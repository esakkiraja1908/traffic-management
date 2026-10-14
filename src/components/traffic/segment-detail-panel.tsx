"use client";

import {
  ArrowDownUp,
  CircleDot,
  Clock,
  Gauge,
  GitBranch,
  Layers3,
  Percent,
  TrafficCone,
  X,
} from "lucide-react";
import type { RoadSegment, TrafficIncident } from "@/types/traffic";
import {
  cn,
  formatRelativeMinutes,
  getCongestionBadgeStyles,
  getSeverityBadgeStyles,
} from "@/lib/utils";
import { CustomBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sparkline } from "@/components/charts/sparkline";
import { EmptyState } from "@/components/ui/states";

export function SegmentDetailPanel({
  segment,
  allSegments,
  incidents,
  onClose,
  onFocusSensor,
}: {
  segment: RoadSegment | null;
  allSegments: RoadSegment[];
  incidents: TrafficIncident[];
  onClose: () => void;
  onFocusSensor?: (segmentId: string) => void;
}) {
  if (!segment) {
    return (
      <EmptyState
        title="No segment selected"
        description="Select a road segment on the map or in the segment list to inspect its speed, flow, occupancy and connected sensors."
        icon={CircleDot}
      />
    );
  }

  const styles = getCongestionBadgeStyles(segment.congestionLevel);
  const upstream = allSegments.filter((s) => segment.upstreamSensorIds.includes(s.sensorId));
  const downstream = allSegments.filter((s) => segment.downstreamSensorIds.includes(s.sensorId));
  const relatedIncidents = incidents.filter(
    (i) => i.segmentId === segment.id && i.status !== "resolved"
  );

  const metrics = [
    { label: "Current speed", value: `${segment.currentSpeedMph}`, unit: "mph", icon: Gauge },
    { label: "Free-flow ref.", value: `${segment.freeFlowSpeedMph}`, unit: "mph", icon: Gauge },
    {
      label: "Traffic flow",
      value: segment.flowVehPerHr.toLocaleString(),
      unit: "veh/h",
      icon: ArrowDownUp,
    },
    { label: "Occupancy", value: `${segment.occupancyPct}`, unit: "%", icon: Percent },
    { label: "Congestion index", value: `${segment.congestionIndex}`, unit: "%", icon: Layers3 },
    { label: "Lanes", value: `${segment.lanes}`, unit: segment.direction, icon: GitBranch },
  ];

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-start justify-between gap-3 border-b border-white/[0.06] px-4 py-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <CustomBadge
              label={styles.label}
              className={cn(styles.bg, styles.text, styles.border)}
              dotClass={styles.dot}
            />
            <span className="font-mono text-[10.5px] text-slate-500">
              sensor {segment.sensorId}
            </span>
          </div>
          <h3 className="mt-1.5 text-[13px] font-semibold leading-snug text-slate-100">
            {segment.highway} {segment.direction} · {segment.name}
          </h3>
          <p className="mt-0.5 text-[11px] text-slate-500">{segment.corridor}</p>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close segment inspector">
          <X className="h-3.5 w-3.5" aria-hidden="true" />
        </Button>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto px-4 py-3.5">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {metrics.map((metric) => {
            const Icon = metric.icon;
            return (
              <div
                key={metric.label}
                className="rounded-lg border border-white/[0.07] bg-white/[0.025] px-2.5 py-2"
              >
                <p className="flex items-center gap-1.5 text-[9.5px] uppercase tracking-[0.1em] text-slate-500">
                  <Icon className="h-3 w-3" aria-hidden="true" />
                  {metric.label}
                </p>
                <p className="mt-1 font-mono text-[15px] font-semibold text-slate-100">
                  {metric.value}
                  <span className="ml-1 text-[10px] font-normal text-slate-500">{metric.unit}</span>
                </p>
              </div>
            );
          })}
        </div>

        <div className="rounded-lg border border-white/[0.07] bg-white/[0.02] p-3">
          <div className="flex items-center justify-between">
            <p className="label-caps">Speed trend · 60 minutes</p>
            <span
              className={cn(
                "font-mono text-[11px]",
                segment.trendDeltaMph >= 0 ? "text-emerald-400" : "text-rose-400"
              )}
            >
              {segment.trendDeltaMph >= 0 ? "+" : ""}
              {segment.trendDeltaMph.toFixed(1)} mph
            </span>
          </div>
          <div className="mt-2">
            <Sparkline
              values={segment.recentHistory.map((h) => h.speedMph)}
              color={segment.trendDeltaMph >= 0 ? "#34d399" : "#fb7185"}
              width={280}
              height={48}
              className="w-full"
              label={`${segment.name} speed trend`}
            />
          </div>
          <div className="mt-1.5 flex justify-between">
            {segment.recentHistory.map((point) => (
              <span key={point.time} className="font-mono text-[9px] text-slate-600">
                {point.time}
              </span>
            ))}
          </div>
        </div>

        <div className="rounded-lg border border-white/[0.07] bg-white/[0.02] p-3">
          <p className="label-caps flex items-center gap-1.5">
            <Clock className="h-3 w-3" aria-hidden="true" />
            Predicted speed horizons
          </p>
          <div className="mt-2 grid grid-cols-3 gap-2">
            {[
              { label: "+15 min", value: segment.predictedSpeed15mMph },
              { label: "+30 min", value: segment.predictedSpeed30mMph },
              { label: "+60 min", value: segment.predictedSpeed60mMph },
            ].map((horizon) => {
              const delta = horizon.value - segment.currentSpeedMph;
              return (
                <div
                  key={horizon.label}
                  className="rounded-md border border-white/[0.06] bg-slate-950/40 px-2 py-1.5 text-center"
                >
                  <p className="text-[9.5px] text-slate-500">{horizon.label}</p>
                  <p className="font-mono text-[13px] font-semibold text-slate-100">
                    {horizon.value}
                    <span className="ml-0.5 text-[9px] font-normal text-slate-500">mph</span>
                  </p>
                  <p
                    className={cn(
                      "font-mono text-[9.5px]",
                      delta >= 0 ? "text-emerald-400" : "text-rose-400"
                    )}
                  >
                    {delta >= 0 ? "+" : ""}
                    {delta.toFixed(1)}
                  </p>
                </div>
              );
            })}
          </div>
          <p className="mt-2 text-[10px] text-slate-500">
            Simulated short-horizon projection · not a LibCity checkpoint run
          </p>
        </div>

        <div className="rounded-lg border border-white/[0.07] bg-white/[0.02] p-3">
          <p className="label-caps flex items-center gap-1.5">
            <GitBranch className="h-3 w-3" aria-hidden="true" />
            Graph neighbours (METR_LA.rel)
          </p>
          <div className="mt-2 space-y-2.5">
            <NeighbourGroup
              title="Upstream"
              neighbours={upstream}
              onFocusSensor={onFocusSensor}
              emptyLabel="No upstream sensors in the mapped subgraph"
            />
            <NeighbourGroup
              title="Downstream"
              neighbours={downstream}
              onFocusSensor={onFocusSensor}
              emptyLabel="No downstream sensors in the mapped subgraph"
            />
          </div>
        </div>

        <div className="rounded-lg border border-white/[0.07] bg-white/[0.02] p-3">
          <p className="label-caps flex items-center gap-1.5">
            <TrafficCone className="h-3 w-3" aria-hidden="true" />
            Active incidents on segment
          </p>
          {relatedIncidents.length ? (
            <ul className="mt-2 space-y-2">
              {relatedIncidents.map((incident) => {
                const severity = getSeverityBadgeStyles(incident.severity);
                return (
                  <li key={incident.id} className="flex items-start gap-2">
                    <CustomBadge
                      label={severity.label}
                      className={cn(severity.bg, severity.text, severity.border)}
                    />
                    <div className="min-w-0">
                      <p className="text-[11.5px] text-slate-200">{incident.title}</p>
                      <p className="text-[10px] text-slate-500">
                        {incident.id} · {formatRelativeMinutes(incident.reportedAt)} ·{" "}
                        {incident.lanesBlocked}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="mt-1.5 text-[11px] text-slate-500">
              No active incidents reported on this segment.
            </p>
          )}
        </div>

        <p className="text-[10px] leading-relaxed text-slate-600">
          Observation timestamp{" "}
          {new Date(segment.updatedAt).toLocaleString("en-US", { timeZone: "America/Los_Angeles" })}{" "}
          PT · simulated value from the deterministic engine
        </p>
      </div>
    </div>
  );
}

function NeighbourGroup({
  title,
  neighbours,
  onFocusSensor,
  emptyLabel,
}: {
  title: string;
  neighbours: RoadSegment[];
  onFocusSensor?: (segmentId: string) => void;
  emptyLabel: string;
}) {
  return (
    <div>
      <p className="text-[10px] font-medium uppercase tracking-[0.1em] text-slate-500">{title}</p>
      {neighbours.length ? (
        <ul className="mt-1 space-y-1">
          {neighbours.map((neighbour) => (
            <li key={neighbour.id}>
              <button
                type="button"
                onClick={() => onFocusSensor?.(neighbour.id)}
                disabled={!onFocusSensor}
                className={cn(
                  "focus-ring flex w-full items-center justify-between gap-2 rounded-md border border-white/[0.06] bg-slate-950/40 px-2 py-1.5 text-left transition",
                  onFocusSensor ? "hover:border-cyan-400/30 hover:bg-cyan-500/[0.06]" : ""
                )}
              >
                <span className="min-w-0">
                  <span className="block truncate text-[11px] text-slate-300">
                    {neighbour.highway} {neighbour.direction}
                  </span>
                  <span className="block font-mono text-[9.5px] text-slate-500">
                    sensor {neighbour.sensorId}
                  </span>
                </span>
                <span className="shrink-0 font-mono text-[11px] text-slate-200">
                  {neighbour.currentSpeedMph} mph
                </span>
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-1 text-[10.5px] text-slate-600">{emptyLabel}</p>
      )}
    </div>
  );
}

