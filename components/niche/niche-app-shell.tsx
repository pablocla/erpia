"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import {
  ArrowRight,
  Banknote,
  Link2,
  MessageCircle,
  Plus,
  RefreshCw,
  Search,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
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
import type { NicheAppDefinition } from "@/lib/niche/types"
import { NicheConsorciosPanel } from "@/components/niche/niche-consorcios-panel"
import { NicheCuotasPanelV2 } from "@/components/niche/niche-cuotas-panel-v2"
import { NicheMovimientosPanelV2 } from "@/components/niche/niche-movimientos-panel-v2"
import { NicheClientePicker, type ClienteOption } from "./niche-cliente-picker"
import { AppExperienceHeader } from "@/components/app-experience/app-experience-header"
import { getNicheExperience } from "@/lib/comercial/app-experience"
import { getNicheLabels, getWorkflowEstados, labelEstado } from "@/lib/niche/niche-labels"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

const fmt = (n: number) =>
  n.toLocaleString("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 })

type Movimiento = {
  id: number
  titulo: string
  categoria: string
  monto: string | number
  estado: string
  periodo: string | null
  metadata?: { numero?: string } | null
  cliente?: { id: number; nombre: string; telefono: string | null } | null
}

type Resumen = {
  total: number
  pendientes: number
  pagados: number
  montoPendiente: number
  montoTotal: number
}

type MembresiaRow = {
  id: number
  estado: string
  clienteId?: number
  cliente: { id: number; nombre: string; telefono: string | null }
  plan: { nombre: string; precio: number }
}

export function NicheAppShell({ app }: { app: NicheAppDefinition }) {
  if (app.engine === "consorcio") {
    return <NicheConsorciosPanel app={app} />
  }

  if (app.redirectPath) {
    const guide = getNicheExperience(app.appId)
    return (
      <div className="p-4 md:p-6 space-y-4 max-w-5xl mx-auto">
        {guide && <AppExperienceHeader guide={guide} compact />}
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="pt-4 text-sm">
            Estás en <strong>{app.nombre}</strong>. El proceso completo abre en el módulo del ERP.
          </CardContent>
        </Card>
        <Button asChild size="lg" className="w-full sm:w-auto min-h-11">
          <Link href={app.redirectPath}>
            Ir a {app.nombre}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </div>
    )
  }

  if (app.engine === "cuotas") {
    return <NicheCuotasPanel app={app} />
  }

  return <NicheMovimientosPanelV2 app={app} />
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full px-3 py-1.5 text-xs font-medium border transition-colors min-h-9",
        active
          ? "bg-primary text-primary-foreground border-primary"
          : "bg-background text-muted-foreground hover:bg-muted",
      )}
    >
      {children}
    </button>
  )
}

