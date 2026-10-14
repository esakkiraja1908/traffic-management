"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import {
  Bell,
  CheckCheck,
  ChevronDown,
  Menu,
  ShieldCheck,
  TriangleAlert,
  UserRound,
} from "lucide-react";
import { findNavItem } from "@/lib/navigation";
import { cn } from "@/lib/utils";
import { DataSourceBadge } from "@/components/ui/data-source-badge";
import { useSettings } from "@/components/providers/settings-provider";
import { loadIncidents } from "@/lib/api-client";

function useClock() {
  const [now, setNow] = React.useState<Date | null>(null);
  React.useEffect(() => {
    setNow(new Date());
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);
  return now;
}

export function Topbar({ onOpenMobileNav }: { onOpenMobileNav: () => void }) {
  const pathname = usePathname();
  const navItem = findNavItem(pathname);
  const now = useClock();
  const { settings } = useSettings();

  const [notificationsOpen, setNotificationsOpen] = React.useState(false);
  const [profileOpen, setProfileOpen] = React.useState(false);
  const [notifications, setNotifications] = React.useState<
    { id: string; title: string; detail: string; tone: "critical" | "warning" | "info" }[]
  >([]);

  React.useEffect(() => {
    const incidents = loadIncidents();
    setNotifications(
      incidents
        .filter((i) => i.status !== "resolved")
        .slice(0, 4)
        .map((i) => ({
          id: i.id,
          title: i.title,
          detail: `${i.highway} · ${i.status}`,
          tone:
            i.severity === "critical"
              ? ("critical" as const)
              : i.severity === "major"
                ? ("warning" as const)
                : ("info" as const),
        }))
    );
  }, [pathname]);

  React.useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setNotificationsOpen(false);
        setProfileOpen(false);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const clockLabel = now
    ? new Intl.DateTimeFormat("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
        timeZone: "America/Los_Angeles",
      }).format(now)
    : "--:--:--";

  const dateLabel = now
    ? new Intl.DateTimeFormat("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
        timeZone: "America/Los_Angeles",
      }).format(now)
    : "———";

  return (
    <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center justify-between gap-3 border-b border-white/[0.06] bg-slate-950/70 px-3.5 backdrop-blur-2xl">
      <div className="flex min-w-0 items-center gap-3">
        <button
          type="button"
          onClick={onOpenMobileNav}
          aria-label="Open navigation"
          className="focus-ring rounded-lg border border-white/[0.08] bg-white/[0.03] p-1.5 text-slate-300 transition hover:bg-white/[0.08] lg:hidden"
        >
          <Menu className="h-4 w-4" aria-hidden="true" />
        </button>
        <div className="min-w-0">
          <h1 className="truncate text-[14px] font-semibold leading-tight tracking-tight text-slate-100">
            {navItem?.label ?? "Overview"}
          </h1>
          <p className="hidden truncate text-[10.5px] leading-tight text-slate-500 sm:block">
            {navItem?.description ?? "Network-wide operational picture"}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div className="hidden items-center gap-2 md:flex">
          <DataSourceBadge mode={settings.preferLiveBackend ? "live_backend" : "simulation"} />
        </div>

        <div className="hidden items-center gap-2.5 rounded-lg border border-white/[0.07] bg-white/[0.03] px-2.5 py-1.5 xl:flex">
          <span className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.9)]" />
            <span className="text-[10.5px] font-medium text-slate-300">Systems nominal</span>
          </span>
          <span className="h-3 w-px bg-white/10" />
          <span className="text-[10.5px] text-slate-500">METR-LA adapter</span>
        </div>

        <div className="hidden items-center gap-2 rounded-lg border border-white/[0.07] bg-white/[0.03] px-2.5 py-1.5 sm:flex">
          <span className="font-mono text-[12px] font-medium tabular-nums text-slate-100">
            {clockLabel}
          </span>
          <span className="h-3 w-px bg-white/10" />
          <span className="text-[10.5px] text-slate-500">LA · {dateLabel}</span>
        </div>

        {/* Notifications */}
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setNotificationsOpen((v) => !v);
              setProfileOpen(false);
            }}
            aria-label="Open notifications"
            aria-expanded={notificationsOpen}
            className="focus-ring relative rounded-lg border border-white/[0.08] bg-white/[0.03] p-1.5 text-slate-300 transition hover:bg-white/[0.08]"
          >
            <Bell className="h-4 w-4" aria-hidden="true" />
            {notifications.length > 0 ? (
              <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full border border-slate-950 bg-rose-500 px-1 font-mono text-[9px] font-semibold text-white">
                {notifications.length}
              </span>
            ) : null}
          </button>
          {notificationsOpen ? (
            <div className="glass-panel-strong animate-slide-up absolute right-0 top-11 w-[min(88vw,330px)] overflow-hidden">
              <div className="flex items-center justify-between border-b border-white/[0.07] px-3.5 py-2.5">
                <p className="text-[12px] font-semibold text-slate-100">Active notifications</p>
                <span className="text-[10.5px] text-slate-500">{notifications.length} open</span>
              </div>
              <ul className="max-h-72 overflow-y-auto">
                {notifications.map((n) => (
                  <li
                    key={n.id}
                    className="border-b border-white/[0.05] px-3.5 py-2.5 last:border-0"
                  >
                    <div className="flex items-start gap-2">
                      <TriangleAlert
                        className={cn(
                          "mt-0.5 h-3.5 w-3.5 shrink-0",
                          n.tone === "critical"
                            ? "text-rose-400"
                            : n.tone === "warning"
                              ? "text-amber-400"
                              : "text-cyan-400"
                        )}
                        aria-hidden="true"
                      />
                      <div className="min-w-0">
                        <p className="truncate text-[11.5px] font-medium text-slate-200">
                          {n.title}
                        </p>
                        <p className="mt-0.5 text-[10.5px] text-slate-500">{n.detail}</p>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
              <div className="border-t border-white/[0.07] px-3.5 py-2">
                <p className="flex items-center gap-1.5 text-[10px] text-slate-500">
                  <CheckCheck className="h-3 w-3" aria-hidden="true" />
                  Sourced from local demo incident storage
                </p>
              </div>
            </div>
          ) : null}
        </div>

        {/* Profile */}
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setProfileOpen((v) => !v);
              setNotificationsOpen(false);
            }}
            aria-label="Open operator profile menu"
            aria-expanded={profileOpen}
            className="focus-ring flex items-center gap-2 rounded-lg border border-white/[0.08] bg-white/[0.03] py-1 pl-1 pr-2 text-slate-300 transition hover:bg-white/[0.08]"
          >
            <span className="flex h-6 w-6 items-center justify-center rounded-md border border-cyan-500/25 bg-cyan-500/12">
              <UserRound className="h-3.5 w-3.5 text-cyan-300" aria-hidden="true" />
            </span>
            <span className="hidden text-[11.5px] font-medium text-slate-200 sm:block">
              Duty Operator
            </span>
            <ChevronDown className="h-3 w-3 text-slate-500" aria-hidden="true" />
          </button>
          {profileOpen ? (
            <div className="glass-panel-strong animate-slide-up absolute right-0 top-11 w-[min(88vw,272px)] overflow-hidden">
              <div className="border-b border-white/[0.07] px-3.5 py-3">
                <p className="text-[12px] font-semibold text-slate-100">Duty Operator</p>
                <p className="mt-0.5 text-[10.5px] text-slate-500">
                  Traffic Operations Center · Shift B
                </p>
              </div>
              <div className="space-y-1.5 px-3.5 py-3">
                <p className="flex items-center gap-1.5 text-[11px] text-slate-400">
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" aria-hidden="true" />
                  Read/write access to local demo state
                </p>
                <p className="text-[10.5px] leading-relaxed text-slate-500">
                  Demonstration workspace. No authentication provider is attached and no privileged
                  city systems are reachable.
                </p>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
}
