import { cn } from '@/lib/utils'

function Skeleton({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="skeleton"
      className={cn('animate-shimmer rounded-md', className)}
      {...props}
    />
  )
}

/** KPI card skeleton with title line + large value + subtitle */
function SkeletonKPI({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="skeleton-kpi"
      className={cn(
        'rounded-xl border p-6 space-y-3 bg-card',
        className,
      )}
      {...props}
    >
      <div className="flex items-center justify-between">
        <Skeleton className="h-3.5 w-24" />
        <Skeleton className="h-4 w-4 rounded" />
      </div>
      <Skeleton className="h-7 w-32" />
      <Skeleton className="h-3 w-20" />
    </div>
  )
}

/** Table skeleton with header + n rows */
function SkeletonTable({
  rows = 5,
  cols = 4,
  className,
  ...props
}: React.ComponentProps<'div'> & { rows?: number; cols?: number }) {
  return (
    <div
      data-slot="skeleton-table"
      className={cn('rounded-xl border bg-card overflow-hidden', className)}
      {...props}
    >
      {/* Header */}
      <div className="flex gap-4 p-4 border-b bg-muted/30">
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={i} className="h-3.5 flex-1" />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, r) => (
        <div
          key={r}
          className="flex gap-4 p-4 border-b last:border-0"
          style={{ animationDelay: `${r * 80}ms` }}
        >
          {Array.from({ length: cols }).map((_, c) => (
            <Skeleton
              key={c}
              className="h-3.5 flex-1"
              style={{ animationDelay: `${(r * cols + c) * 40}ms` }}
            />
          ))}
        </div>
      ))}
    </div>
  )
}

/** Card skeleton for dashboard sections */
function SkeletonCard({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="skeleton-card"
      className={cn('rounded-xl border p-6 space-y-4 bg-card', className)}
      {...props}
    >
      <Skeleton className="h-4 w-40" />
      <div className="space-y-2">
        <Skeleton className="h-3.5 w-full" />
        <Skeleton className="h-3.5 w-3/4" />
        <Skeleton className="h-3.5 w-1/2" />
      </div>
    </div>
  )
}

export { Skeleton, SkeletonKPI, SkeletonTable, SkeletonCard }
