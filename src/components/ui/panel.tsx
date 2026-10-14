import * as React from "react";
import { cn } from "@/lib/utils";

interface PanelProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "strong";
  as?: "div" | "section" | "article" | "aside";
}

export function Panel({
  className,
  variant = "default",
  as: Tag = "div",
  ...props
}: PanelProps) {
  return (
    <Tag
      className={cn(variant === "strong" ? "glass-panel-strong" : "glass-panel", className)}
      {...props}
    />
  );
}

interface PanelHeaderProps {
  title: string;
  description?: string;
  icon?: React.ComponentType<{ className?: string }>;
  action?: React.ReactNode;
  className?: string;
}

export function PanelHeader({
  title,
  description,
  icon: Icon,
  action,
  className,
}: PanelHeaderProps) {
  return (
    <div
      className={cn(
        "flex items-start justify-between gap-3 border-b border-white/[0.06] px-4 py-3",
        className
      )}
    >
      <div className="flex min-w-0 items-start gap-2.5">
        {Icon ? (
          <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md border border-cyan-500/20 bg-cyan-500/10">
            <Icon className="h-3.5 w-3.5 text-cyan-400" />
          </span>
        ) : null}
        <div className="min-w-0">
          <h2 className="truncate text-[13px] font-semibold tracking-tight text-slate-100">
            {title}
          </h2>
          {description ? (
            <p className="mt-0.5 text-[11px] leading-relaxed text-slate-500">{description}</p>
          ) : null}
        </div>
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}
