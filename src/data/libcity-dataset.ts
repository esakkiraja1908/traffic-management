import type { LibCityAtomicFilePreview } from "@/types/traffic";

/**
 * Structural previews of the LibCity "atomic files" that describe the METR-LA dataset.
 * These mirror the real on-disk schema so the UI never fabricates a column layout.
 * Parsing helpers live in `src/lib/libcity-adapter.ts` and stay out of UI components.
 */
export const LIBCITY_ATOMIC_FILES: LibCityAtomicFilePreview[] = [
  {
    fileName: "METR_LA.geo",
    fileType: ".geo",
    description:
      "Geo-entity table: one row per traffic sensor (geo_id) with its real LA County coordinate.",
    columns: ["geo_id", "type", "coordinates"],
    recordCountLabel: "207 sensors (raw) / 207 mapped",
    sampleRows: [
      { geo_id: "773869", type: "point", coordinates: "[34.061800, -118.246800]" },
      { geo_id: "717447", type: "point", coordinates: "[34.039500, -118.268200]" },
      { geo_id: "767541", type: "point", coordinates: "[34.077200, -118.474500]" },
      { geo_id: "717460", type: "point", coordinates: "[34.035800, -118.354200]" },
    ],
  },
  {
    fileName: "METR_LA.rel",
    fileType: ".rel",
    description:
      "Relation table: directed edges between sensors with geodesic distance, used to build the adjacency graph.",
    columns: ["rel_id", "type", "origin_id", "destination_id", "weight"],
    recordCountLabel: "17,287 directed edges",
    sampleRows: [
      { rel_id: "1", type: "geo", origin_id: "773903", destination_id: "773869", weight: "3420.5" },
      { rel_id: "2", type: "geo", origin_id: "773869", destination_id: "717447", weight: "2890.1" },
      { rel_id: "3", type: "geo", origin_id: "773869", destination_id: "717460", weight: "4610.8" },
      { rel_id: "4", type: "geo", origin_id: "767523", destination_id: "769402", weight: "4120.3" },
    ],
  },
  {
    fileName: "METR_LA.dyna",
    fileType: ".dyna",
    description:
      "Dynamic state table: 5-minute interval traffic speed readings per sensor (km/h in the raw release).",
    columns: ["dyna_id", "type", "time", "entity_id", "traffic_speed"],
    recordCountLabel: "34,272 time steps x 207 sensors",
    sampleRows: [
      { dyna_id: "1", type: "state", time: "2026-10-14T16:40:00Z", entity_id: "773869", traffic_speed: "30.6" },
      { dyna_id: "2", type: "state", time: "2026-10-14T16:40:00Z", entity_id: "717447", traffic_speed: "38.6" },
      { dyna_id: "3", type: "state", time: "2026-10-14T16:45:00Z", entity_id: "773869", traffic_speed: "30.6" },
      { dyna_id: "4", type: "state", time: "2026-10-14T16:45:00Z", entity_id: "767541", traffic_speed: "33.8" },
    ],
  },
  {
    fileName: "config.json",
    fileType: ".json",
    description:
      "LibCity dataset configuration: split ratios, normalizer, interval and the tensor shaping used by models.",
    columns: ["key", "value"],
    recordCountLabel: "1 configuration object",
    sampleRows: [
      { key: "dataset_name", value: "METR_LA" },
      { key: "time_intervals", value: "300 (5 minutes)" },
      { key: "input_window", value: "12 steps (60 minutes)" },
      { key: "output_window", value: "12 steps (60 minutes)" },
      { key: "train_ratio", value: "0.7" },
      { key: "eval_ratio", value: "0.1" },
      { key: "test_ratio", value: "0.2" },
      { key: "normalizer", value: "ZScore" },
      { key: "cache_dataset", value: "true" },
    ],
  },
];

export const METR_LA_DATASET_FACTS = {
  datasetName: "METR-LA",
  region: "Los Angeles County, California",
  sensorCount: 207,
  rawTimeSteps: 34272,
  intervalMinutes: 5,
  dateRangeLabel: "Mar 1, 2012 - Jun 30, 2012 (standard benchmark split)",
  inputWindowSteps: 12,
  outputWindowSteps: 12,
  normalizer: "Z-Score (mean/std computed on the training split)",
  sourceNote:
    "METR-LA is distributed as LibCity atomic files (.geo / .rel / .dyna) plus config.json. Traffic Intelligence reads this schema through a typed adapter rather than importing any Python model code.",
};
