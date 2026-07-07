"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useParams, useSearchParams } from "next/navigation"
import {
  CheckCircle2,
  CreditCard,
  ExternalLink,
  Link2,
  Package,
  Play,
  Power,
  PowerOff,
  Settings2,
  Zap,
} from "lucide-react"
import { CustomPlaybooksEditor } from "@/components/claver-cloud/custom-playbooks-editor"
import { LegacyBridgeWizard } from "@/components/claver-cloud/legacy-bridge-wizard"
import { PlaybooksPanel } from "@/components/claver-cloud/playbooks-panel"
import { TenantBillingPanel } from "@/components/claver-cloud/tenant-billing-panel"
import { TenantConfigPanel } from "@/components/claver-cloud/tenant-config-panel"
import { TenantOverviewTab } from "@/components/claver-cloud/tenant-overview-tab"
import { TenantPropiedadTab } from "@/components/claver-cloud/tenant-propiedad-tab"
import { TenantResourceHeader } from "@/components/claver-cloud/tenant-resource-header"
import { useAuthStore } from "@/lib/stores"
import type {
  TenantActivityItem,
  TenantHealth,
  TenantLifecycle,
  TenantPipelineLeadSummary,
} from "@/lib/ops/tenant-lifecycle-service"
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
    deletedAt: string | null
  }
  lifecycle: TenantLifecycle
  health: TenantHealth
  recentActivity: TenantActivityItem[]
  pipelineLead: TenantPipelineLeadSummary | null
  readiness: {
    listoGoLive: boolean
    score: number
    items: { id: string; label: string; estado: string; detalle?: string; href?: string }[]
    rubroChecks: { id: string; label: string; estado: string; detalle?: string; href?: string }[]
    integraciones?: { id: string; label: string; estado: string; detalle?: string; href?: string }[]
  }
  plan?: { id: string; maxSkusActivos: number; playbooksCustom: boolean }
  billing?: { mrrTotalArs: number; skusActivos: number; limiteSkus: number; plan: string; mpSubscriptionStatus: string | null }
  comercial?: {
    createdAt: string
    diasDesdeAlta: number
    origenLabel: string
    signup: {
      origen: string | null
      demoIndustryId: string | null
      trial: { activo: boolean; diasRestantes: number; expirado: boolean } | null
    }
  }
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

  const abrirErpImpersonado = async (redirectPath?: string) => {
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
    window.location.href = redirectPath ?? session.redirectUrl ?? "/dashboard/configuracion"
  }

  const diagnosticar = async () => {
    setActionSku("diagnosticar")
    try {
      await fetch(`/api/claver/tenants/${empresaId}/ops`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ action: "diagnosticar" }),
      })
      await cargar()
    } finally {
      setActionSku(null)
    }
  }

  const lifecycleAction = async (action: "suspend" | "reactivate") => {
    if (action === "suspend" && !confirm("¿Suspender este tenant? Los usuarios no podrán acceder.")) return
    setActionSku(action)
    try {
      const res = await fetch(`/api/claver/tenants/${empresaId}`, {
        method: "PATCH",
        headers: authHeaders(),
        body: JSON.stringify({ action }),
      })
      if (res.ok) {
        const json = await res.json()
        if (json.overview) setData(json.overview)
        else await cargar()
      }
    } finally {
      setActionSku(null)
    }
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
        {loading ? "Cargando recurso tenant…" : "No se pudo cargar el tenant"}
      </p>
    )
  }

  const { empresa, readiness, proyecto } = data
  const searchParams = useSearchParams()
  const recienProvisionado = searchParams.get("provisioned") === "1"
  const tabInicial = searchParams.get("tab") ?? "overview"
  const esRubroPropiedad =
    ["inmobiliaria", "consorcios", "administracion_consorcios"].includes(empresa.rubro) ||
    data.packs.some((p) => p.id === "pool-propiedad" && p.algunoActivo)

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {recienProvisionado && (
        <Card className="border-emerald-500/40 bg-emerald-500/10">
          <CardContent className="py-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle2 className="h-5 w-5 text-emerald-500" />
              <span>
                <strong>Organización creada.</strong> Activá más servicios en Servicios o seguí el proyecto CCA.
              </span>
            </div>
            <div className="flex gap-2">
              {proyecto && (
                <Button size="sm" variant="outline" asChild>
                  <Link href={`/claver-cloud/implementation/${proyecto.id}`}>Ver implementación</Link>
                </Button>
              )}
              <Button size="sm" asChild>
                <Link href="/claver-cloud/marketplace">Ir al marketplace</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <TenantResourceHeader
        empresa={empresa}
        lifecycle={data.lifecycle}
        health={data.health}
        readinessScore={readiness.score}
        listoGoLive={readiness.listoGoLive}
        productosActivos={data.productosActivos}
        productosCatalogo={data.productosCatalogo}
        billing={data.billing}
        comercial={
          data.comercial
            ? {
                origenLabel: data.comercial.origenLabel,
                diasDesdeAlta: data.comercial.diasDesdeAlta,
                trial: data.comercial.signup.trial,
              }
            : undefined
        }
        loading={loading}
        actionLoading={actionSku}
        onRefresh={() => void cargar()}
        onImpersonate={() => void abrirErpImpersonado()}
        onDiagnosticar={() => void diagnosticar()}
        onLifecycle={(action) => void lifecycleAction(action)}
      />

      <Tabs defaultValue={tabInicial}>
        <TabsList className="flex-wrap h-auto gap-1">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          {esRubroPropiedad && (
            <TabsTrigger value="propiedad">Propiedad</TabsTrigger>
          )}
          <TabsTrigger value="servicios">
            Servicios ({data.productosCatalogo})
          </TabsTrigger>
          <TabsTrigger value="ops">Ops</TabsTrigger>
          <TabsTrigger value="billing">
            <CreditCard className="h-3 w-3 mr-1 inline" />
            Billing
          </TabsTrigger>
          <TabsTrigger value="config">
            <Settings2 className="h-3 w-3 mr-1 inline" />
            Config
          </TabsTrigger>
        </TabsList>

        {esRubroPropiedad && (
          <TabsContent value="propiedad" className="mt-4">
            <TenantPropiedadTab
              empresaId={Number(empresaId)}
              onImpersonate={(path) => void abrirErpImpersonado(path)}
            />
          </TabsContent>
        )}

        <TabsContent value="overview" className="mt-4">
          <TenantOverviewTab
            lifecycle={data.lifecycle}
            health={data.health}
            recentActivity={data.recentActivity}
            pipelineLead={data.pipelineLead}
            proyecto={proyecto}
            readiness={readiness}
            stats={{
              productosActivos: data.productosActivos,
              productosCatalogo: data.productosCatalogo,
              tareasPendientes: data.tareasPendientes,
            }}
          />
        </TabsContent>

        <TabsContent value="servicios" className="mt-4 space-y-6">
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              Productos del catálogo
            </h3>
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
            <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-1">
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
                      title="Provisionar"
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
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
              <Package className="h-4 w-4" />
              Packs ({data.packs.length})
            </h3>
            {data.packs.map((pack) => (
              <Card key={pack.id}>
                <CardHeader className="py-3">
                  <CardTitle className="text-base flex flex-wrap items-center gap-2">
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
          </div>
        </TabsContent>

        <TabsContent value="ops" className="mt-4 space-y-6">
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              Readiness ({readiness.score}%)
            </h3>
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
          </div>

          <div>
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
              <Link2 className="h-4 w-4" />
              Legacy Bridge
            </h3>
            <LegacyBridgeWizard empresaId={Number(empresaId)} />
          </div>

          <div className="space-y-6">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
              <Zap className="h-4 w-4" />
              Automatizaciones
            </h3>
            <PlaybooksPanel empresaId={Number(empresaId)} />
            <CustomPlaybooksEditor
              empresaId={Number(empresaId)}
              planAllowsCustom={data.plan?.playbooksCustom ?? false}
            />
          </div>
        </TabsContent>

        <TabsContent value="billing" className="mt-4">
          <TenantBillingPanel empresaId={Number(empresaId)} />
        </TabsContent>

        <TabsContent value="config" className="mt-4">
          <TenantConfigPanel empresaId={Number(empresaId)} />
        </TabsContent>
      </Tabs>
    </div>
  )
}