function NicheCuotasPanel({ app }: { app: NicheAppDefinition }) {
  const labels = getNicheLabels(app.appId)
  const [membresias, setMembresias] = useState<MembresiaRow[]>([])
  const [movimientos, setMovimientos] = useState<Movimiento[]>([])
  const [resumen, setResumen] = useState<Resumen | null>(null)
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const [monto, setMonto] = useState("")
  const [cliente, setCliente] = useState<ClienteOption | null>(null)
  const [q, setQ] = useState("")
  const [filtro, setFiltro] = useState<"todos" | "pendiente" | "pagado">("todos")
  const [busyId, setBusyId] = useState<number | null>(null)

  const cargar = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/niche/${app.appId}`, { headers: getAuthHeaders() })
      if (res.ok) {
        const data = await res.json()
        setMembresias(data.membresias ?? [])
        setMovimientos(data.movimientos ?? [])
        setResumen(data.resumen ?? null)
      }
    } finally {
      setLoading(false)
    }
  }, [app.appId])

  useEffect(() => {
    void cargar()
  }, [cargar])

  const filtrados = useMemo(() => {
    const qq = q.trim().toLowerCase()
    return movimientos.filter((m) => {
      if (filtro === "pendiente" && m.estado !== "pendiente") return false
      if (filtro === "pagado" && m.estado !== "pagado") return false
      if (!qq) return true
      const hay =
        m.titulo.toLowerCase().includes(qq) ||
        (m.cliente?.nombre ?? "").toLowerCase().includes(qq) ||
        (m.cliente?.telefono ?? "").includes(qq) ||
        (m.periodo ?? "").includes(qq)
      return hay
    })
  }, [movimientos, q, filtro])

  const pendientesCount = movimientos.filter((m) => m.estado === "pendiente").length

  async function registrarCuota() {
    if (!cliente) {
      toast.error(`Seleccioná un ${labels.socio.toLowerCase()}`)
      return
    }
    const res = await fetch(`/api/niche/${app.appId}`, {
      method: "POST",
      headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "cuota",
        clienteId: cliente.id,
        monto: Number(monto) || app.precioArs,
        periodo: new Date().toISOString().slice(0, 7),
      }),
    })
    if (res.ok) {
      toast.success(`${labels.cuota} registrada`)
      setOpen(false)
      setMonto("")
      setCliente(null)
      void cargar()
    } else {
      toast.error("Error al guardar")
    }
  }

  async function cobrar(id: number) {
    setBusyId(id)
    try {
      const res = await fetch(`/api/niche/${app.appId}`, {
        method: "POST",
        headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify({ action: "cobrar_cuota", id }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast.error(data.error ?? "No se pudo cobrar")
        return
      }
      toast.success("Cobro registrado")
      void cargar()
    } finally {
      setBusyId(null)
    }
  }

  async function avisar(id: number) {
    setBusyId(id)
    try {
      const res = await fetch(`/api/niche/${app.appId}`, {
        method: "POST",
        headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify({ action: "avisar_cuota", id }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast.error(data.error ?? "WhatsApp no disponible")
        if (data.linkPago) {
          try {
            await navigator.clipboard.writeText(data.linkPago)
            toast.message("Link de pago copiado")
          } catch { /* */ }
        }
        return
      }
      toast.success(data.linkPago ? "WA + link de pago" : "WhatsApp encolado")
    } finally {
      setBusyId(null)
    }
  }

  async function linkMp(id: number) {
    setBusyId(id)
    try {
      const res = await fetch(`/api/niche/${app.appId}`, {
        method: "POST",
        headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify({ action: "link_pago_cuota", id }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok || !data.linkPago) {
        toast.error(data.error ?? "Configurá Mercado Pago")
        return
      }
      try {
        await navigator.clipboard.writeText(data.linkPago)
        toast.success("Link copiado")
      } catch {
        toast.success("Link generado")
      }
      window.open(data.linkPago as string, "_blank")
    } finally {
      setBusyId(null)
    }
  }

  async function avisarMorosos() {
    const pend = movimientos.filter((m) => m.estado === "pendiente" && m.cliente?.telefono)
    if (pend.length === 0) {
      toast.message("No hay morosos con teléfono")
      return
    }
    const res = await fetch(`/api/niche/${app.appId}`, {
      method: "POST",
      headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "whatsapp_masivo",
        mensaje: app.plantillaWhatsApp ?? "Recordatorio de cuota pendiente",
        soloPendientes: true,
      }),
    })
    if (res.ok) {
      const data = await res.json().catch(() => ({}))
      toast.success(`Avisos encolados (${data.enviados ?? pend.length} dest.)`)
    } else toast.error("Error al avisar")
  }

  async function cuotaMesTodos() {
    const montoN = Number(monto) || app.precioArs
    if (!confirm(`¿Generar ${labels.cuota.toLowerCase()} del mes a todos los activos por ${fmt(montoN)}?`)) {
      return
    }
    const res = await fetch(`/api/niche/${app.appId}`, {
      method: "POST",
      headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "generar_masiva",
        monto: montoN,
        periodo: new Date().toISOString().slice(0, 7),
      }),
    })
    const data = await res.json().catch(() => ({}))
    if (res.ok) {
      toast.success(`${data.generadas ?? 0} cuotas generadas`)
      void cargar()
    } else toast.error(data.error ?? "Error")
  }

  const guide = getNicheExperience(app.appId)
  const vacio = membresias.length === 0 && movimientos.length === 0

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-5xl mx-auto">
      {guide && (
        <AppExperienceHeader guide={guide} onPrimaryClick={() => setOpen(true)} />
      )}

      <div className="flex flex-wrap gap-2">
        <Button size="sm" className="min-h-10" onClick={() => setOpen(true)}>
          <Plus className="h-4 w-4 mr-1" />
          {app.accionPrincipal}
        </Button>
        <Button size="sm" variant="secondary" className="min-h-10" onClick={() => void avisarMorosos()}>
          <MessageCircle className="h-4 w-4 mr-1" />
          Avisar morosos
          {pendientesCount > 0 && (
            <Badge className="ml-1" variant="destructive">
              {pendientesCount}
            </Badge>
          )}
        </Button>
        <Button size="sm" variant="outline" className="min-h-10" onClick={() => void cuotaMesTodos()}>
          Cuota del mes a todos
        </Button>
        <Button size="sm" variant="outline" className="min-h-10" asChild>
          <Link href="/dashboard/cuentas-cobrar">CxC</Link>
        </Button>
        <Button size="sm" variant="ghost" className="min-h-10" onClick={() => void cargar()} disabled={loading}>
          <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
        </Button>
      </div>

      {resumen && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card>
            <CardContent className="pt-4">
              <p className="text-xs text-muted-foreground">{labels.socioPlural}</p>
              <p className="text-2xl font-semibold">{membresias.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <p className="text-xs text-muted-foreground">Pendientes</p>
              <p className="text-2xl font-semibold text-amber-600">{resumen.pendientes}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <p className="text-xs text-muted-foreground">Cobradas</p>
              <p className="text-2xl font-semibold text-emerald-600">{resumen.pagados}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <p className="text-xs text-muted-foreground">Pendiente $</p>
              <p className="text-lg font-semibold">{fmt(resumen.montoPendiente)}</p>
            </CardContent>
          </Card>
        </div>
      )}

      {vacio ? (
        <Card className="border-dashed border-primary/30">
          <CardContent className="py-10 text-center space-y-4">
            <p className="font-medium">{app.wowMoment}</p>
            <ol className="text-sm text-muted-foreground space-y-1 max-w-sm mx-auto text-left list-decimal list-inside">
              <li>{labels.emptyStep1}</li>
              <li>{labels.emptyStep2}</li>
              <li>{labels.emptyStep3}</li>
            </ol>
            <Button size="lg" className="min-h-11" onClick={() => setOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              {app.accionPrincipal}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                className="pl-9 min-h-10"
                placeholder={labels.buscarPlaceholder}
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
            </div>
            <div className="flex gap-1.5 flex-wrap">
              <FilterChip active={filtro === "todos"} onClick={() => setFiltro("todos")}>
                Todas
              </FilterChip>
              <FilterChip active={filtro === "pendiente"} onClick={() => setFiltro("pendiente")}>
                Pendientes ({pendientesCount})
              </FilterChip>
              <FilterChip active={filtro === "pagado"} onClick={() => setFiltro("pagado")}>
                Pagadas
              </FilterChip>
            </div>
          </div>

          {membresias.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">{labels.socioPlural}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 max-h-48 overflow-y-auto">
                {membresias.slice(0, 12).map((m) => (
                  <div
                    key={m.id}
                    className="flex items-center justify-between gap-2 border rounded-lg px-3 py-2.5 text-sm min-h-11"
                  >
                    <div>
                      <p className="font-medium">{m.cliente.nombre}</p>
                      <p className="text-xs text-muted-foreground">{m.plan.nombre}</p>
                    </div>
                    <Badge variant={m.estado === "activa" ? "default" : "secondary"}>{m.estado}</Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader className="pb-2 sticky top-0 bg-card z-10">
              <CardTitle className="text-base">
                {labels.cuota}s ({filtrados.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {filtrados.length === 0 ? (
                <p className="text-sm text-muted-foreground py-6 text-center">Sin resultados</p>
              ) : (
                filtrados.map((m) => (
                  <div
                    key={m.id}
                    className="flex flex-wrap items-center justify-between gap-2 border rounded-lg px-3 py-2.5"
                  >
                    <div className="min-w-0">
                      <p className="font-medium text-sm truncate">{m.titulo}</p>
                      <p className="text-xs text-muted-foreground">
                        {m.cliente?.nombre ?? "—"} · {m.periodo ?? ""}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-sm font-medium">{fmt(Number(m.monto))}</span>
                      <Badge variant={m.estado === "pendiente" ? "secondary" : "default"}>
                        {labelEstado(m.estado)}
                      </Badge>
                      {m.estado === "pendiente" && (
                        <>
                          <Button
                            size="sm"
                            className="min-h-10"
                            disabled={busyId === m.id}
                            onClick={() => void cobrar(m.id)}
                          >
                            <Banknote className="h-4 w-4 mr-1" />
                            Cobrar
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="min-h-10"
                            disabled={busyId === m.id}
                            onClick={() => void avisar(m.id)}
                          >
                            <MessageCircle className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="min-h-10"
                            disabled={busyId === m.id}
                            onClick={() => void linkMp(m.id)}
                          >
                            <Link2 className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{app.accionPrincipal}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <NicheClientePicker
              value={cliente?.id ?? null}
              onChange={setCliente}
              label={labels.socio}
              required
            />
            <div>
              <Label>Monto (ARS)</Label>
              <Input
                type="number"
                value={monto}
                onChange={(e) => setMonto(e.target.value)}
                placeholder={String(app.precioArs)}
                className="min-h-10"
              />
            </div>
            <Button className="w-full min-h-11" onClick={() => void registrarCuota()}>
              Guardar {labels.cuota.toLowerCase()}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function NicheMovimientosPanel({ app }: { app: NicheAppDefinition }) {
  const estados = getWorkflowEstados(app.appId)
  const [movimientos, setMovimientos] = useState<Movimiento[]>([])
  const [resumen, setResumen] = useState<Resumen | null>(null)
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const [titulo, setTitulo] = useState("")
  const [monto, setMonto] = useState("")
  const [categoria, setCategoria] = useState(app.categorias[0] ?? "movimiento")
  const [cliente, setCliente] = useState<ClienteOption | null>(null)
  const [waMsg, setWaMsg] = useState(app.plantillaWhatsApp ?? "")
  const [q, setQ] = useState("")
  const [filtroEstado, setFiltroEstado] = useState<string>("todos")
  const [busyId, setBusyId] = useState<number | null>(null)
  const necesitaCliente =
    app.categorias.includes("ticket") ||
    app.appId === "plancha" ||
    app.appId === "taller"

  const cargar = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/niche/${app.appId}`, { headers: getAuthHeaders() })
      if (res.ok) {
        const data = await res.json()
        setMovimientos(data.movimientos ?? [])
        setResumen(data.resumen ?? null)
      }
    } finally {
      setLoading(false)
    }
  }, [app.appId])

  useEffect(() => {
    void cargar()
  }, [cargar])

  const filtrados = useMemo(() => {
    const qq = q.trim().toLowerCase()
    return movimientos.filter((m) => {
      if (filtroEstado !== "todos" && m.estado !== filtroEstado) return false
      if (!qq) return true
      return (
        m.titulo.toLowerCase().includes(qq) ||
        m.categoria.toLowerCase().includes(qq) ||
        (m.cliente?.nombre ?? "").toLowerCase().includes(qq) ||
        (m.cliente?.telefono ?? "").includes(qq) ||
        String((m.metadata as { numero?: string } | null)?.numero ?? "").toLowerCase().includes(qq)
      )
    })
  }, [movimientos, q, filtroEstado])

  async function crearRegistro() {
    if (necesitaCliente && !cliente) {
      toast.error("Seleccioná un cliente")
      return
    }
    const res = await fetch(`/api/niche/${app.appId}`, {
      method: "POST",
      headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
      body: JSON.stringify({
        titulo: titulo || app.accionPrincipal,
        monto: Number(monto) || 0,
        categoria,
        clienteId: cliente?.id,
        estado: "pendiente",
      }),
    })
    if (res.ok) {
      toast.success("Registro creado")
      setOpen(false)
      setTitulo("")
      setMonto("")
      setCliente(null)
      void cargar()
    } else toast.error("Error al guardar")
  }

  async function setEstado(id: number, estado: string) {
    setBusyId(id)
    try {
      const res = await fetch(`/api/niche/${app.appId}`, {
        method: "POST",
        headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "marcar_estado",
          id,
          estado,
          avisarWhatsApp: estado === "listo" || estado === "entregado",
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast.error("No se pudo actualizar")
        return
      }
      if (data.whatsappEncolado) toast.success(`${labelEstado(estado)} — WhatsApp encolado`)
      else toast.success(labelEstado(estado))
      void cargar()
    } finally {
      setBusyId(null)
    }
  }

  async function linkMp(id: number) {
    setBusyId(id)
    try {
      const res = await fetch(`/api/niche/${app.appId}`, {
        method: "POST",
        headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify({ action: "link_pago_mov", id }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok || !data.linkPago) {
        toast.error(data.error ?? "MP no configurado")
        return
      }
      try {
        await navigator.clipboard.writeText(data.linkPago)
        toast.success("Link copiado")
      } catch {
        toast.success("Link generado")
      }
      window.open(data.linkPago as string, "_blank")
    } finally {
      setBusyId(null)
    }
  }

  async function whatsappMasivo() {
    const res = await fetch(`/api/niche/${app.appId}`, {
      method: "POST",
      headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "whatsapp_masivo",
        mensaje: waMsg,
        soloPendientes: true,
      }),
    })
    if (res.ok) toast.success("Mensajes a la cola")
    else toast.error("Error WhatsApp masivo")
  }

  const guide = getNicheExperience(app.appId)

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-5xl mx-auto">
      {guide && <AppExperienceHeader guide={guide} onPrimaryClick={() => setOpen(true)} />}

      <div className="flex flex-wrap gap-2">
        <Button size="sm" className="min-h-10" onClick={() => setOpen(true)}>
          <Plus className="h-4 w-4 mr-1" />
          {app.accionPrincipal}
        </Button>
        <Button size="sm" variant="secondary" className="min-h-10" onClick={() => void whatsappMasivo()}>
          <MessageCircle className="h-4 w-4 mr-1" />
          WA pendientes
        </Button>
        <Button size="sm" variant="outline" className="min-h-10" asChild>
          <Link href="/dashboard/clientes">Clientes</Link>
        </Button>
        <Button size="sm" variant="ghost" className="min-h-10" onClick={() => void cargar()} disabled={loading}>
          <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
        </Button>
      </div>

      {resumen && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card>
            <CardContent className="pt-4">
              <p className="text-xs text-muted-foreground">Registros</p>
              <p className="text-xl font-semibold">{resumen.total}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <p className="text-xs text-muted-foreground">Pendientes</p>
              <p className="text-xl font-semibold text-amber-600">{resumen.pendientes}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <p className="text-xs text-muted-foreground">OK / cobrado</p>
              <p className="text-xl font-semibold text-emerald-600">{resumen.pagados}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <p className="text-xs text-muted-foreground">Pendiente $</p>
              <p className="text-lg font-semibold">{fmt(resumen.montoPendiente)}</p>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-9 min-h-10"
            placeholder="Buscar concepto, cliente, teléfono o #ticket…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <Select value={filtroEstado} onValueChange={setFiltroEstado}>
          <SelectTrigger className="w-full sm:w-44 min-h-10">
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos los estados</SelectItem>
            {estados.map((e) => (
              <SelectItem key={e} value={e}>
                {labelEstado(e)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Actividad ({filtrados.length})</CardTitle>
          <Input
            className="text-sm mt-2"
            value={waMsg}
            onChange={(e) => setWaMsg(e.target.value)}
            placeholder="Mensaje WA masivo a pendientes…"
          />
        </CardHeader>
        <CardContent className="space-y-2">
          {filtrados.length === 0 && (
            <div className="py-8 text-center space-y-3">
              <p className="text-sm text-muted-foreground">{app.wowMoment}</p>
              <ol className="text-xs text-muted-foreground space-y-1 max-w-xs mx-auto text-left list-decimal list-inside">
                <li>Creá el registro con {app.accionPrincipal}</li>
                <li>Actualizá el estado (proceso / listo)</li>
                <li>Cobrás o avisás al cliente</li>
              </ol>
              <Button size="sm" className="min-h-10" onClick={() => setOpen(true)}>
                <Plus className="h-4 w-4 mr-1" />
                {app.accionPrincipal}
              </Button>
            </div>
          )}
          {filtrados.map((m) => (
            <div
              key={m.id}
              className="flex flex-wrap items-center justify-between gap-2 border rounded-lg px-3 py-2.5"
            >
              <div className="min-w-0">
                <p className="font-medium text-sm truncate">{m.titulo}</p>
                <p className="text-xs text-muted-foreground">
                  {m.cliente?.nombre ?? "—"} · {m.categoria}
                  {m.periodo ? ` · ${m.periodo}` : ""}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-sm font-medium">{fmt(Number(m.monto))}</span>
                <Badge variant={m.estado === "pendiente" ? "secondary" : "default"}>
                  {labelEstado(m.estado)}
                </Badge>
                {m.estado === "pendiente" && (
                  <>
                    {(app.appId === "plancha" || app.appId === "taller") && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="min-h-10"
                        disabled={busyId === m.id}
                        onClick={() => void setEstado(m.id, "listo")}
                      >
                        Listo
                      </Button>
                    )}
                    <Button
                      size="sm"
                      className="min-h-10"
                      disabled={busyId === m.id}
                      onClick={() => void setEstado(m.id, "pagado")}
                    >
                      Cobrado
                    </Button>
                    {m.cliente?.id && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="min-h-10"
                        disabled={busyId === m.id}
                        onClick={() => void linkMp(m.id)}
                      >
                        <Link2 className="h-4 w-4" />
                      </Button>
                    )}
                  </>
                )}
                {m.estado === "listo" && (
                  <Button
                    size="sm"
                    className="min-h-10"
                    disabled={busyId === m.id}
                    onClick={() => void setEstado(m.id, "entregado")}
                  >
                    Entregar
                  </Button>
                )}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{app.accionPrincipal}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Categoría</Label>
              <Select value={categoria} onValueChange={setCategoria}>
                <SelectTrigger className="min-h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {app.categorias.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Concepto</Label>
              <Input className="min-h-10" value={titulo} onChange={(e) => setTitulo(e.target.value)} />
            </div>
            <div>
              <Label>Monto (ARS)</Label>
              <Input
                type="number"
                className="min-h-10"
                value={monto}
                onChange={(e) => setMonto(e.target.value)}
              />
            </div>
            <NicheClientePicker
              value={cliente?.id ?? null}
              onChange={setCliente}
              required={necesitaCliente}
            />
            <Button className="w-full min-h-11" onClick={() => void crearRegistro()}>
              Guardar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
