"use client"

import * as React from "react"
import Link from "next/link"
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  Building2,
  CheckCircle2,
  ExternalLink,
  Layers,
  LogIn,
  Plus,
  RefreshCw,
  Rocket,
  Search,
  Server,
  Shield,
  SlidersHorizontal,
  Wrench,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { CloudPageHeader } from "@/components/claver-cloud/cloud-page-header"
import { cloudAuthHeaders } from "@/lib/claver-cloud/auth-headers"
import { useAuthStore } from "@/lib/stores"
import { cn } from "@/lib/utils"
import { EmptyState } from "@/components/ui/empty-state"
import { PageSkeleton } from "@/components/layout/page-skeleton"

type TenantFleetItem = {
  id: number
  nombre: string
  razonSocial: string
  cuit: string | null
  rubro: string
  entorno: string
  planHosting?: string
  entornos: { codigo: string; estado: string; version: string | null }[]
  metricas: { ticketsAbiertos: number; jobsActivos: number; logsError: number }
  readinessScore?: number
  listoGoLive?: boolean
}

export default function ClaverTenantsFleetPage() {
  const [tenants, setTenants] = React.useState<TenantFleetItem[]>([])
  const [loading, setLoading] = React.useState(true)
  const [q, setQ] = React.useState("")
  const [filterState, setFilterState] = React.useState("todos")
  const [impersonatingId, setImpersonatingId] = React.useState<number | null>(null)
  const login = useAuthStore((s) => s.login)

  const cargar = React.useCallback(async () => {
    setLoading(true)
    try {
      const [clientesRes, fleetRes] = await Promise.all([
        fetch("/api/claver/ops/clientes", { headers: cloudAuthHeaders() }),
        fetch("/api/claver/superadmin/dashboard", { headers: cloudAuthHeaders() }),
      ])

      const clientesData = clientesRes.ok ? await clientesRes.json() : { data: [] }
      const fleetData = fleetRes.ok ? await fleetRes.json() : { tenants: [] }

      const rawClientes = (clientesData.data ?? []) as TenantFleetItem[]
      const superTenants = (fleetData.tenants ?? []) as Array<any>

      const superMap = new Map<number, any>()
      for (const st of superTenants) superMap.set(st.id, st)

      const merged = rawClientes.map((c) => {
        const st = superMap.get(c.id)
        return {
          ...c,
          readinessScore: st?.readinessScore ?? 60,
          listoGoLive: st?.listoGoLive ?? false,
        }
      })

      setTenants(merged)
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    void cargar()
  }, [cargar])

  // Impersonar tenant
  const impersonar = async (empresaId: number, targetPath = "/dashboard") => {
    setImpersonatingId(empresaId)
    try {
      const analystToken = localStorage.getItem("token")
      const analystUser = useAuthStore.getState().user
      if (analystToken) sessionStorage.setItem("claver_analyst_token", analystToken)
      if (analystUser) sessionStorage.setItem("claver_analyst_user", JSON.stringify(analystUser))

      const res = await fetch(`/api/claver/tenants/${empresaId}/impersonate`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...cloudAuthHeaders() },
        body: JSON.stringify({ targetPath }),
      })
      if (!res.ok) {
        alert("No se pudo impersonar a la organización.")
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

  const filtrados = React.useMemo(() => {
    const term = q.trim().toLowerCase()
    return tenants.filter((t) => {
      const hayMatch =
        !term ||
        [t.nombre, t.razonSocial, t.cuit, t.rubro, String(t.id)]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(term)

      if (!hayMatch) return false

      if (filterState === "error") {
        return (
          t.entornos.some((e) => e.estado === "error") ||
          (t.metricas?.logsError ?? 0) > 0
        )
      }
      if (filterState === "golive") return t.listoGoLive
      if (filterState === "dedicated") return t.planHosting === "dedicated"

      return true
    })
  }, [tenants, q, filterState])

  const totalActivos = tenants.length
  const totalEnError = tenants.filter(
    (t) => t.entornos.some((e) => e.estado === "error") || (t.metricas?.logsError ?? 0) > 0,
  ).length
  const totalGoLive = tenants.filter((t) => t.listoGoLive).length

  if (loading && tenants.length === 0) {
    return <PageSkeleton kpis={3} tableRows={6} tableCols={4} />
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <CloudPageHeader
        icon={Building2}
        eyebrow="Multi-Tenant Hub"
        title="Flota de Organizaciones"
        description="Gestión centralizada de entornos, perfiles multi-tenant, checklist go-live e ingreso inmediato al ERP."
        badge={`${totalActivos} Organizaciones`}
        onRefresh={cargar}
        loading={loading}
        actions={
          <Button size="sm" asChild className="bg-violet-600 hover:bg-violet-500">
            <Link href="/claver-cloud/provisioning/new">
              <Plus className="h-4 w-4 mr-1.5" />
              Nueva Organización
            </Link>
          </Button>
        }
      />

      {/* KPI bar */}
      <div className="grid gap-3 sm:grid-cols-3">
        <Card className="border-border/60">
          <CardHeader className="pb-1 pt-3 px-4 flex flex-row items-center justify-between space-y-0">
            <span className="text-xs text-muted-foreground font-medium">Flota Total</span>
            <Building2 className="h-4 w-4 text-violet-400" />
          </CardHeader>
          <CardContent className="px-4 pb-3">
            <div className="text-2xl font-bold">{totalActivos}</div>
            <p className="text-[11px] text-muted-foreground">Tenants desplegados en Claver Cloud</p>
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardHeader className="pb-1 pt-3 px-4 flex flex-row items-center justify-between space-y-0">
            <span className="text-xs text-muted-foreground font-medium">Listos para Go-Live PRD</span>
            <Rocket className="h-4 w-4 text-emerald-400" />
          </CardHeader>
          <CardContent className="px-4 pb-3">
            <div className="text-2xl font-bold text-emerald-400">{totalGoLive}</div>
            <p className="text-[11px] text-muted-foreground">Checklist comercial y técnico superado</p>
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardHeader className="pb-1 pt-3 px-4 flex flex-row items-center justify-between space-y-0">
            <span className="text-xs text-muted-foreground font-medium">Entornos con Atención</span>
            <AlertTriangle className="h-4 w-4 text-amber-400" />
          </CardHeader>
          <CardContent className="px-4 pb-3">
            <div className="text-2xl font-bold text-amber-400">{totalEnError}</div>
            <p className="text-[11px] text-muted-foreground">Requieren diagnóstico o revisión OPO</p>
          </CardContent>
        </Card>
      </div>

      {/* Filtros y búsqueda */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-9 h-9 text-xs"
            placeholder="Buscar por nombre, CUIT, razón social o ID..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-2">
          <Select value={filterState} onValueChange={setFilterState}>
            <SelectTrigger className="h-9 w-44 text-xs">
              <SelectValue placeholder="Filtrar por estado" />
            </SelectTrigger>
            <SelectContent className="text-xs">
              <SelectItem value="todos">Todos los tenants</SelectItem>
              <SelectItem value="error">Con errores / Logs</SelectItem>
              <SelectItem value="golive">Listos Go-Live</SelectItem>
              <SelectItem value="dedicated">Hosting Dedicado</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Listado de Tenants */}
      {filtrados.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="No se encontraron organizaciones"
          description={
            q
              ? "No hay coincidencias con tu búsqueda. Intentá con otro término."
              : "Todavía no se han provisionado tenants en este alcance."
          }
          actionLabel={q ? "Limpiar filtro" : "Nueva Organización"}
          onAction={
            q
              ? () => setQ("")
              : () => {
                  window.location.href = "/claver-cloud/provisioning/new"
                }
          }
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtrados.map((t) => {
            const hasError =
              t.entornos.some((e) => e.estado === "error") ||
              (t.metricas?.logsError ?? 0) > 0

            return (
              <Card
                key={t.id}
                className={cn(
                  "hover:border-violet-500/40 transition-all flex flex-col justify-between shadow-xs",
                  hasError && "border-red-500/30 bg-red-500/5",
                )}
              >
                <CardHeader className="pb-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <CardTitle className="text-base font-semibold truncate hover:text-violet-300">
                        <Link href={`/claver-cloud/tenants/${t.id}`}>{t.nombre}</Link>
                      </CardTitle>
                      <CardDescription className="text-xs truncate">
                        #{t.id} · {t.cuit ? `CUIT ${t.cuit}` : t.razonSocial}
                      </CardDescription>
                    </div>

                    <Badge
                      variant="outline"
                      className={cn(
                        "text-[10px] shrink-0",
                        t.listoGoLive
                          ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                          : "bg-slate-500/10 text-slate-400 border-slate-500/20",
                      )}
                    >
                      {t.listoGoLive ? "Go-Live OK" : `Score ${t.readinessScore}%`}
                    </Badge>
                  </div>

                  <div className="flex flex-wrap gap-1.5 pt-2">
                    <Badge variant="secondary" className="text-[10px]">
                      {t.rubro || "Comercio"}
                    </Badge>
                    <Badge variant="outline" className="text-[10px]">
                      {t.planHosting === "dedicated" ? "Dedicado" : "Cloud Shared"}
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="space-y-3 pt-0">
                  {/* Entornos */}
                  <div className="flex flex-wrap gap-1 text-[11px]">
                    {t.entornos.length === 0 ? (
                      <span className="text-muted-foreground text-xs">Sin microservicios OPO</span>
                    ) : (
                      t.entornos.map((e) => (
                        <span
                          key={e.codigo}
                          className={cn(
                            "px-1.5 py-0.5 rounded border text-[10px] font-mono",
                            e.estado === "activo"
                              ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/20"
                              : e.estado === "error"
                                ? "bg-red-500/10 text-red-300 border-red-500/20"
                                : "bg-amber-500/10 text-amber-300 border-amber-500/20",
                          )}
                        >
                          {e.codigo}: {e.estado}
                        </span>
                      ))
                    )}
                  </div>

                  {/* Acciones principales cableadas */}
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border/40">
                    <Button
                      size="sm"
                      className="w-full text-xs bg-violet-600 hover:bg-violet-500 font-medium"
                      onClick={() => void impersonar(t.id)}
                      disabled={impersonatingId === t.id}
                    >
                      <LogIn className="h-3.5 w-3.5 mr-1.5" />
                      {impersonatingId === t.id ? "Ingresando..." : "Ingresar ERP"}
                    </Button>

                    <Button size="sm" variant="outline" className="w-full text-xs" asChild>
                      <Link href={`/claver-cloud/tenants/${t.id}`}>
                        Ficha Técnica
                        <ArrowRight className="h-3.5 w-3.5 ml-1" />
                      </Link>
                    </Button>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1">
                    <Link
                      href={`/claver-cloud/operations/${t.id}`}
                      className="hover:text-foreground transition-colors flex items-center gap-1"
                    >
                      <Activity className="h-3 w-3" />
                      Operaciones
                    </Link>
                    <Link
                      href={`/claver-cloud/go-live?empresaId=${t.id}`}
                      className="hover:text-emerald-400 transition-colors flex items-center gap-1"
                    >
                      <Rocket className="h-3 w-3" />
                      Checklist Go-Live
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
