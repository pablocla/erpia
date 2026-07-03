import * as React from "react"
import { cn } from "@/lib/utils"

export function ClaverLogo({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("text-primary", className)}
      aria-label="Claver Logo"
    >
      <path
        d="M 28 14 L 14 14 L 14 34 L 28 34"
        stroke="currentColor"
        strokeWidth="4.5"
        fill="none"
      />
      <path
        d="M 36 10 L 36 38"
        stroke="#3B82F6"
        strokeWidth="4.5"
      />
    </svg>
  )
}
