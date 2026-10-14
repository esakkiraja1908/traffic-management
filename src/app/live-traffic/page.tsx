"use client";

import * as React from "react";
import {
  Activity,
  Clock3,
  Eye,
  EyeOff,
  Layers,
  Map as MapIcon,
  RefreshCw,
  Search,
  SlidersHorizontal,
  Waypoints,
  X,
} from "lucide-react";
import { Panel, PanelHeader } from "@/components/ui/panel";
import { Button } from "@/components/ui/button";
import { Badge, CustomBadge } from "@/components/ui/badge";
import { SegmentedControl, Select, inputClasses } from "@/components/ui/controls";
import { NoticeBanner } from "@/components/ui/notice-banner";
import { ErrorState, EmptyState } from "@/components/ui/states";
import { DataSourceBadge } from "@/components/ui/data-source-badge";
import { TrafficMap } from "@/components/map/traffic-map";
import type { TileProviderKey } from "@/components/map/map-config";
import { SegmentDetailPanel } from "@/components/traffic/segment-detail-panel";
import { SegmentTable } from "@/components/traffic/segment-table";
import { useTrafficData } from "@/hooks/use-traffic-data";
import { useSettings } from "@/components/providers/settings-provider";
import { getCongestionBadgeStyles, cn } from "@/lib/utils";
import type { CongestionLevel } from "@/types/traffic";

type TimeRange = "live" | "-15m" | "-30m" | "-1h" | "-3h";
type CongestionFilter = "all" | CongestionLevel;

const TIME_RANGE_OPTIONS: { value: TimeRange; label: string }[] = [
  { value: "live", label: "Live now" },
  { value: "-15m", label: "-15 min" },
  { value: "-30m", label: "-30 min" },
  { value: "-1h", label: "-1 hr" },
  { value: "-3h", label: "-3 hr" },
];

const CONGESTION_FILTERS: { value: CongestionFilter; label: string }[] = [
  { value: "all", label: "All states" },
  { value: "free", label: "Free flow" },
  { value: "moderate", label: "Moderate" },
  { value: "heavy", label: "Heavy" },
  { value: "severe", label: "Severe" },
];

