"use client";

import * as React from "react";
import {
  BarChart3,
  CalendarRange,
  Clock3,
  Download,
  Filter,
  Gauge,
  TrendingUp,
  Waypoints,
} from "lucide-react";
import { Panel, PanelHeader } from "@/components/ui/panel";
import { Button } from "@/components/ui/button";
import { Badge, CustomBadge } from "@/components/ui/badge";
import { Select } from "@/components/ui/controls";
import { NoticeBanner } from "@/components/ui/notice-banner";
import { ChartSkeleton, ListSkeleton } from "@/components/ui/skeleton";
import { ErrorState, EmptyState } from "@/components/ui/states";
import { DataSourceBadge } from "@/components/ui/data-source-badge";
import { VolumeSpeedChart } from "@/components/charts/volume-speed-chart";
import { SpeedDistributionChart } from "@/components/charts/speed-distribution-chart";
import { TimeOfDayHeatmap } from "@/components/charts/time-of-day-heatmap";
import { SegmentComparisonChart } from "@/components/charts/segment-comparison-chart";
import { useAnalytics } from "@/hooks/use-analytics";
import { useTrafficData } from "@/hooks/use-traffic-data";
import { useToast } from "@/components/providers/toast-provider";
import { generateCsvContent, cn } from "@/lib/utils";

const DATE_RANGES = [
  { value: "Last 24 hours", label: "Last 24 hours" },
  { value: "Last 7 days", label: "Last 7 days" },
  { value: "Last 30 days", label: "Last 30 days" },
  { value: "Q3 2026 (quarter)", label: "Q3 2026 (quarter)" },
];

