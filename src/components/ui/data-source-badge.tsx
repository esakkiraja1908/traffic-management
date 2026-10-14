import { Activity, FlaskConical, Radio } from "lucide-react";
import type { DataSourceMode } from "@/types/traffic";
import { cn } from "@/lib/utils";

export function DataSourceBadge({
  mode,
  className,
  compact = false,
}: {
  mode: DataSourceMode;
  className?: string;
  compact?: boolean;
}) {
  const live = mode === "live_backend";
  const Icon = live ? Radio : FlaskConical;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.1em]",
        live
          ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-300"
          : "border-amber-500/25 bg-amber-500/10 text-amber-300",
        className
      )}
      title={
        live
          ? "Values returned by the configured live backend."
          : "Deterministic simulated values. No live city telemetry is being used."
      }
    >
      <Icon className="h-3 w-3" aria-hidden="true" />
      {live ? "Live backend" : compact ? "Simulated" : "Simulated telemetry"}
    </span>
  );
}

export function ModelStatusPill({ status }: { status: "benchmark_ready" | "live_connected" | "offline_simulation" }) {
  const config = {
    benchmark_ready: {
      label: "Benchmark ready",
      className: "border-cyan-500/25 bg-cyan-500/10 text-cyan-300",
    },
    live_connected: {
      label: "Live connected",
      className: "border-emerald-500/25 bg-emerald-500/10 text-emerald-300",
    },
    offline_simulation: {
      label: "Offline simulation",
      className: "border-amber-500/25 bg-amber-500/10 text-amber-300",
    },
  }[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.1em]",
        config.className
      )}
    >
      <Activity className="h-3 w-3" aria-hidden="true" />
      {config.label}
    </span>
  );
}
