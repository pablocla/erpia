"use client"

import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

interface PageShellProps {
  children: ReactNode
  className?: string
  maxWidth?: "none" | "4xl" | "5xl" | "6xl" | "7xl"
}

const MAX: Record<NonNullable<PageShellProps["maxWidth"]>, string> = {
  none: "",
  "4xl": "max-w-4xl",
  "5xl": "max-w-5xl",
  "6xl": "max-w-6xl",
  "7xl": "max-w-7xl",
}

export function PageShell({ children, className, maxWidth = "none" }: PageShellProps) {
  return (
    <div className={cn("space-y-6", MAX[maxWidth], maxWidth !== "none" && "mx-auto w-full", className)}>
      {children}
    </div>
  )
}