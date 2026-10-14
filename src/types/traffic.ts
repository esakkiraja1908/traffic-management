import { z } from "zod";

export type CongestionLevel = "free" | "moderate" | "heavy" | "severe";

export type DataSourceMode = "simulation" | "live_backend";

export type ForecastHorizon = 15 | 30 | 60;

export type LibCityModelId = "DCRNN" | "GraphWaveNet" | "STGCN" | "AGCRN";

export interface GeoPoint {
  lat: number;
  lng: number;
}

export interface RoadSegment {
  id: string;
  sensorId: string; // Matches METR-LA geo_id e.g., "773869"
  name: string;
  highway: string;
  corridor: string;
  direction: "NB" | "SB" | "EB" | "WB";
  lanes: number;
  lengthMiles: number;
  freeFlowSpeedMph: number;
  currentSpeedMph: number;
  predictedSpeed15mMph: number;
  predictedSpeed30mMph: number;
  predictedSpeed60mMph: number;
  flowVehPerHr: number;
  occupancyPct: number;
  congestionIndex: number; // 0 - 100
  congestionLevel: CongestionLevel;
  trendDeltaMph: number; // change vs 15 min ago
  updatedAt: string;
  coordinates: [number, number][]; // Polyline [lat, lng][]
  center: [number, number]; // Sensor location [lat, lng]
  upstreamSensorIds: string[];
  downstreamSensorIds: string[];
  recentHistory: {
    time: string;
    speedMph: number;
    flowVehPerHr: number;
    congestionIndex: number;
  }[];
}

export interface TrafficObservationSnapshot {
  timestamp: string;
  dataSource: DataSourceMode;
  networkAvgSpeedMph: number;
  speedDeltaPct: number;
  networkCongestionIndex: number;
  congestionDeltaPct: number;
  activeIncidentCount: number;
  criticalCorridorCount: number;
  predictedDeteriorationPct: number;
  deterioratingSegmentsCount: number;
  totalSensorsMonitored: number;
  aiExecutiveSummary: {
    headline: string;
    keyFindings: string[];
    recommendedAction: string;
    generatedBy: string;
    isSimulated: boolean;
  };
}

export type IncidentType =
  | "collision"
  | "stalled_vehicle"
  | "roadwork"
  | "weather_hazard"
  | "signal_failure"
  | "congestion_alert";

export type IncidentSeverity = "low" | "moderate" | "major" | "critical";

export type IncidentStatus = "active" | "responding" | "clearing" | "resolved";

export interface TrafficIncident {
  id: string;
  title: string;
  type: IncidentType;
  severity: IncidentSeverity;
  status: IncidentStatus;
  segmentId: string;
  segmentName: string;
  highway: string;
  coordinates: [number, number];
  reportedAt: string;
  updatedAt: string;
  lanesBlocked: string;
  estimatedClearanceMin: number;
  respondingUnit: string;
  speedImpactMph: number;
  description: string;
  isSimulated: boolean;
}

export const CreateIncidentSchema = z.object({
  title: z
    .string()
    .min(5, "Incident title must be at least 5 characters")
    .max(100, "Title cannot exceed 100 characters"),
  type: z.enum([
    "collision",
    "stalled_vehicle",
    "roadwork",
    "weather_hazard",
    "signal_failure",
    "congestion_alert",
  ]),
  severity: z.enum(["low", "moderate", "major", "critical"]),
  segmentId: z.string().min(1, "Please select an affected road segment"),
  lanesBlocked: z
    .string()
    .min(2, "Specify lane impact (e.g., 'Left 2 Lanes' or 'Right Shoulder')"),
  estimatedClearanceMin: z.coerce
    .number()
    .min(5, "Minimum 5 minutes")
    .max(720, "Maximum 720 minutes"),
  respondingUnit: z
    .string()
    .min(2, "Specify assigned unit (e.g., 'CHP Central-14')"),
  description: z
    .string()
    .min(10, "Provide at least 10 characters of operational context")
    .max(500, "Description cannot exceed 500 characters"),
});

export type CreateIncidentInput = z.infer<typeof CreateIncidentSchema>;

export const ForecastRequestSchema = z.object({
  segmentId: z.string().min(1, "Segment ID is required"),
  horizonMinutes: z.union([z.literal(15), z.literal(30), z.literal(60)]),
  modelId: z.enum(["DCRNN", "GraphWaveNet", "STGCN", "AGCRN"]),
  includeConfidenceInterval: z.boolean().default(true),
});

export type ForecastRequestInput = z.infer<typeof ForecastRequestSchema>;

