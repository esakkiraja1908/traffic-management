"use client";

import * as React from "react";
import { Layers } from "lucide-react";
import type { CongestionLevel } from "@/types/traffic";
import { getCongestionColorHex, cn } from "@/lib/utils";

const LEGEND_ITEMS: { level: CongestionLevel; label: string; range: string }[] = [
  { level: "free", label: "Free flow", range: "≥ 50 mph" },
  { level: "moderate", label: "Moderate", range: "36 - 49 mph" },
  { level: "heavy", label: "Heavy", range: "24 - 35 mph" },
  { level: "severe", label: "Severe", range: "< 24 mph" },
];

export function MapLegend({ className }: { className?: string }) {
  const [collapsed, setCollapsed] = React.useState(false);

  return (
    <div
      className={cn(
        "glass-panel-strong w-[196px] overflow-hidden text-slate-300",
        className
      )}
    >
      <button
        type="button"
        onClick={() => setCollapsed((v) => !v)}
        aria-expanded={!collapsed}
        className="focus-ring flex w-full items-center justify-between gap-2 border-b border-white/[0.07] px-3 py-2 text-left"
      >
        <span className="flex items-center gap-1.5">
          <Layers className="h-3.5 w-3.5 text-cyan-400" aria-hidden="true" />
          <span className="text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-300">
            Congestion
          </span>
        </span>
        <span className="text-[10px] text-slate-500">{collapsed ? "show" : "hide"}</span>
      </button>
      {!collapsed ? (
        <ul className="space-y-1.5 px-3 py-2.5">
          {LEGEND_ITEMS.map((item) => (
            <li key={item.level} className="flex items-center gap-2">
              <span
                className="h-1.5 w-6 shrink-0 rounded-full"
                style={{ backgroundColor: getCongestionColorHex(item.level) }}
                aria-hidden="true"
              />
              <span className="flex-1 text-[11px] text-slate-300">{item.label}</span>
              <span className="font-mono text-[10px] text-slate-500">{item.range}</span>
            </li>
          ))}
          <li className="flex items-center gap-2 border-t border-white/[0.06] pt-1.5">
            <span className="relative flex h-2.5 w-6 shrink-0 items-center justify-center" aria-hidden="true">
              <span className="h-2.5 w-2.5 rounded-full border border-slate-950 bg-rose-500" />
              <span className="absolute h-2.5 w-2.5 rounded-full border border-rose-400/50" />
            </span>
            <span className="flex-1 text-[11px] text-slate-300">Incident marker</span>
          </li>
        </ul>
      ) : null}
    </div>
  );
}
