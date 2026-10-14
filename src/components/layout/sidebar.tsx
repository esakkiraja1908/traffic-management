"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronLeft, RadioTower, X } from "lucide-react";
import { NAV_ITEMS } from "@/lib/navigation";
import { cn } from "@/lib/utils";

interface SidebarProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

export function Sidebar({
  collapsed,
  onToggleCollapse,
  mobileOpen,
  onCloseMobile,
}: SidebarProps) {
  const pathname = usePathname();

  return (
    <>
      {mobileOpen ? (
        <button
          type="button"
          aria-label="Close navigation"
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-slate-950/70 backdrop-blur-sm lg:hidden"
        />
      ) : null}

      <aside
        aria-label="Primary navigation"
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex flex-col border-r border-white/[0.06] bg-slate-950/85 backdrop-blur-2xl transition-[width,transform] duration-300 ease-out",
          collapsed ? "w-[68px]" : "w-[248px]",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Brand */}
        <div className="flex h-14 shrink-0 items-center gap-2.5 border-b border-white/[0.06] px-3.5">
          <span className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-cyan-500/30 bg-gradient-to-br from-cyan-500/25 to-blue-600/15">
            <RadioTower className="h-4 w-4 text-cyan-300" aria-hidden="true" />
            <span className="absolute -right-0.5 -top-0.5 h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.9)]" />
          </span>
          {!collapsed ? (
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-semibold leading-tight tracking-tight text-slate-100">
                Traffic Intelligence
              </p>
              <p className="truncate text-[10px] leading-tight text-slate-500">
                Smart-city operations
              </p>
            </div>
          ) : null}
          <button
            type="button"
            onClick={onCloseMobile}
            aria-label="Close navigation"
            className="focus-ring rounded-md p-1 text-slate-500 transition hover:text-slate-200 lg:hidden"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-2 py-3">
          <ul className="space-y-0.5">
            {NAV_ITEMS.map((item) => {
              const active =
                item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
              const Icon = item.icon;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={onCloseMobile}
                    aria-current={active ? "page" : undefined}
                    title={collapsed ? item.label : undefined}
                    className={cn(
                      "focus-ring group relative flex items-center gap-2.5 rounded-lg px-2.5 py-2 transition-all duration-200",
                      active
                        ? "bg-cyan-500/12 text-cyan-200"
                        : "text-slate-400 hover:bg-white/[0.05] hover:text-slate-100"
                    )}
                  >
                    {active ? (
                      <span className="absolute left-0 top-1/2 h-5 w-[2px] -translate-y-1/2 rounded-r bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.9)]" />
                    ) : null}
                    <Icon
                      className={cn(
                        "h-4 w-4 shrink-0 transition-colors",
                        active ? "text-cyan-300" : "text-slate-500 group-hover:text-slate-300"
                      )}
                      aria-hidden="true"
                    />
                    {!collapsed ? (
                      <span className="min-w-0 flex-1 truncate text-[12.5px] font-medium">
                        {item.label}
                      </span>
                    ) : null}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Footer */}
        <div className="shrink-0 border-t border-white/[0.06] p-2.5">
          {!collapsed ? (
            <div className="mb-2 rounded-lg border border-amber-500/20 bg-amber-500/[0.06] px-2.5 py-2">
              <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-amber-300">
                Simulation mode
              </p>
              <p className="mt-0.5 text-[10.5px] leading-snug text-amber-200/60">
                Demo telemetry only. No live city feed is connected.
              </p>
            </div>
          ) : null}
          <button
            type="button"
            onClick={onToggleCollapse}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            className="focus-ring hidden w-full items-center justify-center gap-2 rounded-lg border border-white/[0.07] bg-white/[0.03] py-1.5 text-[11px] text-slate-400 transition hover:bg-white/[0.07] hover:text-slate-200 lg:flex"
          >
            <ChevronLeft
              className={cn("h-3.5 w-3.5 transition-transform duration-300", collapsed && "rotate-180")}
              aria-hidden="true"
            />
            {!collapsed ? "Collapse" : null}
          </button>
        </div>
      </aside>
    </>
  );
}
