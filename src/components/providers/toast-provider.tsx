"use client";

import * as React from "react";
import { AlertTriangle, CheckCircle2, Info, X, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export type ToastVariant = "success" | "error" | "info" | "warning";

export interface Toast {
  id: string;
  title: string;
  description?: string;
  variant: ToastVariant;
}

interface ToastContextValue {
  toasts: Toast[];
  pushToast: (toast: Omit<Toast, "id">) => void;
  dismissToast: (id: string) => void;
}

const ToastContext = React.createContext<ToastContextValue | null>(null);

const VARIANT_CONFIG: Record<
  ToastVariant,
  { icon: typeof Info; accent: string; ring: string }
> = {
  success: { icon: CheckCircle2, accent: "text-emerald-400", ring: "border-emerald-500/25" },
  error: { icon: XCircle, accent: "text-rose-400", ring: "border-rose-500/25" },
  info: { icon: Info, accent: "text-cyan-400", ring: "border-cyan-500/25" },
  warning: { icon: AlertTriangle, accent: "text-amber-400", ring: "border-amber-500/25" },
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<Toast[]>([]);

  const dismissToast = React.useCallback((id: string) => {
    setToasts((current) => current.filter((t) => t.id !== id));
  }, []);

  const pushToast = React.useCallback(
    (toast: Omit<Toast, "id">) => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      setToasts((current) => [...current.slice(-3), { ...toast, id }]);
      window.setTimeout(() => dismissToast(id), 5200);
    },
    [dismissToast]
  );

  const value = React.useMemo(
    () => ({ toasts, pushToast, dismissToast }),
    [toasts, pushToast, dismissToast]
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        aria-live="polite"
        aria-atomic="false"
        className="pointer-events-none fixed bottom-4 right-4 z-[1200] flex w-[min(94vw,380px)] flex-col gap-2.5"
      >
        {toasts.map((toast) => {
          const config = VARIANT_CONFIG[toast.variant];
          const Icon = config.icon;
          return (
            <div
              key={toast.id}
              role="status"
              className={cn(
                "glass-panel-strong animate-slide-up pointer-events-auto flex items-start gap-3 border p-3.5",
                config.ring
              )}
            >
              <Icon className={cn("mt-0.5 h-4 w-4 shrink-0", config.accent)} aria-hidden="true" />
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-medium leading-snug text-slate-100">{toast.title}</p>
                {toast.description ? (
                  <p className="mt-1 text-[11.5px] leading-relaxed text-slate-400">
                    {toast.description}
                  </p>
                ) : null}
              </div>
              <button
                type="button"
                onClick={() => dismissToast(toast.id)}
                aria-label="Dismiss notification"
                className="focus-ring rounded p-0.5 text-slate-500 transition hover:text-slate-200"
              >
                <X className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const context = React.useContext(ToastContext);
  if (!context) throw new Error("useToast must be used within a ToastProvider");
  return context;
}
