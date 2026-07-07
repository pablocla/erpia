"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import {
  AlertTriangle,
  ChevronDown,
  Clock,
  FileEdit,
  Sparkles,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useAuthStore } from "@/lib/stores/auth-store"
import { authFetch } from "@/lib/stores"
import { formatTrialCountdown } from "@/lib/comercial/trial-service"
import { fmtPrecioArs } from "@/lib/comercial/sub-saas-catalog"
import { contarVentasSuspendidas, POS_SUSPENDIDAS_KEY } from "@/lib/pos/ventas-suspendidas"
import { useToast } from "@/hooks/use-toast"
import { useComercialAccess } from "@/hooks/use-comercial-access"

const POS_DRAFT_KEY = "erp:pos:draft:v1"
const MI_PLAN_HREF = "/dashboard/mi-plan"
const ROLES_DRAFT = new Set(["cajero", "vendedor", "vendedor_ruta", "gerente", "dueno", "admin"])
const ROLES_CAJA_ALERTA = new Set(["gerente", "dueno", "admin"])
const HORAS_LIMITE_CAJA = 12

type AlertTone = "destructive" | "warning" | "info" | "primary"

type AlertDef = {
  id: string
  priority: number
  title: string
  description: string
  tone: AlertTone
}

export function DashboardAlertsHub() {
  const token = useAuthStore((s) => s.token)
  const rol = useAuthStore((s) => s.user?.rol ?? "")
  const { toast } = useToast()
  const { trial, access } = useComercialAccess()

  const [expanded, setExpanded] = useState(false)
  const [subscribing, setSubscribing] = useState(false)
  const [cajasViejas, setCajasViejas] = useState(0)
  const [draftTotal, setDraftTotal] = useState(0)

  useEffect(() => {
    if (!token || !ROLES_CAJA_ALERTA.has(rol)) return
    const cargar = async () => {
      try {
        const res = await fetch("/api/caja?estado=abierta", {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (!res.ok) return
        const data = (await res.json()) as { fecha: string }[]
        const limite = Date.now() - HORAS_LIMITE_CAJA * 60 * 60 * 1000
        setCajasViejas(
          (Array.isArray(data) ? data : []).filter((c) => new Date(c.fecha).getTime() < limite).length,
        )
      } catch {
        /* silencioso */
      }
    }
    void cargar()
    const interval = setInterval(() => void cargar(), 5 * 60_000)
    return () => clearInterval(interval)
  }, [token, rol])

  useEffect(() => {
    if (!ROLES_DRAFT.has(rol)) return
    const refresh = () => {
      let total = contarVentasSuspendidas()
      try {
        const raw = localStorage.getItem(POS_DRAFT_KEY)
        if (raw && raw !== "{}") total += 1
      } catch {
        /* ignore */
      }
      setDraftTotal(total)
    }
    refresh()
    const onStorage = (e: StorageEvent) => {
      if (!e.key || e.key === POS_SUSPENDIDAS_KEY || e.key === POS_DRAFT_KEY) refresh()
    }
    window.addEventListener("storage", onStorage)
    const interval = setInterval(refresh, 30_000)
    return () => {
      window.removeEventListener("storage", onStorage)
      clearInterval(interval)
    }
  }, [rol])

  async function iniciarSuscripcion() {
    setSubscribing(true)
    try {
      const endpoint =
        (access?.precioUpgradeArs ?? 0) > 0
          ? "/api/billing/create-subscription"
          : "/api/billing/subscribe"
      const res = await authFetch(endpoint, {
        method: "POST",
        body:
          endpoint === "/api/billing/subscribe"
            ? JSON.stringify({ sku: access?.upsellSkus?.[0]?.sku })
            : undefined,
      })
      const data = await res.json()
      if (res.ok && data.init_point) {
        window.location.href = data.init_point as string
        return
      }
      if (res.ok && data.free) {
        toast({ title: data.message ?? "Módulo activado" })
        window.location.reload()
        return
      }
      throw new Error(data.error ?? "No se pudo iniciar el pago")
    } catch (e) {
      toast({
        title: "Error al suscribir",
        description: e instanceof Error ? e.message : "Intentá de nuevo",
        variant: "destructive",
      })
    } finally {
      setSubscribing(false)
    }
  }

  const alerts: AlertDef[] = []
  const monetizadosEnTrial = (access?.monetizados ?? []).filter((m) => m.enTrial && !m.gratisPermanente)
  const monetizadosExpirados = (access?.monetizados ?? []).filter((m) => m.expirado && !m.gratisPermanente)
  const showTrialAlert =
    !access?.mpAutorizado &&
    (Boolean(trial && (trial.activo || trial.expirado)) ||
      monetizadosEnTrial.length > 0 ||
      monetizadosExpirados.length > 0)

  if (showTrialAlert && trial) {
    const vencido = trial.expirado || monetizadosExpirados.length > 0
    const urgente = !vencido && trial.diasRestantes <= 3
    const titulo = vencido
      ? access?.tieneAnclaGratis
        ? "Trial de caja y stock finalizado"
        : "Tu período de prueba terminó"
      : access?.tieneAnclaGratis
        ? `Libreta gratis · POS en trial — ${formatTrialCountdown(trial.diasRestantes)}`
        : `Prueba gratis — ${formatTrialCountdown(trial.diasRestantes)}`

    alerts.push({
      id: "trial",
      priority: vencido ? 100 : urgente ? 80 : 50,
      title: titulo,
      description:
        access?.ofertaLema ??
        (vencido
          ? "Activá tu plan para seguir operando sin límites."
          : `Vence el ${new Intl.DateTimeFormat("es-AR", { day: "2-digit", month: "2-digit", year: "numeric" }).format(new Date(trial.expiresAt))}.`),
      tone: vencido ? "destructive" : urgente ? "warning" : "primary",
    })
  }

  if (cajasViejas > 0) {
    alerts.push({
      id: "cajas",
      priority: 70,
      title: `${cajasViejas} caja(s) abierta(s) hace más de ${HORAS_LIMITE_CAJA} h`,
      description: "Cerrá o arqueá los turnos vencidos para evitar diferencias.",
      tone: "warning",
    })
  }
  if (draftTotal > 0) {
    alerts.push({
      id: "draft",
      priority: 60,
      title: `Borradores pendientes (${draftTotal})`,
      description: "Tenés ventas suspendidas o un carrito POS sin finalizar.",
      tone: "info",
    })
  }

  alerts.sort((a, b) => b.priority - a.priority)

  if (alerts.length === 0) return null

  const primary = alerts[0]
  const secondary = alerts.slice(1)

  const toneClass: Record<AlertTone, string> = {
    destructive: "border-destructive/40 bg-destructive/10",
    warning: "border-amber-500/40 bg-amber-500/10",
    info: "border-border/60 bg-muted/40",
    primary: "border-primary/30 bg-primary/5",
  }

  function renderActions(alert: AlertDef) {
    if (alert.id === "trial") {
      const vencido = trial?.expirado || monetizadosExpirados.length > 0
      const urgente = trial && trial.diasRestantes <= 3 && trial.activo
      const precio = access?.precioUpgradeArs ?? 0
      return (
        <div className="flex shrink-0 items-center gap-2 flex-wrap">
          {precio > 0 ? (
            <Button
              size="sm"
              variant={vencido || urgente ? "default" : "outline"}
              onClick={() => void iniciarSuscripcion()}
              disabled={subscribing}
            >
              {subscribing ? "Redirigiendo…" : vencido ? `Activar · ${fmtPrecioArs(precio)}` : `Pagar · ${fmtPrecioArs(precio)}`}
            </Button>
          ) : (
            <Button size="sm" variant="outline" asChild>
              <Link href={MI_PLAN_HREF}>Ver planes</Link>
            </Button>
          )}
          <Button size="sm" variant="ghost" asChild>
            <Link href={MI_PLAN_HREF}>Mi plan</Link>
          </Button>
        </div>
      )
    }
    if (alert.id === "cajas") {
      return (
        <Button asChild size="sm" variant="outline">
          <Link href="/dashboard/caja">Ver cajas</Link>
        </Button>
      )
    }
    if (alert.id === "draft") {
      return (
        <Button asChild size="sm" variant="outline">
          <Link href="/dashboard/pos">Continuar en POS</Link>
        </Button>
      )
    }
    return null
  }

  function renderIcon(alert: AlertDef) {
    if (alert.id === "trial") {
      return alert.tone === "destructive" ? (
        <Clock className="h-4 w-4 text-destructive" />
      ) : (
        <Sparkles className="h-4 w-4 text-primary" />
      )
    }
    if (alert.id === "cajas") return <AlertTriangle className="h-4 w-4 text-amber-600" />
    if (alert.id === "draft") return <FileEdit className="h-4 w-4 text-primary" />
    return <Sparkles className="h-4 w-4 text-primary" />
  }

  return (
    <div className="space-y-2" role="status">
      <div
        className={cn(
          "flex flex-col gap-3 rounded-xl border px-4 py-3 sm:flex-row sm:items-center sm:justify-between",
          toneClass[primary.tone],
        )}
      >
        <div className="flex items-start gap-3 min-w-0">
          <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-background/60">
            {renderIcon(primary)}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium">{primary.title}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{primary.description}</p>
          </div>
        </div>
        {renderActions(primary)}
      </div>

      {secondary.length > 0 && (
        <div>
          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            className="flex w-full items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-colors"
          >
            <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", expanded && "rotate-180")} />
            {expanded ? "Ocultar avisos" : `${secondary.length} aviso${secondary.length !== 1 ? "s" : ""} más`}
          </button>
          {expanded && (
            <div className="mt-1 space-y-2 pl-1">
              {secondary.map((alert) => (
                <div
                  key={alert.id}
                  className="flex flex-col gap-2 rounded-lg border border-border/50 bg-muted/30 px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <p className="text-xs font-medium">{alert.title}</p>
                    <p className="text-[11px] text-muted-foreground">{alert.description}</p>
                  </div>
                  {renderActions(alert)}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}