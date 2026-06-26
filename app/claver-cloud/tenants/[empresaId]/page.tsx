"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import {
  ArrowLeft,
  Building2,
  CheckCircle2,
  CreditCard,
  ExternalLink,
  Package,
  Play,
  Power,
  PowerOff,
  RefreshCw,
  Server,
  Settings2,
  Store,
  Target,
  UserCog,
  XCircle,
  Zap,
  Link2,
} from "lucide-react"
import { CustomPlaybooksEditor } from "@/components/claver-cloud/custom-playbooks-editor"
import { LegacyBridgeWizard } from "@/components/claver-cloud/legacy-bridge-wizard"
import { PlaybooksPanel } from "@/components/claver-cloud/playbooks-panel"
import { TenantBillingPanel } from "@/components/claver-cloud/tenant-billing-panel"
import { TenantConfigPanel } from "@/components/claver-cloud/tenant-config-panel"
import { useAuthStore } from "@/lib/stores"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"

type Overview = {
  empresa: {
    id: number
    nombre: string
    razonSocial: string
    cuit: string | null
    rubro: string
    entornoAfip: string | null
    planHosting: string | null
  }
  readiness: {
    listoGoLive: boolean
    score: number
    items: { id: string; label: string; estado: string; detalle?: string; href?: string }[]
    rubroChecks: { id: string; label: string; estado: string; detalle?: string; href?: string }[]
    integraciones?: { id: string; label: string; estado: string; detalle?: string; href?: string }[]
  }
  plan?: { id: string; maxSkusActivos: number; playbooksCustom: boolean }
  billing?: { mrrTotalArs: number; skusActivos: number; limiteSkus: number; plan: string }
  productosActivos: number
  productosCatalogo: number
  proyecto: { id: number; codigo: string; faseActual: string; porcentajeAvance: number } | null
  tareasPendientes: number
  packs: {
    id: string
    nombre: string
    precioArs: number
    skus: string[]
    todoActivo: boolean
    algunoActivo: boolean
  }[]
  productos: {
    sku: string
    nombre: string
    categoria: string
    autoCertLevel: string
    precioArs: number
    status: string
    activo: boolean
    ccaFase: string
    activacionCliente: string
  }[]
}

function authHeaders(): HeadersInit {
  const token = localStorage.getItem("token")
  return token ? { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } : { "Content-Type": "application/json" }
}

function estadoBadge(estado: string) {
  if (estado === "ok") return "bg-emerald-500/10 text-emerald-700 border-emerald-300"
  if (estado === "fail") return "bg-red-500/10 text-red-700 border-red-300"
  return "bg-amber-500/10 text-amber-800 border-amber-300"
}

function certBadge(level: string) {
  if (level === "GLOBAL_AUTO") return "bg-emerald-500/10 text-emerald-700"
  if (level === "REGION_AUTO") return "bg-blue-500/10 text-blue-700"
  if (level === "SEMI_AUTO") return "bg-amber-500/10 text-amber-800"
  return "bg-red-500/10 text-red-700"
}

const fmtArs = (n: number) =>
  new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(n)

