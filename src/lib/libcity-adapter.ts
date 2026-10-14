import { z } from "zod";
import type {
  AnalyticsDataset,
  CongestionLevel,
  ForecastHorizon,
  ForecastResponse,
  ForecastTimeStep,
  CorridorRiskCell,
  HourlyTrafficPoint,
  LibCityModelId,
  LibCityModelSpec,
  RoadSegment,
  SegmentComparisonMetric,
  SpeedDistributionBin,
  TimeOfDayHeatmapRow,
  TrafficIncident,
  TrafficObservationSnapshot,
} from "@/types/traffic";
import { LIBCITY_MODELS } from "@/data/metr-la-models";
import { classifyCongestionFromSpeed } from "@/lib/utils";

/* -------------------------------------------------------------------------- */
/* LibCity atomic-file parsing (pure functions, no React, no Python coupling)  */
/* -------------------------------------------------------------------------- */

export const LibCityGeoRowSchema = z.object({
  geo_id: z.string().min(1),
  type: z.string().default("point"),
  coordinates: z.string().regex(/^\[.*\]$/, "coordinates must look like [lat, lng]"),
});

export const LibCityRelRowSchema = z.object({
  rel_id: z.string().min(1),
  type: z.string().default("geo"),
  origin_id: z.string().min(1),
  destination_id: z.string().min(1),
  weight: z.coerce.number().nonnegative(),
});

export const LibCityDynaRowSchema = z.object({
  dyna_id: z.string().min(1),
  type: z.string().default("state"),
  time: z.string().min(1),
  entity_id: z.string().min(1),
  traffic_speed: z.coerce.number(),
});

export const LibCityConfigSchema = z.object({
  dataset_name: z.string().default("METR_LA"),
  time_intervals: z.union([z.string(), z.number()]).default(300),
  input_window: z.coerce.number().int().positive().default(12),
  output_window: z.coerce.number().int().positive().default(12),
  train_ratio: z.coerce.number().min(0).max(1).default(0.7),
  eval_ratio: z.coerce.number().min(0).max(1).default(0.1),
  test_ratio: z.coerce.number().min(0).max(1).default(0.2),
  normalizer: z.string().default("ZScore"),
});

export type LibCityGeoRow = z.infer<typeof LibCityGeoRowSchema>;
export type LibCityRelRow = z.infer<typeof LibCityRelRowSchema>;
export type LibCityDynaRow = z.infer<typeof LibCityDynaRowSchema>;

export interface LibCityParseResult<T> {
  success: boolean;
  data: T[];
  errors: string[];
}

function parseRows<T>(
  schema: z.ZodType<T, z.ZodTypeDef, unknown>,
  rows: unknown[],
  label: string
): LibCityParseResult<T> {
  const data: T[] = [];
  const errors: string[] = [];
  rows.forEach((row, index) => {
    const result = schema.safeParse(row);
    if (result.success) {
      data.push(result.data);
    } else {
      errors.push(`${label} row ${index + 1}: ${result.error.issues[0]?.message ?? "invalid"}`);
    }
  });
  return { success: errors.length === 0, data, errors };
}

export function parseLibCityGeoRows(rows: unknown[]): LibCityParseResult<LibCityGeoRow> {
  return parseRows(LibCityGeoRowSchema, rows, "METR_LA.geo");
}

export function parseLibCityRelRows(rows: unknown[]): LibCityParseResult<LibCityRelRow> {
  return parseRows(LibCityRelRowSchema, rows, "METR_LA.rel");
}

export function parseLibCityDynaRows(rows: unknown[]): LibCityParseResult<LibCityDynaRow> {
  return parseRows(LibCityDynaRowSchema, rows, "METR_LA.dyna");
}

export function parseLibCityConfig(raw: unknown) {
  const result = LibCityConfigSchema.safeParse(raw);
  return result.success
    ? { success: true as const, data: result.data, error: null }
    : { success: false as const, data: null, error: result.error.issues[0]?.message ?? "invalid config" };
}

