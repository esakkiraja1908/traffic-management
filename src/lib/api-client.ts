import { z } from "zod";
import type {
  AnalyticsDataset,
  CreateIncidentInput,
  DataSourceMode,
  ForecastHorizon,
  ForecastResponse,
  IncidentStatus,
  LibCityModelId,
  PlatformSettings,
  RoadSegment,
  TrafficIncident,
  TrafficObservationSnapshot,
} from "@/types/traffic";
import { INITIAL_METR_LA_INCIDENTS } from "@/data/metr-la-incidents";
import { METR_LA_SEGMENTS } from "@/data/metr-la-segments";
import {
  generateAnalyticsDataset,
  generateDeterministicForecast,
  generateObservationSnapshot,
} from "@/lib/libcity-adapter";

/* -------------------------------------------------------------------------- */
/* Environment configuration                                                   */
/* -------------------------------------------------------------------------- */

export const DEFAULT_SETTINGS: PlatformSettings = {
  apiBaseUrl: process.env.NEXT_PUBLIC_TRAFFIC_API_URL ?? "",
  libCityEndpoint: process.env.NEXT_PUBLIC_LIBCITY_MODEL_ENDPOINT ?? "",
  preferLiveBackend: false,
  refreshIntervalSec: 30,
  mapTileStyle: "dark_matter",
  showSensorLabels: true,
  reducedMotion: false,
  severeCongestionThresholdMph: 25,
};

const SETTINGS_KEY = "traffic-intelligence.settings.v1";
const INCIDENTS_KEY = "traffic-intelligence.incidents.v1";

export function loadSettings(): PlatformSettings {
  if (typeof window === "undefined") return DEFAULT_SETTINGS;
  try {
    const raw = window.localStorage.getItem(SETTINGS_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...(JSON.parse(raw) as Partial<PlatformSettings>) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: PlatformSettings): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

/* -------------------------------------------------------------------------- */
/* Response envelope                                                           */
/* -------------------------------------------------------------------------- */

export interface ApiResult<T> {
  data: T;
  dataSource: DataSourceMode;
  notice: string | null;
}

export class TrafficApiError extends Error {
  constructor(
    message: string,
    public readonly kind: "network" | "validation" | "backend" = "backend"
  ) {
    super(message);
    this.name = "TrafficApiError";
  }
}

const SIMULATION_NOTICE =
  "Simulation mode: no LibCity / FastAPI backend is connected. Values are deterministic demo data, not live city telemetry.";

async function fetchJson<T>(
  url: string,
  schema: z.ZodType<T>,
  timeoutMs = 6000
): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: { Accept: "application/json" },
    });
    if (!response.ok) {
      throw new TrafficApiError(`Backend responded with HTTP ${response.status}`, "backend");
    }
    const parsed = schema.safeParse(await response.json());
    if (!parsed.success) {
      throw new TrafficApiError(
        `Backend response failed schema validation: ${parsed.error.issues[0]?.message ?? "unknown"}`,
        "validation"
      );
    }
    return parsed.data;
  } catch (error) {
    if (error instanceof TrafficApiError) throw error;
    throw new TrafficApiError(
      error instanceof Error ? error.message : "Network request failed",
      "network"
    );
  } finally {
    clearTimeout(timer);
  }
}

/* -------------------------------------------------------------------------- */
/* Zod schemas for backend responses                                           */
/* -------------------------------------------------------------------------- */

const CongestionLevelSchema = z.enum(["free", "moderate", "heavy", "severe"]);

const RoadSegmentSchema = z.object({
  id: z.string(),
  sensorId: z.string(),
  name: z.string(),
  highway: z.string(),
  corridor: z.string(),
  direction: z.enum(["NB", "SB", "EB", "WB"]),
  lanes: z.number(),
  lengthMiles: z.number(),
  freeFlowSpeedMph: z.number(),
  currentSpeedMph: z.number(),
  predictedSpeed15mMph: z.number(),
  predictedSpeed30mMph: z.number(),
  predictedSpeed60mMph: z.number(),
  flowVehPerHr: z.number(),
  occupancyPct: z.number(),
  congestionIndex: z.number(),
  congestionLevel: CongestionLevelSchema,
  trendDeltaMph: z.number(),
  updatedAt: z.string(),
  coordinates: z.array(z.tuple([z.number(), z.number()])),
  center: z.tuple([z.number(), z.number()]),
  upstreamSensorIds: z.array(z.string()),
  downstreamSensorIds: z.array(z.string()),
  recentHistory: z.array(
    z.object({
      time: z.string(),
      speedMph: z.number(),
      flowVehPerHr: z.number(),
      congestionIndex: z.number(),
    })
  ),
});

export const RoadSegmentListSchema = z.array(RoadSegmentSchema);