export default function LiveTrafficPage() {
  const { segments, incidents, loading, refreshing, error, notice, dataSource, refresh } =
    useTrafficData();
  const { settings, updateSettings } = useSettings();

  const [selectedSegmentId, setSelectedSegmentId] = React.useState<string | null>(null);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [timeRange, setTimeRange] = React.useState<TimeRange>("live");
  const [congestionFilter, setCongestionFilter] = React.useState<CongestionFilter>("all");
  const [showSegments, setShowSegments] = React.useState(true);
  const [showSensors, setShowSensors] = React.useState(true);
  const [showIncidents, setShowIncidents] = React.useState(true);
  const [showLabels, setShowLabels] = React.useState(settings.showSensorLabels);
  const [tileProvider, setTileProvider] = React.useState<TileProviderKey>(
    settings.mapTileStyle === "osm_standard" ? "osm_standard" : "dark_matter"
  );
  const [mapKey, setMapKey] = React.useState(0);

  const filteredSegments = React.useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return segments.filter((segment) => {
      const matchesCongestion =
        congestionFilter === "all" || segment.congestionLevel === congestionFilter;
      if (!matchesCongestion) return false;
      if (!query) return true;
      return (
        segment.name.toLowerCase().includes(query) ||
        segment.highway.toLowerCase().includes(query) ||
        segment.corridor.toLowerCase().includes(query) ||
        segment.sensorId.includes(query)
      );
    });
  }, [segments, searchQuery, congestionFilter]);

  const selectedSegment = segments.find((s) => s.id === selectedSegmentId) ?? null;

  const counts = React.useMemo(() => {
    const base = { free: 0, moderate: 0, heavy: 0, severe: 0 };
    for (const segment of segments) base[segment.congestionLevel] += 1;
    return base;
  }, [segments]);

  // Segments at or below the operator-configured severe threshold.
  const belowSevereThreshold = React.useMemo(
    () => segments.filter((segment) => segment.currentSpeedMph <= settings.severeCongestionThresholdMph),
    [segments, settings.severeCongestionThresholdMph]
  );

  const resetMap = React.useCallback(() => {
    setSelectedSegmentId(null);
    setSearchQuery("");
    setCongestionFilter("all");
    setTimeRange("live");
    setShowSegments(true);
    setShowSensors(true);
    setShowIncidents(true);
    setMapKey((k) => k + 1);
  }, []);

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
          <span className="text-[11px] text-slate-500">
            {filteredSegments.length} of {segments.length} segments shown
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
          <Button variant="secondary" onClick={resetMap}>
            <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
            Reset map
          </Button>
        </div>
      </div>

      {notice ? <NoticeBanner tone="warning" title="Demo data notice" message={notice} /> : null}

      <Panel variant="strong" className="overflow-hidden">
        <div className="flex flex-wrap items-center gap-2.5 border-b border-white/[0.06] px-3.5 py-2.5">
          <div className="relative min-w-[190px] flex-1">
            <Search
              className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500"
              aria-hidden="true"
            />
            <input
              type="search"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search highway, corridor, or METR-LA sensor ID…"
              aria-label="Search road segments"
              className={cn(inputClasses, "pl-8")}
            />
            {searchQuery ? (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                aria-label="Clear search"
                className="focus-ring absolute right-2 top-1/2 -translate-y-1/2 rounded p-0.5 text-slate-500 hover:text-slate-200"
              >
                <X className="h-3 w-3" aria-hidden="true" />
              </button>
            ) : null}
          </div>

          <SegmentedControl
            ariaLabel="Time range"
            options={TIME_RANGE_OPTIONS}
            value={timeRange}
            onChange={setTimeRange}
          />

          <Select
            ariaLabel="Congestion filter"
            value={congestionFilter}
            onChange={(value) => setCongestionFilter(value as CongestionFilter)}
            options={CONGESTION_FILTERS}
            className="w-[132px]"
          />

          <Select
            ariaLabel="Basemap style"
            value={tileProvider}
            onChange={(value) => setTileProvider(value as TileProviderKey)}
            options={[
              { value: "dark_matter", label: "Dark basemap" },
              { value: "osm_standard", label: "OSM standard" },
            ]}
            className="w-[136px]"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_352px]">
          <div className="relative">
            <div className="h-[440px] w-full p-2 lg:h-[612px]">
              {loading ? (
                <div className="skeleton h-full w-full rounded-xl" />
              ) : filteredSegments.length ? (
                <TrafficMap
                  key={mapKey}
                  segments={filteredSegments}
                  incidents={incidents}
                  selectedSegmentId={selectedSegmentId}
                  onSelectSegment={setSelectedSegmentId}
                  showSegments={showSegments}
                  showSensors={showSensors}
                  showIncidents={showIncidents}
                  showLabels={showLabels}
                  tileProvider={tileProvider}
                />
              ) : (
                <div className="flex h-full items-center justify-center rounded-xl border border-white/[0.07] bg-slate-950/40">
                  <EmptyState
                    title="No segments match the filters"
                    description="Adjust the search query or congestion filter to bring road segments back onto the map."
                    icon={Waypoints}
                    action={
                      <Button variant="secondary" onClick={resetMap}>
                        Reset filters
                      </Button>
                    }
                  />
                </div>
              )}
            </div>


            <div className="absolute left-3 top-3 z-[500] w-[190px]">
              <div className="glass-panel-strong overflow-hidden">
                <div className="flex items-center gap-1.5 border-b border-white/[0.07] px-3 py-2">
                  <SlidersHorizontal className="h-3.5 w-3.5 text-cyan-400" aria-hidden="true" />
                  <span className="text-[10.5px] font-semibold uppercase tracking-[0.1em] text-slate-300">
                    Layers
                  </span>
                </div>
                <div className="space-y-0.5 p-1.5">
                  <LayerToggle
                    label="Road segments"
                    icon={Waypoints}
                    active={showSegments}
                    onToggle={() => setShowSegments((v) => !v)}
                  />
                  <LayerToggle
                    label="Sensor nodes"
                    icon={Activity}
                    active={showSensors}
                    onToggle={() => setShowSensors((v) => !v)}
                  />
                  <LayerToggle
                    label="Incident markers"
                    icon={Layers}
                    active={showIncidents}
                    onToggle={() => setShowIncidents((v) => !v)}
                  />
                  <LayerToggle
                    label="Sensor labels"
                    icon={Eye}
                    active={showLabels}
                    onToggle={() => {
                      setShowLabels((v) => {
                        updateSettings({ showSensorLabels: !v });
                        return !v;
                      });
                    }}
                  />
                </div>
                <div className="border-t border-white/[0.07] px-3 py-2">
                  <p className="label-caps">Network state</p>
                  <div className="mt-1.5 space-y-1">
                    {(["free", "moderate", "heavy", "severe"] as CongestionLevel[]).map((level) => {
                      const styles = getCongestionBadgeStyles(level);
                      return (
                        <div key={level} className="flex items-center justify-between">
                          <span className="flex items-center gap-1.5">
                            <span className={cn("h-1.5 w-1.5 rounded-full", styles.dot)} />
                            <span className="text-[10.5px] text-slate-400">{styles.label}</span>
                          </span>
                          <span className="font-mono text-[10.5px] text-slate-300">
                            {counts[level]}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                  <div className="mt-2 flex items-center justify-between border-t border-white/[0.06] pt-2">
                    <span className="text-[10px] text-slate-500">
                      ≤ {settings.severeCongestionThresholdMph} mph threshold
                    </span>
                    <span
                      className={cn(
                        "font-mono text-[10.5px] font-medium",
                        belowSevereThreshold.length ? "text-rose-400" : "text-emerald-400"
                      )}
                      title={`${belowSevereThreshold.length} segment(s) at or below your configured severe threshold. Adjust it in Settings.`}
                    >
                      {belowSevereThreshold.length} flagged
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="pointer-events-none absolute bottom-3 right-3 z-[500]">
              <Badge variant="muted" className="bg-slate-950/85 backdrop-blur">
                <MapIcon className="h-3 w-3" aria-hidden="true" />
                {tileProvider === "dark_matter" ? "CARTO Dark Matter" : "OpenStreetMap"} ·{" "}
                {timeRange === "live" ? "live" : timeRange}
              </Badge>
            </div>
          </div>

          <div className="border-t border-white/[0.06] lg:border-l lg:border-t-0">
            <PanelHeader
              title="Segment telemetry inspector"
              description="Speed, flow, occupancy and graph neighbours"
              icon={Activity}
              action={
                selectedSegment ? (
                  <Badge variant="cyan" dot>
                    selected
                  </Badge>
                ) : (
                  <Badge variant="muted">
                    <EyeOff className="h-3 w-3" aria-hidden="true" />
                    idle
                  </Badge>
                )
              }
            />
            <div className="h-[520px] overflow-hidden">
              <SegmentDetailPanel
                segment={selectedSegment}
                allSegments={segments}
                incidents={incidents}
                onClose={() => setSelectedSegmentId(null)}
                onFocusSensor={setSelectedSegmentId}
              />
            </div>
          </div>
        </div>
      </Panel>



      <Panel className="overflow-hidden">
        <PanelHeader
          title="Filtered segment register"
          description={`${filteredSegments.length} segments matching current filters · ${
            timeRange === "live" ? "live snapshot" : `${timeRange} lookback`
          }`}
          icon={Clock3}
          action={
            <CustomBadge
              label="Simulated observations"
              className="border-amber-500/25 bg-amber-500/10 text-amber-300"
            />
          }
        />
        {loading ? (
          <div className="space-y-2 p-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="skeleton h-9 w-full rounded-md" />
            ))}
          </div>
        ) : (
          <SegmentTable
            segments={filteredSegments}
            selectedSegmentId={selectedSegmentId}
            onSelect={(segment) => setSelectedSegmentId(segment.id)}
          />
        )}
      </Panel>
    </div>
  );
}

function LayerToggle({
  label,
  icon: Icon,
  active,
  onToggle,
}: {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  active: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={active}
      onClick={onToggle}
      className={cn(
        "focus-ring flex w-full items-center justify-between gap-2 rounded-md px-2 py-1.5 text-left transition",
        active ? "bg-cyan-500/10" : "hover:bg-white/[0.05]"
      )}
    >
      <span className="flex items-center gap-2">
        <Icon className={cn("h-3.5 w-3.5", active ? "text-cyan-300" : "text-slate-500")} />
        <span className={cn("text-[11px]", active ? "text-slate-200" : "text-slate-500")}>
          {label}
        </span>
      </span>
      <span
        className={cn(
          "relative h-3.5 w-6 shrink-0 rounded-full transition-colors",
          active ? "bg-cyan-500/70" : "bg-slate-700"
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 h-2.5 w-2.5 rounded-full bg-white transition-all",
            active ? "left-3" : "left-0.5"
          )}
        />
      </span>
    </button>
  );
}
