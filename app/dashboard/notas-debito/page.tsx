"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useAuthFetch } from "@/hooks/use-auth-fetch"
import { Search, ChevronLeft, ChevronRight, Eye, FileWarning } from "lucide-react"
import Link from "next/link"
import { DataTable, type DataTableColumn } from "@/components/data-table"
import { EmptyStateIllustration } from "@/components/empty-state-illustration"

interface NotaDebito {
  id: number
  tipo: string
  numero: number
  puntoVenta: number
  fecha: string
  total: number
  estado: string
  motivo?: string
  cliente?: { id: number; nombre: string }
  proveedor?: { id: number; nombre: string }
  factura?: { id: number; tipo: string; numero: number }
}

const estadoColors: Record<string, string> = {
  emitida: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
  anulada: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
}

export default function NotasDebitoPage() {
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)

  const params = new URLSearchParams()
  params.set("page", String(page))
  params.set("pageSize", "25")
  if (search) params.set("search", search)

  const { data, isLoading } = useAuthFetch<NotaDebito[]>(`/api/notas-debito?${params}`)
  const items = Array.isArray(data) ? data : []

  const formatCurrency = (n: number) =>
    new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" }).format(n)

  const formatComprobante = (nd: NotaDebito) =>
    `ND ${nd.tipo} ${String(nd.puntoVenta).padStart(5, "0")}-${String(nd.numero).padStart(8, "0")}`

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Notas de Débito</h1>
          <p className="text-muted-foreground">Notas de débito emitidas</p>
        </div>
      </div>

      {/* Summary */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total ND</CardTitle>
            <FileWarning className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(items.filter(nd => nd.estado !== "anulada").reduce((s, nd) => s + nd.total, 0))}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cantidad</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{items.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por cliente, proveedor o número..."
              className="pl-9"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="pt-4">
          <DataTable<NotaDebito>
            data={items}
            columns={[
              { key: "numero", header: "Comprobante", sortable: true, cell: (nd) => <span className="font-mono text-xs">{formatComprobante(nd)}</span> },
              { key: "fecha", header: "Fecha", sortable: true, cell: (nd) => new Date(nd.fecha).toLocaleDateString("es-AR") },
              { key: "cliente" as any, header: "Destino", cell: (nd) => nd.cliente?.nombre ?? nd.proveedor?.nombre ?? "—", exportFn: (nd) => nd.cliente?.nombre ?? nd.proveedor?.nombre ?? "" },
              { key: "motivo" as any, header: "Motivo", cell: (nd) => <span className="truncate max-w-[200px] block">{nd.motivo ?? "—"}</span> },
              { key: "total", header: "Total", align: "right", sortable: true, cell: (nd) => <span className="font-medium">{formatCurrency(nd.total)}</span> },
              { key: "estado", header: "Estado", cell: (nd) => <Badge variant="outline" className={estadoColors[nd.estado] ?? ""}>{nd.estado}</Badge> },
              { key: "factura" as any, header: "Factura Origen", cell: (nd) => <span className="font-mono text-xs">{nd.factura ? `${nd.factura.tipo} ${String(nd.factura.numero).padStart(8, "0")}` : "—"}</span> },
              { key: "acciones" as any, header: "", cell: (nd) => <Link href={`/dashboard/notas-debito/${nd.id}`}><Button variant="ghost" size="icon"><Eye className="h-4 w-4" /></Button></Link> },
            ] as DataTableColumn<NotaDebito>[]}
            rowKey="id"
            searchPlaceholder="Buscar nota de débito..."
            searchKeys={["numero", "motivo"]}
            selectable
            exportFilename="notas-debito"
            loading={isLoading}
            emptyMessage="Sin notas de débito"
            emptyIcon={<EmptyStateIllustration type="generico" compact title="Sin notas de débito" description="Las notas de débito se generan desde facturas." />}
            defaultPageSize={25}
            compact
          />
        </CardContent>
      </Card>
    </div>
  )
}
