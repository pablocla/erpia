"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import {
  Wrench,
  Plus,
  Search,
  Calendar,
  CheckCircle2,
  Clock,
  ExternalLink,
  Users,
  DollarSign,
  Phone,
  MapPin,
  Sparkles,
  Share2,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { authFetch } from "@/lib/stores/auth-store"
import { useToast } from "@/hooks/use-toast"

import { PaywallTriggerBanner } from "@/components/billing/paywall-trigger-banner"

const fmt = (n: number) =>
  n.toLocaleString("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 })

interface Trabajo {
  id: string
  tokenPublico: string
  numero: number
  tipoOficio: string
  titulo: string
  descripcion?: string
  direccion?: string
  fechaPactada?: string
  estado: "PRESUPUESTADO" | "CONFIRMADO" | "EN_CURSO" | "FINALIZADO" | "CANCELADO" | "EN_GARANTIA"
  montoAcordado?: number
  porcentajeSena: number
  senaPagada: boolean
  saldoPagado: boolean
  cliente?: {
    id: number
    nombre: string
    telefono?: string
    direccion?: string
  }
  asignaciones?: Array<{
    operario: {
      nombre: string
      rol: string
    }
  }>
}

export default function OficiosDashboardPage() {
  const { toast } = useToast()
  const [trabajos, setTrabajos] = useState<Trabajo[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState("")
  const [filtroEstado, setFiltroEstado] = useState<string>("TODOS")

  async function cargarTrabajos() {
    setLoading(true)
    try {
      const res = await authFetch("/api/oficios/trabajos")
      if (res.ok) {
        const json = await res.json()
        setTrabajos(json.data || [])
      }
    } catch (e) {
      toast({
        title: "Error al cargar trabajos",
        description: "No se pudieron obtener los datos del servidor.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    cargarTrabajos()
  }, [])

  const filtrados = trabajos.filter((t) => {
    const matchQuery =
      t.titulo.toLowerCase().includes(query.toLowerCase()) ||
      t.cliente?.nombre.toLowerCase().includes(query.toLowerCase()) ||
      t.direccion?.toLowerCase().includes(query.toLowerCase())
    const matchEstado = filtroEstado === "TODOS" || t.estado === filtroEstado
    return matchQuery && matchEstado
  })

  const totalPresupuestado = trabajos
    .filter((t) => t.estado === "PRESUPUESTADO")
    .reduce((acc, t) => acc + Number(t.montoAcordado || 0), 0)

  const totalEnCurso = trabajos
    .filter((t) => t.estado === "CONFIRMADO" || t.estado === "EN_CURSO")
    .reduce((acc, t) => acc + Number(t.montoAcordado || 0), 0)

  const totalCobradoSena = trabajos
    .filter((t) => t.senaPagada)
    .reduce((acc, t) => acc + (Number(t.montoAcordado || 0) * t.porcentajeSena) / 100, 0)

  function copiarLinkPublico(token: string) {
    const url = `${window.location.origin}/p/trabajo/${token}`
    navigator.clipboard.writeText(url)
    toast({
      title: "¡Link de presupuesto copiado!",
      description: "Pegalo en WhatsApp para que tu cliente elija la opción y pague la seña.",
    })
  }

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <Wrench className="h-6 w-6" />
            </span>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Claver Oficios & Obras</h1>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Presupuestos en 3 niveles, señas con Mercado Pago y cuadrilla en tiempo real.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/dashboard/oficios/cuadrilla">
            <Button variant="outline" className="gap-2">
              <Users className="h-4 w-4" />
              Cuadrilla
            </Button>
          </Link>
          <Link href="/dashboard/oficios/nuevo">
            <Button className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm">
              <Plus className="h-4 w-4" />
              Nuevo Presupuesto
            </Button>
          </Link>
        </div>
      </div>

      {/* Paywall Contextual Upsell */}
      {trabajos.length > 0 && (
        <PaywallTriggerBanner
          disparoKey="sena_link_mp"
          badgeText="Máxima Conversión"
          headline="Cobrá la seña online en tus presupuestos con tarjeta y débito"
          subheadline="Tus clientes confirman el trabajo en 1 clic pagando la seña por Mercado Pago directo desde el link público."
          ctaText="Activar Seña Online"
          variant="indigo"
        />
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-l-4 border-l-amber-500">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase flex items-center justify-between">
              Presupuestos Enviados
              <Clock className="h-4 w-4 text-amber-500" />
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-bold">{fmt(totalPresupuestado)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {trabajos.filter((t) => t.estado === "PRESUPUESTADO").length} clientes evaluando cotización
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-emerald-500">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase flex items-center justify-between">
              Señas Cobradas (MP / Efectivo)
              <DollarSign className="h-4 w-4 text-emerald-500" />
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              {fmt(totalCobradoSena)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {trabajos.filter((t) => t.senaPagada).length} señas aseguradas
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase flex items-center justify-between">
              Obras en Ejecución
              <CheckCircle2 className="h-4 w-4 text-blue-500" />
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-bold">{fmt(totalEnCurso)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {trabajos.filter((t) => t.estado === "EN_CURSO" || t.estado === "CONFIRMADO").length} trabajos activos
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filtros y Buscador */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por cliente, título o calle..."
            className="pl-9"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        <div className="flex flex-wrap gap-1.5 w-full sm:w-auto">
          {["TODOS", "PRESUPUESTADO", "CONFIRMADO", "EN_CURSO", "FINALIZADO"].map((est) => (
            <Button
              key={est}
              variant={filtroEstado === est ? "default" : "outline"}
              size="sm"
              onClick={() => setFiltroEstado(est)}
              className="text-xs"
            >
              {est === "TODOS"
                ? "Todos"
                : est === "PRESUPUESTADO"
                ? "Presupuestos"
                : est === "CONFIRMADO"
                ? "Señados"
                : est === "EN_CURSO"
                ? "En Obra"
                : "Finalizados"}
            </Button>
          ))}
        </div>
      </div>

      {/* Lista de Trabajos */}
      {loading ? (
        <div className="p-12 text-center text-muted-foreground">Cargando trabajos...</div>
      ) : filtrados.length === 0 ? (
        <Card className="border-dashed p-12 text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center mx-auto">
            <Sparkles className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">No hay trabajos registrados</h3>
            <p className="text-sm text-muted-foreground max-w-md mx-auto mt-1">
              Creá tu primer presupuesto en 3 niveles o dictalo por audio para enviárselo a tu cliente por WhatsApp.
            </p>
          </div>
          <Link href="/dashboard/oficios/nuevo">
            <Button className="bg-emerald-600 hover:bg-emerald-700 text-white">
              <Plus className="h-4 w-4 mr-2" />
              Crear Presupuesto Express
            </Button>
          </Link>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtrados.map((t) => {
            const badgeVariant =
              t.estado === "FINALIZADO"
                ? "default"
                : t.estado === "EN_CURSO"
                ? "secondary"
                : t.estado === "CONFIRMADO"
                ? "outline"
                : "destructive"

            return (
              <Card key={t.id} className="hover:border-emerald-500/50 transition-all flex flex-col justify-between">
                <CardHeader className="p-4 pb-2 space-y-2">
                  <div className="flex items-center justify-between">
                    <Badge variant={badgeVariant} className="text-[11px] uppercase">
                      {t.estado}
                    </Badge>
                    <span className="text-xs text-muted-foreground font-mono">#{t.numero}</span>
                  </div>
                  <CardTitle className="text-base line-clamp-1">{t.titulo}</CardTitle>
                </CardHeader>

                <CardContent className="p-4 pt-0 space-y-3 text-sm">
                  {t.cliente && (
                    <div className="flex items-center gap-2 text-muted-foreground text-xs">
                      <span className="font-semibold text-foreground">{t.cliente.nombre}</span>
                      {t.cliente.telefono && (
                        <span className="flex items-center gap-1">
                          <Phone className="h-3 w-3" /> {t.cliente.telefono}
                        </span>
                      )}
                    </div>
                  )}

                  {t.direccion && (
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground line-clamp-1">
                      <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                      <span>{t.direccion}</span>
                    </div>
                  )}

                  <div className="pt-2 border-t flex items-center justify-between">
                    <div>
                      <span className="text-[11px] text-muted-foreground block">Monto / Seña</span>
                      <span className="font-bold text-base">
                        {t.montoAcordado ? fmt(Number(t.montoAcordado)) : "A definir"}
                      </span>
                    </div>

                    <div className="text-right">
                      <Badge
                        variant="outline"
                        className={t.senaPagada ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/30" : ""}
                      >
                        {t.senaPagada ? "Seña Paga" : `${t.porcentajeSena}% Seña Pendiente`}
                      </Badge>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-2">
                    <Link href={`/dashboard/oficios/${t.id}`} className="flex-1">
                      <Button variant="outline" size="sm" className="w-full text-xs">
                        Abrir Ficha
                      </Button>
                    </Link>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copiarLinkPublico(t.tokenPublico)}
                      title="Copiar link interactivo para WhatsApp"
                      className="px-2.5 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
                    >
                      <Share2 className="h-4 w-4" />
                    </Button>

                    <Link href={`/p/trabajo/${t.tokenPublico}`} target="_blank" title="Ver como cliente">
                      <Button variant="ghost" size="sm" className="px-2.5 text-muted-foreground">
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