/** Convert a LibCity `[lat, lng]` coordinate string into a numeric tuple. */
export function parseGeoCoordinates(raw: string): [number, number] | null {
  const match = raw.match(/\[\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*\]/);
  if (!match) return null;
  const lat = Number(match[1]);
  const lng = Number(match[2]);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  return [lat, lng];
}

/**
 * Build a normalized adjacency matrix from LibCity `.rel` edges using the
 * standard METR-LA Gaussian kernel with a 0.1 thresholded weight matrix.
 */
export function buildAdjacencyMatrix(
  sensorIds: string[],
  relations: LibCityRelRow[]
): number[][] {
  const index = new Map(sensorIds.map((id, i) => [id, i]));
  const size = sensorIds.length;
  const matrix: number[][] = Array.from({ length: size }, () => new Array(size).fill(0));
  for (const rel of relations) {
    const i = index.get(rel.origin_id);
    const j = index.get(rel.destination_id);
    if (i === undefined || j === undefined) continue;
    const weight = Math.exp(-Math.pow(rel.weight / 1000, 2));
    matrix[i][j] = weight;
    matrix[j][i] = Math.max(matrix[j][i], weight);
  }
  return matrix;
}

/* -------------------------------------------------------------------------- */
/* Deterministic simulation primitives (seeded -> identical on every render)  */
/* -------------------------------------------------------------------------- */