const IncidentSchema = z.object({
  id: z.string(),
  title: z.string(),
  type: z.enum([
    "collision",
    "stalled_vehicle",
    "roadwork",
    "weather_hazard",
    "signal_failure",
    "congestion_alert",
  ]),
  severity: z.enum(["low", "moderate", "major", "critical"]),
  status: z.enum(["active", "responding", "clearing", "resolved"]),
  segmentId: z.string(),
  segmentName: z.string(),
  highway: z.string(),
  coordinates: z.tuple([z.number(), z.number()]),
  reportedAt: z.string(),
  updatedAt: z.string(),
  lanesBlocked: z.string(),
  estimatedClearanceMin: z.number(),
  respondingUnit: z.string(),
  speedImpactMph: z.number(),
  description: z.string(),
  isSimulated: z.boolean(),
});

export const IncidentListSchema = z.array(IncidentSchema);


/* -------------------------------------------------------------------------- */
/* Public API surface (typed; falls back to simulation when backend is absent) */
/* -------------------------------------------------------------------------- */

export async function fetchTrafficSegments(
  settings: PlatformSettings = DEFAULT_SETTINGS
): Promise<ApiResult<RoadSegment[]>> {
  if (settings.preferLiveBackend && settings.apiBaseUrl) {
    try {
      const data = await fetchJson(
        `${settings.apiBaseUrl.replace(/\/$/, "")}/segments`,
        RoadSegmentListSchema
      );
      return { data, dataSource: "live_backend", notice: null };
    } catch (error) {
      return {
        data: METR_LA_SEGMENTS,
        dataSource: "simulation",
        notice: `Live backend unavailable (${(error as Error).message}). Fell back to ${SIMULATION_NOTICE}`,
      };
    }
  }
  return { data: METR_LA_SEGMENTS, dataSource: "simulation", notice: SIMULATION_NOTICE };
}

export async function fetchCurrentObservations(
  settings: PlatformSettings = DEFAULT_SETTINGS
): Promise<ApiResult<TrafficObservationSnapshot>> {
  const incidents = loadIncidents();
  if (settings.preferLiveBackend && settings.apiBaseUrl) {
    try {
      await fetchJson(
        `${settings.apiBaseUrl.replace(/\/$/, "")}/observations/current`,
        z.object({}).passthrough()
      );
      return {
        data: generateObservationSnapshot(METR_LA_SEGMENTS, incidents),
        dataSource: "live_backend",
        notice:
          "Backend responded, but its observation payload is not yet mapped to the snapshot schema. Derived simulation values are displayed.",
      };
    } catch {
      /* fall through to simulation */
    }
  }
  return {
    data: generateObservationSnapshot(METR_LA_SEGMENTS, incidents),
    dataSource: "simulation",
    notice: SIMULATION_NOTICE,
  };
}

export async function requestTrafficForecast(
  input: { segmentId: string; horizonMinutes: ForecastHorizon; modelId: LibCityModelId },
  settings: PlatformSettings = DEFAULT_SETTINGS
): Promise<ApiResult<ForecastResponse>> {
  const segment = METR_LA_SEGMENTS.find((s) => s.id === input.segmentId) ?? METR_LA_SEGMENTS[0];

  if (settings.preferLiveBackend && settings.libCityEndpoint) {
    try {
      await fetchJson(
        `${settings.libCityEndpoint.replace(/\/$/, "")}/predict`,
        z.object({}).passthrough(),
        10000
      );
      throw new TrafficApiError("LibCity tensor mapping adapter not configured", "backend");
    } catch (error) {
      return {
        data: generateDeterministicForecast({
          segment,
          horizonMinutes: input.horizonMinutes,
          modelId: input.modelId,
          allSegments: METR_LA_SEGMENTS,
        }),
        dataSource: "simulation",
        notice: `LibCity model endpoint did not return a usable forecast (${(error as Error).message}). Showing deterministic demo predictions - the trained model did NOT run.`,
      };
    }
  }

  // Simulate inference latency so loading states are exercised honestly.
  await new Promise((resolve) => setTimeout(resolve, 700));
  return {
    data: generateDeterministicForecast({
      segment,
      horizonMinutes: input.horizonMinutes,
      modelId: input.modelId,
      allSegments: METR_LA_SEGMENTS,
    }),
    dataSource: "simulation",
    notice:
      "Demo predictions: generated deterministically from the seeded simulation engine. The LibCity model checkpoint was not executed.",
  };
}

export async function fetchTrafficAnalytics(
  corridorFilter = "all",
  dateRangeLabel = "Last 24 hours",
  settings: PlatformSettings = DEFAULT_SETTINGS
): Promise<ApiResult<AnalyticsDataset>> {
  if (settings.preferLiveBackend && settings.apiBaseUrl) {
    try {
      await fetchJson(
        `${settings.apiBaseUrl.replace(/\/$/, "")}/analytics?corridor=${encodeURIComponent(corridorFilter)}`,
        z.object({}).passthrough()
      );
    } catch {
      /* fall through */
    }
  }
  return {
    data: generateAnalyticsDataset(METR_LA_SEGMENTS, corridorFilter, dateRangeLabel),
    dataSource: "simulation",
    notice: SIMULATION_NOTICE,
  };
}

