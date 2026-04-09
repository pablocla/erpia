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
  Plus, FolderTree, BarChart3, ChevronRight, ChevronDown,
} from "lucide-react"

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
  const [form, setForm] = useState({ codigo: "", nombre: "", descripcion: "", parentId: "" })

  // Report
  const [repMes, setRepMes] = useState(String(new Date().getMonth() + 1))
  const [repAnio, setRepAnio] = useState(String(new Date().getFullYear()))
  const [reporte, setReporte] = useState<ReporteItem[]>([])
  const [loadingRep, setLoadingRep] = useState(false)

  // Expanded nodes
  const [expanded, setExpanded] = useState<Set<number>>(new Set())

  useEffect(() => { cargar() }, [])

  async function cargar() {
    setLoading(true)
    try {
      const [flatRes, treeRes] = await Promise.all([
        fetch("/api/contabilidad/centros-costo"),
        fetch("/api/contabilidad/centros-costo?vista=jerarquia"),
      ])
      setCentros(await flatRes.json())
      setArbol(await treeRes.json())
    } catch { setError("Error al cargar") }
    setLoading(false)
  }

  async function crear() {
    setError("")
    if (!form.codigo || !form.nombre) { setError("Código y nombre requeridos"); return }
    try {
      const res = await fetch("/api/contabilidad/centros-costo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          codigo: form.codigo,
          nombre: form.nombre,
          descripcion: form.descripcion || undefined,
          parentId: form.parentId ? parseInt(form.parentId) : undefined,
        }),
      })
      if (!res.ok) throw new Error((await res.json()).error)
      setSuccess("Centro de costos creado")
      setDialogOpen(false)
      setForm({ codigo: "", nombre: "", descripcion: "", parentId: "" })
      cargar()
    } catch (e: any) { setError(e.message) }
  }

  async function cargarReporte() {
    setLoadingRep(true)
    try {
      const res = await fetch("/api/contabilidad/centros-costo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reporte", mes: parseInt(repMes), anio: parseInt(repAnio) }),
      })
      if (!res.ok) throw new Error((await res.json()).error)
      setReporte(await res.json())
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
    return nodes.map(node => {
      const hasChildren = (node.hijos?.length ?? 0) > 0
      const isExpanded = expanded.has(node.id)

      return (
        <div key={node.id}>
          <div
            className="flex items-center gap-2 py-2 px-2 hover:bg-muted/50 rounded cursor-pointer"
            style={{ paddingLeft: `${depth * 24 + 8}px` }}
            onClick={() => hasChildren && toggleExpanded(node.id)}
          >
            {hasChildren ? (
              isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />
            ) : (
              <div className="w-4" />
            )}
            <span className="font-mono text-sm text-muted-foreground">{node.codigo}</span>
            <span className="font-medium">{node.nombre}</span>
            {node._count && node._count.movimientos > 0 && (
              <Badge variant="secondary" className="ml-auto text-xs">{node._count.movimientos} mov.</Badge>
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Centros de Costo</h1>
          <p className="text-muted-foreground">Estructura jerárquica y distribución de gastos</p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> Nuevo Centro
        </Button>
      </div>

      {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}
      {success && <Alert><AlertDescription className="text-green-600">{success}</AlertDescription></Alert>}

      <Tabs defaultValue="jerarquia">
        <TabsList>
          <TabsTrigger value="jerarquia"><FolderTree className="mr-2 h-4 w-4" /> Jerarquía</TabsTrigger>
          <TabsTrigger value="reporte"><BarChart3 className="mr-2 h-4 w-4" /> Reporte por Período</TabsTrigger>
        </TabsList>

        <TabsContent value="jerarquia">
          <Card>
            <CardHeader>
              <CardTitle>Estructura de Centros de Costo</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p className="text-muted-foreground text-center py-8">Cargando...</p>
              ) : arbol.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  Sin centros de costo. Cree el primer centro para comenzar.
                </p>
              ) : (
                <div className="border rounded-lg p-2">
                  {renderTree(arbol)}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Flat list */}
          <Card>
            <CardHeader><CardTitle>Lista Completa</CardTitle></CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Código</TableHead>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Centro Padre</TableHead>
                    <TableHead className="text-right">Movimientos</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {centros.map(cc => (
                    <TableRow key={cc.id}>
                      <TableCell className="font-mono">{cc.codigo}</TableCell>
                      <TableCell className="font-medium">{cc.nombre}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {cc.parent ? `${cc.parent.codigo} — ${cc.parent.nombre}` : "—"}
                      </TableCell>
                      <TableCell className="text-right">{cc._count?.movimientos ?? 0}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reporte" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Reporte por Período</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-4 items-end">
                <div>
                  <Label>Mes</Label>
                  <Select value={repMes} onValueChange={setRepMes}>
                    <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 12 }, (_, i) => (
                        <SelectItem key={i + 1} value={String(i + 1)}>
                          {new Date(2000, i).toLocaleString("es-AR", { month: "long" })}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Año</Label>
                  <Input type="number" className="w-28" value={repAnio} onChange={e => setRepAnio(e.target.value)} />
                </div>
                <Button onClick={cargarReporte} disabled={loadingRep}>
                  <BarChart3 className="mr-2 h-4 w-4" /> {loadingRep ? "Generando..." : "Generar Reporte"}
                </Button>
              </div>

              {reporte.length > 0 && (
                <Table>
                  <TableHeader>
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
                      <TableRow key={r.id}>
                        <TableCell className="font-mono">{r.codigo}</TableCell>
                        <TableCell className="font-medium">{r.nombre}</TableCell>
                        <TableCell className="text-right">${fmt(r.totalDebe)}</TableCell>
                        <TableCell className="text-right">${fmt(r.totalHaber)}</TableCell>
                        <TableCell className="text-right font-bold">
                          <span className={r.saldo >= 0 ? "text-blue-600" : "text-red-600"}>
                            ${fmt(r.saldo)}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">{r.movimientos}</TableCell>
                      </TableRow>
                    ))}
                    <TableRow className="font-bold border-t-2">
                      <TableCell colSpan={2}>TOTAL</TableCell>
                      <TableCell className="text-right">${fmt(totalReporteDebe)}</TableCell>
                      <TableCell className="text-right">${fmt(totalReporteHaber)}</TableCell>
                      <TableCell className="text-right">${fmt(totalReporteDebe - totalReporteHaber)}</TableCell>
                      <TableCell />
                    </TableRow>
                  </TableBody>
                </Table>
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
              <Select value={form.parentId} onValueChange={v => setForm({ ...form, parentId: v })}>
                <SelectTrigger><SelectValue placeholder="Ninguno (raíz)" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Ninguno (raíz)</SelectItem>
                  {centros.map(cc => (
                    <SelectItem key={cc.id} value={String(cc.id)}>{cc.codigo} — {cc.nombre}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
              <Button onClick={crear}>Crear Centro</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
