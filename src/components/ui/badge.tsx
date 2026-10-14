import * as React from "react";
import { cn } from "@/lib/utils";

type Variant = "default" | "cyan" | "success" | "warning" | "danger" | "muted";

const VARIANTS: Record<Variant, string> = {
  default: "border-white/10 bg-white/[0.05] text-slate-300",
  cyan: "border-cyan-500/25 bg-cyan-500/10 text-cyan-300",
  success: "border-emerald-500/25 bg-emerald-500/10 text-emerald-300",
  warning: "border-amber-500/25 bg-amber-500/10 text-amber-300",
  danger: "border-rose-500/30 bg-rose-500/10 text-rose-300",
  muted: "border-white/[0.07] bg-white/[0.02] text-slate-500",
};

export function Badge({
  children,
  variant = "default",
  className,
  dot = false,
}: {
  children: React.ReactNode;
  variant?: Variant;
  className?: string;
  dot?: boolean;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-[10.5px] font-medium tracking-wide",
        VARIANTS[variant],
        className
      )}
    >
      {dot ? <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" /> : null}
      {children}
    </span>
  );
}

export function CustomBadge({
  label,
  className,
  dotClass,
}: {
  label: string;
  className: string;
  dotClass?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-[10.5px] font-medium tracking-wide",
        className
      )}
    >
      {dotClass ? (
        <span className={cn("h-1.5 w-1.5 rounded-full", dotClass)} aria-hidden="true" />
      ) : null}
      {label}
    </span>
  );
}
