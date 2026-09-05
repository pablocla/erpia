"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import {
  Building2,
  RefreshCw,
  Server,
  ArrowRight,
  BarChart3,
  Search,
  Activity,
  LogIn,
  ExternalLink,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { PageShell, PageHeader, KpiStrip, StatusBadge } from "@/components/layout"
import { PageSkeleton } from "@/components/layout/page-skeleton"
import { EmptyState } from "@/components/ui/empty-state"
import { useAuthStore } from "@/lib/stores"
import type { StatusVariant } from "@/lib/ui/status-map"

type ClienteCard = {
  id: number
  nombre: string
  razonSocial: string
  rubro: string
  entorno: string
  planHosting?: string
  entornos: { codigo: string; estado: string; version: string | null }[]
  metricas: { ticketsAbiertos: number; jobsActivos: number; logsError: number }
}

function authHeaders(): HeadersInit {
  const token = localStorage.getItem("token")
  return token ? { Authorization: `Bearer ${token}` } : {}
}

type OpsKpis = {
  entornosEnError: number
  slaVencidos: number
  readinessPromedio: number
  tenantsEnRiesgo: number
}

function entornoVariant(estado: string): StatusVariant {
  const e = (estado || "").toLowerCase()
  if (e === "activo" || e === "ok" || e === "healthy") return "success"
  if (e === "error" || e === "down" || e === "failed") return "error"
  if (e === "degraded" || e === "warning" || e === "pendiente") return "warning"
  return "neutral"
}

