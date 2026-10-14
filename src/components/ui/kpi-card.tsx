import * as React from "react";
import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

export interface KpiCardProps {
  label: string;
  value: string;
  unit?: string;
  delta?: number;
  deltaLabel?: string;
  invertDelta?: boolean;
  icon: React.ComponentType<{ className?: string }>;
  accent?: "cyan" | "blue" | "amber" | "rose" | "emerald";
  footer?: React.ReactNode;
  children?: React.ReactNode;
}

const ACCENTS = {
  cyan: "border-cyan-500/20 bg-cyan-500/[0.07] text-cyan-400",
  blue: "border-blue-500/20 bg-blue-500/[0.07] text-blue-400",
  amber: "border-amber-500/20 bg-amber-500/[0.07] text-amber-400",
  rose: "border-rose-500/20 bg-rose-500/[0.07] text-rose-400",
  emerald: "border-emerald-500/20 bg-emerald-500/[0.07] text-emerald-400",
} as const;

export function KpiCard({
  label,
  value,
  unit,
  delta,
  deltaLabel,
  invertDelta = false,
  icon: Icon,
  accent = "cyan",
  footer,
  children,
}: KpiCardProps) {
  const hasDelta = typeof delta === "number";
  const improved = hasDelta ? (invertDelta ? delta! < 0 : delta! > 0) : false;
  const flat = hasDelta && Math.abs(delta!) < 0.05;
  const DeltaIcon = flat ? Minus : delta! > 0 ? ArrowUpRight : ArrowDownRight;

  return (
    <div className="glass-panel flex flex-col justify-between gap-3 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="label-caps">{label}</p>
          <div className="mt-1.5 flex items-baseline gap-1.5">
            <span className="font-mono text-2xl font-semibold leading-none tracking-tight text-slate-50">
              {value}
            </span>
            {unit ? <span className="text-[11px] font-medium text-slate-500">{unit}</span> : null}
          </div>
        </div>
        <span
          className={cn(
            "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border",
            ACCENTS[accent]
          )}
        >
          <Icon className="h-4 w-4" aria-hidden="true" />
        </span>
      </div>

      {hasDelta ? (
        <div className="flex items-center gap-1.5">
          <span
            className={cn(
              "inline-flex items-center gap-0.5 rounded-md border px-1.5 py-0.5 font-mono text-[10.5px] font-medium",
              flat
                ? "border-white/10 bg-white/[0.04] text-slate-400"
                : improved
                  ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-300"
                  : "border-rose-500/25 bg-rose-500/10 text-rose-300"
            )}
          >
            <DeltaIcon className="h-3 w-3" aria-hidden="true" />
            {Math.abs(delta!).toFixed(1)}
            {deltaLabel ? `%` : ""}
          </span>
          <span className="text-[11px] text-slate-500">{deltaLabel ?? "vs 15 min ago"}</span>
        </div>
      ) : null}

      {children}

      {footer ? (
        <div className="border-t border-white/[0.06] pt-2.5 text-[11px] text-slate-500">{footer}</div>
      ) : null}
    </div>
  );
}
