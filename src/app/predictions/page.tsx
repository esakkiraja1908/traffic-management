"use client";

import * as React from "react";
import {
  AlertTriangle,
  BrainCircuit,
  CalendarClock,
  CheckCircle2,
  Cpu,
  Gauge,
  Play,
  Radar,
  ShieldCheck,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { Panel, PanelHeader } from "@/components/ui/panel";
import { Button } from "@/components/ui/button";
import { Badge, CustomBadge } from "@/components/ui/badge";
import { Field, SegmentedControl, Select } from "@/components/ui/controls";
import { NoticeBanner } from "@/components/ui/notice-banner";
import { ChartSkeleton, ListSkeleton } from "@/components/ui/skeleton";
import { EmptyState, ErrorState } from "@/components/ui/states";
import { KpiCard } from "@/components/ui/kpi-card";
import { DataSourceBadge } from "@/components/ui/data-source-badge";
import { ForecastVsActualChart } from "@/components/charts/forecast-vs-actual-chart";
import { CorridorRiskHeatmap } from "@/components/charts/corridor-risk-heatmap";
import { useForecast } from "@/hooks/use-analytics";
import { useTrafficData } from "@/hooks/use-traffic-data";
import { useToast } from "@/components/providers/toast-provider";
import { getCongestionBadgeStyles, cn, formatRelativeMinutes } from "@/lib/utils";
import type { ForecastHorizon, LibCityModelId } from "@/types/traffic";

const HORIZON_OPTIONS: { value: string; label: string }[] = [
  { value: "15", label: "15 min" },
  { value: "30", label: "30 min" },
  { value: "60", label: "60 min" },
];

const MODEL_OPTIONS: { value: LibCityModelId; label: string }[] = [
  { value: "GraphWaveNet", label: "Graph WaveNet — adaptive adjacency GCN + dilated TCN" },
  { value: "DCRNN", label: "DCRNN — diffusion conv + seq2seq GRU" },
  { value: "STGCN", label: "STGCN — Chebyshev spectral + gated temporal conv" },
  { value: "AGCRN", label: "AGCRN — node-adaptive graph + data-adaptive GRU" },
];

export default function PredictionsPage() {
  const { segments, loading: segmentsLoading, error: segmentsError, refresh } = useTrafficData();
  const { forecast, loading, error, notice, lastSuccessAt, run } = useForecast();
  const { pushToast } = useToast();

  const [segmentId, setSegmentId] = React.useState<string>("");
  const [horizon, setHorizon] = React.useState<string>("30");
  const [modelId, setModelId] = React.useState<LibCityModelId>("GraphWaveNet");

  React.useEffect(() => {
    if (!segmentId && segments.length) {
      const worst = [...segments].sort((a, b) => b.congestionIndex - a.congestionIndex)[0];
      setSegmentId(worst.id);
    }
  }, [segments, segmentId]);

  const segmentOptions = React.useMemo(
    () =>
      segments.map((segment) => ({
        value: segment.id,
        label: `${segment.highway} ${segment.direction} · sensor ${segment.sensorId} · ${segment.currentSpeedMph} mph`,
      })),
    [segments]
  );

  const handleRun = React.useCallback(async () => {
    if (!segmentId) return;
    await run({
      segmentId,
      horizonMinutes: Number(horizon) as ForecastHorizon,
      modelId,
    });
    pushToast({
      variant: "info",
      title: "Forecast request completed",
      description:
        "Deterministic demo predictions were generated. No LibCity checkpoint was executed.",
    });
  }, [segmentId, horizon, modelId, run, pushToast]);

  if (segmentsError) {
    return (
      <Panel variant="strong">
        <ErrorState description={segmentsError} onRetry={refresh} />
      </Panel>
    );
  }


  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <DataSourceBadge mode="simulation" />
          <Badge variant="muted">
            <Cpu className="h-3 w-3" aria-hidden="true" />
            LibCity adapter · METR-LA
          </Badge>
        </div>
        {lastSuccessAt ? (
          <span className="flex items-center gap-1.5 text-[11px] text-slate-500">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" aria-hidden="true" />
            Last successful prediction {formatRelativeMinutes(lastSuccessAt)}
          </span>
        ) : (
          <span className="flex items-center gap-1.5 text-[11px] text-slate-500">
            <AlertTriangle className="h-3.5 w-3.5 text-amber-400" aria-hidden="true" />
            No prediction requested in this session
          </span>
        )}
      </div>

      <NoticeBanner
        tone="warning"
        title="Forecast provenance"
        message="Predictions shown here are deterministic demo outputs from the seeded simulation engine unless a LibCity FastAPI endpoint is configured and reachable in Settings. No trained model inference is claimed."
      />

      <Panel variant="strong">
        <PanelHeader
          title="Forecast configuration"
          description="Select a sensor, horizon and graph architecture, then request a prediction"
          icon={BrainCircuit}
          action={
            <CustomBadge
              label="Input window 12 steps · 60 min"
              className="border-white/10 bg-white/[0.04] text-slate-400"
            />
          }
        />
        <div className="grid grid-cols-1 gap-3 p-4 lg:grid-cols-[1.6fr_1fr_1.6fr_auto] lg:items-end">
          <Field label="Road segment / sensor" htmlFor="segment-select">
            <Select
              id="segment-select"
              ariaLabel="Select road segment"
              value={segmentId}
              onChange={setSegmentId}
              options={
                segmentOptions.length ? segmentOptions : [{ value: "", label: "Loading segments…" }]
              }
            />
          </Field>
          <Field label="Forecast horizon">
            <SegmentedControl
              ariaLabel="Forecast horizon"
              options={HORIZON_OPTIONS}
              value={horizon}
              onChange={setHorizon}
              size="md"
            />
          </Field>
          <Field label="Model architecture" htmlFor="model-select">
            <Select
              id="model-select"
              ariaLabel="Select model architecture"
              value={modelId}
              onChange={(value) => setModelId(value as LibCityModelId)}
              options={MODEL_OPTIONS}
            />
          </Field>
          <Button
            variant="primary"
            size="md"
            onClick={() => void handleRun()}
            disabled={loading || segmentsLoading || !segmentId}
            className="h-9"
          >
            <Play className={cn("h-3.5 w-3.5", loading && "animate-pulse")} aria-hidden="true" />
            {loading ? "Running forecast…" : "Request prediction"}
          </Button>
        </div>
      </Panel>

      {error ? (
        <Panel variant="strong">
          <ErrorState
            title="Forecast request failed"
            description={error}
            onRetry={() => void handleRun()}
          />
        </Panel>
      ) : null}

      {notice ? <NoticeBanner tone="info" title="Model execution status" message={notice} /> : null}

      {loading ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Panel key={i}>
              <ListSkeleton rows={2} />
            </Panel>
          ))}
        </div>
      ) : forecast ? (
        <>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <KpiCard
              label="Current observed speed"
              value={String(forecast.currentSpeedMph)}
              unit="mph"
              icon={Gauge}
              accent="cyan"
              footer={`Sensor ${forecast.sensorId}`}
            />
            <KpiCard
              label={`Predicted at +${forecast.horizonMinutes} min`}
              value={String(forecast.terminalPredictedSpeedMph)}
              unit="mph"
              delta={forecast.speedChangeMph}
              deltaLabel="vs now"
              icon={forecast.speedChangeMph >= 0 ? TrendingUp : TrendingDown}
              accent={forecast.speedChangeMph >= 0 ? "emerald" : "rose"}
              footer={`Regime: ${forecast.expectedRegime}`}
            />
            <KpiCard
              label="Peak congestion risk"
              value={String(forecast.peakCongestionRiskPct)}
              unit="%"
              icon={Radar}
              accent="amber"
              footer={`Within ${forecast.horizonMinutes}-min horizon`}
            />
            <KpiCard
              label="Forecast confidence"
              value={forecast.confidenceSupported ? `${forecast.confidenceLevelPct}` : "N/A"}
              unit={forecast.confidenceSupported ? "% interval" : "unsupported"}
              icon={ShieldCheck}
              accent={forecast.confidenceSupported ? "emerald" : "amber"}
              footer={
                forecast.confidenceSupported
                  ? "Calibrated uncertainty band available"
                  : "STGCN does not emit calibrated uncertainty"
              }
            />
          </div>

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.7fr_1fr]">
            <Panel className="overflow-hidden">
              <PanelHeader
                title="Actual vs predicted speed"
                description={`${forecast.segmentName} · 5-minute steps, -60 to +60 min`}
                icon={Gauge}
                action={
                  <div className="flex items-center gap-1.5">
                    <Badge variant="cyan">Predicted</Badge>
                    <Badge variant="success">Actual</Badge>
                    {forecast.confidenceSupported ? <Badge variant="muted">90% band</Badge> : null}
                  </div>
                }
              />
              <ForecastVsActualChart
                series={forecast.series}
                showConfidence={forecast.confidenceSupported}
              />
            </Panel>


            <div className="space-y-4">
              <Panel className="overflow-hidden">
                <PanelHeader
                  title="Prediction summary"
                  description={forecast.modelName}
                  icon={BrainCircuit}
                  action={
                    <CustomBadge
                      label={getCongestionBadgeStyles(forecast.expectedRegime).label}
                      className={cn(
                        getCongestionBadgeStyles(forecast.expectedRegime).bg,
                        getCongestionBadgeStyles(forecast.expectedRegime).text,
                        getCongestionBadgeStyles(forecast.expectedRegime).border
                      )}
                      dotClass={getCongestionBadgeStyles(forecast.expectedRegime).dot}
                    />
                  }
                />
                <div className="space-y-3 p-4">
                  <p className="text-[12px] leading-relaxed text-slate-300">{forecast.summaryText}</p>
                  <dl className="grid grid-cols-2 gap-2.5">
                    <SummaryRow label="Request ID" value={forecast.requestId} mono />
                    <SummaryRow label="Model ID" value={forecast.modelId} mono />
                    <SummaryRow label="Data source" value={forecast.dataSource} />
                    <SummaryRow
                      label="Generated"
                      value={new Date(forecast.generatedAt).toLocaleTimeString()}
                    />
                  </dl>
                </div>
              </Panel>

              <Panel className="overflow-hidden">
                <PanelHeader
                  title="Historical comparison"
                  description="Observed window vs simulated projection"
                  icon={CalendarClock}
                />
                <div className="space-y-2.5 p-4">
                  <ComparisonRow
                    label="60-min historical average"
                    value={`${forecast.series[0].historicalAvgSpeedMph} mph`}
                  />
                  <ComparisonRow
                    label="Observed at request time"
                    value={`${forecast.currentSpeedMph} mph`}
                  />
                  <ComparisonRow
                    label={`Projected +${forecast.horizonMinutes} min`}
                    value={`${forecast.terminalPredictedSpeedMph} mph`}
                    emphasis
                  />
                  <p className="pt-1 text-[10px] leading-relaxed text-slate-500">
                    Historical values are drawn from the simulated 60-minute sensor window, not from a
                    live PeMS feed.
                  </p>
                </div>
              </Panel>
            </div>
          </div>

          <Panel className="overflow-hidden">
            <PanelHeader
              title="Congestion risk heatmap"
              description="Cross-corridor risk projection across future 5-minute steps"
              icon={Radar}
              action={
                <CustomBadge
                  label={`${forecast.modelId} · simulated`}
                  className="border-amber-500/25 bg-amber-500/10 text-amber-300"
                />
              }
            />
            <CorridorRiskHeatmap matrix={forecast.corridorRiskMatrix} />
          </Panel>
        </>
      ) : (
        <Panel variant="strong">
          <EmptyState
            title="No forecast generated yet"
            description="Choose a road segment, horizon and model architecture above, then select 'Request prediction' to generate a deterministic demo forecast with confidence bands and a cross-corridor risk matrix."
            icon={BrainCircuit}
            action={
              <Button variant="primary" onClick={() => void handleRun()} disabled={!segmentId}>
                <Play className="h-3.5 w-3.5" aria-hidden="true" />
                Request prediction
              </Button>
            }
          />
        </Panel>
      )}
    </div>
  );
}

function SummaryRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="rounded-md border border-white/[0.06] bg-white/[0.02] px-2.5 py-1.5">
      <dt className="label-caps">{label}</dt>
      <dd className={cn("mt-0.5 truncate text-[11.5px] text-slate-200", mono && "font-mono")}>
        {value}
      </dd>
    </div>
  );
}

function ComparisonRow({
  label,
  value,
  emphasis,
}: {
  label: string;
  value: string;
  emphasis?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-white/[0.05] pb-2 last:border-0">
      <span className="text-[11.5px] text-slate-400">{label}</span>
      <span
        className={cn(
          "font-mono text-[12.5px] font-medium",
          emphasis ? "text-cyan-300" : "text-slate-200"
        )}
      >
        {value}
      </span>
    </div>
  );
}

