"use client"

import { SkeletonKPI } from "@/components/ui/skeleton"
import { ProductHome } from "@/components/dashboard/product-home"
import { useProductHomeData } from "@/hooks/use-product-home-data"
import type { ProductShellConfig } from "@/lib/comercial/product-shell"

interface ProductDashboardHomeProps {
  shell: ProductShellConfig
  authHeaders: () => HeadersInit
  empresaId?: number
}

export function ProductDashboardHome({ shell, authHeaders, empresaId }: ProductDashboardHomeProps) {
  const { kpis, actions, loading } = useProductHomeData(shell, authHeaders, empresaId)

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-10 w-64 animate-pulse rounded-lg bg-muted" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <SkeletonKPI key={i} />
          ))}
        </div>
      </div>
    )
  }

  return <ProductHome marca={shell.marca} kpis={kpis} actions={actions} />
}