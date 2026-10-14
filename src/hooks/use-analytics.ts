"use client";

import * as React from "react";
import type { AnalyticsDataset, ForecastHorizon, ForecastResponse, LibCityModelId } from "@/types/traffic";
import { fetchTrafficAnalytics, requestTrafficForecast } from "@/lib/api-client";
import { useSettings } from "@/components/providers/settings-provider";

export function useAnalytics(corridorFilter: string, dateRangeLabel: string) {
  const { settings, hydrated } = useSettings();
  const [dataset, setDataset] = React.useState<AnalyticsDataset | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [notice, setNotice] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!hydrated) return;
    let cancelled = false;
    setLoading(true);
    void fetchTrafficAnalytics(corridorFilter, dateRangeLabel, settings).then((result) => {
      if (cancelled) return;
      setDataset(result.data);
      setNotice(result.notice);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [corridorFilter, dateRangeLabel, settings, hydrated]);

  return { dataset, loading, notice };
}

export function useForecast() {
  const { settings } = useSettings();
  const [forecast, setForecast] = React.useState<ForecastResponse | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [notice, setNotice] = React.useState<string | null>(null);
  const [lastSuccessAt, setLastSuccessAt] = React.useState<string | null>(null);

  const run = React.useCallback(
    async (input: { segmentId: string; horizonMinutes: ForecastHorizon; modelId: LibCityModelId }) => {
      setLoading(true);
      setError(null);
      try {
        const result = await requestTrafficForecast(input, settings);
        setForecast(result.data);
        setNotice(result.notice);
        setLastSuccessAt(new Date().toISOString());
      } catch (err) {
        setError(err instanceof Error ? err.message : "Forecast request failed");
      } finally {
        setLoading(false);
      }
    },
    [settings]
  );

  const reset = React.useCallback(() => {
    setForecast(null);
    setError(null);
    setNotice(null);
  }, []);

  return { forecast, loading, error, notice, lastSuccessAt, run, reset };
}
