import * as React from "react";
import { cn } from "@/lib/utils";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
type ButtonSize = "sm" | "md" | "icon";

const VARIANTS: Record<ButtonVariant, string> = {
  primary:
    "border-cyan-400/30 bg-cyan-500/15 text-cyan-100 hover:bg-cyan-500/25 hover:border-cyan-400/45 shadow-[0_0_20px_-8px_rgba(6,182,212,0.5)]",
  secondary:
    "border-white/10 bg-white/[0.04] text-slate-200 hover:bg-white/[0.08] hover:border-white/20",
  ghost: "border-transparent bg-transparent text-slate-400 hover:bg-white/[0.06] hover:text-slate-100",
  danger:
    "border-rose-500/30 bg-rose-500/12 text-rose-200 hover:bg-rose-500/22 hover:border-rose-500/45",
};

const SIZES: Record<ButtonSize, string> = {
  sm: "h-8 px-3 text-[11.5px] gap-1.5",
  md: "h-9 px-4 text-[12.5px] gap-2",
  icon: "h-8 w-8 justify-center",
};

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant = "secondary", size = "sm", type = "button", ...props },
  ref
) {
  return (
    <button
      ref={ref}
      type={type}
      className={cn(
        "focus-ring inline-flex select-none items-center rounded-lg border font-medium transition-all duration-200",
        "disabled:pointer-events-none disabled:opacity-45",
        VARIANTS[variant],
        SIZES[size],
        className
      )}
      {...props}
    />
  );
});