export interface ForecastTimeStep {
  timestamp: string;
  relativeMin: number; // -60 to +60 in 5-min increments
  actualSpeedMph: number | null;
  predictedSpeedMph: number;
  historicalAvgSpeedMph: number;
  confidenceLowerMph: number;
  confidenceUpperMph: number;
  predictedFlowVehPerHr: number;
  congestionRiskPct: number;
}

export interface CorridorRiskCell {
  segmentId: string;
  segmentName: string;
  highway: string;
  sensorId: string;
  steps: {
    stepLabel: string; // "+5m", "+15m", "+30m", "+45m", "+60m"
    riskScore: number; // 0-100
    predictedSpeedMph: number;
    level: CongestionLevel;
  }[];
}

export interface ForecastResponse {
  requestId: string;
  generatedAt: string;
  dataSource: DataSourceMode;
  modelId: LibCityModelId;
  modelName: string;
  segmentId: string;
  segmentName: string;
  sensorId: string;
  horizonMinutes: ForecastHorizon;
  confidenceSupported: boolean;
  confidenceLevelPct: number;
  currentSpeedMph: number;
  terminalPredictedSpeedMph: number;
  speedChangeMph: number;
  peakCongestionRiskPct: number;
  expectedRegime: CongestionLevel;
  summaryText: string;
  series: ForecastTimeStep[];
  corridorRiskMatrix: CorridorRiskCell[];
}

export interface HourlyTrafficPoint {
  hourLabel: string;
  hour24: number;
  volumeVehPerHr: number;
  avgSpeedMph: number;
  freeFlowSpeedMph: number;
  congestionIndex: number;
  predictedCongestionIndex: number;
  incidentCount: number;
}

export interface SpeedDistributionBin {
  rangeLabel: string;
  minMph: number;
  maxMph: number;
  segmentCount: number;
  percentage: number;
  regime: CongestionLevel;
}

export interface TimeOfDayHeatmapRow {
  corridor: string;
  highway: string;
  hours: {
    period: string;
    congestionPct: number;
    avgSpeedMph: number;
  }[];
}

export interface SegmentComparisonMetric {
  segmentId: string;
  name: string;
  highway: string;
  avgSpeedMph: number;
  peakCongestionPct: number;
  dailyVolumeK: number;
  reliabilityScore: number;
  delayMinPerMile: number;
}

export interface AnalyticsDataset {
  dateRangeLabel: string;
  corridorFilter: string;
  dataSource: DataSourceMode;
  hourlySeries: HourlyTrafficPoint[];
  speedDistribution: SpeedDistributionBin[];
  timeOfDayMatrix: TimeOfDayHeatmapRow[];
  segmentComparisons: SegmentComparisonMetric[];
  peakHourSummary: {
    morningPeakWindow: string;
    morningPeakCongestionPct: number;
    morningAvgSpeedMph: number;
    eveningPeakWindow: string;
    eveningPeakCongestionPct: number;
    eveningAvgSpeedMph: number;
    mostImpactedCorridor: string;
    dailyTotalVehicleMilesK: number;
  };
}

export interface LibCityAtomicFilePreview {
  fileName: string;
  fileType: ".geo" | ".rel" | ".dyna" | ".json";
  description: string;
  columns: string[];
  recordCountLabel: string;
  sampleRows: Record<string, string | number>[];
}

export interface LibCityModelSpec {
  id: LibCityModelId;
  name: string;
  fullName: string;
  architectureType: string;
  paperReference: string;
  spatialMechanism: string;
  temporalMechanism: string;
  supportsConfidenceIntervals: boolean;
  inputWindowSteps: number;
  outputHorizonSteps: number;
  status: "benchmark_ready" | "live_connected" | "offline_simulation";
  lastEvaluationNote: string;
  horizonMetrics: {
    horizonMinutes: 15 | 30 | 60;
    horizonSteps: 3 | 6 | 12;
    maeMph: number;
    rmseMph: number;
    mapePct: number;
    sourceLabel: string;
  }[];
  residualComparison: {
    timestamp: string;
    actualMph: number;
    predictedMph: number;
    residualMph: number;
  }[];
  spatialGraphEdges: {
    originSensor: string;
    destinationSensor: string;
    corridorName: string;
    distanceMeters: number;
    gaussianKernelWeight: number;
  }[];
}

export interface PlatformSettings {
  apiBaseUrl: string;
  libCityEndpoint: string;
  preferLiveBackend: boolean;
  refreshIntervalSec: number;
  mapTileStyle: "dark_matter" | "osm_standard" | "schematic_vector";
  showSensorLabels: boolean;
  reducedMotion: boolean;
  severeCongestionThresholdMph: number;
}
