"use client";

import * as React from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { cn } from "@/lib/utils";

export function AppShell({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = React.useState(false);
  const [mobileOpen, setMobileOpen] = React.useState(false);

  React.useEffect(() => {
    const stored = window.localStorage.getItem("traffic-intelligence.sidebar-collapsed");
    if (stored === "true") setCollapsed(true);
  }, []);

  const toggleCollapse = React.useCallback(() => {
    setCollapsed((current) => {
      const next = !current;
      window.localStorage.setItem("traffic-intelligence.sidebar-collapsed", String(next));
      return next;
    });
  }, []);

  return (
    <div className="relative min-h-screen">
      <div className="grid-overlay pointer-events-none fixed inset-0 opacity-60" aria-hidden="true" />
      <Sidebar
        collapsed={collapsed}
        onToggleCollapse={toggleCollapse}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />
      <div
        className={cn(
          "relative flex min-h-screen flex-col transition-[padding] duration-300 ease-out",
          collapsed ? "lg:pl-[68px]" : "lg:pl-[248px]"
        )}
      >
        <Topbar onOpenMobileNav={() => setMobileOpen(true)} />
        <main className="relative flex-1 px-3.5 py-4 sm:px-5 sm:py-5">{children}</main>
        <footer className="border-t border-white/[0.06] px-4 py-3">
          <p className="text-[10.5px] leading-relaxed text-slate-600">
            Traffic Intelligence · Demonstration build. Traffic conditions shown are deterministic
            simulations unless a live backend is explicitly configured in Settings. Model metrics
            labelled as benchmarks are published LibCity/METR-LA references, not live measurements
            from this deployment.
          </p>
        </footer>
      </div>
    </div>
  );
}
