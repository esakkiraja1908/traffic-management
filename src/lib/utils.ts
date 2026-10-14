import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import type { CongestionLevel, IncidentSeverity, IncidentStatus } from "@/types/traffic";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getCongestionColorHex(level: CongestionLevel): string {
  switch (level) {
    case "free":
      return "#10B981"; // Emerald 500
    case "moderate":
      return "#F59E0B"; // Amber 500
    case "heavy":
      return "#F97316"; // Orange 500
    case "severe":
      return "#F43F5E"; // Rose 500
  }
}

export function getCongestionBadgeStyles(level: CongestionLevel): {
  bg: string;
  text: string;
  border: string;
  dot: string;
  label: string;
} {
  switch (level) {
    case "free":
      return {
        bg: "bg-emerald-500/10",
        text: "text-emerald-400",
        border: "border-emerald-500/25",
        dot: "bg-emerald-400",
        label: "Free Flow",
      };
    case "moderate":
      return {
        bg: "bg-amber-500/10",
        text: "text-amber-400",
        border: "border-amber-500/25",
        dot: "bg-amber-400",
        label: "Moderate",
      };
    case "heavy":
      return {
        bg: "bg-orange-500/10",
        text: "text-orange-400",
        border: "border-orange-500/25",
        dot: "bg-orange-400",
        label: "Heavy Traffic",
      };
    case "severe":
      return {
        bg: "bg-rose-500/10",
        text: "text-rose-400",
        border: "border-rose-500/25",
        dot: "bg-rose-500",
        label: "Severe Gridlock",
      };
  }
}

export function getSeverityBadgeStyles(severity: IncidentSeverity): {
  bg: string;
  text: string;
  border: string;
  label: string;
} {
  switch (severity) {
    case "low":
      return {
        bg: "bg-sky-500/10",
        text: "text-sky-400",
        border: "border-sky-500/25",
        label: "Low",
      };
    case "moderate":
      return {
        bg: "bg-amber-500/10",
        text: "text-amber-400",
        border: "border-amber-500/25",
        label: "Moderate",
      };
    case "major":
      return {
        bg: "bg-orange-500/10",
        text: "text-orange-400",
        border: "border-orange-500/25",
        label: "Major",
      };
    case "critical":
      return {
        bg: "bg-rose-500/15",
        text: "text-rose-400",
        border: "border-rose-500/35",
        label: "Critical",
      };
  }
}

export function getStatusBadgeStyles(status: IncidentStatus): {
  bg: string;
  text: string;
  border: string;
  label: string;
} {
  switch (status) {
    case "active":
      return {
        bg: "bg-rose-500/15",
        text: "text-rose-400",
        border: "border-rose-500/30",
        label: "Active",
      };
    case "responding":
      return {
        bg: "bg-amber-500/15",
        text: "text-amber-300",
        border: "border-amber-500/30",
        label: "Responding",
      };
    case "clearing":
      return {
        bg: "bg-cyan-500/15",
        text: "text-cyan-300",
        border: "border-cyan-500/30",
        label: "Clearing",
      };
    case "resolved":
      return {
        bg: "bg-emerald-500/15",
        text: "text-emerald-400",
        border: "border-emerald-500/30",
        label: "Resolved",
      };
  }
}

export function classifyCongestionFromSpeed(
  currentSpeedMph: number,
  freeFlowSpeedMph: number
): CongestionLevel {
  const ratio = currentSpeedMph / Math.max(freeFlowSpeedMph, 1);
  if (ratio >= 0.78) return "free";
  if (ratio >= 0.56) return "moderate";
  if (ratio >= 0.36) return "heavy";
  return "severe";
}

export function formatRelativeMinutes(isoString: string): string {
  const date = new Date(isoString);
  const diffMs = Date.now() - date.getTime();
  const diffMin = Math.max(1, Math.round(diffMs / 60000));
  if (diffMin < 60) return `${diffMin}m ago`;
  const hrs = Math.floor(diffMin / 60);
  const rem = diffMin % 60;
  return rem > 0 ? `${hrs}h ${rem}m ago` : `${hrs}h ago`;
}

export function generateCsvContent<T extends Record<string, string | number | boolean | null>>(
  rows: T[],
  columns: { key: keyof T; header: string }[]
): string {
  const headerLine = columns.map((c) => `"${String(c.header).replace(/"/g, '""')}"`).join(",");
  const bodyLines = rows.map((row) =>
    columns
      .map((col) => {
        const val = row[col.key];
        if (val === null || val === undefined) return '""';
        return `"${String(val).replace(/"/g, '""')}"`;
      })
      .join(",")
  );
  return [headerLine, ...bodyLines].join("\n");
}
