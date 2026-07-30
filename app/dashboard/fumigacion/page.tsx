"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import {
  Bug,
  ExternalLink,
  MapPin,
  Navigation,
  Phone,
  Plus,
  RefreshCw,
  Route,
  FileText,
  Users,
  Wallet,
  CalendarDays,
  ClipboardList,
  ChevronUp,
  ChevronDown,
  MessageCircle,
  Sun,
  X,
  UserCheck,
  CheckCircle2,
  Clock,
  Edit,
  Trash2,
  AlertTriangle,
  Calendar,
  FileText,
} from "lucide-react"
import { PageShell, PageHeader } from "@/components/layout"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { CampoMapaLibre, type CampoMapPin } from "@/components/claver-cloud/campo-mapa-libre"
import { OTDialog } from "@/components/ot/ot-dialog"
import { useAuthFetch } from "@/hooks/use-auth-fetch"
import { authFetch } from "@/lib/stores"
import { cn } from "@/lib/utils"
import {
  buildGoogleMapsUrl,
  buildWazeUrl,
  buildAppleMapsUrl,
} from "@/lib/maps/mobile-directions"
import type { FumigacionParada, FumigacionRutaDia } from "@/lib/fumigacion/fumigacion-ruta-service"

const hoyIso = () => new Date().toISOString().slice(0, 10)

function estadoBadgeVariant(estado: string): "default" | "secondary" | "outline" | "destructive" {
  if (estado === "LISTO" || estado === "ENTREGADO") return "default"
  if (estado === "EN_PROCESO") return "secondary"
  if (estado === "CANCELADO") return "destructive"
  return "outline"
}

function estadoLabel(estado: string): string {
  if (estado === "PENDIENTE") return "Pendiente"
  if (estado === "EN_PROCESO") return "En camino / En sitio"
  if (estado === "LISTO") return "Tratado"
  if (estado === "ENTREGADO") return "Cerrado y firmado"
  if (estado === "CANCELADO") return "Omitido"
  return estado
}

function pinEtapa(estado: string): string {
  if (estado === "LISTO" || estado === "ENTREGADO") return "visitada"
  if (estado === "EN_PROCESO") return "visita"
  if (estado === "CANCELADO") return "omitida"
  return "pendiente"
}

function cleanPhoneForWa(phone: string): string {
  const digits = phone.replace(/\D/g, "")
  if (digits.startsWith("54")) return digits
  if (digits.startsWith("0")) return `549${digits.slice(1)}`
  if (digits.length === 10) return `549${digits}`
  return `54${digits}`
}

