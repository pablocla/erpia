"use client"

/**
 * Wrapper component that initializes the page tracker.
 * Must be rendered inside a client boundary.
 */

import { usePageTracker } from "@/hooks/use-page-tracker"

export function PageTrackerProvider({ children }: { children: React.ReactNode }) {
  usePageTracker()
  return <>{children}</>
}