export default function AnalyticsPage() {
  const { segments, loading: segmentsLoading, error: segmentsError, refresh } = useTrafficData();
  const [corridorFilter, setCorridorFilter] = React.useState("all");
  const [dateRange, setDateRange] = React.useState("Last 24 hours");
  const { dataset, loading, notice } = useAnalytics(corridorFilter, dateRange);
  const { pushToast } = useToast();

  const corridorOptions = React.useMemo(() => {
    const highways = Array.from(new Set(segments.map((s) => s.highway))).sort();
    return [
      { value: "all", label: "All corridors" },
      ...highways.map((h) => ({ value: h, label: h })),
    ];
  }, [segments]);

  const handleExport = React.useCallback(() => {
    if (!dataset) return;
    const csv = generateCsvContent(
      dataset.hourlySeries.map((point) => ({
        hour: point.hourLabel,
        volume_veh_per_hr: point.volumeVehPerHr,
        avg_speed_mph: point.avgSpeedMph,
        free_flow_speed_mph: point.freeFlowSpeedMph,
        congestion_index_pct: point.congestionIndex,
        forecast_congestion_index_pct: point.predictedCongestionIndex,
        incident_count: point.incidentCount,
      })),
      [
        { key: "hour", header: "Hour" },
        { key: "volume_veh_per_hr", header: "Volume (veh/h)" },
        { key: "avg_speed_mph", header: "Average speed (mph)" },
        { key: "free_flow_speed_mph", header: "Free-flow speed (mph)" },
        { key: "congestion_index_pct", header: "Congestion index (%)" },
        { key: "forecast_congestion_index_pct", header: "Forecast congestion index (%)" },
        { key: "incident_count", header: "Incident count" },
      ]
    );

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `traffic-intelligence-analytics-${corridorFilter
      .replace(/[^a-z0-9]/gi, "-")
      .toLowerCase()}.csv`;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);

    pushToast({
      variant: "success",
      title: "CSV export complete",
      description: `${dataset.hourlySeries.length} hourly rows exported for ${
        corridorFilter === "all" ? "all corridors" : corridorFilter
      }.`,
    });
  }, [dataset, corridorFilter, pushToast]);

  if (segmentsError) {
    return (
      <Panel variant="strong">
        <ErrorState description={segmentsError} onRetry={refresh} />
      </Panel>
    );
  }

  const busy = loading || segmentsLoading;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <DataSourceBadge mode="simulation" />
          <span className="text-[11px] text-slate-500">
            {dateRange} · {corridorFilter === "all" ? "all corridors" : corridorFilter}
          </span>
        </div>
        <Button variant="primary" onClick={handleExport} disabled={!dataset || busy}>
          <Download className="h-3.5 w-3.5" aria-hidden="true" />
          Export displayed data (CSV)
        </Button>
      </div>

      {notice ? <NoticeBanner tone="warning" title="Demo data notice" message={notice} /> : null}

      <Panel>
        <PanelHeader
          title="Filters"
          description="Adjust the corridor scope and reporting window"
          icon={Filter}
        />
        <div className="flex flex-wrap items-end gap-3 p-4">
          <div className="w-[176px]">
            <label className="label-caps mb-1.5 block" htmlFor="corridor-filter">
              Corridor
            </label>
            <Select
              id="corridor-filter"
              ariaLabel="Corridor filter"
              value={corridorFilter}
              onChange={setCorridorFilter}
              options={corridorOptions}
            />
          </div>
          <div className="w-[188px]">
            <label className="label-caps mb-1.5 block" htmlFor="date-range">
              Date range
            </label>
            <Select
              id="date-range"
              ariaLabel="Date range"
              value={dateRange}
              onChange={setDateRange}
              options={DATE_RANGES}
            />
          </div>
          <Badge variant="muted" className="mb-1">
            <CalendarRange className="h-3 w-3" aria-hidden="true" />
            {dataset?.hourlySeries.length ?? 0} hourly buckets
          </Badge>
        </div>
      </Panel>

      {busy || !dataset ? (
        <>
          <Panel className="overflow-hidden">
            <ChartSkeleton className="h-[248px]" />
          </Panel>
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            <Panel className="overflow-hidden">
              <ChartSkeleton className="h-[224px]" />
            </Panel>
            <Panel className="overflow-hidden">
              <ListSkeleton rows={5} />
            </Panel>
          </div>
        </>
      ) : (
        <>
          <Panel className="overflow-hidden">
            <PanelHeader
              title="Traffic volume & speed over time"
              description="Hourly aggregated volume and average speed"
              icon={BarChart3}
              action={
                <div className="flex items-center gap-1.5">
                  <Badge variant="cyan">Volume</Badge>
                  <Badge variant="default">Speed</Badge>
                </div>
              }
            />
            <VolumeSpeedChart data={dataset.hourlySeries} />
          </Panel>

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            <Panel className="overflow-hidden">
              <PanelHeader
                title="Speed distribution"
                description="How monitored segments distribute across speed regimes"
                icon={Gauge}
              />
              <SpeedDistributionChart data={dataset.speedDistribution} />
            </Panel>

            <Panel className="overflow-hidden">
              <PanelHeader
                title="Peak-hour analysis"
                description="Morning and evening commute windows"
                icon={Clock3}
              />
              <div className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-2">
                <PeakBlock
                  title="Morning peak"
                  window={dataset.peakHourSummary.morningPeakWindow}
                  congestion={dataset.peakHourSummary.morningPeakCongestionPct}
                  speed={dataset.peakHourSummary.morningAvgSpeedMph}
                />
                <PeakBlock
                  title="Evening peak"
                  window={dataset.peakHourSummary.eveningPeakWindow}
                  congestion={dataset.peakHourSummary.eveningPeakCongestionPct}
                  speed={dataset.peakHourSummary.eveningAvgSpeedMph}
                />
                <div className="sm:col-span-2 rounded-lg border border-white/[0.07] bg-white/[0.02] px-3 py-2.5">
                  <p className="label-caps">Most impacted corridor</p>
                  <p className="mt-0.5 text-[13px] font-medium text-slate-100">
                    {dataset.peakHourSummary.mostImpactedCorridor}
                  </p>
                  <p className="mt-1 text-[10.5px] text-slate-500">
                    Daily total {dataset.peakHourSummary.dailyTotalVehicleMilesK}k vehicle-miles ·
                    simulated
                  </p>
                </div>
              </div>
            </Panel>
          </div>

          <Panel className="overflow-hidden">
            <PanelHeader
              title="Congestion by time of day"
              description="Corridor x period congestion matrix"
              icon={Clock3}
              action={
                <CustomBadge
                  label="Congestion index %"
                  className="border-white/10 bg-white/[0.04] text-slate-400"
                />
              }
            />
            <TimeOfDayHeatmap rows={dataset.timeOfDayMatrix} />
          </Panel>

          <Panel className="overflow-hidden">
            <PanelHeader
              title="Road-segment comparison"
              description="Peak congestion and reliability across corridors"
              icon={Waypoints}
            />
            <SegmentComparisonChart data={dataset.segmentComparisons} />
          </Panel>


          <Panel className="overflow-hidden">
            <PanelHeader
              title="Historical traffic trends"
              description="Segment-level daily summary with delay and reliability"
              icon={TrendingUp}
            />
            <div className="overflow-x-auto">
              <table className="w-full min-w-[620px]">
                <thead>
                  <tr className="border-b border-white/[0.06]">
                    <th className="label-caps px-3 py-2 text-left">Segment</th>
                    <th className="label-caps px-3 py-2 text-right">Avg speed</th>
                    <th className="label-caps px-3 py-2 text-right">Peak congestion</th>
                    <th className="label-caps px-3 py-2 text-right">Daily volume</th>
                    <th className="label-caps px-3 py-2 text-right">Delay</th>
                    <th className="label-caps px-3 py-2 text-right">Reliability</th>
                  </tr>
                </thead>
                <tbody>
                  {dataset.segmentComparisons.map((row) => (
                    <tr key={row.segmentId} className="border-b border-white/[0.04]">
                      <td className="px-3 py-2.5">
                        <span className="text-[12px] font-medium text-slate-200">{row.highway}</span>
                        <span className="ml-2 text-[10.5px] text-slate-500">{row.name}</span>
                      </td>
                      <td className="px-3 py-2.5 text-right font-mono text-[12px] text-slate-300">
                        {row.avgSpeedMph} mph
                      </td>
                      <td className="px-3 py-2.5 text-right">
                        <span
                          className={cn(
                            "font-mono text-[12px] font-medium",
                            row.peakCongestionPct >= 70
                              ? "text-rose-400"
                              : row.peakCongestionPct >= 50
                                ? "text-orange-400"
                                : "text-amber-400"
                          )}
                        >
                          {row.peakCongestionPct}%
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-right font-mono text-[12px] text-slate-300">
                        {row.dailyVolumeK}k
                      </td>
                      <td className="px-3 py-2.5 text-right font-mono text-[12px] text-slate-300">
                        {row.delayMinPerMile} min/mi
                      </td>
                      <td className="px-3 py-2.5 text-right">
                        <span
                          className={cn(
                            "font-mono text-[12px]",
                            row.reliabilityScore >= 60
                              ? "text-emerald-400"
                              : row.reliabilityScore >= 40
                                ? "text-amber-400"
                                : "text-rose-400"
                          )}
                        >
                          {row.reliabilityScore}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>
        </>
      )}

      {!busy && dataset && dataset.segmentComparisons.length === 0 ? (
        <Panel variant="strong">
          <EmptyState
            title="No data for this corridor"
            description="The selected corridor has no monitored segments in the current demo dataset. Choose a different corridor filter."
            icon={Waypoints}
          />
        </Panel>
      ) : null}
    </div>
  );
}

function PeakBlock({
  title,
  window: windowLabel,
  congestion,
  speed,
}: {
  title: string;
  window: string;
  congestion: number;
  speed: number;
}) {
  return (
    <div className="rounded-lg border border-white/[0.07] bg-white/[0.02] px-3 py-2.5">
      <p className="label-caps">{title}</p>
      <p className="mt-0.5 font-mono text-[11px] text-slate-500">{windowLabel}</p>
      <div className="mt-2 flex items-end gap-3">
        <span className="font-mono text-[20px] font-semibold leading-none text-slate-100">
          {congestion}
          <span className="ml-0.5 text-[11px] font-normal text-slate-500">%</span>
        </span>
        <span className="pb-0.5 font-mono text-[11px] text-slate-400">{speed} mph avg</span>
      </div>
    </div>
  );
}

