"use client"
import React from "react"
import Link from "next/link"
import { useAuthFetch } from "@/hooks/use-auth-fetch"
import { Plus, Server, CheckCircle2, Clock, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"

export default function ProvisioningListPage() {
  const { data: orders, isLoading } = useAuthFetch<any[]>("/api/claver-cloud/provisioning/orders")

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Provisioning</h2>
          <p className="text-muted-foreground mt-1">
            Gestión de altas automáticas de clientes y aprovisionamiento de tenants.
          </p>
        </div>
        <Link href="/claver-cloud/provisioning/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" /> Nueva Orden
          </Button>
        </Link>
      </div>

      <div className="border rounded-lg bg-card">
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
                    <td className="px-4 py-4"><Skeleton className="h-4 w-32" /></td>
                    <td className="px-4 py-4"><Skeleton className="h-4 w-24" /></td>
                    <td className="px-4 py-4"><Skeleton className="h-4 w-20" /></td>
                    <td className="px-4 py-4"><Skeleton className="h-4 w-24" /></td>
                    <td className="px-4 py-4"><Skeleton className="h-5 w-20 rounded-full" /></td>
                    <td className="px-4 py-4"><Skeleton className="h-4 w-20 ml-auto" /></td>
                  </tr>
                ))
              ) : orders?.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">
                    <Server className="h-8 w-8 mx-auto mb-3 opacity-20" />
                    <p>No hay órdenes de provisión recientes</p>
                  </td>
                </tr>
              ) : (
                orders?.map((order) => (
                  <tr key={order.id} className="border-b bg-card hover:bg-muted/50 transition-colors">
                    <td className="px-4 py-3 font-medium">
                      {order.razonSocial}
                      <div className="text-xs text-muted-foreground">{order.cuit}</div>
                    </td>
                    <td className="px-4 py-3">
                      {order.contactoNombre}
                      <div className="text-xs text-muted-foreground">{order.contactoEmail}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-semibold">{order.planHosting}</span>
                      {order.skus && order.skus.length > 0 && (
                        <div className="text-xs text-muted-foreground">+{order.skus.length} add-ons</div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">
                      {order.analistaAsignado || "Automático"}
                    </td>
                    <td className="px-4 py-3">
                      {order.estado === "completado" && (
                        <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">
                          <CheckCircle2 className="h-3 w-3 mr-1" /> Completado
                        </Badge>
                      )}
                      {order.estado === "pendiente" && (
                        <Badge variant="outline" className="bg-amber-500/10 text-amber-500 border-amber-500/20">
                          <Clock className="h-3 w-3 mr-1" /> Pendiente
                        </Badge>
                      )}
                      {order.estado === "error" && (
                        <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20">
                          <AlertCircle className="h-3 w-3 mr-1" /> Falló
                        </Badge>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right text-xs text-muted-foreground">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
