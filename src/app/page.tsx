"use client";

import * as React from "react";
import Link from "next/link";
import {
  Activity,
  ArrowRight,
  BrainCircuit,
  Gauge,
  RefreshCw,
  Sparkles,
  TrafficCone,
  TrendingDown,
  Waypoints,
} from "lucide-react";
import { Panel, PanelHeader } from "@/components/ui/panel";
import { Button } from "@/components/ui/button";
import { KpiCard } from "@/components/ui/kpi-card";
import { NoticeBanner } from "@/components/ui/notice-banner";
import { ChartSkeleton, ListSkeleton, MetricSkeleton } from "@/components/ui/skeleton";
import { ErrorState, EmptyState } from "@/components/ui/states";
import { DataSourceBadge } from "@/components/ui/data-source-badge";
import { CustomBadge } from "@/components/ui/badge";
import { TrafficMap } from "@/components/map/traffic-map";
import { VolumeSpeedChart } from "@/components/charts/volume-speed-chart";
import { CongestionForecastChart } from "@/components/charts/congestion-forecast-chart";
import { SegmentTable } from "@/components/traffic/segment-table";
import { IncidentFeed } from "@/components/traffic/incident-feed";
import { useTrafficData } from "@/hooks/use-traffic-data";
import { generateAnalyticsDataset } from "@/lib/libcity-adapter";
import { getCongestionBadgeStyles, cn } from "@/lib/utils";
import type { RoadSegment } from "@/types/traffic";

