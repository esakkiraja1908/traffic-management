"use client";

import * as React from "react";
import type { TooltipProps } from "recharts";

export const CHART_COLORS = {
  cyan: "#22d3ee",
  blue: "#60a5fa",
  emerald: "#34d399",
  amber: "#fbbf24",
  orange: "#fb923c",
  rose: "#fb7185",
  slate: "#64748b",
  violet: "#a78bfa",
} as const;

export const axisStyle = {
  stroke: "rgba(148,163,184,0.35)",
  tick: { fill: "#64748b", fontSize: 10 },
  tickLine: false,
  axisLine: { stroke: "rgba(148,163,184,0.16)" },
} as const;

export const gridStyle = {
  stroke: "rgba(148,163,184,0.09)",
  strokeDasharray: "3 3",
  vertical: false,
} as const;

interface TooltipRow {
  label: string;
  value: string;
  color: string;
}

export function ChartTooltipCard({
  title,
  rows,
  footer,
}: {
  title: string;
  rows: TooltipRow[];
  footer?: string;
}) {
  return (
    <div className="glass-panel-strong min-w-[168px] px-3 py-2.5">
      <p className="text-[11px] font-semibold text-slate-100">{title}</p>
      <ul className="mt-1.5 space-y-1">
        {rows.map((row) => (
          <li key={row.label} className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-1.5 text-[10.5px] text-slate-400">
              <span
                className="h-1.5 w-1.5 rounded-full"
                style={{ backgroundColor: row.color }}
                aria-hidden="true"
              />
              {row.label}
            </span>
            <span className="font-mono text-[11px] font-medium text-slate-100">{row.value}</span>
          </li>
        ))}
      </ul>
      {footer ? <p className="mt-1.5 text-[10px] text-slate-500">{footer}</p> : null}
    </div>
  );
}

export function isTooltipActive(active: unknown): boolean {
  return Boolean(active);
}

export type RechartsTooltipProps = TooltipProps<number, string>;
