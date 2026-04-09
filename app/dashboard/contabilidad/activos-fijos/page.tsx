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
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import { Progress } from "@/components/ui/progress"
import {
  Plus, Building2, Car, Monitor, Wrench, Home, Lightbulb,
  TrendingDown, Calendar, Ban, BarChart3,
} from "lucide-react"

interface ActivoFijo {
  id: number
  descripcion: string
  categoria: string
  fechaCompra: string
  valorCompra: number
  valorResidual: number
  vidaUtilMeses: number
  valorLibros: number
  estado: string
  identificador?: string
  observaciones?: string
  cuentaActivoCodigo?: string
  cuentaAmortizacionCodigo?: string
  // Calculated fields
  mesesTranscurridos?: number
  amortizacionAcumulada?: number
}

const CATEGORIAS = [
  { value: "vehiculo", label: "Vehículo", icon: Car },
  { value: "mueble_utensilio", label: "Mueble/Utensilio", icon: Building2 },
  { value: "maquinaria", label: "Maquinaria", icon: Wrench },
  { value: "inmueble", label: "Inmueble", icon: Home },
  { value: "hardware", label: "Hardware", icon: Monitor },
  { value: "intangible", label: "Intangible", icon: Lightbulb },
]

const ESTADO_COLOR: Record<string, string> = {
  activo: "bg-green-600",
  totalmente_amortizado: "bg-orange-500",
  dado_de_baja: "bg-red-500",
}

