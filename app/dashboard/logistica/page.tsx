"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { PageShell, PageHeader, StatusBadge } from "@/components/layout"
import { envioEstadoLabel, envioEstadoVariant } from "@/lib/ui/status-map"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Truck, Plus, Search, Pencil, Trash2, Package, MapPin, Users, PenTool, MessageSquare, CheckCircle2 } from "lucide-react"
import { DataTable, type DataTableColumn } from "@/components/data-table"
import { EmptyStateIllustration } from "@/components/empty-state-illustration"
import { useKeyboardShortcuts, erpShortcuts } from "@/hooks/use-keyboard-shortcuts"
import { useToast } from "@/hooks/use-toast"
import { useConfirm } from "@/hooks/use-confirm"
import { PodSignatureDialog } from "@/components/logistica/pod-signature-dialog"
import { getWhatsAppShareUrl } from "@/lib/utils/formatters-ar"

interface Transportista {
  id: number
  nombre: string
  cuit?: string
  telefono?: string
  email?: string
  activo: boolean
}

interface Envio {
  id: number
  numero: string
  estado: string
  direccionDestino: string
  fechaEmbarque?: string
  fechaEntrega?: string
  pesoKg?: number
  bultos: number
  observaciones?: string
  transportistaId?: number
  transportista?: Transportista
  remito?: { id: number; numero: number }
  firmaPodUrl?: string
  receptorNombre?: string
}

const initialEnvioForm = {
  numero: "", direccionDestino: "", transportistaId: "", remitoId: "",
  fechaEmbarque: "", fechaEntrega: "", pesoKg: "", bultos: "1", observaciones: "",
}

const initialTransportistaForm = {
  nombre: "", cuit: "", telefono: "", email: "",
}