export default function OverviewPage() {
  const { segments, incidents, snapshot, loading, refreshing, error, notice, dataSource, refresh } =
    useTrafficData();
  const [selectedSegmentId, setSelectedSegmentId] = React.useState<string | null>(null);

  const analytics = React.useMemo(
    () => (segments.length ? generateAnalyticsDataset(segments, "all", "Last 24 hours") : null),
    [segments]
  );

  const selectedSegment = segments.find((s) => s.id === selectedSegmentId) ?? null;

  if (error) {
    return (
      <Panel variant="strong">
        <ErrorState description={error} onRetry={refresh} />
      </Panel>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <DataSourceBadge mode={dataSource} />
          <span className="flex items-center gap-1.5 text-[11px] text-slate-500">
            {refreshing ? (
              <span className="h-2.5 w-2.5 animate-spin rounded-full border border-cyan-500/30 border-t-cyan-400" />
            ) : null}
            {loading
              ? "Loading network snapshot…"
              : refreshing
                ? "Refreshing network snapshot…"
                : `Last refreshed ${new Date().toLocaleTimeString()}`}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" onClick={refresh} disabled={loading || refreshing}>
            <RefreshCw
              className={cn("h-3.5 w-3.5", (loading || refreshing) && "animate-spin")}
              aria-hidden="true"
            />
            Refresh
          </Button>
          <Link href="/live-traffic">
            <Button variant="primary">
              Open live operations
              <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </Button>
          </Link>
        </div>
      </div>

      {notice ? <NoticeBanner tone="warning" title="Demo data notice" message={notice} /> : null}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {loading || !snapshot ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Panel key={i}>
              <MetricSkeleton />
            </Panel>
          ))
        ) : (
          <>
            <KpiCard
              label="Average network speed"
              value={snapshot.networkAvgSpeedMph.toFixed(1)}
              unit="mph"
              delta={snapshot.speedDeltaPct}
              deltaLabel="vs 15 min ago"
              icon={Gauge}
              accent="cyan"
              footer={`${snapshot.totalSensorsMonitored} METR-LA corridor segments monitored`}
            />
            <KpiCard
              label="Congestion index"
              value={String(snapshot.networkCongestionIndex)}
              unit="%"
              delta={snapshot.congestionDeltaPct}
              deltaLabel="vs 15 min ago"
              invertDelta
              icon={Activity}
              accent="amber"
              footer={`${snapshot.criticalCorridorCount} corridors in severe state`}
            />
            <KpiCard
              label="Active incidents"
              value={String(snapshot.activeIncidentCount)}
              unit="open"
              icon={TrafficCone}
              accent="rose"
              footer="Local demo incident store"
            />
            <KpiCard
              label="Predicted deterioration"
              value={snapshot.predictedDeteriorationPct.toFixed(1)}
              unit="%"
              delta={-snapshot.predictedDeteriorationPct}
              deltaLabel="15-min horizon"
              invertDelta
              icon={TrendingDown}
              accent="rose"
              footer={`${snapshot.deterioratingSegmentsCount} segments trending slower`}
            />
          </>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.65fr_1fr]">
        <Panel variant="strong" className="overflow-hidden">
          <PanelHeader
            title="Live traffic network"
            description="Los Angeles County METR-LA corridor segments · click any segment to inspect"
            icon={Waypoints}
            action={
              <span className="hidden items-center gap-1.5 text-[10.5px] text-slate-500 sm:flex">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-cyan-400" />
                simulated feed
              </span>
            }
          />
          <div className="h-[420px] w-full p-2 sm:h-[480px]">
            {loading ? (
              <div className="skeleton h-full w-full rounded-xl" />
            ) : (
              <TrafficMap
                segments={segments}
                incidents={incidents}
                selectedSegmentId={selectedSegmentId}
                onSelectSegment={setSelectedSegmentId}
              />
            )}
          </div>
          {selectedSegment ? (
            <div className="border-t border-white/[0.06] px-4 py-3">
              <SegmentQuickFacts
                segment={selectedSegment}
                onClear={() => setSelectedSegmentId(null)}
              />
            </div>
          ) : null}
        </Panel>

        <div className="space-y-4">
          <Panel className="overflow-hidden">
            <PanelHeader
              title="AI traffic summary"
              description="Deterministic rule-based analysis · simulation mode"
              icon={Sparkles}
              action={
                <CustomBadge
                  label="Not a live model"
                  className="border-amber-500/25 bg-amber-500/10 text-amber-300"
                />
              }
            />
            {loading || !snapshot ? (
              <ListSkeleton rows={4} />
            ) : (
              <div className="space-y-3 p-4">
                <p className="text-[12.5px] font-medium leading-relaxed text-slate-100">
                  {snapshot.aiExecutiveSummary.headline}
                </p>
                <ul className="space-y-2">
                  {snapshot.aiExecutiveSummary.keyFindings.map((finding, index) => (
                    <li key={index} className="flex gap-2.5">
                      <span
                        className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-cyan-400"
                        aria-hidden="true"
                      />
                      <span className="text-[11.5px] leading-relaxed text-slate-400">{finding}</span>
                    </li>
                  ))}
                </ul>
                <div className="rounded-lg border border-cyan-500/15 bg-cyan-500/[0.05] px-3 py-2.5">
                  <p className="label-caps text-cyan-300/80">Recommended action</p>
                  <p className="mt-1 text-[11.5px] leading-relaxed text-cyan-100/80">
                    {snapshot.aiExecutiveSummary.recommendedAction}
                  </p>
                </div>
                <p className="text-[10px] leading-relaxed text-slate-500">
                  {snapshot.aiExecutiveSummary.generatedBy}
                </p>
              </div>
            )}
          </Panel>

          <Panel className="overflow-hidden">
            <PanelHeader
              title="Live incident feed"
              description="Most recent operational events"
              icon={TrafficCone}
              action={
                <Link
                  href="/incidents"
                  className="focus-ring rounded text-[10.5px] text-cyan-400 transition hover:text-cyan-300"
                >
                  Manage →
                </Link>
              }
            />
            {loading ? (
              <ListSkeleton rows={4} />
            ) : incidents.length ? (
              <IncidentFeed incidents={incidents} limit={4} />
            ) : (
              <EmptyState
                title="No incidents recorded"
                description="There are currently no incidents in the local demo store."
                icon={TrafficCone}
              />
            )}
          </Panel>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <Panel className="overflow-hidden">
          <PanelHeader
            title="Traffic volume & speed profile"
            description="24-hour hourly profile across all monitored corridors"
            icon={Activity}
            action={
              <CustomBadge
                label="Volume veh/h · Speed mph"
                className="border-white/10 bg-white/[0.04] text-slate-400"
              />
            }
          />
          {loading || !analytics ? (
            <ChartSkeleton className="h-[248px]" />
          ) : (
            <VolumeSpeedChart data={analytics.hourlySeries} />
          )}
        </Panel>

        <Panel className="overflow-hidden">
          <PanelHeader
            title="Hourly congestion forecast"
            description="Observed congestion index with simulated forecast overlay"
            icon={BrainCircuit}
            action={
              <Link
                href="/predictions"
                className="focus-ring rounded text-[10.5px] text-cyan-400 transition hover:text-cyan-300"
              >
                Forecast studio →
              </Link>
            }
          />
          {loading || !analytics ? (
            <ChartSkeleton className="h-[230px]" />
          ) : (
            <CongestionForecastChart data={analytics.hourlySeries} />
          )}
        </Panel>
      </div>

      <Panel className="overflow-hidden">
        <PanelHeader
          title="Most congested road segments"
          description="Ranked by current congestion index across the monitored network"
          icon={Waypoints}
          action={
            <Link
              href="/analytics"
              className="focus-ring rounded text-[10.5px] text-cyan-400 transition hover:text-cyan-300"
            >
              Full analytics →
            </Link>
          }
        />
        {loading ? (
          <ListSkeleton rows={6} />
        ) : (
          <SegmentTable
            segments={segments}
            limit={6}
            selectedSegmentId={selectedSegmentId}
            onSelect={(segment) => setSelectedSegmentId(segment.id)}
          />
        )}
      </Panel>
    </div>
  );
}

function SegmentQuickFacts({ segment, onClear }: { segment: RoadSegment; onClear: () => void }) {
  const styles = getCongestionBadgeStyles(segment.congestionLevel);
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex flex-wrap items-center gap-3">
        <CustomBadge
          label={styles.label}
          className={cn(styles.bg, styles.text, styles.border)}
          dotClass={styles.dot}
        />
        <span className="text-[12px] font-medium text-slate-200">
          {segment.highway} {segment.direction} · {segment.name}
        </span>
        <span className="font-mono text-[11px] text-slate-400">
          {segment.currentSpeedMph} mph · {segment.flowVehPerHr.toLocaleString()} veh/h ·{" "}
          {segment.occupancyPct}% occupancy
        </span>
      </div>
      <Button variant="ghost" size="sm" onClick={onClear}>
        Clear selection
      </Button>
    </div>
  );
}

