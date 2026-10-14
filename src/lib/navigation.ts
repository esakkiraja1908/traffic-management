import {
  Activity,
  BarChart3,
  BrainCircuit,
  Cpu,
  LayoutDashboard,
  Settings,
  TriangleAlert,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  description: string;
  icon: LucideIcon;
  short: string;
}

export const NAV_ITEMS: NavItem[] = [
  {
    href: "/",
    label: "Overview",
    short: "Overview",
    description: "Network-wide operational picture",
    icon: LayoutDashboard,
  },
  {
    href: "/live-traffic",
    label: "Live Traffic",
    short: "Live",
    description: "Geospatial segment operations",
    icon: Activity,
  },
  {
    href: "/predictions",
    label: "AI Predictions",
    short: "Forecast",
    description: "Spatiotemporal forecasting studio",
    icon: BrainCircuit,
  },
  {
    href: "/analytics",
    label: "Traffic Analytics",
    short: "Analytics",
    description: "Historical trends and comparisons",
    icon: BarChart3,
  },
  {
    href: "/incidents",
    label: "Incidents",
    short: "Incidents",
    description: "Incident management workspace",
    icon: TriangleAlert,
  },
  {
    href: "/model-insights",
    label: "Model Insights",
    short: "Models",
    description: "LibCity / METR-LA transparency",
    icon: Cpu,
  },
  {
    href: "/settings",
    label: "Settings",
    short: "Settings",
    description: "Backend, map and demo controls",
    icon: Settings,
  },
];

export function findNavItem(pathname: string): NavItem | undefined {
  return NAV_ITEMS.find((item) =>
    item.href === "/" ? pathname === "/" : pathname.startsWith(item.href)
  );
}