export default function LogisticaPage() {
  const [envios, setEnvios] = useState<Envio[]>([])
  const [transportistas, setTransportistas] = useState<Transportista[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [filtroEstado, setFiltroEstado] = useState("todos")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [transportistaDialogOpen, setTransportistaDialogOpen] = useState(false)
  const [podDialogOpen, setPodDialogOpen] = useState(false)
  const [envioParaPod, setEnvioParaPod] = useState<Envio | null>(null)
  const [envioSeleccionado, setEnvioSeleccionado] = useState<Envio | null>(null)
  const [form, setForm] = useState(initialEnvioForm)
  const [transportistaForm, setTransportistaForm] = useState(initialTransportistaForm)
  const [error, setError] = useState("")
  const [guardando, setGuardando] = useState(false)
  const { toast } = useToast()
  const { confirm, ConfirmDialog } = useConfirm()

  const fetchEnvios = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (search) params.set("search", search)
      if (filtroEstado !== "todos") params.set("estado", filtroEstado)
      const res = await fetch(`/api/logistica?${params}`)
      if (res.ok) setEnvios(await res.json())
    } finally {
      setLoading(false)
    }
  }, [search, filtroEstado])

  const fetchTransportistas = useCallback(async () => {
    const res = await fetch("/api/logistica/transportistas")
    if (res.ok) setTransportistas(await res.json())
  }, [])

  useEffect(() => { fetchEnvios(); fetchTransportistas() }, [fetchEnvios, fetchTransportistas])

  useKeyboardShortcuts(erpShortcuts({ onRefresh: fetchEnvios, onNew: () => { setEnvioSeleccionado(null); setForm(initialEnvioForm); setError(""); setDialogOpen(true) } }))

  const abrirDialogNuevo = () => {
    setEnvioSeleccionado(null)
    setForm(initialEnvioForm)
    setError("")
    setDialogOpen(true)
  }

  const abrirDialogEditar = (envio: Envio) => {
    setEnvioSeleccionado(envio)
    setForm({
      numero: envio.numero,
      direccionDestino: envio.direccionDestino,
      transportistaId: envio.transportistaId?.toString() || "",
      remitoId: envio.remito?.id?.toString() || "",
      fechaEmbarque: envio.fechaEmbarque ? envio.fechaEmbarque.substring(0, 10) : "",
      fechaEntrega: envio.fechaEntrega ? envio.fechaEntrega.substring(0, 10) : "",
      pesoKg: envio.pesoKg?.toString() || "",
      bultos: envio.bultos.toString(),
      observaciones: envio.observaciones || "",
    })
    setError("")
    setDialogOpen(true)
  }

  const guardarEnvio = async () => {
    if (!form.numero || !form.direccionDestino) { setError("Número y destino son obligatorios"); return }
    setGuardando(true); setError("")
    try {
      const payload = {
        numero: form.numero,
        direccionDestino: form.direccionDestino,
        transportistaId: form.transportistaId ? Number(form.transportistaId) : null,
        remitoId: form.remitoId ? Number(form.remitoId) : null,
        fechaEmbarque: form.fechaEmbarque ? new Date(form.fechaEmbarque).toISOString() : null,
        fechaEntrega: form.fechaEntrega ? new Date(form.fechaEntrega).toISOString() : null,
        pesoKg: form.pesoKg ? Number(form.pesoKg) : null,
        bultos: Number(form.bultos) || 1,
        observaciones: form.observaciones || null,
      }
      const url = envioSeleccionado ? `/api/logistica/${envioSeleccionado.id}` : "/api/logistica"
      const method = envioSeleccionado ? "PUT" : "POST"
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) })
      if (!res.ok) { const data = await res.json(); setError(data.error || "Error al guardar"); return }
      setDialogOpen(false); fetchEnvios(); toast({ title: envioSeleccionado ? "Envío actualizado" : "Envío creado" })
    } finally { setGuardando(false) }
  }

  const cambiarEstado = async (id: number, estado: string) => {
    await fetch(`/api/logistica/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ estado }) })
    fetchEnvios()
    toast({ title: "Estado actualizado", description: `Envío cambiado a ${envioEstadoLabel(estado)}` })
  }

  const handleSaveSignature = (signatureDataUrl: string, receptorNombre: string, receptorDni: string) => {
    if (!envioParaPod) return
    setEnvios((prev) =>
      prev.map((e) =>
        e.id === envioParaPod.id
          ? { ...e, estado: "entregado", firmaPodUrl: signatureDataUrl, receptorNombre }
          : e
      )
    )
    toast({ title: "Firma POD registrada", description: `Entrega de Remito #${envioParaPod.numero} firmada por ${receptorNombre} (${receptorDni})` })
  }

  const eliminarEnvio = async (id: number) => {
    const ok = await confirm({
      title: "Eliminar envío",
      description: "¿Eliminar este envío? Esta acción no se puede deshacer.",
      confirmLabel: "Eliminar",
      variant: "destructive",
    })
    if (!ok) return
    await fetch(`/api/logistica/${id}`, { method: "DELETE" })
    fetchEnvios()
    toast({ title: "Envío eliminado" })
  }

  const guardarTransportista = async () => {
    if (!transportistaForm.nombre) { return }
    setGuardando(true)
    try {
      const res = await fetch("/api/logistica/transportistas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(transportistaForm),
      })
      if (res.ok) {
        setTransportistaDialogOpen(false)
        setTransportistaForm(initialTransportistaForm)
        fetchTransportistas()
      }
    } finally {
      setGuardando(false)
    }
  }

  const estadisticas = {
    pendientes: envios.filter((e) => e.estado === "pendiente").length,
    enTransito: envios.filter((e) => e.estado === "en_transito").length,
    entregados: envios.filter((e) => e.estado === "entregado").length,
    totalBultos: envios.reduce((sum, e) => sum + e.bultos, 0),
  }

  return (
    <PageShell>
      <PageHeader
        title="Logística y Remitos"
        description="Gestión de envíos, remitos, firmas POD y rutas de entrega"
        actions={
          <Button onClick={abrirDialogNuevo} className="gap-2">
            <Plus className="h-4 w-4" /> Nuevo Envío / Remito
          </Button>
        }
      />

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><CardContent className="pt-4"><p className="text-sm text-muted-foreground">Pendientes</p><p className="text-2xl font-bold text-amber-600">{estadisticas.pendientes}</p></CardContent></Card>
        <Card><CardContent className="pt-4"><p className="text-sm text-muted-foreground">En camino</p><p className="text-2xl font-bold text-blue-600">{estadisticas.enTransito}</p></CardContent></Card>
        <Card><CardContent className="pt-4"><p className="text-sm text-muted-foreground">Entregados POD</p><p className="text-2xl font-bold text-emerald-600">{estadisticas.entregados}</p></CardContent></Card>
        <Card><CardContent className="pt-4"><p className="text-sm text-muted-foreground">Total bultos</p><p className="text-2xl font-bold">{estadisticas.totalBultos}</p></CardContent></Card>
      </div>

      <Tabs defaultValue="envios">
        <TabsList>
          <TabsTrigger value="envios" className="gap-2"><Package className="h-4 w-4" />Envíos y Remitos</TabsTrigger>
          <TabsTrigger value="transportistas" className="gap-2"><Users className="h-4 w-4" />Transportistas</TabsTrigger>
        </TabsList>

        <TabsContent value="envios" className="space-y-4">
          <div className="flex gap-3">
            <Select value={filtroEstado} onValueChange={setFiltroEstado}>
              <SelectTrigger className="w-44"><SelectValue placeholder="Estado" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos los estados</SelectItem>
                <SelectItem value="pendiente">Pendiente</SelectItem>
                <SelectItem value="en_transito">En camino</SelectItem>
                <SelectItem value="entregado">Entregado</SelectItem>
                <SelectItem value="devuelto">Devuelto</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Card>
            <CardContent className="pt-4">
              <DataTable<Envio>
                data={envios}
                columns={[
                  { key: "numero", header: "Remito / Nº", sortable: true, cell: (e) => <span className="font-mono font-medium">{e.numero}</span> },
                  { key: "direccionDestino", header: "Destino", cell: (e) => <div className="flex items-center gap-1 text-sm"><MapPin className="h-3 w-3 text-muted-foreground" />{e.direccionDestino}</div> },
                  { key: "transportista" as any, header: "Transportista", cell: (e) => e.transportista?.nombre || <span className="text-muted-foreground">—</span> },
                  { key: "bultos", header: "Bultos", align: "right", sortable: true },
                  { key: "estado", header: "Estado", cell: (e) => (
                    <div className="flex items-center gap-2">
                      <Select value={e.estado} onValueChange={(v) => cambiarEstado(e.id, v)}>
                        <SelectTrigger className="h-7 w-auto border-0 bg-transparent p-0 shadow-none">
                          <StatusBadge variant={envioEstadoVariant(e.estado)} label={envioEstadoLabel(e.estado)} />
                        </SelectTrigger>
                        <SelectContent>
                          {(["pendiente", "en_transito", "entregado", "devuelto"] as const).map((k) => (
                            <SelectItem key={k} value={k}>{envioEstadoLabel(k)}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  ) },
                  { key: "acciones" as any, header: "Acciones POD & WA", cell: (e) => (
                    <div className="flex items-center gap-1">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-300"
                        onClick={() => {
                          setEnvioParaPod(e)
                          setPodDialogOpen(true)
                        }}
                      >
                        <PenTool className="h-3 w-3 mr-1" />
                        {e.firmaPodUrl ? "Ver POD" : "Firma POD"}
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 text-green-600 hover:text-green-700"
                        title="Notificar por WhatsApp"
                        onClick={() => {
                          const text = `Hola! Tu pedido #${e.numero} está ${envioEstadoLabel(e.estado)} con destino a ${e.direccionDestino}.`
                          window.open(getWhatsAppShareUrl(e.transportista?.telefono, text), "_blank")
                        }}
                      >
                        <MessageSquare className="h-3.5 w-3.5" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => abrirDialogEditar(e)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => eliminarEnvio(e.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ) },
                ] as DataTableColumn<Envio>[]}
                rowKey="id"
                searchPlaceholder="Buscar envío o remito..."
                searchKeys={["numero", "direccionDestino"]}
                loading={loading}
                emptyMessage="No hay envíos registrados"
                emptyIcon={<EmptyStateIllustration type="generico" compact title="Sin envíos" description="Creá un nuevo envío para empezar." />}
                defaultPageSize={25}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="transportistas">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-sm">Transportistas de la Empresa</CardTitle>
              <Button size="sm" onClick={() => setTransportistaDialogOpen(true)} className="gap-1">
                <Plus className="h-3.5 w-3.5" /> Agregar Transportista
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>CUIT</TableHead>
                    <TableHead>Teléfono</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Estado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transportistas.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground">No hay transportistas cargados</TableCell>
                    </TableRow>
                  ) : (
                    transportistas.map((t) => (
                      <TableRow key={t.id}>
                        <TableCell className="font-medium">{t.nombre}</TableCell>
                        <TableCell>{t.cuit || "—"}</TableCell>
                        <TableCell>{t.telefono || "—"}</TableCell>
                        <TableCell>{t.email || "—"}</TableCell>
                        <TableCell><StatusBadge variant={t.activo ? "success" : "neutral"} label={t.activo ? "Activo" : "Inactivo"} /></TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialog Nuevo / Editar Envío */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{envioSeleccionado ? "Editar Envío" : "Nuevo Envío / Remito"}</DialogTitle>
          </DialogHeader>
          {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}
          <div className="grid gap-3 py-2 text-sm">
            <div><Label>Número de Remito / Envío</Label><Input value={form.numero} onChange={(e) => setForm({ ...form, numero: e.target.value })} placeholder="Ej: REM-0001-00004512" /></div>
            <div><Label>Dirección Destino</Label><Input value={form.direccionDestino} onChange={(e) => setForm({ ...form, direccionDestino: e.target.value })} placeholder="Ej: Av. Corrientes 1234, CABA" /></div>
            <div>
              <Label>Transportista</Label>
              <Select value={form.transportistaId} onValueChange={(v) => setForm({ ...form, transportistaId: v })}>
                <SelectTrigger><SelectValue placeholder="Seleccionar transportista" /></SelectTrigger>
                <SelectContent>
                  {transportistas.map((t) => (<SelectItem key={t.id} value={t.id.toString()}>{t.nombre}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Bultos</Label><Input type="number" value={form.bultos} onChange={(e) => setForm({ ...form, bultos: e.target.value })} /></div>
              <div><Label>Peso (Kg)</Label><Input type="number" value={form.pesoKg} onChange={(e) => setForm({ ...form, pesoKg: e.target.value })} placeholder="Ej: 15.5" /></div>
            </div>
            <div><Label>Observaciones Internas</Label><Input value={form.observaciones} onChange={(e) => setForm({ ...form, observaciones: e.target.value })} placeholder="Ej: Entregar en horario comercial" /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={guardarEnvio} disabled={guardando}>{guardando ? "Guardando..." : "Guardar"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Nuevo Transportista */}
      <Dialog open={transportistaDialogOpen} onOpenChange={setTransportistaDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Nuevo Transportista</DialogTitle></DialogHeader>
          <div className="grid gap-3 py-2 text-sm">
            <div><Label>Nombre / Razón Social</Label><Input value={transportistaForm.nombre} onChange={(e) => setTransportistaForm({ ...transportistaForm, nombre: e.target.value })} /></div>
            <div><Label>CUIT</Label><Input value={transportistaForm.cuit} onChange={(e) => setTransportistaForm({ ...transportistaForm, cuit: e.target.value })} placeholder="20-12345678-9" /></div>
            <div><Label>Teléfono / WhatsApp</Label><Input value={transportistaForm.telefono} onChange={(e) => setTransportistaForm({ ...transportistaForm, telefono: e.target.value })} placeholder="+54 9 11 1234-5678" /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTransportistaDialogOpen(false)}>Cancelar</Button>
            <Button onClick={guardarTransportista} disabled={guardando}>{guardando ? "Guardando..." : "Guardar"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog POD Firma Táctil */}
      <PodSignatureDialog
        open={podDialogOpen}
        onClose={() => setPodDialogOpen(false)}
        envioNumero={envioParaPod?.numero ?? ""}
        onSaveSignature={handleSaveSignature}
      />
      <ConfirmDialog />
    </PageShell>
  )
}