export default function FumigacionPage() {
  const [fecha, setFecha] = useState(hoyIso())
  const [ruta, setRuta] = useState<FumigacionRutaDia | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [otDialogOpen, setOtDialogOpen] = useState(false)
  const [showHint, setShowHint] = useState(true)
  const [tecnicoFiltro, setTecnicoFiltro] = useState<string>("TODOS")

  // Modal para editar visita seleccionada
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [editingParada, setEditingParada] = useState<FumigacionParada | null>(null)
  const [editForm, setEditForm] = useState({
    estado: "PENDIENTE",
    tecnicoAsignado: "",
    fechaPrometida: hoyIso(),
    descripcion: "",
    observacionesVisita: "",
    montoCobrado: "",
    estadoPago: "PENDIENTE_PAGO",
    fechaVencimientoCertificado: "",
    insumosConsumidos: [] as { productoId: string, cantidad: string, nombre: string }[],
  })
  const [updating, setUpdating] = useState(false)

  const { data: productosRaw } = useAuthFetch<any>("/api/productos")
  const productos = useMemo(() => {
    return Array.isArray(productosRaw) ? productosRaw.filter((p: any) => p.categoria === "Insumos" || p.tipo === "Insumo" || true) : [] // Por ahora todos
  }, [productosRaw])

  const { data: otsRaw, mutate: mutateOts } = useAuthFetch<unknown>("/api/ot")
  const otsCount = useMemo(() => {
    if (Array.isArray(otsRaw)) return otsRaw.length
    const arr = (otsRaw as { ots?: unknown[] } | null)?.ots
    return Array.isArray(arr) ? arr.length : 0
  }, [otsRaw])

  const { data: alertasRaw } = useAuthFetch<any>("/api/fumigacion/alertas")
  const alertasCriticas = useMemo(() => {
    if (!alertasRaw?.alertas) return []
    return alertasRaw.alertas.filter((a: any) => a.diasParaVencer <= 7)
  }, [alertasRaw])

  const cargarRuta = useCallback(async (optimizarProximidad = false) => {
    setLoading(true)
    setError(null)
    try {
      const tecnicoQuery = tecnicoFiltro && tecnicoFiltro !== "TODOS" ? `&tecnico=${encodeURIComponent(tecnicoFiltro)}` : ""
      const proxQuery = optimizarProximidad ? "&optimizarProximidad=true" : ""
      const res = await authFetch(`/api/fumigacion/ruta?fecha=${encodeURIComponent(fecha)}${tecnicoQuery}${proxQuery}`)
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error || "No se pudo cargar la hoja de ruta")
      }
      const data = (await res.json()) as FumigacionRutaDia
      setRuta(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error de red")
      setRuta(null)
    } finally {
      setLoading(false)
    }
  }, [fecha, tecnicoFiltro])

  useEffect(() => {
    void cargarRuta()
  }, [cargarRuta])

  // Helper para seleccionar un día de la semana actual (0=Dom, 1=Lun, ..., 6=Sáb)
  const irADiaSemana = (dayOfWeekTarget: number) => {
    const d = new Date()
    const currentDay = d.getDay() // 0 = Domingo
    const diff = dayOfWeekTarget - (currentDay === 0 ? 7 : currentDay)
    d.setDate(d.getDate() + diff)
    setFecha(d.toISOString().slice(0, 10))
  }

  const pins: CampoMapPin[] = useMemo(() => {
    if (!ruta) return []
    return ruta.paradas
      .filter((p) => p.lat != null && p.lon != null)
      .map((p) => ({
        id: p.id,
        nombre: p.clienteNombre,
        subtitulo: [p.plagaLabel !== "—" ? p.plagaLabel : null, p.direccion].filter(Boolean).join(" · "),
        etapa: pinEtapa(p.estado),
        lat: p.lat as number,
        lon: p.lon as number,
        orden: p.orden,
        selected: selectedId === p.id,
      }))
  }, [ruta, selectedId])

  const selected: FumigacionParada | null =
    ruta?.paradas.find((p) => p.id === selectedId) ?? null

  const stats = useMemo(() => {
    if (!ruta?.paradas) return { total: 0, hechas: 0, pendientes: 0 }
    const total = ruta.paradas.length
    const hechas = ruta.paradas.filter((p) => p.estado === "LISTO" || p.estado === "ENTREGADO").length
    const pendientes = total - hechas
    return { total, hechas, pendientes }
  }, [ruta])

  async function cambiarEstadoRapido(ordenId: number, estado: string) {
    const res = await authFetch(`/api/ot/${ordenId}`, {
      method: "PUT",
      body: JSON.stringify({ estado }),
    })
    if (res.ok) {
      await Promise.all([cargarRuta(), mutateOts()])
    }
  }

  async function reordenarParadas(indexFrom: number, indexTo: number) {
    if (!ruta?.paradas) return
    const newParadas = [...ruta.paradas]
    const [moved] = newParadas.splice(indexFrom, 1)
    newParadas.splice(indexTo, 0, moved)

    // Actualizar localmente de inmediato para UX fluida
    setRuta({
      ...ruta,
      paradas: newParadas.map((p, idx) => ({ ...p, orden: idx + 1, ordenRuta: idx + 1 })),
    })

    // Persistir orden en metadata de cada OT
    try {
      await Promise.all(
        newParadas.map((p, idx) =>
          authFetch(`/api/ot/${p.ordenServicioId}`, {
            method: "PUT",
            body: JSON.stringify({ metadata: { ordenRuta: idx + 1 } }),
          }),
        ),
      )
    } catch {
      await cargarRuta()
    }
  }

  function abrirEdicion(p: FumigacionParada) {
    setEditingParada(p)
    const meta = (p as any).metadata || {}
    setEditForm({
      estado: p.estado as string,
      tecnicoAsignado: p.tecnicoAsignado || "",
      fechaPrometida: p.fechaPrometida?.substring(0, 10) || hoyIso(),
      descripcion: p.descripcion || "",
      observacionesVisita: (meta.observacionesVisita as string) || "",
      montoCobrado: (meta.montoCobrado as string) || "",
      estadoPago: (meta.estadoPago as string) || "PENDIENTE_PAGO",
      fechaVencimientoCertificado: (meta.fechaVencimientoCertificado as string) || "",
      insumosConsumidos: [],
    })
    setEditDialogOpen(true)
  }

  async function guardarEdicion(e: React.FormEvent) {
    e.preventDefault()
    if (!editingParada) return
    setUpdating(true)
    try {
      const res = await authFetch(`/api/ot/${editingParada.ordenServicioId}`, {
        method: "PUT",
        body: JSON.stringify({
          estado: editForm.estado,
          tecnicoAsignado: editForm.tecnicoAsignado || null,
          fechaPrometida: editForm.fechaPrometida,
          titulo: editForm.descripcion || undefined,
          metadata: {
            observacionesVisita: editForm.observacionesVisita,
            montoCobrado: editForm.montoCobrado ? Number(editForm.montoCobrado) : 0,
            estadoPago: editForm.estadoPago,
            fechaVencimientoCertificado: editForm.fechaVencimientoCertificado,
            insumosConsumidos: editForm.insumosConsumidos,
          },
        }),
      })
      if (!res.ok) throw new Error("No se pudo guardar la modificación")
      setEditDialogOpen(false)
      await Promise.all([cargarRuta(), mutateOts()])
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al guardar")
    } finally {
      setUpdating(false)
    }
  }

  async function quitarDeLaRuta(ordenId: number) {
    if (!confirm("¿Quitar esta visita de la hoja de ruta de hoy?")) return
    const res = await authFetch(`/api/ot/${ordenId}`, {
      method: "PUT",
      body: JSON.stringify({ fechaPrometida: null }),
    })
    if (res.ok) {
      setSelectedId(null)
      await Promise.all([cargarRuta(), mutateOts()])
    }
  }

  return (
    <PageShell>
      <PageHeader
        title="Fumigación & Servicios Especiales"
        description="Ruteo diario, emisión de certificados y seguimiento de cobros en campo."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" asChild className="h-11 px-4">
              <Link href="/dashboard/fumigacion/calendario">
                <Calendar className="mr-2 h-4 w-4" />
                Calendario
              </Link>
            </Button>
            <Button size="lg" className="h-11 px-5 text-sm font-semibold touch-target shadow-sm" onClick={() => setOtDialogOpen(true)}>
              <Plus className="mr-2 h-5 w-5" />
              + Nueva visita
            </Button>
            <Button variant="outline" size="lg" className="h-11 px-4 touch-target" onClick={() => void cargarRuta()} disabled={loading}>
              <RefreshCw className={cn("mr-2 h-4 w-4", loading && "animate-spin")} />
              Actualizar
            </Button>
            <Button variant="outline" size="lg" className="h-11 px-4 touch-target bg-green-50 text-green-700 hover:bg-green-100 hover:text-green-800 border-green-200 dark:bg-green-950/30 dark:text-green-400 dark:border-green-800" onClick={() => {
              const tecnicoQuery = tecnicoFiltro && tecnicoFiltro !== "TODOS" ? `&tecnico=${encodeURIComponent(tecnicoFiltro)}` : ""
              window.open(`/api/fumigacion/ruta?fecha=${encodeURIComponent(fecha)}${tecnicoQuery}&export=csv`, "_blank")
            }}>
              <FileText className="mr-2 h-4 w-4" />
              Exportar CSV
            </Button>
          </div>
        }
      />

      {/* Alertas de Vencimiento */}
      {alertasCriticas.length > 0 && (
        <div className="mb-4 flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 dark:bg-red-950/30 dark:border-red-900/50 p-4 text-sm text-red-900 dark:text-red-200">
          <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5 shrink-0" />
          <div className="flex-1">
            <h4 className="font-semibold text-red-800 dark:text-red-300 text-base mb-1">
              Atención: {alertasCriticas.length} certificado{alertasCriticas.length > 1 ? "s" : ""} por vencer
            </h4>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              {alertasCriticas.slice(0, 5).map((alerta: any) => (
                <li key={alerta.otId}>
                  <Link href={`/dashboard/clientes/${alerta.clienteId}`} className="font-medium hover:underline">
                    {alerta.clienteNombre}
                  </Link>
                  {" — "}
                  {alerta.diasParaVencer < 0 
                    ? <span className="font-bold text-red-700 dark:text-red-400">Vencido hace {Math.abs(alerta.diasParaVencer)} días</span>
                    : alerta.diasParaVencer === 0 
                      ? <span className="font-bold text-amber-600 dark:text-amber-400">Vence HOY</span>
                      : <span>Vence en {alerta.diasParaVencer} días</span>
                  }
                  {alerta.telefono && <span className="text-muted-foreground ml-1">({alerta.telefono})</span>}
                </li>
              ))}
              {alertasCriticas.length > 5 && (
                <li className="text-muted-foreground font-medium">...y {alertasCriticas.length - 5} más</li>
              )}
            </ul>
          </div>
        </div>
      )}

      {/* Micro hint para usuarios no técnicos sobre el sol/luna */}
      {showHint && (
        <div className="mb-4 flex items-center justify-between gap-3 rounded-lg border border-amber-300 bg-amber-50 dark:bg-amber-950/40 dark:border-amber-800 p-3 text-sm text-amber-900 dark:text-amber-200">
          <div className="flex items-center gap-2">
            <Sun className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0" />
            <p>
              <strong>¿La pantalla se ve muy oscura?</strong> Tocá el botón de <strong>Sol ☀️ / Luna 🌙</strong> arriba a la derecha en la barra superior para pasar a <strong>modo claro</strong>.
            </p>
          </div>
          <Button variant="ghost" size="icon" className="h-7 w-7 text-amber-800 dark:text-amber-300" onClick={() => setShowHint(false)}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Accesos Rápido y Días de la Semana (Diseño Empaquetado) */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3 bg-muted/20 p-2 rounded-xl border">
        <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto">
          {[
            { label: "+ Visita", icon: Plus, onClick: () => setOtDialogOpen(true), primary: true },
            { href: "/dashboard/clientes", label: "Clientes", icon: Users },
            { href: "/dashboard/ot", label: "Visitas", icon: ClipboardList },
            { href: "/dashboard/cuentas-cobrar", label: "Cobrar CxC", icon: Wallet },
            { href: "/dashboard/ventas", label: "Facturar", icon: FileText },
            { href: "/dashboard/productos", label: "Insumos", icon: Bug },
          ].map((a, idx) => (
            a.onClick ? (
              <Button
                key={idx}
                size="sm"
                className="h-8 gap-1.5 font-bold text-xs bg-primary text-primary-foreground shadow-sm"
                onClick={a.onClick}
              >
                <a.icon className="h-3.5 w-3.5" />
                <span>{a.label}</span>
              </Button>
            ) : (
              <Button
                key={a.href}
                variant="outline"
                size="sm"
                className="h-8 gap-1.5 text-xs font-semibold bg-background"
                asChild
              >
                <Link href={a.href}>
                  <a.icon className="h-3.5 w-3.5 text-muted-foreground" />
                  <span>{a.label}</span>
                </Link>
              </Button>
            )
          ))}
        </div>

        <div className="flex items-center gap-1 overflow-x-auto">
          <span className="text-[11px] font-bold text-muted-foreground mr-1">Día:</span>
          <Button
            variant={fecha === hoyIso() ? "default" : "outline"}
            size="sm"
            className="h-7 px-2.5 text-xs font-bold rounded-md"
            onClick={() => setFecha(hoyIso())}
          >
            Hoy
          </Button>

          {[
            { label: "Lun", dayIdx: 1 },
            { label: "Mar", dayIdx: 2 },
            { label: "Mié", dayIdx: 3 },
            { label: "Jue", dayIdx: 4 },
            { label: "Vie", dayIdx: 5 },
            { label: "Sáb", dayIdx: 6 },
          ].map((d) => (
            <Button
              key={d.label}
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs font-medium rounded-md hover:bg-background"
              onClick={() => irADiaSemana(d.dayIdx)}
            >
              {d.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Barra de Filtro de Fecha, Firmadores & Resumen de Visitas */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-4 bg-muted/30 p-3.5 rounded-xl border shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          <div>
            <label className="text-xs font-semibold text-muted-foreground mb-1 block">Fecha de ruta</label>
            <Input
              type="date"
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
              className="w-[150px] h-9 text-sm font-medium"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-muted-foreground mb-1 block">👤 Quién hace las visitas hoy</label>
            <select
              value={tecnicoFiltro}
              onChange={(e) => setTecnicoFiltro(e.target.value)}
              className="h-9 px-3 text-xs font-medium rounded-md border border-input bg-background text-foreground shadow-sm"
            >
              <option value="TODOS">👥 Todas las personas (Ruta completa)</option>
              <option value="Carina Gallardo">👤 Carina Gallardo</option>
              <option value="Germán Almirón">👤 Germán Almirón</option>
              <option value="Pablo Test">👤 Pablo Test</option>
            </select>
          </div>

          <div className="flex items-center gap-2 self-end pb-0.5">
            <Badge variant="outline" className="h-9 px-3 text-xs gap-1.5 font-medium bg-background">
              <Route className="h-3.5 w-3.5 text-blue-500" />
              <span><strong>{stats.total}</strong> visitas</span>
            </Badge>
            <Badge variant="outline" className="h-9 px-3 text-xs gap-1.5 font-medium bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-300">
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span><strong>{stats.hechas}</strong> tratadas</span>
            </Badge>
            <Badge variant="outline" className="h-9 px-3 text-xs gap-1.5 font-medium bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-300">
              <Clock className="h-3.5 w-3.5" />
              <span><strong>{stats.pendientes}</strong> pendientes</span>
            </Badge>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            className="h-9 gap-1.5 text-xs font-semibold border shadow-sm"
            onClick={() => void cargarRuta(true)}
            disabled={loading}
          >
            <Route className="h-3.5 w-3.5 text-primary" />
            <span>🗺️ Ordenar por cercanía</span>
          </Button>

          {ruta?.googleMapsDirectionsUrl && (
            <Button variant="default" size="sm" className="h-9 gap-1.5 font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm" asChild>
              <a href={ruta.googleMapsDirectionsUrl} target="_blank" rel="noreferrer">
                <Navigation className="h-4 w-4" />
                <span>Ruta en Google Maps</span>
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </Button>
          )}
        </div>
      </div>

      {error && (
        <Card className="mb-4 border-destructive/40 bg-destructive/5">
          <CardContent className="p-4 text-sm text-destructive font-medium flex items-center justify-between">
            <span>{error}</span>
            <Button variant="outline" size="sm" onClick={() => void cargarRuta()}>Reintentar</Button>
          </CardContent>
        </Card>
      )}

      {/* Grid Principal: Mapa a la izquierda / Paradas a la derecha */}
      <div className="grid gap-4 lg:grid-cols-5">
        <Card className="lg:col-span-3 overflow-hidden border-border/70">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2 font-semibold">
              <MapPin className="h-4 w-4 text-primary" />
              Mapa interactivo de visitas
            </CardTitle>
            {ruta && (
              <span className="text-xs text-muted-foreground">
                {ruta.conCoordenadas} en mapa
                {ruta.sinCoordenadas > 0 && (
                  <span className="text-amber-600 font-semibold dark:text-amber-400">
                    {" "}· {ruta.sinCoordenadas} sin dirección
                  </span>
                )}
              </span>
            )}
          </CardHeader>
          <CardContent className="p-0 sm:p-4 pt-0">
            {loading && !ruta ? (
              <div className="min-h-[380px] flex items-center justify-center text-muted-foreground text-sm">
                Cargando mapa de visitas…
              </div>
            ) : pins.length === 0 ? (
              <div className="min-h-[380px] flex flex-col items-center justify-center gap-3 p-6 text-center">
                <Bug className="h-12 w-12 text-muted-foreground/40" />
                <p className="text-sm font-medium text-foreground max-w-sm">
                  No hay visitas con dirección válida para esta fecha.
                </p>
                <p className="text-xs text-muted-foreground max-w-xs">
                  Tocá <strong>+ Nueva visita</strong> arriba y poné la dirección completa del cliente.
                </p>
                <Button size="sm" className="mt-1" onClick={() => setOtDialogOpen(true)}>
                  <Plus className="mr-1.5 h-4 w-4" />
                  Nueva visita
                </Button>
              </div>
            ) : (
              <CampoMapaLibre
                pins={pins}
                routeLine={ruta?.routeLine}
                className="h-[440px]"
                onPinClick={(pin) => setSelectedId(pin.id)}
              />
            )}
          </CardContent>
        </Card>

        {/* Lista de Paradas del Día */}
        <Card className="lg:col-span-2 border-border/70">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-base font-semibold">Paradas a realizar ({ruta?.paradas.length ?? 0})</CardTitle>
            <span className="text-xs text-muted-foreground">Tocá una para ver detalles</span>
          </CardHeader>
          <CardContent className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
            {!ruta?.paradas.length && !loading && (
              <div className="py-12 text-center space-y-2">
                <p className="text-sm text-muted-foreground">Sin visitas programadas para el {fecha}.</p>
                <Button size="sm" variant="outline" onClick={() => setOtDialogOpen(true)}>
                  + Agregar visita hoy
                </Button>
              </div>
            )}
            {ruta?.paradas.map((p, idx) => {
              const isSelected = selectedId === p.id
              const gmapsSingle = buildGoogleMapsUrl(p)

              return (
                <div
                  key={p.id}
                  className={cn(
                    "w-full rounded-xl border p-3 transition text-left flex flex-col gap-2",
                    isSelected
                      ? "border-primary bg-primary/5 ring-1 ring-primary/30"
                      : "border-border/60 hover:border-primary/40 bg-card",
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedId(p.id)}
                      className="flex items-start gap-2.5 text-left flex-1 min-w-0"
                    >
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-violet-600 text-xs font-bold text-white shadow-sm mt-0.5">
                        {p.orden}
                      </span>
                      <div className="min-w-0">
                        <p className="font-semibold text-sm truncate text-foreground">{p.clienteNombre}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {p.numero}
                          {p.plagaLabel !== "—" ? ` · ${p.plagaLabel}` : ""}
                          {p.sitio ? ` (${p.sitio})` : ""}
                        </p>
                      </div>
                    </button>

                    <div className="flex items-center gap-1 shrink-0">
                      <Badge variant={estadoBadgeVariant(p.estado)} className="text-[10px] px-2 py-0.5 font-semibold">
                        {estadoLabel(p.estado)}
                      </Badge>
                      {/* Controles de Reordenamiento Subir/Bajar */}
                      <div className="flex flex-col gap-0.5 ml-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-5 w-5 text-muted-foreground hover:text-foreground"
                          disabled={idx === 0}
                          onClick={() => void reordenarParadas(idx, idx - 1)}
                          title="Subir en la lista"
                        >
                          <ChevronUp className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-5 w-5 text-muted-foreground hover:text-foreground"
                          disabled={idx === (ruta?.paradas.length ?? 0) - 1}
                          onClick={() => void reordenarParadas(idx, idx + 1)}
                          title="Bajar en la lista"
                        >
                          <ChevronDown className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  </div>

                  {p.direccion ? (
                    <p className="text-xs text-muted-foreground flex items-start gap-1">
                      <MapPin className="h-3.5 w-3.5 mt-0.5 shrink-0 text-rose-500" />
                      <span className="truncate">{p.direccion}</span>
                    </p>
                  ) : (
                    <p className="text-xs font-medium text-amber-600 dark:text-amber-400 flex items-center gap-1">
                      ⚠️ Sin dirección — <Link href="/dashboard/clientes" className="underline">cargar en cliente</Link>
                    </p>
                  )}

                  {/* Acciones Rápidas en Tarjeta */}
                  <div className="flex flex-wrap items-center justify-between gap-1.5 pt-1.5 border-t border-border/40 mt-1">
                    <div className="flex items-center gap-1">
                      {gmapsSingle && (
                        <Button variant="outline" size="sm" className="h-7 text-[11px] px-2 gap-1 text-blue-600 dark:text-blue-400 border-blue-200" asChild>
                          <a href={gmapsSingle} target="_blank" rel="noreferrer">
                            <Navigation className="h-3 w-3" />
                            Cómo llegar
                          </a>
                        </Button>
                      )}
                      {p.telefono && (
                        <Button variant="outline" size="sm" className="h-7 text-[11px] px-2 gap-1 text-emerald-600 dark:text-emerald-400 border-emerald-200" asChild>
                          <a href={`https://wa.me/${cleanPhoneForWa(p.telefono)}`} target="_blank" rel="noreferrer">
                            <MessageCircle className="h-3 w-3" />
                            WhatsApp
                          </a>
                        </Button>
                      )}
                      {(p.estado === "LISTO" || p.estado === "ENTREGADO") && (
                        <Button variant="outline" size="sm" className="h-7 text-[11px] px-2 gap-1 text-black dark:text-white border-neutral-300" asChild>
                          <Link href={`/dashboard/fumigacion/certificado/${p.ordenServicioId}`} target="_blank">
                            <FileText className="h-3 w-3" />
                            Certificado
                          </Link>
                        </Button>
                      )}
                    </div>

                    <Button variant="ghost" size="sm" className="h-7 text-[11px] px-2" onClick={() => abrirEdicion(p)}>
                      <Edit className="h-3 w-3 mr-1" />
                      Editar
                    </Button>
                  </div>
                </div>
              )
            })}
          </CardContent>
        </Card>
      </div>

      {/* Detalle Ampliado de la Parada Seleccionada */}
      {selected && (
        <Card className="mt-4 border-primary/40 bg-card shadow-sm">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-violet-600 text-xs font-bold text-white">
                {selected.orden}
              </span>
              Visita #{selected.numero} · {selected.clienteNombre}
            </CardTitle>
            <Badge variant={estadoBadgeVariant(selected.estado)} className="text-xs px-2.5 py-0.5 font-semibold">
              {estadoLabel(selected.estado)}
            </Badge>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-4 items-center justify-between">
            <div className="text-sm space-y-1.5 flex-1 min-w-[240px]">
              {selected.titulo && (
                <p className="font-medium text-foreground">
                  <span className="text-muted-foreground font-normal">Trabajo:</span> {selected.titulo}
                </p>
              )}
              {selected.sitio && (
                <p>
                  <span className="text-muted-foreground">Sitio / unidad:</span> {selected.sitio}
                </p>
              )}
              {selected.plagaLabel !== "—" && (
                <p>
                  <span className="text-muted-foreground">Plaga a tratar:</span> <Badge variant="outline" className="text-xs">{selected.plagaLabel}</Badge>
                </p>
              )}
              {selected.tipoServicioLabel !== "—" && (
                <p>
                  <span className="text-muted-foreground">Tipo de servicio:</span> {selected.tipoServicioLabel}
                </p>
              )}
              {selected.direccion && (
                <p className="flex items-center gap-1.5 font-medium">
                  <MapPin className="h-4 w-4 text-rose-500 shrink-0" />
                  <span>{selected.direccion}</span>
                </p>
              )}
              {selected.tecnicoAsignado && (
                <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <UserCheck className="h-3.5 w-3.5 text-blue-500" />
                  <span>Firmador: <strong>{selected.tecnicoAsignado}</strong></span>
                </p>
              )}
              {selected.observacionesVisita && (
                <div className="rounded-lg border p-2.5 bg-muted/20 text-xs space-y-1">
                  <p className="font-semibold text-foreground">📝 Observaciones del tratamiento:</p>
                  <p className="text-muted-foreground whitespace-pre-line">{selected.observacionesVisita}</p>
                </div>
              )}
              {selected.montoCobrado != null && selected.montoCobrado > 0 && (
                <div className="flex items-center justify-between p-2 rounded-lg border bg-emerald-500/5 text-xs">
                  <span className="font-medium">Monto servicio: <strong>${selected.montoCobrado.toLocaleString("es-AR")}</strong></span>
                  <Badge variant={selected.estadoPago === "COBRADO" ? "default" : "secondary"}>
                    {selected.estadoPago === "COBRADO" ? "✅ Cobrado" : "⏳ Pendiente (CxC)"}
                  </Badge>
                </div>
              )}
              {selected.fechaVencimientoCertificado && (
                <p className="text-xs text-muted-foreground">
                  📅 Vencimiento Certificado / Próximo control: <strong>{selected.fechaVencimientoCertificado}</strong>
                </p>
              )}
            </div>

            {/* Acciones Principales en Ficha de Visita */}
            <div className="flex flex-wrap gap-2 items-center">
              {selected.telefono && (
                <Button variant="outline" size="sm" className="h-9 gap-1.5 text-emerald-600 border-emerald-300 dark:text-emerald-400" asChild>
                  <a href={`https://wa.me/${cleanPhoneForWa(selected.telefono)}`} target="_blank" rel="noreferrer">
                    <MessageCircle className="h-4 w-4" />
                    WhatsApp
                  </a>
                </Button>
              )}

              {/* Menú Desplegable de Cómo Llegar (Google Maps / Waze / Apple Maps) */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="default" size="sm" className="h-9 gap-1.5 font-semibold bg-blue-600 hover:bg-blue-700 text-white">
                    <Navigation className="h-4 w-4" />
                    Cómo llegar
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {buildGoogleMapsUrl(selected) && (
                    <DropdownMenuItem asChild>
                      <a href={buildGoogleMapsUrl(selected)!} target="_blank" rel="noreferrer" className="gap-2 cursor-pointer font-medium">
                        🗺️ Google Maps (Recomendado AR)
                      </a>
                    </DropdownMenuItem>
                  )}
                  {buildWazeUrl(selected) && (
                    <DropdownMenuItem asChild>
                      <a href={buildWazeUrl(selected)!} target="_blank" rel="noreferrer" className="gap-2 cursor-pointer">
                        🚙 Waze
                      </a>
                    </DropdownMenuItem>
                  )}
                  {buildAppleMapsUrl(selected) && (
                    <DropdownMenuItem asChild>
                      <a href={buildAppleMapsUrl(selected)!} target="_blank" rel="noreferrer" className="gap-2 cursor-pointer">
                        🍎 Apple Maps
                      </a>
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Botones de Estado */}
              {selected.estado === "PENDIENTE" && (
                <Button size="sm" className="h-9 bg-blue-600 hover:bg-blue-700 text-white" onClick={() => void cambiarEstadoRapido(selected.ordenServicioId, "EN_PROCESO")}>
                  En camino / sitio
                </Button>
              )}
              {selected.estado === "EN_PROCESO" && (
                <Button size="sm" className="h-9 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold" onClick={() => void cambiarEstadoRapido(selected.ordenServicioId, "LISTO")}>
                  <CheckCircle2 className="mr-1.5 h-4 w-4" />
                  Marcar Tratado
                </Button>
              )}
              {selected.estado === "LISTO" && (
                <Button size="sm" className="h-9 font-semibold" asChild>
                  <Link href={`/dashboard/ventas`}>Facturar abono</Link>
                </Button>
              )}

              <Button variant="outline" size="sm" className="h-9" onClick={() => abrirEdicion(selected)}>
                <Edit className="h-4 w-4 mr-1" />
                Editar
              </Button>

              <Button variant="ghost" size="sm" className="h-9 text-destructive hover:bg-destructive/10" onClick={() => void quitarDeLaRuta(selected.ordenServicioId)}>
                <Trash2 className="h-4 w-4 mr-1" />
                Quitar de hoy
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Modal para Crear Nueva Visita (modo fumigación) */}
      <OTDialog
        open={otDialogOpen}
        onOpenChange={setOtDialogOpen}
        mode="fumigacion"
        onSuccess={() => {
          void cargarRuta()
          void mutateOts()
        }}
      />

      {/* Modal para Editar Visita Existente */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-[440px]">
          <DialogHeader>
            <DialogTitle>Editar visita #{editingParada?.numero}</DialogTitle>
            <DialogDescription>
              {editingParada?.clienteNombre} · {editingParada?.direccion || "Sin dirección"}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={guardarEdicion} className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label>Estado de la visita</Label>
              <select
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
                value={editForm.estado}
                onChange={(e) => setEditForm((p) => ({ ...p, estado: e.target.value }))}
              >
                <option value="PENDIENTE">Pendiente</option>
                <option value="EN_PROCESO">En camino / En sitio</option>
                <option value="LISTO">Tratado (completado)</option>
                <option value="ENTREGADO">Cerrado y firmado</option>
                <option value="CANCELADO">Omitido / Cancelado</option>
              </select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="editFecha">Fecha prometida</Label>
              <Input
                id="editFecha"
                type="date"
                value={editForm.fechaPrometida}
                onChange={(e) => setEditForm((p) => ({ ...p, fechaPrometida: e.target.value }))}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="editTecnico">Persona encargada de la visita (Firmador)</Label>
              <select
                id="editTecnico"
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-xs font-semibold shadow-sm"
                value={editForm.tecnicoAsignado}
                onChange={(e) => setEditForm((p) => ({ ...p, tecnicoAsignado: e.target.value }))}
              >
                <option value="">-- Sin asignar --</option>
                <option value="Carina Gallardo">👤 Carina Gallardo</option>
                <option value="Germán Almirón">👤 Germán Almirón</option>
                <option value="Pablo Test">👤 Pablo Test</option>
              </select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="editObs">Observaciones del tratamiento en el local</Label>
              <Textarea
                id="editObs"
                rows={3}
                placeholder="Ej: Aplicado cebo gel en cocina y depósito. Sin presencia activa de plaga. Certificado firmado."
                value={editForm.observacionesVisita}
                onChange={(e) => setEditForm((p) => ({ ...p, observacionesVisita: e.target.value }))}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-2">
                <Label htmlFor="editMonto">Monto del servicio ($)</Label>
                <Input
                  id="editMonto"
                  type="number"
                  placeholder="Ej: 15000"
                  value={editForm.montoCobrado}
                  onChange={(e) => setEditForm((p) => ({ ...p, montoCobrado: e.target.value }))}
                />
              </div>

              <div className="grid gap-2">
                <Label>Estado del cobro</Label>
                <select
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-xs font-medium shadow-sm"
                  value={editForm.estadoPago}
                  onChange={(e) => setEditForm((p) => ({ ...p, estadoPago: e.target.value }))}
                >
                  <option value="COBRADO">✅ Cobrado en el acto</option>
                  <option value="PENDIENTE_PAGO">⏳ Pendiente (Registrar en Cuentas por Cobrar)</option>
                </select>
              </div>
            </div>

            <div className="grid gap-2 border-t pt-2 mt-2">
              <Label>Insumos Consumidos (Descuento de Stock)</Label>
              {editForm.insumosConsumidos.map((insumo, idx) => (
                <div key={idx} className="flex gap-2 items-center">
                  <span className="text-xs flex-1 truncate">{insumo.nombre}</span>
                  <Input 
                    type="number" 
                    className="w-20 h-7 text-xs" 
                    value={insumo.cantidad} 
                    onChange={e => {
                      const newArr = [...editForm.insumosConsumidos]
                      newArr[idx].cantidad = e.target.value
                      setEditForm(p => ({ ...p, insumosConsumidos: newArr }))
                    }}
                  />
                  <Button type="button" variant="ghost" size="icon" className="h-7 w-7 text-red-500" onClick={() => {
                    const newArr = [...editForm.insumosConsumidos]
                    newArr.splice(idx, 1)
                    setEditForm(p => ({ ...p, insumosConsumidos: newArr }))
                  }}><Trash2 className="h-4 w-4" /></Button>
                </div>
              ))}
              <div className="flex gap-2 items-center">
                <select id="select-insumo" className="flex h-8 w-full rounded-md border border-input bg-background px-3 py-1 text-xs">
                  <option value="">-- Agregar producto --</option>
                  {productos.map((p: any) => (
                    <option key={p.id} value={p.id}>{p.nombre} (Stock: {p.stock})</option>
                  ))}
                </select>
                <Button type="button" variant="secondary" size="sm" onClick={() => {
                  const select = document.getElementById("select-insumo") as HTMLSelectElement
                  if (!select.value) return
                  const p = productos.find((x:any) => String(x.id) === select.value)
                  if (!p) return
                  setEditForm(prev => ({
                    ...prev,
                    insumosConsumidos: [...prev.insumosConsumidos, { productoId: String(p.id), cantidad: "1", nombre: p.nombre }]
                  }))
                  select.value = ""
                }}>Agregar</Button>
              </div>
            </div>

            <div className="grid gap-2 border-t pt-2 mt-2">
              <Label htmlFor="editVencCert">Vencimiento del Certificado / Próxima desinsectación</Label>
              <Input
                id="editVencCert"
                type="date"
                value={editForm.fechaVencimientoCertificado}
                onChange={(e) => setEditForm((p) => ({ ...p, fechaVencimientoCertificado: e.target.value }))}
              />
            </div>

            <DialogFooter className="mt-2">
              <Button type="button" variant="outline" onClick={() => setEditDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={updating}>
                {updating ? "Guardando…" : "Guardar cambios"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </PageShell>
  )
}