export default function ActivosFijosPage() {
  const [activos, setActivos] = useState<ActivoFijo[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [filtroCategoria, setFiltroCategoria] = useState("todas")
  const [filtroEstado, setFiltroEstado] = useState("todos")

  // Create dialog
  const [dialogOpen, setDialogOpen] = useState(false)
  const [form, setForm] = useState({
    descripcion: "", categoria: "mueble_utensilio", fechaCompra: "",
    valorCompra: "", valorResidual: "0", vidaUtilMeses: "60",
    identificador: "", observaciones: "",
  })

  // Depreciation dialog
  const [depDialogOpen, setDepDialogOpen] = useState(false)
  const [depMes, setDepMes] = useState(String(new Date().getMonth() + 1))
  const [depAnio, setDepAnio] = useState(String(new Date().getFullYear()))
  const [depResultado, setDepResultado] = useState<any>(null)

  // Cuadro dialog
  const [cuadroOpen, setCuadroOpen] = useState(false)
  const [cuadroData, setCuadroData] = useState<any>(null)

  // Baja
  const [bajaMotivo, setBajaMotivo] = useState("")

  useEffect(() => { cargar() }, [filtroCategoria, filtroEstado])

  async function cargar() {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filtroCategoria !== "todas") params.set("categoria", filtroCategoria)
      if (filtroEstado !== "todos") params.set("estado", filtroEstado)
      const res = await fetch(`/api/contabilidad/activos-fijos?${params}`)
      setActivos(await res.json())
    } catch { setError("Error al cargar activos") }
    setLoading(false)
  }

  async function crearActivo() {
    setError("")
    if (!form.descripcion || !form.fechaCompra || !form.valorCompra) {
      setError("Complete los campos obligatorios")
      return
    }
    try {
      const res = await fetch("/api/contabilidad/activos-fijos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          descripcion: form.descripcion,
          categoria: form.categoria,
          fechaCompra: form.fechaCompra,
          valorCompra: parseFloat(form.valorCompra),
          valorResidual: parseFloat(form.valorResidual) || 0,
          vidaUtilMeses: parseInt(form.vidaUtilMeses) || 60,
          identificador: form.identificador || undefined,
          observaciones: form.observaciones || undefined,
        }),
      })
      if (!res.ok) throw new Error((await res.json()).error)
      setSuccess("Activo fijo registrado")
      setDialogOpen(false)
      setForm({ descripcion: "", categoria: "mueble_utensilio", fechaCompra: "", valorCompra: "", valorResidual: "0", vidaUtilMeses: "60", identificador: "", observaciones: "" })
      cargar()
    } catch (e: any) { setError(e.message) }
  }

  async function correrDepreciacion() {
    setError("")
    try {
      const res = await fetch("/api/contabilidad/activos-fijos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "depreciar", mes: parseInt(depMes), anio: parseInt(depAnio) }),
      })
      if (!res.ok) throw new Error((await res.json()).error)
      const data = await res.json()
      setDepResultado(data)
      setSuccess(`Depreciación ${depMes}/${depAnio}: ${data.activosProcesados} activos, $${data.totalDepreciacion.toLocaleString("es-AR", { minimumFractionDigits: 2 })}`)
      cargar()
    } catch (e: any) { setError(e.message) }
  }

  async function verCuadro(activoId: number) {
    try {
      const res = await fetch("/api/contabilidad/activos-fijos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "cuadro", activoId }),
      })
      if (!res.ok) throw new Error((await res.json()).error)
      setCuadroData(await res.json())
      setCuadroOpen(true)
    } catch (e: any) { setError(e.message) }
  }

  async function darDeBaja(activoId: number) {
    try {
      const res = await fetch("/api/contabilidad/activos-fijos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "baja", activoId, motivo: bajaMotivo || undefined }),
      })
      if (!res.ok) throw new Error((await res.json()).error)
      setSuccess("Activo dado de baja")
      setBajaMotivo("")
      cargar()
    } catch (e: any) { setError(e.message) }
  }

  // Summary
  const totalValorCompra = activos.reduce((s, a) => s + Number(a.valorCompra), 0)
  const totalValorLibros = activos.reduce((s, a) => s + Number(a.valorLibros), 0)
  const totalAmortAcum = activos.reduce((s, a) => s + (Number(a.amortizacionAcumulada) || 0), 0)
  const activosActivos = activos.filter(a => a.estado === "activo").length

  const fmt = (n: number) => n.toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Activos Fijos</h1>
          <p className="text-muted-foreground">Bienes de uso, depreciación y amortización</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setDepDialogOpen(true)}>
            <TrendingDown className="mr-2 h-4 w-4" /> Correr Depreciación
          </Button>
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> Nuevo Activo
          </Button>
        </div>
      </div>

      {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}
      {success && <Alert><AlertDescription className="text-green-600">{success}</AlertDescription></Alert>}

      {/* Summary cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">Valor Original Total</p>
            <p className="text-2xl font-bold">${fmt(totalValorCompra)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">Valor en Libros</p>
            <p className="text-2xl font-bold">${fmt(totalValorLibros)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">Amortización Acumulada</p>
            <p className="text-2xl font-bold text-orange-600">${fmt(totalAmortAcum)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">Activos en Uso</p>
            <p className="text-2xl font-bold">{activosActivos} / {activos.length}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <Select value={filtroCategoria} onValueChange={setFiltroCategoria}>
          <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todas">Todas las categorías</SelectItem>
            {CATEGORIAS.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filtroEstado} onValueChange={setFiltroEstado}>
          <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos los estados</SelectItem>
            <SelectItem value="activo">Activo</SelectItem>
            <SelectItem value="totalmente_amortizado">Totalmente amortizado</SelectItem>
            <SelectItem value="dado_de_baja">Dado de baja</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Descripción</TableHead>
                <TableHead>Categoría</TableHead>
                <TableHead>F. Compra</TableHead>
                <TableHead className="text-right">V. Original</TableHead>
                <TableHead className="text-right">V. Libros</TableHead>
                <TableHead>% Amort.</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={8} className="text-center py-8">Cargando...</TableCell></TableRow>
              ) : activos.length === 0 ? (
                <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">Sin activos fijos registrados</TableCell></TableRow>
              ) : activos.map(a => {
                const pctAmort = Number(a.valorCompra) > 0
                  ? ((Number(a.amortizacionAcumulada) || 0) / (Number(a.valorCompra) - Number(a.valorResidual))) * 100
                  : 0
                const catInfo = CATEGORIAS.find(c => c.value === a.categoria)
                const CatIcon = catInfo?.icon ?? Building2

                return (
                  <TableRow key={a.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <CatIcon className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <div className="font-medium">{a.descripcion}</div>
                          {a.identificador && <div className="text-xs text-muted-foreground">{a.identificador}</div>}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="capitalize">{catInfo?.label ?? a.categoria}</TableCell>
                    <TableCell>{new Date(a.fechaCompra).toLocaleDateString("es-AR")}</TableCell>
                    <TableCell className="text-right">${fmt(Number(a.valorCompra))}</TableCell>
                    <TableCell className="text-right font-medium">${fmt(Number(a.valorLibros))}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Progress value={Math.min(100, pctAmort)} className="h-2 w-16" />
                        <span className="text-xs">{Math.round(pctAmort)}%</span>
                      </div>
                    </TableCell>
                    <TableCell><Badge className={ESTADO_COLOR[a.estado]}>{a.estado.replace("_", " ")}</Badge></TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button size="sm" variant="ghost" onClick={() => verCuadro(a.id)} title="Cuadro de amortización">
                          <BarChart3 className="h-3 w-3" />
                        </Button>
                        {a.estado === "activo" && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button size="sm" variant="ghost" className="text-red-600" title="Dar de baja">
                                <Ban className="h-3 w-3" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Dar de baja: {a.descripcion}</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Valor en libros actual: ${fmt(Number(a.valorLibros))}. Esta acción no se puede deshacer.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <Textarea placeholder="Motivo de baja (opcional)" value={bajaMotivo} onChange={e => setBajaMotivo(e.target.value)} />
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction onClick={() => darDeBaja(a.id)}>Dar de Baja</AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Create dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Nuevo Activo Fijo</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Descripción *</Label>
              <Input value={form.descripcion} onChange={e => setForm({ ...form, descripcion: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Categoría</Label>
                <Select value={form.categoria} onValueChange={v => setForm({ ...form, categoria: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CATEGORIAS.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Fecha de compra *</Label>
                <Input type="date" value={form.fechaCompra} onChange={e => setForm({ ...form, fechaCompra: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Valor compra *</Label>
                <Input type="number" min="0" step="0.01" value={form.valorCompra} onChange={e => setForm({ ...form, valorCompra: e.target.value })} />
              </div>
              <div>
                <Label>Valor residual</Label>
                <Input type="number" min="0" step="0.01" value={form.valorResidual} onChange={e => setForm({ ...form, valorResidual: e.target.value })} />
              </div>
              <div>
                <Label>Vida útil (meses)</Label>
                <Input type="number" min="1" value={form.vidaUtilMeses} onChange={e => setForm({ ...form, vidaUtilMeses: e.target.value })} />
              </div>
            </div>
            <div>
              <Label>Identificador (serie, patente, etc.)</Label>
              <Input value={form.identificador} onChange={e => setForm({ ...form, identificador: e.target.value })} />
            </div>
            <div>
              <Label>Observaciones</Label>
              <Textarea value={form.observaciones} onChange={e => setForm({ ...form, observaciones: e.target.value })} rows={2} />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
              <Button onClick={crearActivo}>Registrar Activo</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Depreciation dialog */}
      <Dialog open={depDialogOpen} onOpenChange={v => { setDepDialogOpen(v); if (!v) setDepResultado(null) }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Correr Depreciación Mensual</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Ejecuta la depreciación lineal de todos los activos activos para el período seleccionado.
              Genera asientos contables automáticamente.
            </p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Mes</Label>
                <Select value={depMes} onValueChange={setDepMes}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
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
                <Input type="number" value={depAnio} onChange={e => setDepAnio(e.target.value)} />
              </div>
            </div>

            {depResultado && (
              <Card>
                <CardContent className="pt-4 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Activos procesados:</span>
                    <span className="font-medium">{depResultado.activosProcesados}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Total depreciación:</span>
                    <span className="font-bold">${fmt(depResultado.totalDepreciacion)}</span>
                  </div>
                  {depResultado.detalle?.length > 0 && (
                    <>
                      <Separator />
                      {depResultado.detalle.map((d: any) => (
                        <div key={d.activoId} className="flex justify-between text-xs">
                          <span>{d.descripcion}</span>
                          <span>${fmt(d.monto)}</span>
                        </div>
                      ))}
                    </>
                  )}
                </CardContent>
              </Card>
            )}

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setDepDialogOpen(false)}>Cerrar</Button>
              <Button onClick={correrDepreciacion}>
                <Calendar className="mr-2 h-4 w-4" /> Ejecutar Depreciación
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Cuadro amortización dialog */}
      <Dialog open={cuadroOpen} onOpenChange={setCuadroOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Cuadro de Amortización — {cuadroData?.activo?.descripcion}</DialogTitle>
          </DialogHeader>
          {cuadroData && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div><span className="text-muted-foreground">Valor compra:</span> ${fmt(Number(cuadroData.activo.valorCompra))}</div>
                <div><span className="text-muted-foreground">Valor residual:</span> ${fmt(Number(cuadroData.activo.valorResidual))}</div>
                <div><span className="text-muted-foreground">Vida útil:</span> {cuadroData.activo.vidaUtilMeses} meses</div>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Mes</TableHead>
                    <TableHead>Período</TableHead>
                    <TableHead className="text-right">Depreciación</TableHead>
                    <TableHead className="text-right">Acumulada</TableHead>
                    <TableHead className="text-right">Valor Libros</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cuadroData.cuadro.slice(0, 120).map((r: any) => (
                    <TableRow key={r.mes}>
                      <TableCell>{r.mes}</TableCell>
                      <TableCell className="font-mono text-xs">{r.fecha}</TableCell>
                      <TableCell className="text-right">${fmt(r.depreciacion)}</TableCell>
                      <TableCell className="text-right">${fmt(r.acumulada)}</TableCell>
                      <TableCell className="text-right font-medium">${fmt(r.valorLibros)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
