"use client";

import * as React from "react";
import type { CorridorRiskCell } from "@/types/traffic";
import { cn } from "@/lib/utils";

function riskColor(score: number): string {
  if (score >= 78) return "rgba(244, 63, 94, 0.9)";
  if (score >= 60) return "rgba(249, 115, 22, 0.88)";
  if (score >= 42) return "rgba(245, 158, 11, 0.86)";
  if (score >= 24) return "rgba(132, 204, 22, 0.8)";
  return "rgba(16, 185, 129, 0.8)";
}

export function CorridorRiskHeatmap({ matrix }: { matrix: CorridorRiskCell[] }) {
  const [hover, setHover] = React.useState<string | null>(null);
  const stepLabels = matrix[0]?.steps.map((s) => s.stepLabel) ?? [];

  return (
    <div className="overflow-x-auto px-3 py-3">
      <table className="w-full min-w-[560px] border-separate border-spacing-[3px]">
        <thead>
          <tr>
            <th className="label-caps w-[168px] pb-1 text-left">Corridor / sensor</th>
            {stepLabels.map((label) => (
              <th key={label} className="label-caps pb-1 text-center font-mono">
                {label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {matrix.map((cell) => (
            <tr key={cell.segmentId}>
              <td className="pr-2">
                <span className="flex flex-col">
                  <span className="text-[11px] font-medium text-slate-200">{cell.highway}</span>
                  <span className="truncate text-[9.5px] text-slate-500">
                    sensor {cell.sensorId} · {cell.segmentName}
                  </span>
                </span>
              </td>
              {cell.steps.map((step) => {
                const key = `${cell.segmentId}-${step.stepLabel}`;
                const active = hover === key;
                return (
                  <td key={key} className="p-0">
                    <div
                      onMouseEnter={() => setHover(key)}
                      onMouseLeave={() => setHover(null)}
                      className={cn(
                        "flex h-10 min-w-[54px] flex-col items-center justify-center rounded-md transition-all duration-200",
                        active ? "scale-[1.05] ring-1 ring-cyan-400/60" : ""
                      )}
                      style={{ backgroundColor: riskColor(step.riskScore) }}
                      title={`${cell.highway} ${step.stepLabel}: ${step.riskScore}% risk · ${step.predictedSpeedMph} mph`}
                    >
                      <span className="font-mono text-[11px] font-semibold text-slate-950">
                        {step.riskScore}
                      </span>
                      <span className="font-mono text-[9px] text-slate-900/70">
                        {step.predictedSpeedMph}
                      </span>
                    </div>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <span className="label-caps">Congestion risk</span>
        <div className="flex items-center gap-1.5">
          {[
            { label: "Low", value: 15 },
            { label: "Guarded", value: 32 },
            { label: "Elevated", value: 52 },
            { label: "High", value: 70 },
            { label: "Critical", value: 88 },
          ].map((band) => (
            <span key={band.label} className="flex items-center gap-1">
              <span
                className="h-2.5 w-5 rounded-sm"
                style={{ backgroundColor: riskColor(band.value) }}
                aria-hidden="true"
              />
              <span className="text-[9.5px] text-slate-500">{band.label}</span>
            </span>
          ))}
        </div>
        <span className="text-[10px] text-slate-500">
          Cell = risk score % (top) · predicted speed mph (bottom)
        </span>
      </div>
    </div>
  );
}
