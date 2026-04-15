"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useAuthFetch } from "@/hooks/use-auth-fetch"
import { FileText, Search, ChevronLeft, ChevronRight, Eye, Download } from "lucide-react"
import Link from "next/link"
import { DataTable, type DataTableColumn } from "@/components/data-table"
import { EmptyStateIllustration } from "@/components/empty-state-illustration"
import { useKeyboardShortcuts, erpShortcuts } from "@/hooks/use-keyboard-shortcuts"
import { FilterPanel, type FilterField, type FilterValues } from "@/components/filter-panel"

interface Factura {
  id: number
  tipo: string
  numero: number
  puntoVenta: number
  fecha: string
  total: number
  iva: number
  estado: string
  cae?: string
  cliente?: { id: number; nombre: string; cuit?: string }
  vendedor?: { id: number; nombre: string }
  _count?: { lineas: number; notasCredito: number }
}

interface FacturasResponse {
  data: Factura[]
  total: number
  page: number
  pageSize: number
  summary: { totalFacturado: number; totalIVA: number; cantidadEmitidas: number }
}

const estadoColors: Record<string, string> = {
  emitida: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  anulada: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  borrador: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
}

export default function FacturasPage() {
  const [search, setSearch] = useState("")
  const [tipo, setTipo] = useState("")
  const [estado, setEstado] = useState("")
  const [page, setPage] = useState(1)
  const [filters, setFilters] = useState<FilterValues>({})

  const params = new URLSearchParams()
  params.set("page", String(page))
  params.set("pageSize", "25")
  if (search) params.set("search", search)
  if (tipo) params.set("tipo", tipo)
  if (estado) params.set("estado", estado)

  const { data, isLoading, mutate } = useAuthFetch<FacturasResponse>(`/api/facturas?${params}`)

  useKeyboardShortcuts(erpShortcuts({ onRefresh: () => { mutate() } }))

  const formatCurrency = (n: number) =>
    new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" }).format(n)

  const formatComprobante = (f: Factura) =>
    `${f.tipo} ${String(f.puntoVenta).padStart(5, "0")}-${String(f.numero).padStart(8, "0")}`

  const filterFields: FilterField[] = [
    { key: "tipoComprobante", label: "Tipo", type: "select", options: [
      { value: "A", label: "Factura A" },
      { value: "B", label: "Factura B" },
      { value: "C", label: "Factura C" },
      { value: "NCA", label: "NC A" },
      { value: "NCB", label: "NC B" },
      { value: "NCC", label: "NC C" },
    ]},
    { key: "estado", label: "Estado", type: "select", options: [
      { value: "emitida", label: "Emitida" },
      { value: "anulada", label: "Anulada" },
      { value: "borrador", label: "Borrador" },
    ]},
    { key: "fecha", label: "Fecha", type: "date-range" },
  ]

  const facturasFiltradas = useMemo(() => {
    const items = data?.data ?? []
    return items.filter((f) => {
      if (filters.tipoComprobante && f.tipo !== filters.tipoComprobante) return false
      if (filters.estado && f.estado !== filters.estado) return false
      if (filters.fecha) {
        const range = filters.fecha as { from?: string; to?: string }
        const fecha = f.fecha.slice(0, 10)
        if (range.from && fecha < range.from) return false
        if (range.to && fecha > range.to) return false
      }
      return true
    })
  }, [data, filters])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Facturas</h1>
          <p className="text-muted-foreground">Todas las facturas emitidas</p>
        </div>
      </div>

      {/* Summary Cards */}
      {data?.summary && (
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Facturado</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(data.summary.totalFacturado)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total IVA</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(data.summary.totalIVA)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Cantidad Emitidas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.summary.cantidadEmitidas}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap items-end gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por cliente, número o CAE..."
                  className="pl-9"
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setPage(1) }}
                />
              </div>
            </div>
            <Select value={tipo} onValueChange={(v) => { setTipo(v === "all" ? "" : v); setPage(1) }}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="A">Factura A</SelectItem>
                <SelectItem value="B">Factura B</SelectItem>
                <SelectItem value="C">Factura C</SelectItem>
              </SelectContent>
            </Select>
            <Select value={estado} onValueChange={(v) => { setEstado(v === "all" ? "" : v); setPage(1) }}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="emitida">Emitida</SelectItem>
                <SelectItem value="anulada">Anulada</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <FilterPanel fields={filterFields} values={filters} onChange={setFilters} />

      {/* Table */}
      <Card>
        <CardContent className="pt-4">
          <DataTable<Factura>
            data={facturasFiltradas}
            columns={[
              { key: "numero", header: "Comprobante", sortable: true, cell: (f) => <span className="font-mono text-xs">{formatComprobante(f)}</span> },
              { key: "fecha", header: "Fecha", sortable: true, cell: (f) => new Date(f.fecha).toLocaleDateString("es-AR") },
              { key: "cliente" as any, header: "Cliente", cell: (f) => (<div>{f.cliente?.nombre ?? "—"}{f.cliente?.cuit && <div className="text-xs text-muted-foreground">{f.cliente.cuit}</div>}</div>), exportFn: (f) => f.cliente?.nombre ?? "" },
              { key: "total", header: "Total", align: "right", sortable: true, cell: (f) => <span className="font-medium">{formatCurrency(f.total)}</span> },
              { key: "estado", header: "Estado", cell: (f) => <Badge variant="outline" className={estadoColors[f.estado] ?? ""}>{f.estado}</Badge> },
              { key: "cae" as any, header: "CAE", cell: (f) => <span className="font-mono text-xs">{f.cae ?? "—"}</span> },
              { key: "_count" as any, header: "NC", cell: (f) => f._count?.notasCredito ?? 0, exportFn: (f) => String(f._count?.notasCredito ?? 0) },
              { key: "acciones" as any, header: "", cell: (f) => <Link href={`/dashboard/facturas/${f.id}`}><Button variant="ghost" size="icon"><Eye className="h-4 w-4" /></Button></Link> },
            ] as DataTableColumn<Factura>[]}
            rowKey="id"
            searchPlaceholder="Buscar factura..."
            searchKeys={["numero"]}
            selectable
            bulkActions={(selected, clear) => (
              <Button variant="outline" size="sm" onClick={() => {
                const h = "tipo,puntoVenta,numero,fecha,cliente,total,iva,estado,cae"
                const rows = selected.map((f) => [f.tipo, f.puntoVenta, f.numero, f.fecha?.slice(0, 10), f.cliente?.nombre, f.total, f.iva, f.estado, f.cae].map(v => `"${String(v ?? "").replace(/"/g, '""')}"`).join(","))
                const blob = new Blob(["\uFEFF" + [h, ...rows].join("\n")], { type: "text/csv;charset=utf-8;" })
                const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "facturas-seleccionadas.csv"; a.click()
                clear()
              }}>
                <Download className="h-4 w-4 mr-1" /> Exportar ({selected.length})
              </Button>
            )}
            exportFilename="facturas"
            loading={isLoading}
            emptyMessage="Sin facturas"
            emptyIcon={<EmptyStateIllustration type="ventas" compact title="Sin facturas" description="Emit\u00ed la primera factura desde el POS." />}
            defaultPageSize={25}
            compact
          />
          {/* Server Pagination */}
          {data && data.total > 25 && (
            <div className="flex items-center justify-between px-4 py-3 border-t">
              <span className="text-sm text-muted-foreground">
                {((page - 1) * 25) + 1}–{Math.min(page * 25, data.total)} de {data.total}
              </span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" disabled={page * 25 >= data.total} onClick={() => setPage(p => p + 1)}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
