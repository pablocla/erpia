"use client"

import { useCallback, useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Route, Plus, Truck, User } from "lucide-react"

interface Vehiculo {
  id: number
  patente: string
  tipo: string
  marca?: string | null
  modelo?: string | null
  capacidadKg?: number | null
  capacidadBultos?: number | null
  activo: boolean
}

interface Chofer {
  id: number
  nombre: string
  documento?: string | null
  licencia?: string | null
  telefono?: string | null
  email?: string | null
  activo: boolean
}

interface Parada {
  id: number
  orden: number
  estado: string
}

interface HojaRuta {
  id: number
  numero: string
  fecha: string
  estado: string
  kmEstimado?: number | null
  vehiculo?: Vehiculo | null
  chofer?: Chofer | null
  paradas: Parada[]
}

interface NuevaParada {
  direccion: string
  envioId: string
  ventanaDesde: string
  ventanaHasta: string
  contactoNombre: string
  contactoTelefono: string
}

const ESTADOS_RUTA = ["planificada", "en_ruta", "finalizada", "cancelada"]

export default function DistribucionPage() {
  const [vehiculos, setVehiculos] = useState<Vehiculo[]>([])
  const [choferes, setChoferes] = useState<Chofer[]>([])
  const [hojas, setHojas] = useState<HojaRuta[]>([])

  const [dialogVehiculo, setDialogVehiculo] = useState(false)
  const [dialogChofer, setDialogChofer] = useState(false)
  const [dialogHoja, setDialogHoja] = useState(false)

  const [vehiculoForm, setVehiculoForm] = useState({ patente: "", tipo: "utilitario", capacidadKg: "", capacidadBultos: "" })
  const [choferForm, setChoferForm] = useState({ nombre: "", documento: "", licencia: "", telefono: "", email: "" })
  const [hojaForm, setHojaForm] = useState({ fecha: new Date().toISOString().substring(0, 10), vehiculoId: "", choferId: "", kmEstimado: "", observaciones: "" })
  const [paradas, setParadas] = useState<NuevaParada[]>([
    { direccion: "", envioId: "", ventanaDesde: "", ventanaHasta: "", contactoNombre: "", contactoTelefono: "" },
  ])

  const authHeaders = useCallback((): Record<string, string> => {
    const token = localStorage.getItem("token")
    return token ? { Authorization: `Bearer ${token}` } : {}
  }, [])

  const fetchVehiculos = useCallback(async () => {
    const res = await fetch("/api/distribucion/vehiculos", { headers: authHeaders() })
    if (res.ok) setVehiculos(await res.json())
  }, [authHeaders])

  const fetchChoferes = useCallback(async () => {
    const res = await fetch("/api/distribucion/choferes", { headers: authHeaders() })
    if (res.ok) setChoferes(await res.json())
  }, [authHeaders])

  const fetchHojas = useCallback(async () => {
    const res = await fetch("/api/distribucion/hojas-ruta", { headers: authHeaders() })
    if (res.ok) setHojas(await res.json())
  }, [authHeaders])

  useEffect(() => {
    fetchVehiculos()
    fetchChoferes()
    fetchHojas()
  }, [fetchVehiculos, fetchChoferes, fetchHojas])

  const agregarParada = () => {
    setParadas((prev) => [...prev, { direccion: "", envioId: "", ventanaDesde: "", ventanaHasta: "", contactoNombre: "", contactoTelefono: "" }])
  }

  const actualizarParada = (idx: number, field: keyof NuevaParada, value: string) => {
    setParadas((prev) => prev.map((p, i) => (i === idx ? { ...p, [field]: value } : p)))
  }

  const guardarVehiculo = async () => {
    if (!vehiculoForm.patente) return
    const payload = {
      patente: vehiculoForm.patente,
      tipo: vehiculoForm.tipo,
      capacidadKg: vehiculoForm.capacidadKg ? parseFloat(vehiculoForm.capacidadKg) : null,
      capacidadBultos: vehiculoForm.capacidadBultos ? parseInt(vehiculoForm.capacidadBultos, 10) : null,
    }
    const res = await fetch("/api/distribucion/vehiculos", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify(payload),
    })
    if (res.ok) {
      setDialogVehiculo(false)
      setVehiculoForm({ patente: "", tipo: "utilitario", capacidadKg: "", capacidadBultos: "" })
      fetchVehiculos()
    }
  }

  const guardarChofer = async () => {
    if (!choferForm.nombre) return
    const res = await fetch("/api/distribucion/choferes", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify(choferForm),
    })
    if (res.ok) {
      setDialogChofer(false)
      setChoferForm({ nombre: "", documento: "", licencia: "", telefono: "", email: "" })
      fetchChoferes()
    }
  }

  const guardarHoja = async () => {
    const paradasValidas = paradas.filter((p) => p.direccion || p.envioId)
    if (paradasValidas.length === 0) return

    const payload = {
      fecha: hojaForm.fecha,
      vehiculoId: hojaForm.vehiculoId ? parseInt(hojaForm.vehiculoId, 10) : null,
      choferId: hojaForm.choferId ? parseInt(hojaForm.choferId, 10) : null,
      kmEstimado: hojaForm.kmEstimado ? parseFloat(hojaForm.kmEstimado) : null,
      observaciones: hojaForm.observaciones || undefined,
      paradas: paradasValidas.map((p) => ({
        envioId: p.envioId ? parseInt(p.envioId, 10) : null,
        direccion: p.direccion || undefined,
        ventanaDesde: p.ventanaDesde || undefined,
        ventanaHasta: p.ventanaHasta || undefined,
        contactoNombre: p.contactoNombre || undefined,
        contactoTelefono: p.contactoTelefono || undefined,
      })),
    }

    const res = await fetch("/api/distribucion/hojas-ruta", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify(payload),
    })

    if (res.ok) {
      setDialogHoja(false)
      setHojaForm({ fecha: new Date().toISOString().substring(0, 10), vehiculoId: "", choferId: "", kmEstimado: "", observaciones: "" })
      setParadas([{ direccion: "", envioId: "", ventanaDesde: "", ventanaHasta: "", contactoNombre: "", contactoTelefono: "" }])
      fetchHojas()
    }
  }

  const actualizarEstadoHoja = async (id: number, estado: string) => {
    await fetch(`/api/distribucion/hojas-ruta/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify({ estado }),
    })
    fetchHojas()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Route className="h-6 w-6 text-emerald-500" />
            Distribucion
          </h1>
          <p className="text-muted-foreground text-sm">Hojas de ruta, vehiculos y choferes</p>
        </div>
        <Button onClick={() => setDialogHoja(true)} className="gap-2">
          <Plus className="h-4 w-4" /> Nueva Hoja
        </Button>
      </div>

      <Tabs defaultValue="hojas">
        <TabsList>
          <TabsTrigger value="hojas" className="gap-2"><Route className="h-4 w-4" />Hojas</TabsTrigger>
          <TabsTrigger value="vehiculos" className="gap-2"><Truck className="h-4 w-4" />Vehiculos</TabsTrigger>
          <TabsTrigger value="choferes" className="gap-2"><User className="h-4 w-4" />Choferes</TabsTrigger>
        </TabsList>

        <TabsContent value="hojas" className="space-y-4">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Numero</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Vehiculo</TableHead>
                    <TableHead>Chofer</TableHead>
                    <TableHead>Paradas</TableHead>
                    <TableHead>Estado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {hojas.length === 0 ? (
                    <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Sin hojas de ruta</TableCell></TableRow>
                  ) : hojas.map((h) => (
                    <TableRow key={h.id}>
                      <TableCell className="font-mono text-xs">{h.numero}</TableCell>
                      <TableCell>{new Date(h.fecha).toLocaleDateString("es-AR")}</TableCell>
                      <TableCell>{h.vehiculo?.patente || "-"}</TableCell>
                      <TableCell>{h.chofer?.nombre || "-"}</TableCell>
                      <TableCell>{h.paradas?.length ?? 0}</TableCell>
                      <TableCell>
                        <Select value={h.estado} onValueChange={(v) => actualizarEstadoHoja(h.id, v)}>
                          <SelectTrigger className="h-7 w-36 text-xs"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {ESTADOS_RUTA.map((e) => (
                              <SelectItem key={e} value={e}>{e}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="vehiculos" className="space-y-4">
          <div className="flex justify-end">
            <Button variant="outline" className="gap-2" onClick={() => setDialogVehiculo(true)}>
              <Plus className="h-4 w-4" /> Agregar Vehiculo
            </Button>
          </div>
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Patente</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Capacidad Kg</TableHead>
                    <TableHead>Capacidad Bultos</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {vehiculos.length === 0 ? (
                    <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground">Sin vehiculos</TableCell></TableRow>
                  ) : vehiculos.map((v) => (
                    <TableRow key={v.id}>
                      <TableCell className="font-mono text-xs">{v.patente}</TableCell>
                      <TableCell>{v.tipo}</TableCell>
                      <TableCell>{v.capacidadKg ?? "-"}</TableCell>
                      <TableCell>{v.capacidadBultos ?? "-"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="choferes" className="space-y-4">
          <div className="flex justify-end">
            <Button variant="outline" className="gap-2" onClick={() => setDialogChofer(true)}>
              <Plus className="h-4 w-4" /> Agregar Chofer
            </Button>
          </div>
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Documento</TableHead>
                    <TableHead>Licencia</TableHead>
                    <TableHead>Telefono</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {choferes.length === 0 ? (
                    <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground">Sin choferes</TableCell></TableRow>
                  ) : choferes.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell>{c.nombre}</TableCell>
                      <TableCell>{c.documento || "-"}</TableCell>
                      <TableCell>{c.licencia || "-"}</TableCell>
                      <TableCell>{c.telefono || "-"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={dialogVehiculo} onOpenChange={setDialogVehiculo}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Nuevo Vehiculo</DialogTitle></DialogHeader>
          <div className="grid gap-3 py-2">
            <div className="space-y-1">
              <Label>Patente</Label>
              <Input value={vehiculoForm.patente} onChange={(e) => setVehiculoForm({ ...vehiculoForm, patente: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label>Tipo</Label>
              <Input value={vehiculoForm.tipo} onChange={(e) => setVehiculoForm({ ...vehiculoForm, tipo: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label>Capacidad Kg</Label>
              <Input type="number" value={vehiculoForm.capacidadKg} onChange={(e) => setVehiculoForm({ ...vehiculoForm, capacidadKg: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label>Capacidad Bultos</Label>
              <Input type="number" value={vehiculoForm.capacidadBultos} onChange={(e) => setVehiculoForm({ ...vehiculoForm, capacidadBultos: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogVehiculo(false)}>Cancelar</Button>
            <Button onClick={guardarVehiculo}>Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={dialogChofer} onOpenChange={setDialogChofer}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Nuevo Chofer</DialogTitle></DialogHeader>
          <div className="grid gap-3 py-2">
            <div className="space-y-1">
              <Label>Nombre</Label>
              <Input value={choferForm.nombre} onChange={(e) => setChoferForm({ ...choferForm, nombre: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label>Documento</Label>
              <Input value={choferForm.documento} onChange={(e) => setChoferForm({ ...choferForm, documento: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label>Licencia</Label>
              <Input value={choferForm.licencia} onChange={(e) => setChoferForm({ ...choferForm, licencia: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label>Telefono</Label>
              <Input value={choferForm.telefono} onChange={(e) => setChoferForm({ ...choferForm, telefono: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label>Email</Label>
              <Input type="email" value={choferForm.email} onChange={(e) => setChoferForm({ ...choferForm, email: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogChofer(false)}>Cancelar</Button>
            <Button onClick={guardarChofer}>Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={dialogHoja} onOpenChange={setDialogHoja}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Nueva Hoja de Ruta</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label>Fecha</Label>
                <Input type="date" value={hojaForm.fecha} onChange={(e) => setHojaForm({ ...hojaForm, fecha: e.target.value })} />
              </div>
              <div className="space-y-1">
                <Label>Vehiculo</Label>
                <Select value={hojaForm.vehiculoId} onValueChange={(v) => setHojaForm({ ...hojaForm, vehiculoId: v })}>
                  <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Sin vehiculo</SelectItem>
                    {vehiculos.map((v) => (
                      <SelectItem key={v.id} value={String(v.id)}>{v.patente}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Chofer</Label>
                <Select value={hojaForm.choferId} onValueChange={(v) => setHojaForm({ ...hojaForm, choferId: v })}>
                  <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Sin chofer</SelectItem>
                    {choferes.map((c) => (
                      <SelectItem key={c.id} value={String(c.id)}>{c.nombre}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Km estimado</Label>
                <Input type="number" value={hojaForm.kmEstimado} onChange={(e) => setHojaForm({ ...hojaForm, kmEstimado: e.target.value })} />
              </div>
              <div className="space-y-1">
                <Label>Observaciones</Label>
                <Input value={hojaForm.observaciones} onChange={(e) => setHojaForm({ ...hojaForm, observaciones: e.target.value })} />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Paradas</Label>
                <Button type="button" variant="outline" size="sm" onClick={agregarParada} className="gap-1 h-7 text-xs">
                  <Plus className="h-3 w-3" /> Agregar
                </Button>
              </div>
              {paradas.map((p, idx) => (
                <div key={idx} className="grid grid-cols-12 gap-2 items-end">
                  <div className="col-span-4 space-y-1">
                    {idx === 0 && <Label className="text-xs">Direccion</Label>}
                    <Input value={p.direccion} onChange={(e) => actualizarParada(idx, "direccion", e.target.value)} placeholder="Calle 123" className="h-8 text-sm" />
                  </div>
                  <div className="col-span-2 space-y-1">
                    {idx === 0 && <Label className="text-xs">Envio ID</Label>}
                    <Input value={p.envioId} onChange={(e) => actualizarParada(idx, "envioId", e.target.value)} placeholder="#" className="h-8 text-sm" />
                  </div>
                  <div className="col-span-3 space-y-1">
                    {idx === 0 && <Label className="text-xs">Ventana desde</Label>}
                    <Input type="datetime-local" value={p.ventanaDesde} onChange={(e) => actualizarParada(idx, "ventanaDesde", e.target.value)} className="h-8 text-sm" />
                  </div>
                  <div className="col-span-3 space-y-1">
                    {idx === 0 && <Label className="text-xs">Ventana hasta</Label>}
                    <Input type="datetime-local" value={p.ventanaHasta} onChange={(e) => actualizarParada(idx, "ventanaHasta", e.target.value)} className="h-8 text-sm" />
                  </div>
                </div>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogHoja(false)}>Cancelar</Button>
            <Button onClick={guardarHoja}>Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
