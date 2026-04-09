"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useToast } from "@/hooks/use-toast"
import {
  Plus, Trash2, ShoppingCart, FileCheck, PackageCheck,
  CheckCircle2, XCircle, AlertTriangle, Loader2, Eye,
} from "lucide-react"

interface Proveedor {
  id: number
  nombre?: string
  razonSocial?: string
  cuit?: string
}

interface LineaOC {
  id: number
  descripcion: string
  cantidad: number
  precioUnitario: number
  subtotal: number
  cantidadRecibida: number
  productoId?: number
}

interface OrdenCompra {
  id: number
  numero: string
  estado: string
  fechaEmision: string
  subtotal: number
  impuestos: number
  total: number
  proveedor: Proveedor
  lineas: LineaOC[]
  _count: { recepciones: number; compras: number }
}

const ESTADO_OC: Record<string, { label: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
  borrador: { label: "Borrador", variant: "secondary" },
  aprobada: { label: "Aprobada", variant: "default" },
  enviada: { label: "Enviada", variant: "outline" },
  parcial: { label: "Parcial", variant: "outline" },
  recibida: { label: "Recibida", variant: "default" },
  facturada: { label: "Facturada", variant: "default" },
  anulada: { label: "Anulada", variant: "destructive" },
}

export default function ComprasPage() {
  const [tab, setTab] = useState("ordenes")
  const [proveedores, setProveedores] = useState<Proveedor[]>([])
  const [ordenes, setOrdenes] = useState<OrdenCompra[]>([])
  const [totalOC, setTotalOC] = useState(0)
  const [loadingOC, setLoadingOC] = useState(false)
  const [crearOcOpen, setCrearOcOpen] = useState(false)
  const [recepcionOpen, setRecepcionOpen] = useState(false)
  const [ocSeleccionada, setOcSeleccionada] = useState<OrdenCompra | null>(null)
  const { toast } = useToast()

  // ── Crear OC form ──────────────────────────────────────────────────────
  const [ocForm, setOcForm] = useState({
    proveedorId: "",
    observaciones: "",
    fechaEntregaEst: "",
  })
  const [ocLineas, setOcLineas] = useState([{ descripcion: "", cantidad: 1, precioUnitario: 0 }])

  // ── Registrar Factura form ─────────────────────────────────────────────
  const [formData, setFormData] = useState({
    proveedorId: "",
    tipo: "A",
    puntoVenta: "",
    numero: "",
    fecha: new Date().toISOString().split("T")[0],
    ordenCompraId: "",
    caeProveedor: "",
  })
  const [items, setItems] = useState([{ descripcion: "", cantidad: 1, precioUnitario: 0, porcentajeIva: 21 }])
  const [guardando, setGuardando] = useState(false)

  const cargarProveedores = useCallback(async () => {
    try {
      const token = localStorage.getItem("token")
      const res = await fetch("/api/proveedores", { headers: { Authorization: `Bearer ${token}` } })
      const data = await res.json()
      setProveedores(Array.isArray(data) ? data : data.data ?? [])
    } catch { /* non-blocking */ }
  }, [])

  const cargarOrdenes = useCallback(async () => {
    setLoadingOC(true)
    try {
      const token = localStorage.getItem("token")
      const res = await fetch("/api/compras/ordenes", { headers: { Authorization: `Bearer ${token}` } })
      const data = await res.json()
      setOrdenes(data.data ?? [])
      setTotalOC(data.total ?? 0)
    } catch {
      toast({ variant: "destructive", title: "Error", description: "No se pudieron cargar las OC" })
    } finally {
      setLoadingOC(false)
    }
  }, [toast])

  useEffect(() => {
    cargarProveedores()
    cargarOrdenes()
  }, [cargarProveedores, cargarOrdenes])

  // ── OC CRUD ────────────────────────────────────────────────────────────
  const crearOrdenCompra = async () => {
    if (!ocForm.proveedorId || ocLineas.some((l) => !l.descripcion || l.cantidad <= 0)) {
      toast({ variant: "destructive", title: "Error", description: "Complete todos los campos" })
      return
    }
    setGuardando(true)
    try {
      const token = localStorage.getItem("token")
      const res = await fetch("/api/compras/ordenes", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          proveedorId: parseInt(ocForm.proveedorId),
          lineas: ocLineas,
          observaciones: ocForm.observaciones || undefined,
          fechaEntregaEst: ocForm.fechaEntregaEst || undefined,
        }),
      })
      if (!res.ok) throw new Error((await res.json()).error)
      toast({ title: "OC creada exitosamente" })
      setCrearOcOpen(false)
      setOcForm({ proveedorId: "", observaciones: "", fechaEntregaEst: "" })
      setOcLineas([{ descripcion: "", cantidad: 1, precioUnitario: 0 }])
      cargarOrdenes()
    } catch (err: any) {
      toast({ variant: "destructive", title: "Error", description: err.message })
    } finally {
      setGuardando(false)
    }
  }

  const aprobarOC = async (ocId: number) => {
    const token = localStorage.getItem("token")
    const res = await fetch("/api/compras/ordenes", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ action: "aprobar", ordenCompraId: ocId }),
    })
    if (res.ok) {
      toast({ title: "OC aprobada" })
      cargarOrdenes()
    }
  }

  // ── Recepción ──────────────────────────────────────────────────────────
  const [recepcionLineas, setRecepcionLineas] = useState<{ lineaOcId: number; cantidadRecibida: number; cantidadRechazada: number }[]>([])

  const abrirRecepcion = (oc: OrdenCompra) => {
    setOcSeleccionada(oc)
    setRecepcionLineas(
      oc.lineas.map((l) => ({
        lineaOcId: l.id,
        cantidadRecibida: Number(l.cantidad) - Number(l.cantidadRecibida),
        cantidadRechazada: 0,
      })),
    )
    setRecepcionOpen(true)
  }

  const registrarRecepcion = async () => {
    if (!ocSeleccionada) return
    setGuardando(true)
    try {
      const token = localStorage.getItem("token")
      const res = await fetch("/api/compras/recepciones", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          ordenCompraId: ocSeleccionada.id,
          lineas: recepcionLineas.filter((l) => l.cantidadRecibida > 0),
        }),
      })
      if (!res.ok) throw new Error((await res.json()).error)
      toast({ title: "Recepción registrada exitosamente" })
      setRecepcionOpen(false)
      cargarOrdenes()
    } catch (err: any) {
      toast({ variant: "destructive", title: "Error", description: err.message })
    } finally {
      setGuardando(false)
    }
  }

  // ── Registrar Factura Proveedor ────────────────────────────────────────
  const registrarCompra = async () => {
    if (!formData.proveedorId || !formData.puntoVenta || !formData.numero) {
      toast({ variant: "destructive", title: "Error", description: "Complete los datos del comprobante" })
      return
    }
    setGuardando(true)
    try {
      const token = localStorage.getItem("token")
      const res = await fetch("/api/compras", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          proveedorId: parseInt(formData.proveedorId),
          tipo: formData.tipo,
          puntoVenta: formData.puntoVenta,
          numero: formData.numero,
          fecha: formData.fecha,
          items: items.map((i) => ({ ...i, porcentajeIva: i.porcentajeIva })),
          ordenCompraId: formData.ordenCompraId ? parseInt(formData.ordenCompraId) : undefined,
          caeProveedor: formData.caeProveedor || undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        if (data.discrepancias) {
          toast({
            variant: "destructive",
            title: "3-Way Match fallido",
            description: data.discrepancias.join("; "),
          })
        } else {
          throw new Error(data.error)
        }
        return
      }
      toast({ title: "Compra registrada", description: `WSCDC: ${data.estadoVerificacionCAE ?? "no verificado"}` })
      setFormData({ proveedorId: "", tipo: "A", puntoVenta: "", numero: "", fecha: new Date().toISOString().split("T")[0], ordenCompraId: "", caeProveedor: "" })
      setItems([{ descripcion: "", cantidad: 1, precioUnitario: 0, porcentajeIva: 21 }])
    } catch (err: any) {
      toast({ variant: "destructive", title: "Error", description: err.message })
    } finally {
      setGuardando(false)
    }
  }

  const calcularTotal = () =>
    items.reduce((t, i) => t + i.cantidad * i.precioUnitario * (1 + i.porcentajeIva / 100), 0)

  const fmt = (n: number) => n.toLocaleString("es-AR", { style: "currency", currency: "ARS" })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <ShoppingCart className="h-6 w-6 text-primary" />
            Compras
          </h1>
          <p className="text-sm text-muted-foreground">
            Órdenes de compra, recepción de mercadería, factura de proveedor y 3-way matching.
          </p>
        </div>
        <Button onClick={() => setCrearOcOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nueva OC
        </Button>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="ordenes">Órdenes de Compra</TabsTrigger>
          <TabsTrigger value="factura">Registrar Factura</TabsTrigger>
        </TabsList>

        {/* ── Tab: Órdenes de Compra ──────────────────────────────────── */}
        <TabsContent value="ordenes" className="space-y-4">
          {loadingOC ? (
            <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin" /></div>
          ) : ordenes.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                <PackageCheck className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p>Sin órdenes de compra. Creá la primera para comenzar.</p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader className="p-4 pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Órdenes de Compra ({totalOC})</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>N° OC</TableHead>
                      <TableHead>Proveedor</TableHead>
                      <TableHead>Fecha</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Recepciones</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {ordenes.map((oc) => {
                      const est = ESTADO_OC[oc.estado] ?? { label: oc.estado, variant: "outline" as const }
                      return (
                        <TableRow key={oc.id}>
                          <TableCell className="font-mono text-sm">{oc.numero}</TableCell>
                          <TableCell>{oc.proveedor?.nombre ?? oc.proveedor?.cuit ?? "—"}</TableCell>
                          <TableCell className="text-sm">{new Date(oc.fechaEmision).toLocaleDateString("es-AR")}</TableCell>
                          <TableCell className="text-right font-medium">{fmt(Number(oc.total))}</TableCell>
                          <TableCell><Badge variant={est.variant}>{est.label}</Badge></TableCell>
                          <TableCell className="text-sm">{oc._count?.recepciones ?? 0}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex gap-1 justify-end">
                              {oc.estado === "borrador" && (
                                <Button size="sm" variant="ghost" className="h-7 text-xs gap-1" onClick={() => aprobarOC(oc.id)}>
                                  <CheckCircle2 className="h-3 w-3" /> Aprobar
                                </Button>
                              )}
                              {["aprobada", "enviada", "parcial"].includes(oc.estado) && (
                                <Button size="sm" variant="ghost" className="h-7 text-xs gap-1" onClick={() => abrirRecepcion(oc)}>
                                  <PackageCheck className="h-3 w-3" /> Recibir
                                </Button>
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
          )}
        </TabsContent>

        {/* ── Tab: Registrar Factura Proveedor ────────────────────────── */}
        <TabsContent value="factura" className="space-y-4">
          <Card>
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-base">Datos del Comprobante</CardTitle>
              <CardDescription className="text-xs">Factura de proveedor para libro IVA + 3-way matching</CardDescription>
            </CardHeader>
            <CardContent className="p-4 pt-2 space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <Label className="text-xs">Proveedor *</Label>
                  <Select value={formData.proveedorId} onValueChange={(v) => setFormData({ ...formData, proveedorId: v })}>
                    <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                    <SelectContent>
                      {proveedores.map((p) => (
                        <SelectItem key={p.id} value={p.id.toString()}>{p.razonSocial ?? p.nombre ?? p.cuit}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Tipo</Label>
                  <Select value={formData.tipo} onValueChange={(v) => setFormData({ ...formData, tipo: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="A">Factura A</SelectItem>
                      <SelectItem value="B">Factura B</SelectItem>
                      <SelectItem value="C">Factura C</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Fecha *</Label>
                  <Input type="date" value={formData.fecha} onChange={(e) => setFormData({ ...formData, fecha: e.target.value })} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Punto de Venta *</Label>
                  <Input value={formData.puntoVenta} onChange={(e) => setFormData({ ...formData, puntoVenta: e.target.value })} placeholder="0001" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Número *</Label>
                  <Input value={formData.numero} onChange={(e) => setFormData({ ...formData, numero: e.target.value })} placeholder="00012345" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">CAE Proveedor</Label>
                  <Input value={formData.caeProveedor} onChange={(e) => setFormData({ ...formData, caeProveedor: e.target.value })} placeholder="WSCDC verificación" />
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-xs">OC asociada (3-Way Matching)</Label>
                <Select value={formData.ordenCompraId} onValueChange={(v) => setFormData({ ...formData, ordenCompraId: v })}>
                  <SelectTrigger><SelectValue placeholder="Sin OC — no aplica matching" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Sin OC</SelectItem>
                    {ordenes.filter((o) => ["aprobada", "enviada", "parcial", "recibida"].includes(o.estado)).map((oc) => (
                      <SelectItem key={oc.id} value={oc.id.toString()}>
                        OC {oc.numero} — {oc.proveedor?.nombre} — {fmt(Number(oc.total))}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between">
              <CardTitle className="text-base">Ítems</CardTitle>
              <Button variant="outline" size="sm" onClick={() => setItems([...items, { descripcion: "", cantidad: 1, precioUnitario: 0, porcentajeIva: 21 }])}>
                <Plus className="h-3.5 w-3.5 mr-1" /> Agregar
              </Button>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Descripción</TableHead>
                    <TableHead className="w-20">Cant.</TableHead>
                    <TableHead className="w-28">Precio Unit.</TableHead>
                    <TableHead className="w-20">IVA %</TableHead>
                    <TableHead className="text-right w-28">Subtotal</TableHead>
                    <TableHead className="w-10"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item, i) => (
                    <TableRow key={i}>
                      <TableCell>
                        <Input value={item.descripcion} placeholder="Descripción" onChange={(e) => {
                          const n = [...items]; n[i] = { ...n[i], descripcion: e.target.value }; setItems(n)
                        }} />
                      </TableCell>
                      <TableCell>
                        <Input type="number" value={item.cantidad} className="w-20" onChange={(e) => {
                          const n = [...items]; n[i] = { ...n[i], cantidad: parseFloat(e.target.value) || 0 }; setItems(n)
                        }} />
                      </TableCell>
                      <TableCell>
                        <Input type="number" value={item.precioUnitario} className="w-28" onChange={(e) => {
                          const n = [...items]; n[i] = { ...n[i], precioUnitario: parseFloat(e.target.value) || 0 }; setItems(n)
                        }} />
                      </TableCell>
                      <TableCell>
                        <Select value={item.porcentajeIva.toString()} onValueChange={(v) => {
                          const n = [...items]; n[i] = { ...n[i], porcentajeIva: parseFloat(v) }; setItems(n)
                        }}>
                          <SelectTrigger className="w-20"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="0">0%</SelectItem>
                            <SelectItem value="10.5">10.5%</SelectItem>
                            <SelectItem value="21">21%</SelectItem>
                            <SelectItem value="27">27%</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {fmt(item.cantidad * item.precioUnitario * (1 + item.porcentajeIva / 100))}
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm" onClick={() => setItems(items.filter((_, j) => j !== i))} disabled={items.length === 1}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="flex justify-end mt-4 gap-4 items-center">
                <span className="text-xl font-bold">Total: {fmt(calcularTotal())}</span>
                <Button onClick={registrarCompra} disabled={guardando}>
                  {guardando ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <FileCheck className="h-4 w-4 mr-2" />}
                  Registrar Compra
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ── Dialog: Crear OC ───────────────────────────────────────────── */}
      <Dialog open={crearOcOpen} onOpenChange={setCrearOcOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Nueva Orden de Compra</DialogTitle>
            <DialogDescription>Creá una OC borrador y luego aprobala para habilitar la recepción.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label className="text-xs">Proveedor *</Label>
                <Select value={ocForm.proveedorId} onValueChange={(v) => setOcForm({ ...ocForm, proveedorId: v })}>
                  <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                  <SelectContent>
                    {proveedores.map((p) => (
                      <SelectItem key={p.id} value={p.id.toString()}>{p.razonSocial ?? p.nombre ?? p.cuit}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Fecha entrega estimada</Label>
                <Input type="date" value={ocForm.fechaEntregaEst} onChange={(e) => setOcForm({ ...ocForm, fechaEntregaEst: e.target.value })} />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <Label className="text-xs">Líneas</Label>
                <Button variant="outline" size="sm" onClick={() => setOcLineas([...ocLineas, { descripcion: "", cantidad: 1, precioUnitario: 0 }])}>
                  <Plus className="h-3 w-3 mr-1" /> Línea
                </Button>
              </div>
              {ocLineas.map((l, i) => (
                <div key={i} className="grid grid-cols-[1fr_80px_100px_32px] gap-2 mb-2">
                  <Input placeholder="Descripción" value={l.descripcion} onChange={(e) => {
                    const n = [...ocLineas]; n[i] = { ...n[i], descripcion: e.target.value }; setOcLineas(n)
                  }} />
                  <Input type="number" placeholder="Cant." value={l.cantidad} onChange={(e) => {
                    const n = [...ocLineas]; n[i] = { ...n[i], cantidad: parseFloat(e.target.value) || 0 }; setOcLineas(n)
                  }} />
                  <Input type="number" placeholder="Precio" value={l.precioUnitario} onChange={(e) => {
                    const n = [...ocLineas]; n[i] = { ...n[i], precioUnitario: parseFloat(e.target.value) || 0 }; setOcLineas(n)
                  }} />
                  <Button variant="ghost" size="sm" onClick={() => setOcLineas(ocLineas.filter((_, j) => j !== i))} disabled={ocLineas.length === 1}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setCrearOcOpen(false)}>Cancelar</Button>
            <Button onClick={crearOrdenCompra} disabled={guardando}>
              {guardando ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Crear OC
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Dialog: Recepción ──────────────────────────────────────────── */}
      <Dialog open={recepcionOpen} onOpenChange={setRecepcionOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Recepción de Mercadería — OC {ocSeleccionada?.numero}</DialogTitle>
            <DialogDescription>Ingresá las cantidades recibidas y rechazadas por línea.</DialogDescription>
          </DialogHeader>
          {ocSeleccionada && (
            <div className="space-y-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Descripción</TableHead>
                    <TableHead className="text-right">OC</TableHead>
                    <TableHead className="text-right">Ya recibido</TableHead>
                    <TableHead className="w-24">Recibido</TableHead>
                    <TableHead className="w-24">Rechazado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ocSeleccionada.lineas.map((l, i) => (
                    <TableRow key={l.id}>
                      <TableCell className="text-sm">{l.descripcion}</TableCell>
                      <TableCell className="text-right">{Number(l.cantidad)}</TableCell>
                      <TableCell className="text-right text-muted-foreground">{Number(l.cantidadRecibida)}</TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          className="w-24"
                          min={0}
                          value={recepcionLineas[i]?.cantidadRecibida ?? 0}
                          onChange={(e) => {
                            const n = [...recepcionLineas]
                            n[i] = { ...n[i], cantidadRecibida: parseFloat(e.target.value) || 0 }
                            setRecepcionLineas(n)
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          className="w-24"
                          min={0}
                          value={recepcionLineas[i]?.cantidadRechazada ?? 0}
                          onChange={(e) => {
                            const n = [...recepcionLineas]
                            n[i] = { ...n[i], cantidadRechazada: parseFloat(e.target.value) || 0 }
                            setRecepcionLineas(n)
                          }}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setRecepcionOpen(false)}>Cancelar</Button>
            <Button onClick={registrarRecepcion} disabled={guardando}>
              {guardando ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <PackageCheck className="h-4 w-4 mr-2" />}
              Registrar Recepción
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
