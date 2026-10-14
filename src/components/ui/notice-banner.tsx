"use client";

import * as React from "react";
import { Info, X } from "lucide-react";
import { cn } from "@/lib/utils";

export function NoticeBanner({
  tone = "info",
  title,
  message,
  className,
  dismissible = true,
}: {
  tone?: "info" | "warning" | "danger";
  title: string;
  message: string;
  className?: string;
  dismissible?: boolean;
}) {
  const [dismissed, setDismissed] = React.useState(false);
  if (dismissed) return null;

  const tones = {
    info: "border-cyan-500/20 bg-cyan-500/[0.05] text-cyan-100",
    warning: "border-amber-500/22 bg-amber-500/[0.06] text-amber-100",
    danger: "border-rose-500/22 bg-rose-500/[0.06] text-rose-100",
  } as const;

  return (
    <div className={cn("flex items-start gap-2.5 rounded-lg border px-3.5 py-2.5", tones[tone], className)}>
      <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 opacity-80" aria-hidden="true" />
      <div className="min-w-0 flex-1">
        <p className="text-[11.5px] font-semibold">{title}</p>
        <p className="mt-0.5 text-[11px] leading-relaxed opacity-75">{message}</p>
      </div>
      {dismissible ? (
        <button
          type="button"
          onClick={() => setDismissed(true)}
          aria-label="Dismiss notice"
          className="focus-ring rounded p-0.5 opacity-60 transition hover:opacity-100"
        >
          <X className="h-3.5 w-3.5" aria-hidden="true" />
        </button>
      ) : null}
    </div>
  );
}
