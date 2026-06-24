"use client"

import { Skeleton, SkeletonKPI, SkeletonTable } from "@/components/ui/skeleton"

interface PageSkeletonProps {
  kpis?: number
  tableRows?: number
  tableCols?: number
}

export function PageSkeleton({ kpis = 3, tableRows = 8, tableCols = 5 }: PageSkeletonProps) {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-72 max-w-full" />
      </div>
      {kpis > 0 && (
        <div className={`grid gap-4 sm:grid-cols-${Math.min(kpis, 3)}`} style={{ gridTemplateColumns: `repeat(${Math.min(kpis, 4)}, minmax(0, 1fr))` }}>
          {Array.from({ length: kpis }).map((_, i) => (
            <SkeletonKPI key={i} />
          ))}
        </div>
      )}
      <SkeletonTable rows={tableRows} cols={tableCols} />
    </div>
  )
}