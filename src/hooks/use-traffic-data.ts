"use client";

import * as React from "react";
import type { RoadSegment, TrafficIncident, TrafficObservationSnapshot } from "@/types/traffic";
import {
  fetchCurrentObservations,
  fetchIncidents,
  fetchTrafficSegments,
  type ApiResult,
} from "@/lib/api-client";
import { useSettings } from "@/components/providers/settings-provider";

export interface TrafficDataState {
  segments: RoadSegment[];
  incidents: TrafficIncident[];
  snapshot: TrafficObservationSnapshot | null;
  loading: boolean;
  error: string | null;
  notice: string | null;
  dataSource: "simulation" | "live_backend";
  refresh: () => void;
}

export function useTrafficData(): TrafficDataState {
  const { settings, hydrated } = useSettings();
  const [segments, setSegments] = React.useState<RoadSegment[]>([]);
  const [incidents, setIncidents] = React.useState<TrafficIncident[]>([]);
  const [snapshot, setSnapshot] = React.useState<TrafficObservationSnapshot | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [notice, setNotice] = React.useState<string | null>(null);
  const [dataSource, setDataSource] = React.useState<"simulation" | "live_backend">("simulation");
  const [nonce, setNonce] = React.useState(0);

  React.useEffect(() => {
    if (!hydrated) return;
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const [segmentsResult, incidentsResult, observationsResult] = await Promise.all([
          fetchTrafficSegments(settings),
          fetchIncidents(settings),
          fetchCurrentObservations(settings),
        ]);
        if (cancelled) return;

        const results: ApiResult<unknown>[] = [segmentsResult, incidentsResult, observationsResult];
        const notices = results.map((r) => r.notice).filter(Boolean) as string[];

        setSegments(segmentsResult.data);
        setIncidents(incidentsResult.data);
        setSnapshot(observationsResult.data);
        setDataSource(
          segmentsResult.dataSource === "live_backend" ? "live_backend" : "simulation"
        );
        setNotice(notices[0] ?? null);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load traffic data");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [settings, hydrated, nonce]);

  const refresh = React.useCallback(() => setNonce((n) => n + 1), []);

  return {
    segments,
    incidents,
    snapshot,
    loading,
    error,
    notice,
    dataSource,
    refresh,
  };
}