export async function fetchIncidents(
  settings: PlatformSettings = DEFAULT_SETTINGS
): Promise<ApiResult<TrafficIncident[]>> {
  if (settings.preferLiveBackend && settings.apiBaseUrl) {
    try {
      const data = await fetchJson(
        `${settings.apiBaseUrl.replace(/\/$/, "")}/incidents`,
        IncidentListSchema
      );
      return { data, dataSource: "live_backend", notice: null };
    } catch {
      /* fall through */
    }
  }
  return {
    data: loadIncidents(),
    dataSource: "simulation",
    notice:
      "Incidents are stored in local browser demo storage. Nothing is transmitted to any real traffic authority.",
  };
}

export async function createIncident(
  input: CreateIncidentInput,
  settings: PlatformSettings = DEFAULT_SETTINGS
): Promise<ApiResult<TrafficIncident>> {
  const segment = METR_LA_SEGMENTS.find((s) => s.id === input.segmentId) ?? METR_LA_SEGMENTS[0];
  const now = new Date().toISOString();
  const incident: TrafficIncident = {
    id: `INC-${Date.now().toString().slice(-6)}`,
    title: input.title,
    type: input.type,
    severity: input.severity,
    status: "active",
    segmentId: segment.id,
    segmentName: segment.name,
    highway: `${segment.highway} ${segment.direction}`,
    coordinates: segment.center,
    reportedAt: now,
    updatedAt: now,
    lanesBlocked: input.lanesBlocked,
    estimatedClearanceMin: input.estimatedClearanceMin,
    respondingUnit: input.respondingUnit,
    speedImpactMph: -Math.round(segment.congestionIndex / 4),
    description: input.description,
    isSimulated: true,
  };

  if (settings.preferLiveBackend && settings.apiBaseUrl) {
    try {
      await fetch(`${settings.apiBaseUrl.replace(/\/$/, "")}/incidents`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(incident),
      });
    } catch {
      /* keep local copy regardless */
    }
  }

  persistIncidents([incident, ...loadIncidents()]);
  return {
    data: incident,
    dataSource: "simulation",
    notice: "Incident saved to local demo storage. It was not dispatched to a real authority.",
  };
}

export async function updateIncidentStatus(
  incidentId: string,
  status: IncidentStatus
): Promise<ApiResult<TrafficIncident | null>> {
  let updated: TrafficIncident | null = null;
  const next = loadIncidents().map((incident) => {
    if (incident.id !== incidentId) return incident;
    updated = { ...incident, status, updatedAt: new Date().toISOString() };
    return updated;
  });
  persistIncidents(next);
  return {
    data: updated,
    dataSource: "simulation",
    notice: `Status updated to "${status}" in local demo storage.`,
  };
}

export function resetIncidentsToSeed(): TrafficIncident[] {
  persistIncidents(INITIAL_METR_LA_INCIDENTS);
  return INITIAL_METR_LA_INCIDENTS;
}

/* -------------------------------------------------------------------------- */
/* Local demo persistence for incidents                                        */
/* -------------------------------------------------------------------------- */

export function loadIncidents(): TrafficIncident[] {
  if (typeof window === "undefined") return INITIAL_METR_LA_INCIDENTS;
  try {
    const raw = window.localStorage.getItem(INCIDENTS_KEY);
    if (!raw) return INITIAL_METR_LA_INCIDENTS;
    const parsed = IncidentListSchema.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : INITIAL_METR_LA_INCIDENTS;
  } catch {
    return INITIAL_METR_LA_INCIDENTS;
  }
}

function persistIncidents(incidents: TrafficIncident[]): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(INCIDENTS_KEY, JSON.stringify(incidents));
}

export async function checkBackendHealth(
  settings: PlatformSettings
): Promise<{ ok: boolean; message: string; latencyMs: number | null }> {
  if (!settings.apiBaseUrl) {
    return { ok: false, message: "No API base URL configured.", latencyMs: null };
  }
  const started = Date.now();
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 5000);
    const response = await fetch(`${settings.apiBaseUrl.replace(/\/$/, "")}/health`, {
      signal: controller.signal,
    });
    clearTimeout(timer);
    const latencyMs = Date.now() - started;
    return response.ok
      ? { ok: true, message: `Backend healthy (HTTP ${response.status}).`, latencyMs }
      : { ok: false, message: `Backend returned HTTP ${response.status}.`, latencyMs };
  } catch (error) {
    return {
      ok: false,
      message: `Connection failed: ${(error as Error).message}`,
      latencyMs: null,
    };
  }
}
