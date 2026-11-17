import * as React from "react"
import { cn } from "@/lib/utils"

export interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  src?: string | null
  alt?: string
  fallback: string
  size?: "sm" | "default" | "lg"
}

export function Avatar({ src, alt, fallback, size = "default", className, ...props }: AvatarProps) {
  const [hasError, setHasError] = React.useState(!src)

  React.useEffect(() => {
    setHasError(!src)
  }, [src])

  const sizeClasses = {
    sm: "h-8 w-8 text-xs",
    default: "h-10 w-10 text-sm",
    lg: "h-14 w-14 text-base font-bold",
  }

  return (
    <div
      className={cn(
        "relative flex shrink-0 overflow-hidden rounded-full border border-slate-200 bg-slate-100 items-center justify-center font-semibold text-slate-700 select-none",
        "dark:border-slate-700/60 dark:bg-slate-800 dark:text-slate-300",
        sizeClasses[size],
        className
      )}
      {...props}
    >
      {src && !hasError ? (
        <img
          src={src}
          alt={alt || "avatar"}
          loading="lazy"
          decoding="async"
          className="aspect-square h-full w-full object-cover"
          onError={() => setHasError(true)}
        />
      ) : (
        <span>{fallback ? fallback.slice(0, 2).toUpperCase() : '?'}</span>
      )}
    </div>
  )
}
