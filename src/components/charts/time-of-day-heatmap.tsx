"use client";

import * as React from "react";
import type { TimeOfDayHeatmapRow } from "@/types/traffic";
import { cn } from "@/lib/utils";

function heatColor(value: number): string {
  // Continuous green -> amber -> orange -> rose ramp for congestion intensity.
  const stops: [number, [number, number, number]][] = [
    [0, [16, 185, 129]],
    [35, [245, 158, 11]],
    [65, [249, 115, 22]],
    [100, [244, 63, 94]],
  ];
  const clamped = Math.max(0, Math.min(100, value));
  for (let i = 0; i < stops.length - 1; i += 1) {
    const [p0, c0] = stops[i];
    const [p1, c1] = stops[i + 1];
    if (clamped >= p0 && clamped <= p1) {
      const t = (clamped - p0) / (p1 - p0);
      const rgb = c0.map((c, idx) => Math.round(c + (c1[idx] - c) * t));
      return `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, 0.86)`;
    }
  }
  return "rgba(244, 63, 94, 0.86)";
}

export function TimeOfDayHeatmap({ rows }: { rows: TimeOfDayHeatmapRow[] }) {
  const [hover, setHover] = React.useState<{ row: number; col: number } | null>(null);
  const periods = rows[0]?.hours.map((h) => h.period) ?? [];

  return (
    <div className="overflow-x-auto px-3 py-3">
      <table className="w-full min-w-[520px] border-separate border-spacing-[3px]">
        <thead>
          <tr>
            <th className="label-caps w-[112px] pb-1 text-left">Corridor</th>
            {periods.map((period) => (
              <th key={period} className="label-caps pb-1 text-center font-mono">
                {period}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr key={row.highway}>
              <td className="pr-2">
                <span className="flex flex-col">
                  <span className="text-[11px] font-medium text-slate-200">{row.highway}</span>
                  <span className="truncate text-[9.5px] text-slate-500">{row.corridor}</span>
                </span>
              </td>
              {row.hours.map((cell, colIndex) => {
                const active = hover?.row === rowIndex && hover?.col === colIndex;
                return (
                  <td key={cell.period} className="p-0">
                    <button
                      type="button"
                      onMouseEnter={() => setHover({ row: rowIndex, col: colIndex })}
                      onMouseLeave={() => setHover(null)}
                      onFocus={() => setHover({ row: rowIndex, col: colIndex })}
                      onBlur={() => setHover(null)}
                      className={cn(
                        "focus-ring flex h-10 w-full min-w-[52px] flex-col items-center justify-center rounded-md transition-all duration-200",
                        active ? "scale-[1.04] ring-1 ring-cyan-400/60" : "hover:opacity-95"
                      )}
                      style={{ backgroundColor: heatColor(cell.congestionPct) }}
                      aria-label={`${row.highway} ${cell.period}: ${cell.congestionPct}% congestion, ${cell.avgSpeedMph} mph`}
                    >
                      <span className="font-mono text-[11px] font-semibold text-slate-950">
                        {cell.congestionPct}
                      </span>
                      <span className="font-mono text-[9px] text-slate-900/70">
                        {cell.avgSpeedMph}
                      </span>
                    </button>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <span className="label-caps">Congestion intensity</span>
        <div className="flex items-center gap-1.5">
          {[12, 38, 62, 88].map((value) => (
            <span
              key={value}
              className="h-2.5 w-8 rounded-sm"
              style={{ backgroundColor: heatColor(value) }}
              aria-hidden="true"
            />
          ))}
        </div>
        <span className="text-[10px] text-slate-500">
          Cell = congestion index % (top) · avg speed mph (bottom)
        </span>
      </div>
    </div>
  );
}