/** Mulberry32 seeded PRNG so simulated values never flicker between renders. */
export function createSeededRandom(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function hashStringToSeed(value: string): number {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function round(value: number, decimals = 1): number {
  const factor = Math.pow(10, decimals);
  return Math.round(value * factor) / factor;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function getModelSpec(modelId: LibCityModelId): LibCityModelSpec {
  return LIBCITY_MODELS.find((m) => m.id === modelId) ?? LIBCITY_MODELS[0];
}

/* -------------------------------------------------------------------------- */
/* Deterministic forecast generation (used when no FastAPI/LibCity backend)    */
/* -------------------------------------------------------------------------- */

interface ForecastOptions {
  segment: RoadSegment;
  horizonMinutes: ForecastHorizon;
  modelId: LibCityModelId;
  allSegments: RoadSegment[];
}

/**
 * Produce a deterministic spatiotemporal forecast.
 *
 * This is NOT a trained model run. It reproduces the characteristic behaviour of
 * graph-based traffic forecasting (smooth decay toward an equilibrium speed,
 * upstream/downstream influence, horizon-widening uncertainty) using a seeded
 * generator, so the UI is fully exercisable in demo mode. Every consumer must
 * label the result as simulation.
 */
export function generateDeterministicForecast({
  segment,
  horizonMinutes,
  modelId,
  allSegments,
}: ForecastOptions): ForecastResponse {
  const model = getModelSpec(modelId);
  const rand = createSeededRandom(hashStringToSeed(`${segment.id}:${modelId}:${horizonMinutes}`));

  const upstream = allSegments.filter((s) => segment.upstreamSensorIds.includes(s.sensorId));
  const downstream = allSegments.filter((s) => segment.downstreamSensorIds.includes(s.sensorId));

  // Spatially-informed equilibrium: congestion propagates from the slowest neighbour.
  const neighbourSpeeds = [...upstream, ...downstream].map((s) => s.currentSpeedMph);
  const neighbourMean = neighbourSpeeds.length
    ? neighbourSpeeds.reduce((a, b) => a + b, 0) / neighbourSpeeds.length
    : segment.currentSpeedMph;
  const equilibrium = clamp(
    segment.currentSpeedMph * 0.7 + neighbourMean * 0.3,
    6,
    segment.freeFlowSpeedMph
  );

  // Model-specific skill: sharper models track the equilibrium faster and tighter.
  const skillFactor =
    modelId === "GraphWaveNet" ? 0.34 : modelId === "AGCRN" ? 0.32 : modelId === "DCRNN" ? 0.3 : 0.26;
  const uncertaintyBase = model.supportsConfidenceIntervals ? 1.9 : 0;

  const series: ForecastTimeStep[] = [];
  const now = new Date(segment.updatedAt);
  const stepCount = 24; // -60m .. +60m at 5-minute steps
  for (let i = 0; i < stepCount; i += 1) {
    const relativeMin = -60 + i * 5;
    const stepDate = new Date(now.getTime() + relativeMin * 60_000);

    const drift = Math.min(1, Math.max(0, (relativeMin + 60) / 120));
    const wobble = (rand() - 0.5) * 2.4;
    const predicted = clamp(
      segment.currentSpeedMph + (equilibrium - segment.currentSpeedMph) * drift * skillFactor + wobble,
      5,
      segment.freeFlowSpeedMph + 3
    );

    const actual =
      relativeMin <= 0
        ? clamp(
            segment.currentSpeedMph +
              (equilibrium - segment.currentSpeedMph) * ((relativeMin + 60) / 60) * 0.9 +
              (rand() - 0.5) * 1.6,
            5,
            segment.freeFlowSpeedMph + 3
          )
        : null;

    const horizonRatio = Math.abs(relativeMin) / 60;
    const band = uncertaintyBase * (0.5 + horizonRatio);

    const flowRatio = clamp(predicted / Math.max(segment.freeFlowSpeedMph, 1), 0.05, 1);
    const predictedFlow = Math.round(segment.flowVehPerHr * (0.55 + (1 - flowRatio) * 0.9));

    series.push({
      timestamp: stepDate.toISOString(),
      relativeMin,
      actualSpeedMph: actual === null ? null : round(actual),
      predictedSpeedMph: round(predicted),
      historicalAvgSpeedMph: round(
        segment.recentHistory.reduce((a, h) => a + h.speedMph, 0) / segment.recentHistory.length
      ),
      confidenceLowerMph: round(clamp(predicted - band, 2, 90)),
      confidenceUpperMph: round(clamp(predicted + band, 2, 95)),
      predictedFlowVehPerHr: predictedFlow,
      congestionRiskPct: Math.round(clamp((1 - flowRatio) * 100, 4, 99)),
    });
  }

  const futureSteps = series.filter((s) => s.relativeMin > 0);
  const horizonCut = futureSteps.filter((s) => s.relativeMin <= horizonMinutes);
  const terminal = horizonCut.length ? horizonCut[horizonCut.length - 1] : series[series.length - 1];

  const corridorRiskMatrix = buildCorridorRiskMatrix(allSegments, rand, modelId);

  const peakRisk = Math.max(...horizonCut.map((s) => s.congestionRiskPct), 0);
  const expectedRegime = classifyCongestionFromSpeed(
    terminal.predictedSpeedMph,
    segment.freeFlowSpeedMph
  );

  const direction = terminal.predictedSpeedMph >= segment.currentSpeedMph ? "improve" : "deteriorate";
  const delta = round(terminal.predictedSpeedMph - segment.currentSpeedMph);

  return {
    requestId: `fc-${segment.id}-${modelId}-${horizonMinutes}`,
    generatedAt: new Date().toISOString(),
    dataSource: "simulation",
    modelId,
    modelName: model.fullName,
    segmentId: segment.id,
    segmentName: segment.name,
    sensorId: segment.sensorId,
    horizonMinutes,
    confidenceSupported: model.supportsConfidenceIntervals,
    confidenceLevelPct: 90,
    currentSpeedMph: segment.currentSpeedMph,
    terminalPredictedSpeedMph: terminal.predictedSpeedMph,
    speedChangeMph: delta,
    peakCongestionRiskPct: peakRisk,
    expectedRegime,
    summaryText: buildForecastSummary(segment, model, horizonMinutes, delta, expectedRegime, direction),
    series,
    corridorRiskMatrix,
  };
}

function buildForecastSummary(
  segment: RoadSegment,
  model: LibCityModelSpec,
  horizon: ForecastHorizon,
  delta: number,
  regime: CongestionLevel,
  direction: string
): string {
  const regimeLabel =
    regime === "free"
      ? "free-flowing"
      : regime === "moderate"
        ? "moderately congested"
        : regime === "heavy"
          ? "heavily congested"
          : "severely gridlocked";
  return (
    `${model.name} (${model.architectureType}) projects sensor ${segment.sensorId} on ${segment.highway} ` +
    `to ${direction} by ${Math.abs(delta).toFixed(1)} mph over the next ${horizon} minutes, settling into a ` +
    `${regimeLabel} regime. Confidence is ${
      model.supportsConfidenceIntervals ? "reported as a 90% interval" : "not available for this architecture"
    }. Simulated output - no live checkpoint was executed.`
  );
}

function buildCorridorRiskMatrix(
  segments: RoadSegment[],
  rand: () => number,
  modelId: LibCityModelId
): CorridorRiskCell[] {
  const stepLabels = ["+5m", "+15m", "+30m", "+45m", "+60m"];
  const modelBias = modelId === "GraphWaveNet" ? 0.96 : modelId === "AGCRN" ? 1.0 : 1.06;

  return segments.map((segment) => ({
    segmentId: segment.id,
    segmentName: segment.name,
    highway: segment.highway,
    sensorId: segment.sensorId,
    steps: stepLabels.map((stepLabel, i) => {
      const decay = clamp(
        segment.currentSpeedMph * (1 - 0.16 * (i / 4)) + (rand() - 0.5) * 4,
        5,
        segment.freeFlowSpeedMph
      );
      const speed = clamp(decay * modelBias, 5, segment.freeFlowSpeedMph);
      const ratio = speed / segment.freeFlowSpeedMph;
      const risk = Math.round(clamp((1 - ratio) * 100, 5, 99));
      return {
        stepLabel,
        riskScore: risk,
        predictedSpeedMph: round(speed),
        level: classifyCongestionFromSpeed(speed, segment.freeFlowSpeedMph),
      };
    }),
  }));
}

/* -------------------------------------------------------------------------- */
/* Analytics generation (deterministic hourly profiles, not random per render) */
/* -------------------------------------------------------------------------- */

export function generateAnalyticsDataset(
  segments: RoadSegment[],
  corridorFilter: string,
  dateRangeLabel: string
): AnalyticsDataset {
  const filtered =
    corridorFilter === "all"
      ? segments
      : segments.filter((s) => s.highway === corridorFilter);
  const active = filtered.length ? filtered : segments;

  const avgFreeFlow =
    active.reduce((a, s) => a + s.freeFlowSpeedMph, 0) / active.length;
  const avgSpeed = active.reduce((a, s) => a + s.currentSpeedMph, 0) / active.length;
  const totalFlow = active.reduce((a, s) => a + s.flowVehPerHr, 0);

  const hourlySeries: HourlyTrafficPoint[] = [];
  for (let hour = 0; hour < 24; hour += 1) {
    // Dual-peak commuter profile: AM peak ~08:00, PM peak ~17:00.
    const am = Math.exp(-Math.pow(hour - 8, 2) / 6);
    const pm = Math.exp(-Math.pow(hour - 17, 2) / 7);
    const night = hour < 5 ? 0.32 : 0.62;
    const demand = clamp(night + am * 0.9 + pm * 1.0, 0.2, 1.7);
    const speedFactor = clamp(1 - (demand - 0.5) * 0.62, 0.28, 1.02);

    const volume = Math.round((totalFlow / 2.1) * demand);
    const speed = round(clamp(avgFreeFlow * speedFactor, 12, avgFreeFlow));
    const congestion = Math.round(clamp((1 - speed / avgFreeFlow) * 100, 3, 96));

    hourlySeries.push({
      hourLabel: `${String(hour).padStart(2, "0")}:00`,
      hour24: hour,
      volumeVehPerHr: volume,
      avgSpeedMph: speed,
      freeFlowSpeedMph: round(avgFreeFlow),
      congestionIndex: congestion,
      predictedCongestionIndex: Math.round(clamp(congestion * 1.04 + 1, 3, 97)),
      incidentCount: congestion > 70 ? 3 : congestion > 45 ? 2 : 1,
    });
  }

  const speedDistribution = buildSpeedDistribution(active);
  const timeOfDayMatrix = buildTimeOfDayMatrix(segments);
  const segmentComparisons = buildSegmentComparisons(active);

  return {
    dateRangeLabel,
    corridorFilter,
    dataSource: "simulation",
    hourlySeries,
    speedDistribution,
    timeOfDayMatrix,
    segmentComparisons,
    peakHourSummary: {
      morningPeakWindow: "07:00 - 09:30",
      morningPeakCongestionPct: hourlySeries[8].congestionIndex,
      morningAvgSpeedMph: hourlySeries[8].avgSpeedMph,
      eveningPeakWindow: "16:00 - 19:00",
      eveningPeakCongestionPct: hourlySeries[17].congestionIndex,
      eveningAvgSpeedMph: hourlySeries[17].avgSpeedMph,
      mostImpactedCorridor: [...active].sort((a, b) => b.congestionIndex - a.congestionIndex)[0]?.highway ?? "US-101",
      dailyTotalVehicleMilesK: round(
        active.reduce((a, s) => a + s.flowVehPerHr * 14 * s.lengthMiles, 0) / 1000,
        1
      ),
    },
  };
}

function buildSpeedDistribution(segments: RoadSegment[]): SpeedDistributionBin[] {
  const bins: { rangeLabel: string; minMph: number; maxMph: number; regime: CongestionLevel }[] = [
    { rangeLabel: "0 - 20 mph", minMph: 0, maxMph: 20, regime: "severe" },
    { rangeLabel: "20 - 35 mph", minMph: 20, maxMph: 35, regime: "heavy" },
    { rangeLabel: "35 - 50 mph", minMph: 35, maxMph: 50, regime: "moderate" },
    { rangeLabel: "50 - 65 mph", minMph: 50, maxMph: 65, regime: "free" },
    { rangeLabel: "65+ mph", minMph: 65, maxMph: 120, regime: "free" },
  ];
  const total = Math.max(segments.length, 1);
  return bins.map((bin) => {
    const count = segments.filter(
      (s) => s.currentSpeedMph >= bin.minMph && s.currentSpeedMph < bin.maxMph
    ).length;
    return {
      rangeLabel: bin.rangeLabel,
      minMph: bin.minMph,
      maxMph: bin.maxMph,
      segmentCount: count,
      percentage: round((count / total) * 100, 1),
      regime: bin.regime,
    };
  });
}

function buildTimeOfDayMatrix(segments: RoadSegment[]): TimeOfDayHeatmapRow[] {
  const periods = ["00-04", "04-08", "08-12", "12-16", "16-20", "20-24"];
  const periodWeights = [0.28, 0.72, 0.66, 0.58, 0.94, 0.42];

  const byHighway = new Map<string, RoadSegment[]>();
  for (const segment of segments) {
    const list = byHighway.get(segment.highway) ?? [];
    list.push(segment);
    byHighway.set(segment.highway, list);
  }

  return Array.from(byHighway.entries()).map(([highway, group]) => {
    const baseCongestion =
      group.reduce((a, s) => a + s.congestionIndex, 0) / Math.max(group.length, 1);
    const baseFreeFlow =
      group.reduce((a, s) => a + s.freeFlowSpeedMph, 0) / Math.max(group.length, 1);
    return {
      corridor: group[0].corridor,
      highway,
      hours: periods.map((period, i) => {
        const congestionPct = Math.round(clamp(baseCongestion * (0.5 + periodWeights[i] * 0.85), 4, 97));
        return {
          period,
          congestionPct,
          avgSpeedMph: round(clamp(baseFreeFlow * (1 - congestionPct / 100), 10, baseFreeFlow)),
        };
      }),
    };
  });
}

function buildSegmentComparisons(segments: RoadSegment[]): SegmentComparisonMetric[] {
  return segments
    .map((s) => {
      const dailyVolumeK = round((s.flowVehPerHr * 14) / 1000, 1);
      const reliability = Math.round(clamp(100 - s.congestionIndex * 0.72 - Math.abs(s.trendDeltaMph) * 1.4, 12, 99));
      const delayMinPerMile = round(
        clamp((60 / Math.max(s.currentSpeedMph, 5) - 60 / s.freeFlowSpeedMph) * s.lengthMiles, 0.05, 12),
        2
      );
      return {
        segmentId: s.id,
        name: s.name,
        highway: s.highway,
        avgSpeedMph: s.currentSpeedMph,
        peakCongestionPct: Math.min(99, s.congestionIndex + 7),
        dailyVolumeK,
        reliabilityScore: reliability,
        delayMinPerMile,
      };
    })
    .sort((a, b) => b.peakCongestionPct - a.peakCongestionPct);
}



/* -------------------------------------------------------------------------- */
/* Network-wide observation snapshot (Overview KPIs + AI-style summary)        */
/* -------------------------------------------------------------------------- */

export function generateObservationSnapshot(
  segments: RoadSegment[],
  incidents: TrafficIncident[]
): TrafficObservationSnapshot {
  const avgSpeed = segments.reduce((a, s) => a + s.currentSpeedMph, 0) / Math.max(segments.length, 1);
  const freeFlowAvg =
    segments.reduce((a, s) => a + s.freeFlowSpeedMph, 0) / Math.max(segments.length, 1);
  const congestionIndex = Math.round(
    segments.reduce((a, s) => a + s.congestionIndex, 0) / Math.max(segments.length, 1)
  );
  const deteriorating = segments.filter((s) => s.predictedSpeed15mMph < s.currentSpeedMph);
  const predictedDeteriorationPct = round(
    (deteriorating.reduce((a, s) => a + (s.currentSpeedMph - s.predictedSpeed15mMph), 0) /
      Math.max(segments.length, 1)) *
      4.2,
    1
  );
  const criticalCount = segments.filter((s) => s.congestionLevel === "severe").length;
  const activeIncidents = incidents.filter((i) => i.status !== "resolved");
  const worst = [...segments].sort((a, b) => b.congestionIndex - a.congestionIndex)[0];
  const best = [...segments].sort((a, b) => a.congestionIndex - b.congestionIndex)[0];
  const highSeverity = activeIncidents.filter(
    (i) => i.severity === "critical" || i.severity === "major"
  ).length;

  return {
    timestamp: new Date().toISOString(),
    dataSource: "simulation",
    networkAvgSpeedMph: round(avgSpeed),
    speedDeltaPct: -4.6,
    networkCongestionIndex: congestionIndex,
    congestionDeltaPct: 3.2,
    activeIncidentCount: activeIncidents.length,
    criticalCorridorCount: criticalCount,
    predictedDeteriorationPct,
    deterioratingSegmentsCount: deteriorating.length,
    totalSensorsMonitored: segments.length,
    aiExecutiveSummary: {
      headline: `${criticalCount} of ${segments.length} monitored METR-LA corridors are in severe congestion, concentrated on ${worst?.highway ?? "US-101"}.`,
      keyFindings: [
        `Network average speed is ${round(avgSpeed)} mph against a ${round(freeFlowAvg)} mph free-flow reference (${congestionIndex}% congestion index).`,
        `${worst?.highway ?? "US-101"} at ${worst?.corridor ?? "Downtown"} is the worst corridor at ${worst?.congestionIndex ?? 0}% congestion with ${worst?.currentSpeedMph ?? 0} mph observed speed.`,
        `${deteriorating.length} segments are projected to lose speed within 15 minutes; aggregate predicted deterioration is ${predictedDeteriorationPct}%.`,
        `${activeIncidents.length} active incidents are tracked, including ${highSeverity} at major or critical severity.`,
        `${best?.highway ?? "I-210"} remains the most resilient corridor at ${best?.currentSpeedMph ?? 0} mph.`,
      ],
      recommendedAction:
        "Prioritize incident clearance on the top-severity corridor and pre-position ramp-metering adjustments upstream of the predicted deterioration zone.",
      generatedBy:
        "Deterministic rule-based summary engine (simulation mode). No live LLM or trained model inference was executed.",
      isSimulated: true,
    },
  };
}
