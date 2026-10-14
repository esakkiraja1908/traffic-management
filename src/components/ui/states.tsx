import * as React from "react";
import { AlertOctagon, Inbox, RefreshCw, WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function EmptyState({
  title,
  description,
  icon: Icon = Inbox,
  action,
  className,
}: {
  title: string;
  description: string;
  icon?: React.ComponentType<{ className?: string }>;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-2.5 px-6 py-12 text-center",
        className
      )}
    >
      <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.03]">
        <Icon className="h-5 w-5 text-slate-500" aria-hidden="true" />
      </span>
      <p className="text-[13px] font-medium text-slate-300">{title}</p>
      <p className="max-w-sm text-[11.5px] leading-relaxed text-slate-500">{description}</p>
      {action ? <div className="mt-1.5">{action}</div> : null}
    </div>
  );
}

export function ErrorState({
  title = "Something went wrong",
  description,
  onRetry,
  className,
}: {
  title?: string;
  description: string;
  onRetry?: () => void;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-2.5 px-6 py-12 text-center",
        className
      )}
    >
      <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-rose-500/20 bg-rose-500/10">
        <AlertOctagon className="h-5 w-5 text-rose-400" aria-hidden="true" />
      </span>
      <p className="text-[13px] font-medium text-slate-200">{title}</p>
      <p className="max-w-md text-[11.5px] leading-relaxed text-slate-500">{description}</p>
      {onRetry ? (
        <Button variant="secondary" onClick={onRetry} className="mt-1.5">
          <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
          Retry
        </Button>
      ) : null}
    </div>
  );
}

export function OfflineFallback({
  title,
  description,
  onRetry,
}: {
  title: string;
  description: string;
  onRetry?: () => void;
}) {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-3 rounded-xl border border-amber-500/20 bg-amber-500/[0.04] p-6 text-center">
      <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-amber-500/25 bg-amber-500/10">
        <WifiOff className="h-5 w-5 text-amber-400" aria-hidden="true" />
      </span>
      <p className="text-[13px] font-medium text-amber-200">{title}</p>
      <p className="max-w-sm text-[11.5px] leading-relaxed text-amber-200/60">{description}</p>
      {onRetry ? (
        <Button variant="secondary" onClick={onRetry} className="mt-1">
          <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
          Retry map load
        </Button>
      ) : null}
    </div>
  );
}
