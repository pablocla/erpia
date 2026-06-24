"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Plus, FolderTree, BarChart3, ChevronRight, ChevronDown, Sparkles
} from "lucide-react"
import { DataTable, type DataTableColumn } from "@/components/data-table"
import { useKeyboardShortcuts, erpShortcuts } from "@/hooks/use-keyboard-shortcuts"
import { PageShell, PageHeader } from "@/components/layout"

interface CentroCosto {
  id: number
  codigo: string
  nombre: string
  descripcion?: string
  parentId?: number
  parent?: { id: number; nombre: string; codigo: string }
  _count?: { movimientos: number }
  hijos?: CentroCosto[]
}

const PARENT_NONE = "__none__"

function authHeaders(): HeadersInit {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null
  return token
    ? { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }
    : { "Content-Type": "application/json" }
}

interface ReporteItem {
  id: number
  codigo: string
  nombre: string
  totalDebe: number
  totalHaber: number
  saldo: number
  movimientos: number
}

export default function CentrosCostoPage() {
  const [centros, setCentros] = useState<CentroCosto[]>([])
  const [arbol, setArbol] = useState<CentroCosto[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  // Create
  const [dialogOpen, setDialogOpen] = useState(false)
  const [form, setForm] = useState({ codigo: "", nombre: "", descripcion: "", parentId: PARENT_NONE })

  // Report
  const [repMes, setRepMes] = useState(String(new Date().getMonth() + 1))
  const [repAnio, setRepAnio] = useState(String(new Date().getFullYear()))
  const [reporte, setReporte] = useState<ReporteItem[]>([])
  const [loadingRep, setLoadingRep] = useState(false)

  // Expanded nodes
  const [expanded, setExpanded] = useState<Set<number>>(new Set())

  useEffect(() => { cargar() }, [])

  useKeyboardShortcuts(erpShortcuts({
    onRefresh: cargar,
  }))

  async function cargar() {
    setLoading(true)
    setError("")
    try {
      const headers = authHeaders()
      const [flatRes, treeRes] = await Promise.all([
        fetch("/api/contabilidad/centros-costo", { headers }),
        fetch("/api/contabilidad/centros-costo?vista=jerarquia", { headers }),
      ])
      const flat = await flatRes.json()
      const tree = await treeRes.json()
      setCentros(Array.isArray(flat) ? flat : [])
      setArbol(Array.isArray(tree) ? tree : [])
      if (!flatRes.ok || !treeRes.ok) {
        setError(flat?.error ?? tree?.error ?? "No se pudieron cargar los centros de costo")
      }
    } catch {
      setCentros([])
      setArbol([])
      setError("Error al cargar")
    }
    setLoading(false)
  }

  async function crear() {
    setError("")
    if (!form.codigo || !form.nombre) { setError("Código y nombre requeridos"); return }
    try {
      const res = await fetch("/api/contabilidad/centros-costo", {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({
          codigo: form.codigo.trim(),
          nombre: form.nombre.trim(),
          descripcion: form.descripcion.trim() || undefined,
          parentId:
            form.parentId && form.parentId !== PARENT_NONE
              ? parseInt(form.parentId, 10)
              : undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? "Error al crear")
      setSuccess("Centro de costos creado")
      setDialogOpen(false)
      setForm({ codigo: "", nombre: "", descripcion: "", parentId: PARENT_NONE })
      cargar()
    } catch (e: any) { setError(e.message) }
  }

  async function cargarReporte() {
    setLoadingRep(true)
    try {
      const res = await fetch("/api/contabilidad/centros-costo", {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ action: "reporte", mes: parseInt(repMes, 10), anio: parseInt(repAnio, 10) }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? "Error al generar reporte")
      setReporte(Array.isArray(data) ? data : [])
    } catch (e: any) { setError(e.message) }
    setLoadingRep(false)
  }

  function toggleExpanded(id: number) {
    const next = new Set(expanded)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setExpanded(next)
  }

  const fmt = (n: number) => n.toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })

  function renderTree(nodes: CentroCosto[], depth = 0): React.ReactNode {
    if (!Array.isArray(nodes)) return null
    return nodes.map(node => {
      const hasChildren = (node.hijos?.length ?? 0) > 0
      const isExpanded = expanded.has(node.id)

      return (
        <div key={node.id}>
          <div
            className="flex items-center gap-2 py-2 px-3 hover:bg-muted/30 rounded-lg cursor-pointer transition-colors"
            style={{ paddingLeft: `${depth * 24 + 12}px` }}
            onClick={() => hasChildren && toggleExpanded(node.id)}
          >
            {hasChildren ? (
              isExpanded ? <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" /> : <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
            ) : (
              <div className="w-4 shrink-0" />
            )}
            <span className="font-mono text-xs text-muted-foreground shrink-0">{node.codigo}</span>
            <span className="font-medium text-foreground">{node.nombre}</span>
            {node._count && node._count.movimientos > 0 && (
              <Badge variant="secondary" className="ml-auto text-xs backdrop-blur-sm bg-muted/40">{node._count.movimientos} mov.</Badge>
            )}
          </div>
          {hasChildren && isExpanded && renderTree(node.hijos!, depth + 1)}
        </div>
      )
    })
  }

  const totalReporteDebe = reporte.reduce((s, r) => s + r.totalDebe, 0)
  const totalReporteHaber = reporte.reduce((s, r) => s + r.totalHaber, 0)

  return (
    <PageShell>
      <PageHeader
        title="Centros de Costo"
        description="Estructura de imputación jerárquica para la distribución, análisis y reporte de egresos e ingresos corporativos."
        badge={
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-medium text-primary">
            <Sparkles className="h-3.5 w-3.5 text-primary/80" />
            Control de Gestión
          </span>
        }
        actions={
          <Button onClick={() => setDialogOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" /> Nuevo Centro
          </Button>
        }
      />

      {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}
      {success && <Alert><AlertDescription className="text-[var(--status-success-foreground)]">{success}</AlertDescription></Alert>}

      <Tabs defaultValue="jerarquia" className="space-y-6">
        <TabsList className="backdrop-blur-sm bg-muted/60">
          <TabsTrigger value="jerarquia"><FolderTree className="mr-2 h-4 w-4" /> Jerarquía</TabsTrigger>
          <TabsTrigger value="reporte"><BarChart3 className="mr-2 h-4 w-4" /> Reporte por Período</TabsTrigger>
        </TabsList>

        <TabsContent value="jerarquia" className="space-y-6">
          <Card className="backdrop-blur-sm bg-card/60 border-muted/40">
            <CardHeader>
              <CardTitle className="text-base font-semibold">Estructura Jerárquica</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-muted-foreground text-center py-12">Cargando jerarquía...</div>
              ) : arbol.length === 0 ? (
                <div className="text-muted-foreground text-center py-12">
                  Sin centros de costo. Cree el primer centro para comenzar.
                </div>
              ) : (
                <div className="border border-muted/30 rounded-xl p-3 bg-background/30 space-y-1">
                  {renderTree(arbol)}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Flat list */}
          <Card className="backdrop-blur-sm bg-card/60 border-muted/40">
            <CardHeader><CardTitle className="text-base font-semibold">Todos los Centros</CardTitle></CardHeader>
            <CardContent className="pt-0">
              <DataTable<CentroCosto>
                data={centros}
                columns={[
                  { key: "codigo", header: "Código", sortable: true, cell: (cc) => <span className="font-mono text-xs">{cc.codigo}</span> },
                  { key: "nombre", header: "Nombre", sortable: true, cell: (cc) => <span className="font-medium text-foreground">{cc.nombre}</span> },
                  { key: "parent" as any, header: "Centro Padre", cell: (cc) => <span className="text-muted-foreground">{cc.parent ? `${cc.parent.codigo} — ${cc.parent.nombre}` : "—"}</span>, exportFn: (cc) => cc.parent ? `${cc.parent.codigo} - ${cc.parent.nombre}` : "" },
                  { key: "_count" as any, header: "Movimientos", cell: (cc) => <span className="text-right block font-semibold">{cc._count?.movimientos ?? 0}</span>, exportFn: (cc) => String(cc._count?.movimientos ?? 0) },
                ]}
                rowKey="id"
                searchPlaceholder="Buscar centro de costo..."
                searchKeys={["codigo", "nombre"]}
                exportFilename="centros-costo"
                emptyMessage="Sin centros de costo"
                compact
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reporte" className="space-y-6">
          <Card className="backdrop-blur-sm bg-card/60 border-muted/40">
            <CardHeader>
              <CardTitle className="text-base font-semibold">Reporte Mensual</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-wrap gap-4 items-end bg-muted/20 p-4 rounded-xl border border-muted/20">
                <div className="space-y-1.5">
                  <Label>Mes de Consulta</Label>
                  <Select value={repMes} onValueChange={setRepMes}>
                    <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 12 }, (_, i) => (
                        <SelectItem key={i + 1} value={String(i + 1)}>
                          {new Date(2000, i).toLocaleString("es-AR", { month: "long" })}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Año</Label>
                  <Input type="number" className="w-28" value={repAnio} onChange={e => setRepAnio(e.target.value)} />
                </div>
                <Button onClick={cargarReporte} disabled={loadingRep} className="gap-2">
                  <BarChart3 className="h-4 w-4" /> {loadingRep ? "Generando..." : "Generar Reporte"}
                </Button>
              </div>

              {reporte.length > 0 ? (
                <div className="border border-muted/30 rounded-xl overflow-hidden">
                  <Table>
                    <TableHeader className="bg-muted/30">
                      <TableRow>
                        <TableHead>Código</TableHead>
                        <TableHead>Centro de Costo</TableHead>
                        <TableHead className="text-right">Debe</TableHead>
                        <TableHead className="text-right">Haber</TableHead>
                        <TableHead className="text-right">Saldo</TableHead>
                        <TableHead className="text-right">Mov.</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {reporte.map(r => (
                        <TableRow key={r.id} className="hover:bg-muted/10">
                          <TableCell className="font-mono text-xs">{r.codigo}</TableCell>
                          <TableCell className="font-medium text-foreground">{r.nombre}</TableCell>
                          <TableCell className="text-right font-mono text-xs">${fmt(r.totalDebe)}</TableCell>
                          <TableCell className="text-right font-mono text-xs">${fmt(r.totalHaber)}</TableCell>
                          <TableCell className="text-right font-mono text-xs font-bold">
                            <span className={r.saldo >= 0 ? "text-[var(--status-info-foreground)]" : "text-[var(--status-error-foreground)]"}>
                              ${fmt(r.saldo)}
                            </span>
                          </TableCell>
                          <TableCell className="text-right font-medium">{r.movimientos}</TableCell>
                        </TableRow>
                      ))}
                      <TableRow className="font-bold border-t-2 bg-muted/20">
                        <TableCell colSpan={2}>TOTAL ACUMULADO</TableCell>
                        <TableCell className="text-right font-mono text-xs">${fmt(totalReporteDebe)}</TableCell>
                        <TableCell className="text-right font-mono text-xs">${fmt(totalReporteHaber)}</TableCell>
                        <TableCell className="text-right font-mono text-xs">${fmt(totalReporteDebe - totalReporteHaber)}</TableCell>
                        <TableCell />
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              ) : (
                !loadingRep && <p className="text-sm text-muted-foreground text-center py-8">Genere el reporte para el período seleccionado.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Nuevo Centro de Costo</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Código *</Label>
                <Input value={form.codigo} onChange={e => setForm({ ...form, codigo: e.target.value })} placeholder="100" />
              </div>
              <div>
                <Label>Nombre *</Label>
                <Input value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })} placeholder="Administración" />
              </div>
            </div>
            <div>
              <Label>Descripción</Label>
              <Input value={form.descripcion} onChange={e => setForm({ ...form, descripcion: e.target.value })} />
            </div>
            <div>
              <Label>Centro padre (opcional)</Label>
              <Select
                value={form.parentId || PARENT_NONE}
                onValueChange={(v) => setForm({ ...form, parentId: v })}
              >
                <SelectTrigger><SelectValue placeholder="Ninguno (raíz)" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={PARENT_NONE}>Ninguno (raíz)</SelectItem>
                  {centros.map(cc => (
                    <SelectItem key={cc.id} value={String(cc.id)}>{cc.codigo} — {cc.nombre}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
              <Button onClick={crear}>Crear Centro</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </PageShell>
  )
}
