import React from "react"
import { cn } from "@/src/lib/utils"

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-muted/20 bg-zinc-200 dark:bg-zinc-800", className)}
      {...props}
    />
  )
}

export { Skeleton }
