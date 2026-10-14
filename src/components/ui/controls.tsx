import * as React from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

/* ------------------------------- Segmented ------------------------------- */

export interface SegmentedOption<T extends string> {
  value: T;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
}

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  className,
  size = "sm",
  ariaLabel,
}: {
  options: SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
  size?: "sm" | "md";
  ariaLabel: string;
}) {
  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      className={cn(
        "inline-flex items-center gap-0.5 rounded-lg border border-white/[0.08] bg-slate-950/50 p-0.5",
        className
      )}
    >
      {options.map((option) => {
        const active = option.value === value;
        const Icon = option.icon;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(option.value)}
            className={cn(
              "focus-ring inline-flex items-center gap-1.5 rounded-md font-medium transition-all duration-200",
              size === "sm" ? "px-2.5 py-1 text-[11px]" : "px-3 py-1.5 text-[12px]",
              active
                ? "bg-cyan-500/18 text-cyan-200 shadow-[0_0_16px_-6px_rgba(6,182,212,0.6)]"
                : "text-slate-500 hover:bg-white/[0.05] hover:text-slate-300"
            )}
          >
            {Icon ? <Icon className="h-3.5 w-3.5" aria-hidden="true" /> : null}
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

/* --------------------------------- Select -------------------------------- */

export interface SelectOption {
  value: string;
  label: string;
}

export function Select({
  value,
  onChange,
  options,
  className,
  ariaLabel,
  id,
}: {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  className?: string;
  ariaLabel: string;
  id?: string;
}) {
  return (
    <div className={cn("relative", className)}>
      <select
        id={id}
        aria-label={ariaLabel}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="focus-ring w-full appearance-none rounded-lg border border-white/[0.09] bg-slate-950/70 py-1.5 pl-2.5 pr-8 text-[12px] text-slate-200 transition hover:border-white/20"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value} className="bg-slate-900 text-slate-200">
            {option.label}
          </option>
        ))}
      </select>
      <ChevronDown
        className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500"
        aria-hidden="true"
      />
    </div>
  );
}

/* --------------------------------- Field --------------------------------- */

export function Field({
  label,
  htmlFor,
  error,
  hint,
  children,
  className,
}: {
  label: string;
  htmlFor?: string;
  error?: string;
  hint?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <label htmlFor={htmlFor} className="label-caps block">
        {label}
      </label>
      {children}
      {error ? (
        <p role="alert" className="text-[11px] text-rose-400">
          {error}
        </p>
      ) : hint ? (
        <p className="text-[11px] text-slate-500">{hint}</p>
      ) : null}
    </div>
  );
}

export const inputClasses =
  "focus-ring w-full rounded-lg border border-white/[0.09] bg-slate-950/70 px-2.5 py-1.5 text-[12.5px] text-slate-200 placeholder:text-slate-600 transition hover:border-white/20";
