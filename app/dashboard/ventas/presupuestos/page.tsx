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
import {
  Plus, Send, CheckCircle2, XCircle, Copy, FileText,
  ArrowRightCircle, Trash2, Filter,
} from "lucide-react"

interface Cliente { id: number; nombre: string; cuit?: string }
interface Linea {
  productoId?: number
  descripcion: string
  cantidad: number
  precioUnitario: number
  descuentoPct: number
}
interface Presupuesto {
  id: number
  numero: string
  fechaEmision: string
  fechaVencimiento?: string
  estado: string
  subtotal: number
  descuentoPct: number
  impuestos: number
  total: number
  observaciones?: string
  cliente: Cliente
  lineas: (Linea & { id: number; subtotal: number })[]
}

const ESTADOS_COLOR: Record<string, string> = {
  borrador: "bg-gray-500",
  enviado: "bg-blue-500",
  aceptado: "bg-green-600",
  rechazado: "bg-red-500",
  vencido: "bg-orange-500",
  facturado: "bg-purple-600",
}

export default function PresupuestosPage() {
  const [presupuestos, setPresupuestos] = useState<Presupuesto[]>([])
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [filtroEstado, setFiltroEstado] = useState("todos")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  // New presupuesto dialog
  const [dialogOpen, setDialogOpen] = useState(false)
  const [clienteId, setClienteId] = useState("")
  const [fechaVenc, setFechaVenc] = useState("")
  const [descGlobal, setDescGlobal] = useState("0")
  const [observaciones, setObservaciones] = useState("")
  const [lineas, setLineas] = useState<Linea[]>([
    { descripcion: "", cantidad: 1, precioUnitario: 0, descuentoPct: 0 },
  ])

  // Detail view
  const [detalle, setDetalle] = useState<Presupuesto | null>(null)

  useEffect(() => {
    cargar()
    fetch("/api/clientes").then(r => r.json()).then(d => setClientes(d.data ?? d)).catch(() => {})
  }, [filtroEstado])

  async function cargar() {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filtroEstado !== "todos") params.set("estado", filtroEstado)
      const res = await fetch(`/api/ventas/presupuestos?${params}`)
      const json = await res.json()
      setPresupuestos(json.data ?? [])
    } catch { setError("Error al cargar presupuestos") }
    setLoading(false)
  }

  function agregarLinea() {
    setLineas([...lineas, { descripcion: "", cantidad: 1, precioUnitario: 0, descuentoPct: 0 }])
  }

  function actualizarLinea(i: number, campo: keyof Linea, valor: any) {
    const nuevas = [...lineas]
    ;(nuevas[i] as any)[campo] = valor
    setLineas(nuevas)
  }

  function eliminarLinea(i: number) {
    if (lineas.length <= 1) return
    setLineas(lineas.filter((_, idx) => idx !== i))
  }

  const subtotalCalc = lineas.reduce((s, l) => s + l.cantidad * l.precioUnitario * (1 - l.descuentoPct / 100), 0)
  const subtotalConDesc = subtotalCalc * (1 - Number(descGlobal) / 100)
  const ivaCalc = subtotalConDesc * 0.21
  const totalCalc = subtotalConDesc + ivaCalc

  async function crearPresupuesto() {
    setError("")
    if (!clienteId) { setError("Seleccione un cliente"); return }
    if (lineas.some(l => !l.descripcion || l.precioUnitario <= 0)) {
      setError("Complete todas las líneas con descripción y precio")
      return
    }

    try {
      const res = await fetch("/api/ventas/presupuestos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clienteId: parseInt(clienteId),
          fechaVencimiento: fechaVenc || undefined,
          descuentoPct: Number(descGlobal),
          observaciones: observaciones || undefined,
          lineas: lineas.map(l => ({
            descripcion: l.descripcion,
            cantidad: l.cantidad,
            precioUnitario: l.precioUnitario,
            descuentoPct: l.descuentoPct,
          })),
        }),
      })
      if (!res.ok) throw new Error((await res.json()).error)
      setSuccess("Presupuesto creado exitosamente")
      setDialogOpen(false)
      resetForm()
      cargar()
    } catch (e: any) { setError(e.message) }
  }

  function resetForm() {
    setClienteId("")
    setFechaVenc("")
    setDescGlobal("0")
    setObservaciones("")
    setLineas([{ descripcion: "", cantidad: 1, precioUnitario: 0, descuentoPct: 0 }])
  }

  async function ejecutarAccion(action: string, presupuestoId: number) {
    setError("")
    try {
      const res = await fetch("/api/ventas/presupuestos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, presupuestoId }),
      })
      if (!res.ok) throw new Error((await res.json()).error)
      const msg = action === "convertir"
        ? "Presupuesto convertido a Pedido de Venta"
        : action === "duplicar"
          ? "Presupuesto duplicado"
          : `Presupuesto ${action === "enviar" ? "enviado" : action === "aceptar" ? "aceptado" : "rechazado"}`
      setSuccess(msg)
      if (detalle?.id === presupuestoId) setDetalle(null)
      cargar()
    } catch (e: any) { setError(e.message) }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Presupuestos</h1>
          <p className="text-muted-foreground">Gestión de presupuestos y conversión a pedidos de venta</p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> Nuevo Presupuesto
        </Button>
      </div>

      {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}
      {success && <Alert><AlertDescription className="text-green-600">{success}</AlertDescription></Alert>}

      {/* Summary cards */}
      <div className="grid gap-4 md:grid-cols-5">
        {(["borrador", "enviado", "aceptado", "rechazado", "facturado"] as const).map(est => {
          const count = presupuestos.filter(p => p.estado === est).length
          const monto = presupuestos.filter(p => p.estado === est).reduce((s, p) => s + Number(p.total), 0)
          return (
            <Card key={est} className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => setFiltroEstado(filtroEstado === est ? "todos" : est)}>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium capitalize">{est}</p>
                  <Badge className={ESTADOS_COLOR[est]}>{count}</Badge>
                </div>
                <p className="text-xl font-bold mt-1">${monto.toLocaleString("es-AR", { minimumFractionDigits: 2 })}</p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Filter bar */}
      <div className="flex items-center gap-4">
        <Filter className="h-4 w-4 text-muted-foreground" />
        <Select value={filtroEstado} onValueChange={setFiltroEstado}>
          <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos los estados</SelectItem>
            <SelectItem value="borrador">Borrador</SelectItem>
            <SelectItem value="enviado">Enviado</SelectItem>
            <SelectItem value="aceptado">Aceptado</SelectItem>
            <SelectItem value="rechazado">Rechazado</SelectItem>
            <SelectItem value="facturado">Facturado</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Número</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead>Vencimiento</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={7} className="text-center py-8">Cargando...</TableCell></TableRow>
              ) : presupuestos.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Sin presupuestos</TableCell></TableRow>
              ) : presupuestos.map(p => (
                <TableRow key={p.id} className="cursor-pointer" onClick={() => setDetalle(p)}>
                  <TableCell className="font-mono">{p.numero}</TableCell>
                  <TableCell>{p.cliente?.nombre ?? "—"}</TableCell>
                  <TableCell>{new Date(p.fechaEmision).toLocaleDateString("es-AR")}</TableCell>
                  <TableCell>{p.fechaVencimiento ? new Date(p.fechaVencimiento).toLocaleDateString("es-AR") : "—"}</TableCell>
                  <TableCell className="text-right font-medium">
                    ${Number(p.total).toLocaleString("es-AR", { minimumFractionDigits: 2 })}
                  </TableCell>
                  <TableCell><Badge className={ESTADOS_COLOR[p.estado]}>{p.estado}</Badge></TableCell>
                  <TableCell onClick={e => e.stopPropagation()}>
                    <div className="flex gap-1">
                      {p.estado === "borrador" && (
                        <Button size="sm" variant="outline" onClick={() => ejecutarAccion("enviar", p.id)}>
                          <Send className="h-3 w-3 mr-1" /> Enviar
                        </Button>
                      )}
                      {(p.estado === "enviado" || p.estado === "borrador") && (
                        <>
                          <Button size="sm" variant="outline" className="text-green-600" onClick={() => ejecutarAccion("aceptar", p.id)}>
                            <CheckCircle2 className="h-3 w-3 mr-1" /> Aceptar
                          </Button>
                          <Button size="sm" variant="outline" className="text-red-600" onClick={() => ejecutarAccion("rechazar", p.id)}>
                            <XCircle className="h-3 w-3 mr-1" /> Rechazar
                          </Button>
                        </>
                      )}
                      {p.estado === "aceptado" && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button size="sm" variant="default">
                              <ArrowRightCircle className="h-3 w-3 mr-1" /> Convertir a Pedido
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Convertir presupuesto {p.numero}</AlertDialogTitle>
                              <AlertDialogDescription>
                                Se creará un Pedido de Venta con las mismas líneas y condiciones.
                                El presupuesto pasará a estado &quot;facturado&quot;.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction onClick={() => ejecutarAccion("convertir", p.id)}>
                                Convertir
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
                      <Button size="sm" variant="ghost" onClick={() => ejecutarAccion("duplicar", p.id)}>
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Detail side panel */}
      {detalle && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              {detalle.numero}
              <Badge className={ESTADOS_COLOR[detalle.estado]}>{detalle.estado}</Badge>
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={() => setDetalle(null)}>✕</Button>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div><span className="text-muted-foreground">Cliente:</span><br />{detalle.cliente?.nombre}</div>
              <div><span className="text-muted-foreground">Fecha:</span><br />{new Date(detalle.fechaEmision).toLocaleDateString("es-AR")}</div>
              <div><span className="text-muted-foreground">Vencimiento:</span><br />{detalle.fechaVencimiento ? new Date(detalle.fechaVencimiento).toLocaleDateString("es-AR") : "—"}</div>
              <div><span className="text-muted-foreground">Descuento global:</span><br />{Number(detalle.descuentoPct)}%</div>
            </div>
            {detalle.observaciones && (
              <p className="text-sm text-muted-foreground italic">{detalle.observaciones}</p>
            )}
            <Separator />
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Descripción</TableHead>
                  <TableHead className="text-right">Cant.</TableHead>
                  <TableHead className="text-right">Precio Unit.</TableHead>
                  <TableHead className="text-right">Desc.%</TableHead>
                  <TableHead className="text-right">Subtotal</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {detalle.lineas.map(l => (
                  <TableRow key={l.id}>
                    <TableCell>{l.descripcion}</TableCell>
                    <TableCell className="text-right">{Number(l.cantidad)}</TableCell>
                    <TableCell className="text-right">${Number(l.precioUnitario).toLocaleString("es-AR", { minimumFractionDigits: 2 })}</TableCell>
                    <TableCell className="text-right">{Number(l.descuentoPct)}%</TableCell>
                    <TableCell className="text-right font-medium">${Number(l.subtotal).toLocaleString("es-AR", { minimumFractionDigits: 2 })}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <Separator />
            <div className="flex justify-end">
              <div className="text-right space-y-1 text-sm">
                <div>Subtotal: ${Number(detalle.subtotal).toLocaleString("es-AR", { minimumFractionDigits: 2 })}</div>
                {Number(detalle.descuentoPct) > 0 && <div>Descuento: {Number(detalle.descuentoPct)}%</div>}
                <div>IVA 21%: ${Number(detalle.impuestos).toLocaleString("es-AR", { minimumFractionDigits: 2 })}</div>
                <div className="text-lg font-bold">Total: ${Number(detalle.total).toLocaleString("es-AR", { minimumFractionDigits: 2 })}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Create dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nuevo Presupuesto</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Cliente *</Label>
                <Select value={clienteId} onValueChange={setClienteId}>
                  <SelectTrigger><SelectValue placeholder="Seleccionar cliente" /></SelectTrigger>
                  <SelectContent>
                    {clientes.map(c => (
                      <SelectItem key={c.id} value={String(c.id)}>{c.nombre}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Fecha vencimiento</Label>
                <Input type="date" value={fechaVenc} onChange={e => setFechaVenc(e.target.value)} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Descuento global %</Label>
                <Input type="number" min="0" max="100" value={descGlobal} onChange={e => setDescGlobal(e.target.value)} />
              </div>
              <div>
                <Label>Observaciones</Label>
                <Textarea value={observaciones} onChange={e => setObservaciones(e.target.value)} rows={2} />
              </div>
            </div>

            <Separator />
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Líneas</h3>
              <Button size="sm" variant="outline" onClick={agregarLinea}>
                <Plus className="h-3 w-3 mr-1" /> Agregar línea
              </Button>
            </div>

            {lineas.map((l, i) => (
              <div key={i} className="grid grid-cols-12 gap-2 items-end">
                <div className="col-span-4">
                  {i === 0 && <Label>Descripción</Label>}
                  <Input value={l.descripcion} onChange={e => actualizarLinea(i, "descripcion", e.target.value)} placeholder="Producto o servicio" />
                </div>
                <div className="col-span-2">
                  {i === 0 && <Label>Cantidad</Label>}
                  <Input type="number" min="0.01" step="0.01" value={l.cantidad} onChange={e => actualizarLinea(i, "cantidad", parseFloat(e.target.value) || 0)} />
                </div>
                <div className="col-span-2">
                  {i === 0 && <Label>Precio Unit.</Label>}
                  <Input type="number" min="0" step="0.01" value={l.precioUnitario} onChange={e => actualizarLinea(i, "precioUnitario", parseFloat(e.target.value) || 0)} />
                </div>
                <div className="col-span-2">
                  {i === 0 && <Label>Desc. %</Label>}
                  <Input type="number" min="0" max="100" value={l.descuentoPct} onChange={e => actualizarLinea(i, "descuentoPct", parseFloat(e.target.value) || 0)} />
                </div>
                <div className="col-span-1 text-right text-sm font-medium pt-1">
                  ${(l.cantidad * l.precioUnitario * (1 - l.descuentoPct / 100)).toLocaleString("es-AR", { minimumFractionDigits: 2 })}
                </div>
                <div className="col-span-1">
                  <Button size="sm" variant="ghost" onClick={() => eliminarLinea(i)} disabled={lineas.length <= 1}>
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}

            <Separator />
            <div className="flex justify-between items-end">
              <div />
              <div className="text-right space-y-1 text-sm">
                <div>Subtotal: ${subtotalCalc.toLocaleString("es-AR", { minimumFractionDigits: 2 })}</div>
                {Number(descGlobal) > 0 && <div>Desc. global {descGlobal}%: -${(subtotalCalc - subtotalConDesc).toLocaleString("es-AR", { minimumFractionDigits: 2 })}</div>}
                <div>IVA 21%: ${ivaCalc.toLocaleString("es-AR", { minimumFractionDigits: 2 })}</div>
                <div className="text-lg font-bold">Total: ${totalCalc.toLocaleString("es-AR", { minimumFractionDigits: 2 })}</div>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
              <Button onClick={crearPresupuesto}>Crear Presupuesto</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
