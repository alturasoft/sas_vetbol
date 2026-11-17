import * as React from "react"
import { cn } from "@/lib/utils"

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "secondary" | "destructive" | "outline" | "success" | "warning"
}

export function Badge({ className, variant = "default", ...props }: BadgeProps) {
  const variantStyles = {
    default: "border-transparent bg-emerald-600 text-white shadow-xs",
    secondary: "border-transparent bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700/60",
    destructive: "border-transparent bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/50 dark:border-rose-800/60 dark:text-rose-300",
    outline: "text-slate-700 border border-slate-200 dark:text-slate-300 dark:border-slate-700",
    success: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:border-emerald-800/60 dark:text-emerald-300",
    warning: "border-amber-200 bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:border-amber-800/60 dark:text-amber-300",
  }

  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500",
        variantStyles[variant],
        className
      )}
      {...props}
    />
  )
}
