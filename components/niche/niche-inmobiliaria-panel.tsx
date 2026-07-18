"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import {
  AlertTriangle,
  Building2,
  FileKey,
  Home,
  Plus,
  RefreshCw,
  Receipt,
  Banknote,
  Link2,
  MessageCircle,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { getAuthHeaders } from "@/lib/stores/auth-store"
import { NicheClientePicker, type ClienteOption } from "@/components/niche/niche-cliente-picker"
import { useToast } from "@/components/ui/use-toast"
import { Badge } from "@/components/ui/badge"
import {
  PropiedadOnboardingChecklist,
  completarPasoOnboardingPropiedad,
} from "@/components/comercial/propiedad-onboarding-checklist"

const fmt = (n: number) =>
  n.toLocaleString("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 })

const ESTADO_COLOR: Record<string, string> = {
  disponible: "bg-emerald-100 text-emerald-800",
  reservada: "bg-amber-100 text-amber-800",
  alquilada: "bg-blue-100 text-blue-800",
  vendida: "bg-muted text-muted-foreground",
}

type Propiedad = {
  id: number
  titulo: string
  direccion: string
  tipo: string
  estado: string
  ambientes: number | null
  m2: number | null
  precioAlquiler: string | number | null
  propietario?: { id: number; nombre: string } | null
  contratos: Array<{
    id: number
    inquilino: { nombre: string }
    fechaFin: string
  }>
}

type Contrato = {
  id: number
  montoMensual: string | number
  diaVencimiento: number
  fechaInicio: string
  fechaFin: string
  estado: string
  propiedad: { titulo: string; direccion: string }
  inquilino: { nombre: string; telefono: string | null }
  propietario?: { nombre: string } | null
}

type Resumen = {
  propiedades: number
  contratosActivos: number
  vencen30: number
}

export function NicheInmobiliariaPanel() {
  const { toast } = useToast()
  const [propiedades, setPropiedades] = useState<Propiedad[]>([])
  const [contratos, setContratos] = useState<Contrato[]>([])
  const [resumen, setResumen] = useState<Resumen | null>(null)
  const [filtroEstado, setFiltroEstado] = useState<string>("todos")
  const [facturando, setFacturando] = useState(false)
  const [pendientesMes, setPendientesMes] = useState<{ periodo: string; pendientes: number } | null>(
    null,
  )
  type AlquilerPendiente = {
    cuentaCobrarId: number
    monto: number
    concepto: string | null
    clienteNombre: string
    vencimiento: string | null
  }
  const [alquileresPendientes, setAlquileresPendientes] = useState<AlquilerPendiente[]>([])

  const cargar = useCallback(async () => {
    const q = filtroEstado !== "todos" ? `?estado=${filtroEstado}` : ""
    const [propRes, contRes] = await Promise.all([
      fetch(`/api/inmobiliaria/propiedades${q}`, { headers: getAuthHeaders() }),
      fetch("/api/inmobiliaria/contratos?estado=activo", { headers: getAuthHeaders() }),
    ])
    if (propRes.ok) {
      const data = await propRes.json()
      setPropiedades(data.propiedades ?? [])
      setResumen(data.resumen ?? null)
    }
    if (contRes.ok) setContratos(await contRes.json())
  }, [filtroEstado])

  const cargarPendientes = useCallback(async () => {
    const res = await fetch("/api/inmobiliaria/facturar-mes", { headers: getAuthHeaders() })
    if (res.ok) setPendientesMes(await res.json())
  }, [])

  const cargarAlquileresCxC = useCallback(async () => {
    const res = await fetch("/api/inmobiliaria/cobrar-alquiler", { headers: getAuthHeaders() })
    if (res.ok) setAlquileresPendientes(await res.json())
    else setAlquileresPendientes([])
  }, [])

  useEffect(() => {
    void cargar()
    void cargarPendientes()
    void cargarAlquileresCxC()
    void completarPasoOnboardingPropiedad("ver_cartera")
  }, [cargar, cargarPendientes, cargarAlquileresCxC])

  async function accionAlquiler(cuentaCobrarId: number, action: "cobrar" | "link_pago" | "avisar") {
    const res = await fetch("/api/inmobiliaria/cobrar-alquiler", {
      method: "POST",
      headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
      body: JSON.stringify({ cuentaCobrarId, action, medioPago: "transferencia" }),
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      toast({
        variant: "destructive",
        title: "No se pudo completar",
        description: data.error ?? "Error",
      })
      return
    }
    if (action === "link_pago" && data.linkPago) {
      try {
        await navigator.clipboard.writeText(data.linkPago as string)
        toast({ title: "Link MP copiado" })
      } catch {
        toast({ title: "Link generado" })
      }
      window.open(data.linkPago as string, "_blank")
      return
    }
    if (action === "cobrar") {
      toast({
        title: "Alquiler cobrado",
        description: data.reciboNumero ? `Recibo ${data.reciboNumero}` : "OK",
      })
      void cargarAlquileresCxC()
      return
    }
    toast({
      title: "Aviso enviado",
      description: data.linkPago ? "WA + link de pago" : "WhatsApp encolado",
    })
  }

  async function facturarAlquileresMes() {
    setFacturando(true)
    try {
      const res = await fetch("/api/inmobiliaria/facturar-mes", {
        method: "POST",
        headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify({}),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast({
          variant: "destructive",
          title: "No se pudo facturar",
          description: data.error ?? "Error al generar alquileres",
        })
        return
      }
      toast({
        title: "Alquileres del mes",
        description: `${data.generados ?? 0} generados · ${data.omitidos ?? 0} omitidos · período ${data.periodo}`,
      })
      void cargarPendientes()
      void cargarAlquileresCxC()
    } finally {
      setFacturando(false)
    }
  }

  async function crearPropiedad(data: {
    titulo: string
    direccion: string
    tipo: string
    precioAlquiler: string
    propietario: ClienteOption | null
  }) {
    const res = await fetch("/api/inmobiliaria/propiedades", {
      method: "POST",
      headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
      body: JSON.stringify({
        titulo: data.titulo,
        direccion: data.direccion,
        tipo: data.tipo,
        precioAlquiler: data.precioAlquiler ? Number(data.precioAlquiler) : undefined,
        propietarioId: data.propietario?.id,
      }),
    })
    if (!res.ok) {
      toast({ variant: "destructive", title: "Error", description: "No se pudo crear la propiedad." })
      return
    }
    toast({ title: "Propiedad cargada", description: data.titulo })
    void cargar()
  }

  async function crearContrato(data: {
    propiedadId: number
    inquilino: ClienteOption | null
    propietario: ClienteOption | null
    montoMensual: string
    fechaInicio: string
    fechaFin: string
    diaVencimiento: string
  }) {
    if (!data.inquilino) {
      toast({ variant: "destructive", title: "Inquilino obligatorio" })
      return
    }
    const res = await fetch("/api/inmobiliaria/contratos", {
      method: "POST",
      headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
      body: JSON.stringify({
        propiedadId: data.propiedadId,
        inquilinoId: data.inquilino.id,
        propietarioId: data.propietario?.id,
        montoMensual: Number(data.montoMensual),
        fechaInicio: data.fechaInicio,
        fechaFin: data.fechaFin,
        diaVencimiento: Number(data.diaVencimiento) || 10,
      }),
    })
    const err = res.ok ? null : await res.json().catch(() => ({}))
    if (!res.ok) {
      toast({
        variant: "destructive",
        title: "Contrato no creado",
        description: err?.error ?? "Revisá fechas y propiedad.",
      })
      return
    }
    toast({ title: "Contrato activo", description: "La propiedad quedó en estado alquilada." })
    void cargar()
  }

  async function finalizarContrato(id: number) {
    const res = await fetch("/api/inmobiliaria/contratos", {
      method: "POST",
      headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
      body: JSON.stringify({ action: "finalizar", id }),
    })
    if (!res.ok) {
      toast({ variant: "destructive", title: "No se pudo finalizar el contrato" })
      return
    }
    toast({ title: "Contrato finalizado", description: "Propiedad disponible nuevamente." })
    void cargar()
  }

  const disponibles = propiedades.filter((p) => p.estado === "disponible")

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-5xl mx-auto">
      <PropiedadOnboardingChecklist />
      <div className="flex flex-wrap gap-2 items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-primary">Claver Propiedad</p>
          <h1 className="text-xl font-semibold">Cartera inmobiliaria</h1>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" size="sm" onClick={() => void cargar()}>
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            disabled={facturando || (pendientesMes?.pendientes ?? 0) === 0}
            onClick={() => void facturarAlquileresMes()}
          >
            <Receipt className="h-4 w-4 mr-1" />
            {facturando
              ? "Generando…"
              : `Cobrar alquileres mes${pendientesMes ? ` (${pendientesMes.pendientes})` : ""}`}
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href="/dashboard/cuentas-cobrar">Cuentas a cobrar</Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href="/dashboard/nicho/consorcios">Consorcios</Link>
          </Button>
        </div>
      </div>

      {resumen && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sticky top-0 z-10 bg-background/95 backdrop-blur py-2">
          <Card>
            <CardHeader className="pb-1">
              <CardTitle className="text-xs text-muted-foreground">Propiedades</CardTitle>
            </CardHeader>
            <CardContent className="text-xl font-semibold">{resumen.propiedades}</CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-1">
              <CardTitle className="text-xs text-muted-foreground">Contratos activos</CardTitle>
            </CardHeader>
            <CardContent className="text-xl font-semibold text-blue-600">{resumen.contratosActivos}</CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-1">
              <CardTitle className="text-xs text-muted-foreground">Vencen 30d</CardTitle>
            </CardHeader>
            <CardContent className="text-xl font-semibold text-amber-600">{resumen.vencen30}</CardContent>
          </Card>
          <Card className="border-primary/30">
            <CardHeader className="pb-1">
              <CardTitle className="text-xs text-muted-foreground">A facturar mes</CardTitle>
            </CardHeader>
            <CardContent className="text-xl font-semibold text-primary">
              {pendientesMes?.pendientes ?? "—"}
            </CardContent>
          </Card>
        </div>
      )}

      {resumen && resumen.vencen30 > 0 && (
        <Card className="border-amber-200 bg-amber-50/50">
          <CardContent className="pt-4 text-sm flex items-center gap-2 text-amber-900">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            {resumen.vencen30} contrato(s) vencen en los próximos 30 días — el cron avisa por WhatsApp.
          </CardContent>
        </Card>
      )}

      {alquileresPendientes.length > 0 && (
        <Card className="border-rose-200 bg-rose-50/40">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2 text-rose-900">
              <Banknote className="h-4 w-4" />
              Alquileres a cobrar ({alquileresPendientes.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {alquileresPendientes.map((a) => (
              <div
                key={a.cuentaCobrarId}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg border bg-white px-3 py-2 text-sm"
              >
                <div>
                  <strong>{a.clienteNombre}</strong>
                  <p className="text-xs text-muted-foreground">
                    {a.concepto ?? "Alquiler"} · {fmt(a.monto)}
                    {a.vencimiento ? ` · vto ${a.vencimiento}` : ""}
                  </p>
                </div>
                <div className="flex gap-1 flex-wrap">
                  <Button size="sm" onClick={() => void accionAlquiler(a.cuentaCobrarId, "cobrar")}>
                    Cobrar
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => void accionAlquiler(a.cuentaCobrarId, "link_pago")}
                  >
                    <Link2 className="h-4 w-4 mr-1" />
                    Link MP
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => void accionAlquiler(a.cuentaCobrarId, "avisar")}
                  >
                    <MessageCircle className="h-4 w-4 mr-1" />
                    WA
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <div className="flex flex-wrap gap-2 items-center">
        <Select value={filtroEstado} onValueChange={setFiltroEstado}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos</SelectItem>
            <SelectItem value="disponible">Disponible</SelectItem>
            <SelectItem value="alquilada">Alquilada</SelectItem>
            <SelectItem value="reservada">Reservada</SelectItem>
          </SelectContent>
        </Select>
        <Dialog>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-1" />
              Nueva propiedad
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Alta propiedad</DialogTitle>
            </DialogHeader>
            <FormPropiedad onSave={crearPropiedad} />
          </DialogContent>
        </Dialog>
        {disponibles.length > 0 && (
          <Dialog>
            <DialogTrigger asChild>
              <Button size="sm" variant="secondary">
                <FileKey className="h-4 w-4 mr-1" />
                Nuevo contrato
              </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Contrato de alquiler</DialogTitle>
              </DialogHeader>
              <FormContrato propiedades={disponibles} onSave={crearContrato} />
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="grid gap-3">
        {propiedades.length === 0 && (
          <Card className="border-dashed">
            <CardContent className="pt-6 text-center space-y-3">
              <Home className="h-10 w-10 mx-auto text-muted-foreground" />
              <p className="font-medium">Empezá con tu primera propiedad</p>
              <p className="text-sm text-muted-foreground">
                Cargá la ficha, asigná propietario y después el contrato de alquiler.
              </p>
            </CardContent>
          </Card>
        )}
        {propiedades.map((p) => (
          <Card key={p.id}>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2 flex-wrap">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                {p.titulo}
                <Badge className={ESTADO_COLOR[p.estado] ?? ""} variant="secondary">
                  {p.estado}
                </Badge>
              </CardTitle>
              <p className="text-xs text-muted-foreground">{p.direccion}</p>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-1">
              <p>
                {p.tipo}
                {p.ambientes ? ` · ${p.ambientes} amb` : ""}
                {p.precioAlquiler ? ` · ${fmt(Number(p.precioAlquiler))}/mes` : ""}
              </p>
              {p.propietario && <p>Propietario: {p.propietario.nombre}</p>}
              {p.contratos[0] && (
                <p>
                  Inquilino: <strong>{p.contratos[0].inquilino.nombre}</strong> — vence{" "}
                  {new Date(p.contratos[0].fechaFin).toLocaleDateString("es-AR")}
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {contratos.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Contratos activos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {contratos.map((c) => (
              <div
                key={c.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg border px-3 py-2 text-sm"
              >
                <div>
                  <strong>{c.propiedad.titulo}</strong> — {c.inquilino.nombre}
                  <p className="text-xs text-muted-foreground">
                    {fmt(Number(c.montoMensual))}/mes · vence{" "}
                    {new Date(c.fechaFin).toLocaleDateString("es-AR")} · día {c.diaVencimiento}
                  </p>
                </div>
                <Button size="sm" variant="outline" onClick={() => void finalizarContrato(c.id)}>
                  Finalizar
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function FormPropiedad({
  onSave,
}: {
  onSave: (d: {
    titulo: string
    direccion: string
    tipo: string
    precioAlquiler: string
    propietario: ClienteOption | null
  }) => void
}) {
  const [titulo, setTitulo] = useState("")
  const [direccion, setDireccion] = useState("")
  const [tipo, setTipo] = useState("depto")
  const [precio, setPrecio] = useState("")
  const [propietario, setPropietario] = useState<ClienteOption | null>(null)

  return (
    <div className="space-y-3">
      <div>
        <Label>Título</Label>
        <Input value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="Depto 4B Palermo" />
      </div>
      <div>
        <Label>Dirección</Label>
        <Input value={direccion} onChange={(e) => setDireccion(e.target.value)} />
      </div>
      <div>
        <Label>Tipo</Label>
        <Select value={tipo} onValueChange={setTipo}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="depto">Departamento</SelectItem>
            <SelectItem value="casa">Casa</SelectItem>
            <SelectItem value="local">Local</SelectItem>
            <SelectItem value="ph">PH</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label>Precio alquiler ref. (ARS)</Label>
        <Input type="number" value={precio} onChange={(e) => setPrecio(e.target.value)} />
      </div>
      <NicheClientePicker value={propietario?.id ?? null} onChange={setPropietario} label="Propietario" />
      <Button
        className="w-full"
        disabled={!titulo.trim() || !direccion.trim()}
        onClick={() => {
          onSave({ titulo, direccion, tipo, precioAlquiler: precio, propietario })
          setTitulo("")
          setDireccion("")
          setPrecio("")
          setPropietario(null)
        }}
      >
        Guardar propiedad
      </Button>
    </div>
  )
}

function FormContrato({
  propiedades,
  onSave,
}: {
  propiedades: Propiedad[]
  onSave: (d: {
    propiedadId: number
    inquilino: ClienteOption | null
    propietario: ClienteOption | null
    montoMensual: string
    fechaInicio: string
    fechaFin: string
    diaVencimiento: string
  }) => void
}) {
  const [propiedadId, setPropiedadId] = useState(String(propiedades[0]?.id ?? ""))
  const [inquilino, setInquilino] = useState<ClienteOption | null>(null)
  const [propietario, setPropietario] = useState<ClienteOption | null>(null)
  const [monto, setMonto] = useState("")
  const [fechaInicio, setFechaInicio] = useState(new Date().toISOString().slice(0, 10))
  const [fechaFin, setFechaFin] = useState("")
  const [diaVencimiento, setDiaVencimiento] = useState("10")

  return (
    <div className="space-y-3">
      <div>
        <Label>Propiedad</Label>
        <Select value={propiedadId} onValueChange={setPropiedadId}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            {propiedades.map((p) => (
              <SelectItem key={p.id} value={String(p.id)}>
                {p.titulo} — {p.direccion}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <NicheClientePicker value={inquilino?.id ?? null} onChange={setInquilino} label="Inquilino" required />
      <NicheClientePicker value={propietario?.id ?? null} onChange={setPropietario} label="Propietario (opcional)" />
      <div>
        <Label>Alquiler mensual (ARS)</Label>
        <Input type="number" value={monto} onChange={(e) => setMonto(e.target.value)} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Inicio</Label>
          <Input type="date" value={fechaInicio} onChange={(e) => setFechaInicio(e.target.value)} />
        </div>
        <div>
          <Label>Fin</Label>
          <Input type="date" value={fechaFin} onChange={(e) => setFechaFin(e.target.value)} />
        </div>
      </div>
      <div>
        <Label>Día vencimiento mensual</Label>
        <Input type="number" min={1} max={28} value={diaVencimiento} onChange={(e) => setDiaVencimiento(e.target.value)} />
      </div>
      <Button
        className="w-full"
        disabled={!propiedadId || !inquilino || !monto || !fechaFin}
        onClick={() => {
          onSave({
            propiedadId: Number(propiedadId),
            inquilino,
            propietario,
            montoMensual: monto,
            fechaInicio,
            fechaFin,
            diaVencimiento,
          })
        }}
      >
        Activar contrato
      </Button>
    </div>
  )
}