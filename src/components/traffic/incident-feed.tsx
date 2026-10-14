"use client";

import {
  AlertTriangle,
  CarFront,
  CloudRain,
  Construction,
  MapPin,
  Radio,
  TrafficCone,
} from "lucide-react";
import type { IncidentType, TrafficIncident } from "@/types/traffic";
import {
  cn,
  formatRelativeMinutes,
  getSeverityBadgeStyles,
  getStatusBadgeStyles,
} from "@/lib/utils";
import { CustomBadge } from "@/components/ui/badge";

export const INCIDENT_TYPE_META: Record<
  IncidentType,
  { label: string; icon: typeof AlertTriangle }
> = {
  collision: { label: "Collision", icon: CarFront },
  stalled_vehicle: { label: "Stalled vehicle", icon: AlertTriangle },
  roadwork: { label: "Roadwork", icon: Construction },
  weather_hazard: { label: "Weather hazard", icon: CloudRain },
  signal_failure: { label: "Signal failure", icon: Radio },
  congestion_alert: { label: "Congestion alert", icon: TrafficCone },
};

export function IncidentFeed({
  incidents,
  selectedIncidentId,
  onSelect,
  limit,
}: {
  incidents: TrafficIncident[];
  selectedIncidentId?: string | null;
  onSelect?: (incident: TrafficIncident) => void;
  limit?: number;
}) {
  const sorted = [...incidents].sort((a, b) => {
    const order = { active: 0, responding: 1, clearing: 2, resolved: 3 };
    if (order[a.status] !== order[b.status]) return order[a.status] - order[b.status];
    return new Date(b.reportedAt).getTime() - new Date(a.reportedAt).getTime();
  });
  const visible = typeof limit === "number" ? sorted.slice(0, limit) : sorted;

  return (
    <ul className="divide-y divide-white/[0.05]">
      {visible.map((incident) => {
        const meta = INCIDENT_TYPE_META[incident.type];
        const Icon = meta.icon;
        const severity = getSeverityBadgeStyles(incident.severity);
        const status = getStatusBadgeStyles(incident.status);
        const selected = incident.id === selectedIncidentId;
        return (
          <li key={incident.id}>
            <button
              type="button"
              onClick={onSelect ? () => onSelect(incident) : undefined}
              disabled={!onSelect}
              className={cn(
                "focus-ring flex w-full items-start gap-3 px-3.5 py-3 text-left transition-colors",
                onSelect ? "hover:bg-white/[0.03]" : "cursor-default",
                selected ? "bg-cyan-500/[0.06]" : ""
              )}
            >
              <span
                className={cn(
                  "mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border",
                  severity.bg,
                  severity.border
                )}
              >
                <Icon className={cn("h-3.5 w-3.5", severity.text)} aria-hidden="true" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-[12px] font-medium leading-snug text-slate-200">
                    {incident.title}
                  </p>
                  <span className="shrink-0 font-mono text-[9.5px] text-slate-500">
                    {formatRelativeMinutes(incident.reportedAt)}
                  </span>
                </div>
                <p className="mt-1 flex items-center gap-1.5 text-[10.5px] text-slate-500">
                  <MapPin className="h-3 w-3 shrink-0" aria-hidden="true" />
                  <span className="truncate">{incident.segmentName}</span>
                </p>
                <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                  <CustomBadge
                    label={severity.label}
                    className={cn(severity.bg, severity.text, severity.border)}
                  />
                  <CustomBadge
                    label={status.label}
                    className={cn(status.bg, status.text, status.border)}
                  />
                  <span className="font-mono text-[9.5px] text-slate-500">{incident.id}</span>
                </div>
              </div>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
