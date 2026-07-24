"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { useAuthFetch } from "@/hooks/use-auth-fetch"
import { Plus, Server, AlertCircle, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { CloudPageHeader } from "@/components/claver-cloud/cloud-page-header"
import { EmptyState } from "@/components/ui/empty-state"
import { StatusBadge } from "@/components/layout"
import type { StatusVariant } from "@/lib/ui/status-map"

function orderEstado(estado: string): { variant: StatusVariant; label: string } {
  switch (estado) {
    case "completado":
      return { variant: "success", label: "Completado" }
    case "pendiente":
      return { variant: "warning", label: "Pendiente" }
    case "error":
      return { variant: "error", label: "Falló" }
    default:
      return { variant: "neutral", label: estado || "—" }
  }
}

export default function ProvisioningListPage() {
  const { data: orders, isLoading, mutate, error } = useAuthFetch<any[]>("/api/claver-cloud/provisioning/orders")
  const [q, setQ] = useState("")

  const list = useMemo(() => {
    const rows = Array.isArray(orders) ? orders : []
    const term = q.trim().toLowerCase()
    if (!term) return rows
    return rows.filter((order) => {
      const hay = [
        order.razonSocial,
        order.cuit,
        order.contactoNombre,
        order.contactoEmail,
        order.planHosting,
        order.analistaAsignado,
        order.estado,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
      return hay.includes(term)
    })
  }, [orders, q])

  return (
    <div className="space-y-6">
      <CloudPageHeader
        title="Provisioning"
        description="Historial de altas: empresa, entornos, admin y servicios. Creá una org o reintentá las fallidas."
        onRefresh={() => mutate()}
        loading={isLoading}
        actions={
          <Button size="sm" asChild className="min-h-[40px]">
            <Link href="/claver-cloud/provisioning/new">
              <Plus className="mr-2 h-4 w-4" />
              Nueva organización
            </Link>
          </Button>
        }
      />

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          className="pl-9 min-h-[40px]"
          placeholder="Buscar por cliente, CUIT, contacto o estado…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          aria-label="Buscar órdenes de provisioning"
        />
      </div>

      {error && (
        <EmptyState
          icon={AlertCircle}
          title="No se pudieron cargar las órdenes"
          description="Revisá tu sesión o reintentá en unos segundos."
          actionLabel="Reintentar"
          onAction={() => mutate()}
        />
      )}

      {!error && (
        <div className="border rounded-xl bg-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-muted-foreground bg-muted/50 uppercase border-b">
                <tr>
                  <th className="px-4 py-3">Cliente</th>
                  <th className="px-4 py-3">Contacto</th>
                  <th className="px-4 py-3">Plan / SKUs</th>
                  <th className="px-4 py-3">Analista</th>
                  <th className="px-4 py-3">Estado</th>
                  <th className="px-4 py-3 text-right">Fecha</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="border-b">
                      <td className="px-4 py-4">
                        <Skeleton className="h-4 w-32" />
                      </td>
                      <td className="px-4 py-4">
                        <Skeleton className="h-4 w-24" />
                      </td>
                      <td className="px-4 py-4">
                        <Skeleton className="h-4 w-20" />
                      </td>
                      <td className="px-4 py-4">
                        <Skeleton className="h-4 w-24" />
                      </td>
                      <td className="px-4 py-4">
                        <Skeleton className="h-5 w-20 rounded-full" />
                      </td>
                      <td className="px-4 py-4">
                        <Skeleton className="h-4 w-20 ml-auto" />
                      </td>
                    </tr>
                  ))
                ) : list.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-2">
                      <EmptyState
                        icon={Server}
                        title={
                          (orders?.length ?? 0) === 0
                            ? "Todavía no hay altas"
                            : "Ninguna orden coincide"
                        }
                        description={
                          (orders?.length ?? 0) === 0
                            ? "Creá la primera organización para provisionar empresa, entornos y admin."
                            : "Probá otro término o limpiá la búsqueda."
                        }
                        actionLabel={
                          (orders?.length ?? 0) === 0 ? "Nueva organización" : "Limpiar búsqueda"
                        }
                        onAction={
                          (orders?.length ?? 0) === 0
                            ? () => {
                                window.location.href = "/claver-cloud/provisioning/new"
                              }
                            : () => setQ("")
                        }
                      />
                    </td>
                  </tr>
                ) : (
                  list.map((order) => {
                    const st = orderEstado(order.estado)
                    return (
                      <tr
                        key={order.id}
                        className="border-b bg-card hover:bg-muted/50 transition-colors"
                      >
                        <td className="px-4 py-3 font-medium">
                          {order.razonSocial}
                          <div className="text-xs text-muted-foreground font-mono">
                            {order.cuit || "Sin CUIT"}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          {order.contactoNombre}
                          <div className="text-xs text-muted-foreground">{order.contactoEmail}</div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="font-semibold">{order.planHosting}</span>
                          {order.skus && order.skus.length > 0 && (
                            <div className="text-xs text-muted-foreground">
                              +{order.skus.length} servicio{order.skus.length !== 1 ? "s" : ""}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground text-xs">
                          {order.analistaAsignado || "Automático"}
                        </td>
                        <td className="px-4 py-3">
                          <StatusBadge
                            variant={st.variant}
                            label={st.label}
                            className="inline-flex items-center"
                          />
                        </td>
                        <td className="px-4 py-3 text-right text-xs text-muted-foreground whitespace-nowrap">
                          {order.createdAt
                            ? new Date(order.createdAt).toLocaleString("es-AR", {
                                day: "2-digit",
                                month: "2-digit",
                                year: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })
                            : "—"}
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
