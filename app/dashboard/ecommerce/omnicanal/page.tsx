"use client"
import React, { useState } from "react"
import { useAuthFetch } from "@/hooks/use-auth-fetch"
import { PageShell, PageHeader } from "@/components/layout"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"

interface Pedido {
  id: number
  numero: string
  fecha: string
  estado: string
  total: number
  cliente: { nombre: string }
  canalVenta: { codigo: string; nombre: string } | null
}

export default function OmnicanalDashboardPage() {
  const { data: pedidos, isLoading } = useAuthFetch<Pedido[]>("/api/ventas/pedidos")
  const [filtroCanal, setFiltroCanal] = useState("")

  const getCanalColor = (codigo: string) => {
    switch (codigo?.toUpperCase()) {
      case "MERCADOLIBRE":
      case "ML":
        return "yellow"
      case "TIENDANUBE":
      case "TN":
        return "blue"
      case "ONLINE":
      case "ECOM":
        return "green"
      default:
        return "gray"
    }
  }

  const filteredPedidos = pedidos?.filter((p) => {
    if (!filtroCanal) return true
    const codigo = p.canalVenta?.codigo?.toLowerCase() || ""
    return codigo.includes(filtroCanal.toLowerCase())
  }) || []

  return (
    <PageShell title="Dashboard Omnicanal" description="Centro de control unificado para pedidos de Ecommerce, Mercado Libre y Tienda Nube.">
      <div className="flex justify-between items-center mb-6">
        <Input 
          placeholder="Filtrar por canal (Ej: ML, ONLINE, TN)..." 
          value={filtroCanal}
          onChange={(e) => setFiltroCanal(e.target.value)}
          className="max-w-sm"
        />
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Número</TableHead>
              <TableHead>Canal</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Cargando pedidos omnicanal...</TableCell>
              </TableRow>
            ) : filteredPedidos.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No se encontraron pedidos en los canales filtrados.</TableCell>
              </TableRow>
            ) : (
              filteredPedidos.map((pedido) => (
                <TableRow key={pedido.id}>
                  <TableCell className="font-medium">{pedido.numero}</TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {pedido.canalVenta?.nombre || "Presencial"}
                    </Badge>
                  </TableCell>
                  <TableCell>{pedido.cliente.nombre}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{pedido.estado}</Badge>
                  </TableCell>
                  <TableCell className="text-right">${Number(pedido.total).toLocaleString("es-AR")}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </PageShell>
  )
}