export default function ClaverOperationsSelectorPage() {
  const [clientes, setClientes] = useState<ClienteCard[]>([])
  const [kpis, setKpis] = useState<OpsKpis | null>(null)
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState("")
  const [loadError, setLoadError] = useState("")
  const [impersonatingId, setImpersonatingId] = useState<number | null>(null)
  const login = useAuthStore((s) => s.login)

  const impersonar = async (empresaId: number, targetPath = "/dashboard") => {
    setImpersonatingId(empresaId)
    try {
      const analystToken = localStorage.getItem("token")
      const analystUser = useAuthStore.getState().user
      if (analystToken) sessionStorage.setItem("claver_analyst_token", analystToken)
      if (analystUser) sessionStorage.setItem("claver_analyst_user", JSON.stringify(analystUser))

      const res = await fetch(`/api/claver/tenants/${empresaId}/impersonate`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({ targetPath }),
      })
      if (!res.ok) {
        alert("No se pudo iniciar sesión en el tenant seleccionado.")
        return
      }
      const session = await res.json()
      login(session.token, {
        id: String(analystUser?.id ?? "0"),
        email: analystUser?.email ?? "",
        nombre: `Analista → ${session.empresa.nombre}`,
        rol: "administrador",
        empresaId: session.empresa.id,
        empresaNombre: session.empresa.nombre,
      })
      window.location.href = session.redirectUrl || targetPath
    } finally {
      setImpersonatingId(null)
    }
  }

  const cargar = async () => {
    setLoading(true)
    setLoadError("")
    try {
      const [clientesRes, metricasRes, fleetRes] = await Promise.all([
        fetch("/api/claver/ops/clientes", { headers: authHeaders() }),
        fetch("/api/claver/ops/metricas", { headers: authHeaders() }),
        fetch("/api/claver/superadmin/dashboard", { headers: authHeaders() }),
      ])
      if (clientesRes.ok) {
        const data = await clientesRes.json()
        setClientes(Array.isArray(data.data) ? data.data : [])
      } else {
        setLoadError("No se pudo cargar la lista de tenants.")
      }
      if (metricasRes.ok && fleetRes.ok) {
        const metricas = await metricasRes.json()
        const fleet = await fleetRes.json()
        setKpis({
          entornosEnError: metricas.entornosEnError ?? fleet.totales?.entornosEnError ?? 0,
          slaVencidos: metricas.slaVencidos ?? 0,
          readinessPromedio: fleet.totales?.readinessPromedio ?? 0,
          tenantsEnRiesgo: (fleet.tenants ?? []).filter(
            (t: { entornosError?: number; readinessScore?: number }) =>
              (t.entornosError ?? 0) > 0 || (t.readinessScore ?? 100) < 50,
          ).length,
        })
      }
    } catch {
      setLoadError("Error de conexión al cargar operaciones.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void cargar()
  }, [])

  const filtrados = useMemo(() => {
    const term = q.trim().toLowerCase()
    if (!term) return clientes
    return clientes.filter((c) => {
      const haystack = [c.nombre, c.razonSocial, c.rubro, String(c.id), c.planHosting ?? ""]
        .join(" ")
        .toLowerCase()
      return haystack.includes(term)
    })
  }, [clientes, q])

  if (loading && clientes.length === 0) {
    return <PageSkeleton kpis={4} tableRows={6} tableCols={3} />
  }

  return (
    <PageShell>
      <PageHeader
        variant="surface"
        title="Operations"
        description="Seleccioná un tenant para pipeline, logs y salud operativa. Priorizá los que están en riesgo."
        badge={
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-medium text-primary">
            <Activity className="h-3.5 w-3.5" />
            Torre analista
          </span>
        }
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" size="sm" asChild className="min-h-[40px]">
              <Link href="/claver-cloud/operations/reports">
                <BarChart3 className="h-4 w-4 mr-2" />
                Reports globales
              </Link>
            </Button>
            <Button variant="outline" size="sm" onClick={() => void cargar()} disabled={loading} className="min-h-[40px]">
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
              Actualizar
            </Button>
          </div>
        }
      />

      <KpiStrip
        columns={4}
        items={[
          {
            label: "Entornos en error",
            value: (
              <span
                className={
                  (kpis?.entornosEnError ?? 0) > 0
                    ? "text-[var(--status-error-foreground)]"
                    : undefined
                }
              >
                {kpis?.entornosEnError ?? "—"}
              </span>
            ),
            hint: (kpis?.entornosEnError ?? 0) > 0 ? "Requiere atención" : undefined,
          },
          {
            label: "SLA vencidos",
            value: (
              <span
                className={
                  (kpis?.slaVencidos ?? 0) > 0
                    ? "text-[var(--status-warning-foreground)]"
                    : undefined
                }
              >
                {kpis?.slaVencidos ?? "—"}
              </span>
            ),
          },
          {
            label: "Readiness promedio",
            value: kpis != null ? `${kpis.readinessPromedio}%` : "—",
          },
          {
            label: "Tenants en riesgo",
            value: (
              <span
                className={
                  (kpis?.tenantsEnRiesgo ?? 0) > 0
                    ? "text-[var(--status-warning-foreground)]"
                    : undefined
                }
              >
                {kpis?.tenantsEnRiesgo ?? "—"}
              </span>
            ),
          },
        ]}
      />

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          className="pl-9 min-h-[40px]"
          placeholder="Buscar por nombre, razón social, rubro o ID…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          aria-label="Buscar tenants"
        />
      </div>

      {loadError && (
        <EmptyState
          icon={Server}
          title="No se pudo cargar Operations"
          description={loadError}
          actionLabel="Reintentar"
          onAction={() => void cargar()}
        />
      )}

      {!loadError && filtrados.length === 0 ? (
        <EmptyState
          icon={Building2}
          title={clientes.length === 0 ? "Sin tenants en la consola" : "Ningún tenant coincide"}
          description={
            clientes.length === 0
              ? "Cuando haya organizaciones provisionadas van a aparecer acá para operar."
              : "Probá otro término o limpiá la búsqueda."
          }
          actionLabel={clientes.length === 0 ? "Ir a Provisioning" : "Limpiar búsqueda"}
          onAction={
            clientes.length === 0
              ? () => {
                  window.location.href = "/claver-cloud/provisioning"
                }
              : () => setQ("")
          }
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtrados.map((c) => {
            const hasErrorEnv = c.entornos.some((e) => entornoVariant(e.estado) === "error")
            const openTickets = c.metricas?.ticketsAbiertos ?? 0
            return (
              <Card
                key={c.id}
                className={`hover:border-primary/40 transition-colors ${
                  hasErrorEnv ? "border-[var(--status-error-border)]" : ""
                }`}
              >
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center justify-between gap-2">
                    <span className="flex items-center gap-2 min-w-0">
                      <Building2 className="h-4 w-4 shrink-0 text-muted-foreground" />
                      <span className="truncate">{c.nombre}</span>
                    </span>
                    <Badge variant="outline" className="text-[10px] font-mono shrink-0">
                      ID {c.id}
                    </Badge>
                  </CardTitle>
                  <p className="text-xs text-muted-foreground truncate">
                    {c.razonSocial}
                    {c.rubro ? ` · ${c.rubro}` : ""}
                    {c.planHosting ? ` · ${c.planHosting}` : ""}
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-wrap gap-1.5">
                    {c.entornos.length === 0 ? (
                      <StatusBadge variant="neutral" label="Sin entornos" />
                    ) : (
                      c.entornos.map((e) => (
                        <StatusBadge
                          key={e.codigo}
                          variant={entornoVariant(e.estado)}
                          label={`${e.codigo}: ${e.estado}`}
                        />
                      ))
                    )}
                  </div>

                  <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                    <span>
                      Tickets: <strong className="text-foreground">{openTickets}</strong>
                    </span>
                    <span>
                      Jobs: <strong className="text-foreground">{c.metricas?.jobsActivos ?? 0}</strong>
                    </span>
                    <span>
                      Logs error:{" "}
                      <strong
                        className={
                          (c.metricas?.logsError ?? 0) > 0
                            ? "text-[var(--status-error-foreground)]"
                            : "text-foreground"
                        }
                      >
                        {c.metricas?.logsError ?? 0}
                      </strong>
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      size="sm"
                      className="w-full min-h-[38px] text-xs bg-violet-600 hover:bg-violet-500 font-medium"
                      onClick={() => void impersonar(c.id)}
                      disabled={impersonatingId === c.id}
                    >
                      <LogIn className="h-3.5 w-3.5 mr-1.5" />
                      {impersonatingId === c.id ? "Entrando..." : "Ingresar ERP"}
                    </Button>
                    <Button asChild variant="outline" size="sm" className="w-full min-h-[38px] text-xs">
                      <Link href={`/claver-cloud/operations/${c.id}`} className="flex items-center justify-center gap-1.5">
                        Consola Ops
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                    </Button>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1 border-t border-border/40">
                    <Link href={`/claver-cloud/tenants/${c.id}`} className="hover:text-foreground transition-colors flex items-center gap-1">
                      Ficha Técnica →
                    </Link>
                    <Link href={`/claver-cloud/go-live?empresaId=${c.id}`} className="hover:text-emerald-400 transition-colors flex items-center gap-1">
                      Go-Live Checklist
                    </Link>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </PageShell>
  )
}
