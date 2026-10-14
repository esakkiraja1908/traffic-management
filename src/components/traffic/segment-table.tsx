"use client";

import { ArrowDown, ArrowUp, ChevronRight, Minus } from "lucide-react";
import type { RoadSegment } from "@/types/traffic";
import { getCongestionBadgeStyles, cn } from "@/lib/utils";
import { CustomBadge } from "@/components/ui/badge";
import { Sparkline } from "@/components/charts/sparkline";

export function SegmentTable({
  segments,
  selectedSegmentId,
  onSelect,
  limit,
}: {
  segments: RoadSegment[];
  selectedSegmentId?: string | null;
  onSelect?: (segment: RoadSegment) => void;
  limit?: number;
}) {
  const rows = [...segments].sort((a, b) => b.congestionIndex - a.congestionIndex);
  const visible = typeof limit === "number" ? rows.slice(0, limit) : rows;

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[620px]">
        <thead>
          <tr className="border-b border-white/[0.06]">
            <th className="label-caps px-3 py-2 text-left">Segment</th>
            <th className="label-caps px-3 py-2 text-right">Speed</th>
            <th className="label-caps px-3 py-2 text-right">Flow</th>
            <th className="label-caps px-3 py-2 text-right">Index</th>
            <th className="label-caps px-3 py-2 text-center">2h trend</th>
            <th className="label-caps px-3 py-2 text-left">State</th>
            {onSelect ? <th className="w-8" /> : null}
          </tr>
        </thead>
        <tbody>
          {visible.map((segment) => {
            const styles = getCongestionBadgeStyles(segment.congestionLevel);
            const selected = segment.id === selectedSegmentId;
            const TrendIcon =
              Math.abs(segment.trendDeltaMph) < 0.5
                ? Minus
                : segment.trendDeltaMph > 0
                  ? ArrowUp
                  : ArrowDown;
            return (
              <tr
                key={segment.id}
                onClick={onSelect ? () => onSelect(segment) : undefined}
                className={cn(
                  "border-b border-white/[0.04] transition-colors",
                  onSelect ? "cursor-pointer hover:bg-white/[0.03]" : "",
                  selected ? "bg-cyan-500/[0.06]" : ""
                )}
              >
                <td className="px-3 py-2.5">
                  <div className="flex flex-col">
                    <span className="text-[12px] font-medium text-slate-200">
                      {segment.highway} {segment.direction}
                    </span>
                    <span className="truncate text-[10.5px] text-slate-500">
                      {segment.corridor} · sensor {segment.sensorId}
                    </span>
                  </div>
                </td>
                <td className="px-3 py-2.5 text-right">
                  <span className="font-mono text-[12.5px] font-semibold text-slate-100">
                    {segment.currentSpeedMph}
                  </span>
                  <span className="ml-0.5 text-[10px] text-slate-500">mph</span>
                  <div className="text-[10px] text-slate-500">
                    free {segment.freeFlowSpeedMph}
                  </div>
                </td>
                <td className="px-3 py-2.5 text-right">
                  <span className="font-mono text-[12px] text-slate-300">
                    {segment.flowVehPerHr.toLocaleString()}
                  </span>
                  <div className="text-[10px] text-slate-500">veh/h</div>
                </td>
                <td className="px-3 py-2.5 text-right">
                  <span className={cn("font-mono text-[12.5px] font-semibold", styles.text)}>
                    {segment.congestionIndex}%
                  </span>
                  <div className="text-[10px] text-slate-500">occ {segment.occupancyPct}%</div>
                </td>
                <td className="px-3 py-2.5">
                  <div className="flex items-center justify-center gap-2">
                    <Sparkline
                      values={segment.recentHistory.map((h) => h.speedMph)}
                      color={segment.trendDeltaMph >= 0 ? "#34d399" : "#fb7185"}
                      width={72}
                      height={24}
                      label={`${segment.highway} speed trend`}
                    />
                    <span
                      className={cn(
                        "inline-flex items-center gap-0.5 font-mono text-[10.5px]",
                        segment.trendDeltaMph >= 0 ? "text-emerald-400" : "text-rose-400"
                      )}
                    >
                      <TrendIcon className="h-3 w-3" aria-hidden="true" />
                      {Math.abs(segment.trendDeltaMph).toFixed(1)}
                    </span>
                  </div>
                </td>
                <td className="px-3 py-2.5">
                  <CustomBadge
                    label={styles.label}
                    className={cn(styles.bg, styles.text, styles.border)}
                    dotClass={styles.dot}
                  />
                </td>
                {onSelect ? (
                  <td className="px-2 py-2.5">
                    <ChevronRight className="h-3.5 w-3.5 text-slate-600" aria-hidden="true" />
                  </td>
                ) : null}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