export default function ClaverTenantSuperAdminPage() {
  const params = useParams()
  const empresaId = params.empresaId as string
  const [data, setData] = useState<Overview | null>(null)
  const [loading, setLoading] = useState(false)
  const [actionSku, setActionSku] = useState<string | null>(null)
  const [filtro, setFiltro] = useState("")
  const [soloActivos, setSoloActivos] = useState(false)

  const cargar = useCallback(async () => {
    if (!empresaId) return
    setLoading(true)
    try {
      const res = await fetch(`/api/claver/tenants/${empresaId}`, { headers: authHeaders() })
      if (res.ok) setData(await res.json())
    } finally {
      setLoading(false)
    }
  }, [empresaId])

  useEffect(() => {
    void cargar()
  }, [cargar])

  const login = useAuthStore((s) => s.login)

  const abrirErpImpersonado = async () => {
    const analystToken = localStorage.getItem("token")
    const analystUser = useAuthStore.getState().user
    if (analystToken) sessionStorage.setItem("claver_analyst_token", analystToken)
    if (analystUser) sessionStorage.setItem("claver_analyst_user", JSON.stringify(analystUser))

    const res = await fetch(`/api/claver/tenants/${empresaId}/impersonate`, {
      method: "POST",
      headers: authHeaders(),
    })
    if (!res.ok) return
    const session = await res.json()
    login(session.token, {
      id: String(analystUser?.id ?? "0"),
      email: analystUser?.email ?? "",
      nombre: `Analista → ${session.empresa.nombre}`,
      rol: "administrador",
      empresaId: session.empresa.id,
      empresaNombre: session.empresa.nombre,
    })
    window.location.href = session.redirectUrl ?? "/dashboard/configuracion"
  }

  const accion = async (
    action: string,
    extra?: { sku?: string; packId?: string },
  ) => {
    const key = extra?.sku ?? extra?.packId ?? action
    setActionSku(key)
    try {
      const res = await fetch(`/api/claver/tenants/${empresaId}/productos`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ action, ...extra }),
      })
      if (res.ok) await cargar()
    } finally {
      setActionSku(null)
    }
  }

  const productosFiltrados = useMemo(() => {
    if (!data) return []
    let list = data.productos
    if (soloActivos) list = list.filter((p) => p.activo)
    if (filtro.trim()) {
      const q = filtro.toLowerCase()
      list = list.filter(
        (p) =>
          p.sku.toLowerCase().includes(q) ||
          p.nombre.toLowerCase().includes(q) ||
          p.categoria.toLowerCase().includes(q),
      )
    }
    return list
  }, [data, filtro, soloActivos])

  if (!data) {
    return (
      <p className="text-sm text-muted-foreground p-6">
        {loading ? "Cargando panel super admin…" : "No se pudo cargar el tenant"}
      </p>
    )
  }

  const { empresa, readiness, proyecto } = data

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Button variant="ghost" size="sm" asChild className="mb-2 -ml-2">
            <Link href="/claver-cloud/organizations">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Organizations
            </Link>
          </Button>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Building2 className="h-6 w-6 text-primary" />
            {empresa.nombre}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {empresa.razonSocial} · CUIT {empresa.cuit ?? "s/d"} · {empresa.rubro}
          </p>
          <div className="flex flex-wrap gap-2 mt-2">
            <Badge variant="outline">AFIP: {empresa.entornoAfip ?? "homologación"}</Badge>
            <Badge variant="outline">{empresa.planHosting === "dedicated" ? "Dedicated" : "Shared"}</Badge>
            <Badge
              variant="outline"
              className={readiness.listoGoLive ? "bg-emerald-500/10 text-emerald-700" : "bg-amber-500/10 text-amber-800"}
            >
              Readiness {readiness.score}%
            </Badge>
            {data.plan && (
              <Badge variant="outline" className="bg-blue-500/10 text-blue-700">
                Plan {data.plan.id}
              </Badge>
            )}
            {data.billing && (
              <Badge variant="outline">
                <CreditCard className="h-3 w-3 mr-1 inline" />
                {fmtArs(data.billing.mrrTotalArs)}/mes
              </Badge>
            )}
          </div>
        </div>
        <Button variant="outline" onClick={() => void cargar()} disabled={loading}>
          <RefreshCw className={cn("h-4 w-4 mr-2", loading && "animate-spin")} />
          Actualizar
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs text-muted-foreground">SKUs activos</p>
            <p className="text-2xl font-bold">
              {data.productosActivos}/{data.productosCatalogo}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs text-muted-foreground">Tareas marketplace</p>
            <p className="text-2xl font-bold">{data.tareasPendientes}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs text-muted-foreground">CCA</p>
            <p className="text-2xl font-bold">{proyecto?.porcentajeAvance ?? 0}%</p>
            <p className="text-xs text-muted-foreground">{proyecto?.faseActual ?? "Sin proyecto"}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs text-muted-foreground">Go-live</p>
            <p className="text-2xl font-bold flex items-center gap-1">
              {readiness.listoGoLive ? (
                <>
                  <CheckCircle2 className="h-5 w-5 text-emerald-600" /> Listo
                </>
              ) : (
                <>
                  <XCircle className="h-5 w-5 text-amber-600" /> Pendiente
                </>
              )}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant="outline" asChild>
          <Link href={`/claver-cloud/operations/${empresa.id}`}>
            <Server className="h-3 w-3 mr-1" />
            Ops / VPS
          </Link>
        </Button>
        {proyecto && (
          <Button size="sm" variant="outline" asChild>
            <Link href={`/claver-cloud/implementation/${proyecto.id}`}>
              <Target className="h-3 w-3 mr-1" />
              Implementación
            </Link>
          </Button>
        )}
        <Button size="sm" variant="outline" asChild>
          <Link href="/claver-cloud/marketplace">
            <Store className="h-3 w-3 mr-1" />
            Torre marketplace
          </Link>
        </Button>
        <Button size="sm" variant="default" onClick={() => void abrirErpImpersonado()}>
          <UserCog className="h-3 w-3 mr-1" />
          Abrir ERP (impersonar)
        </Button>
      </div>

      <Tabs defaultValue="productos">
        <TabsList>
          <TabsTrigger value="resumen">Resumen</TabsTrigger>
          <TabsTrigger value="productos">Productos ({data.productosCatalogo})</TabsTrigger>
          <TabsTrigger value="packs">Packs ({data.packs.length})</TabsTrigger>
          <TabsTrigger value="readiness">Readiness</TabsTrigger>
          <TabsTrigger value="legacy-bridge">
            <Link2 className="h-3 w-3 mr-1 inline" />
            Legacy Bridge
          </TabsTrigger>
          <TabsTrigger value="config">
            <Settings2 className="h-3 w-3 mr-1 inline" />
            Parametrización
          </TabsTrigger>
          <TabsTrigger value="billing">
            <CreditCard className="h-3 w-3 mr-1 inline" />
            Billing
          </TabsTrigger>
          <TabsTrigger value="auto">
            <Zap className="h-3 w-3 mr-1 inline" />
            Automatizaciones
          </TabsTrigger>
        </TabsList>

        <TabsContent value="resumen" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Acciones rápidas super admin</CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-2 text-muted-foreground">
              <p>
                <strong className="text-foreground">Provisionar</strong> — crea job + tarea si es SEMI_AUTO/HUMAN_GATE.
              </p>
              <p>
                <strong className="text-foreground">Activar directo</strong> — bypass entitlement sin esperar checklist (solo analista).
              </p>
              <p>
                <strong className="text-foreground">Desactivar</strong> — revoca suscripción y feature.
              </p>
              <p className="text-xs pt-2 border-t">
                Usá <strong className="text-foreground">Abrir ERP (impersonar)</strong> para parametrizar con auditoría (sesión 2 h).
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="productos" className="mt-4 space-y-3">
          <div className="flex flex-wrap gap-2">
            <Input
              placeholder="Buscar SKU, nombre o categoría…"
              value={filtro}
              onChange={(e) => setFiltro(e.target.value)}
              className="max-w-sm"
            />
            <Button
              size="sm"
              variant={soloActivos ? "default" : "outline"}
              onClick={() => setSoloActivos((v) => !v)}
            >
              Solo activos
            </Button>
          </div>
          <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-1">
            {productosFiltrados.map((p) => (
              <div
                key={p.sku}
                className="flex flex-wrap items-center gap-2 border rounded-lg p-3 text-sm bg-card"
              >
                <div className="flex-1 min-w-[200px]">
                  <p className="font-medium">{p.nombre}</p>
                  <p className="text-xs text-muted-foreground font-mono">{p.sku} · {p.categoria}</p>
                  <p className="text-xs text-muted-foreground mt-0.5 truncate max-w-md">{p.activacionCliente}</p>
                </div>
                <Badge variant="outline" className={certBadge(p.autoCertLevel)}>
                  {p.autoCertLevel}
                </Badge>
                <Badge variant="outline">{p.ccaFase}</Badge>
                <span className="text-xs text-muted-foreground">{fmtArs(p.precioArs)}</span>
                <Badge variant={p.activo ? "default" : "secondary"}>{p.activo ? "Activo" : "Inactivo"}</Badge>
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={actionSku === p.sku}
                    onClick={() => void accion("provision", { sku: p.sku })}
                    title="Provisionar (job + tarea si aplica)"
                  >
                    <Play className="h-3 w-3" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={actionSku === p.sku || p.activo}
                    onClick={() => void accion("activate", { sku: p.sku })}
                    title="Activar directo"
                  >
                    <Power className="h-3 w-3" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={actionSku === p.sku || !p.activo}
                    onClick={() => void accion("deactivate", { sku: p.sku })}
                    title="Desactivar"
                  >
                    <PowerOff className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="packs" className="mt-4 space-y-3">
          {data.packs.map((pack) => (
            <Card key={pack.id}>
              <CardHeader className="py-3">
                <CardTitle className="text-base flex flex-wrap items-center gap-2">
                  <Package className="h-4 w-4" />
                  {pack.nombre}
                  <Badge variant="outline">{pack.id}</Badge>
                  <span className="text-sm font-normal text-muted-foreground">{fmtArs(pack.precioArs)}</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-xs text-muted-foreground">{pack.skus.join(", ")}</p>
                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={actionSku === pack.id}
                    onClick={() => void accion("provision_pack", { packId: pack.id })}
                  >
                    Provisionar pack
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={actionSku === pack.id || pack.todoActivo}
                    onClick={() => void accion("activate_pack", { packId: pack.id })}
                  >
                    Activar pack
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={actionSku === pack.id || !pack.algunoActivo}
                    onClick={() => void accion("deactivate_pack", { packId: pack.id })}
                  >
                    Desactivar pack
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="legacy-bridge" className="mt-4">
          <LegacyBridgeWizard empresaId={Number(empresaId)} />
        </TabsContent>

        <TabsContent value="config" className="mt-4">
          <TenantConfigPanel empresaId={Number(empresaId)} />
        </TabsContent>

        <TabsContent value="billing" className="mt-4">
          <TenantBillingPanel empresaId={Number(empresaId)} />
        </TabsContent>

        <TabsContent value="auto" className="mt-4 space-y-6">
          <PlaybooksPanel empresaId={Number(empresaId)} />
          <CustomPlaybooksEditor
            empresaId={Number(empresaId)}
            planAllowsCustom={data.plan?.playbooksCustom ?? false}
          />
        </TabsContent>

        <TabsContent value="readiness" className="mt-4 space-y-3">
          {[...readiness.items, ...readiness.rubroChecks, ...(readiness.integraciones ?? [])].map((item) => (
            <div
              key={item.id}
              className="flex flex-wrap items-center justify-between gap-2 border rounded-md p-3 text-sm"
            >
              <div>
                <p className="font-medium">{item.label}</p>
                {item.detalle && <p className="text-xs text-muted-foreground">{item.detalle}</p>}
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className={estadoBadge(item.estado)}>
                  {item.estado}
                </Badge>
                {item.href && (
                  <Button size="sm" variant="ghost" asChild>
                    <a href={item.href} target="_blank" rel="noopener noreferrer">
                      Abrir ERP
                      <ExternalLink className="h-3 w-3 ml-1" />
                    </a>
                  </Button>
                )}
              </div>
            </div>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  )
}