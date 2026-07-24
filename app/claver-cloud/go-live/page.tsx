"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { authFetch } from "@/lib/stores/auth-store"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Input } from "@/components/ui/input"
import { Loader2, CheckCircle2, Circle, Rocket, RefreshCw, ExternalLink, Search, Building2 } from "lucide-react"
import { PageShell, PageHeader, StatusBadge } from "@/components/layout"
import { EmptyState } from "@/components/ui/empty-state"
import { PageSkeleton } from "@/components/layout/page-skeleton"

type CatalogItem = {
  id: string
  label: string
  group: string
  required: boolean
}

type QueueTenant = {
  empresaId: number
  nombre: string
  email: string | null
  rubro: string | null
  cuit: string | null
  readinessScore: number
  listoGoLiveReadiness: boolean
  checklistProgress: { done: number; required: number; closed: boolean }
  tosAccepted: boolean
  mpSubscriptionStatus: string | null
}

type Platform = {
  mpMock: boolean
  productionBlocksMock: boolean
  envOk: boolean
  packsPrd: number
}

export default function ClaverGoLivePage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [platform, setPlatform] = useState<Platform | null>(null)
  const [tenants, setTenants] = useState<QueueTenant[]>([])
  const [catalog, setCatalog] = useState<CatalogItem[]>([])
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [detail, setDetail] = useState<{
    checklist: {
      items: Record<string, { done: boolean; at?: string; by?: string }>
      closedAt?: string | null
      packId?: string
    }
    empresa: { id: number; nombre: string }
    readiness: { score: number; listoGoLive: boolean; items: { id: string; label: string; estado: string }[] }
    tos: { accepted: boolean; version?: string } | null
  } | null>(null)
  const [busy, setBusy] = useState(false)

  const loadQueue = useCallback(async () => {
    setLoading(true)
    setError("")
    try {
      const res = await authFetch("/api/claver/go-live")
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? `HTTP ${res.status}`)
      setPlatform(data.platform)
      setTenants(data.tenants ?? [])
      setCatalog(data.catalog ?? [])
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error")
    } finally {
      setLoading(false)
    }
  }, [])

  const loadDetail = useCallback(async (empresaId: number) => {
    setBusy(true)
    setError("")
    try {
      const res = await authFetch(`/api/claver/go-live?empresaId=${empresaId}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? `HTTP ${res.status}`)
      setSelectedId(empresaId)
      setDetail({
        checklist: data.checklist,
        empresa: data.empresa,
        readiness: data.readiness,
        tos: data.tos,
      })
      if (data.catalog) setCatalog(data.catalog)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error")
    } finally {
      setBusy(false)
    }
  }, [])

  useEffect(() => {
    void loadQueue()
  }, [loadQueue])

  async function toggle(itemId: string, done: boolean) {
    if (!selectedId) return
    setBusy(true)
    try {
      const res = await authFetch("/api/claver/go-live", {
        method: "POST",
        body: JSON.stringify({ empresaId: selectedId, itemId, done }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? "Error")
      setDetail((d) => (d ? { ...d, checklist: data.checklist } : d))
      await loadQueue()
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error")
    } finally {
      setBusy(false)
    }
  }

  const groups = ["plataforma", "comercial", "fiscal", "comms", "smoke", "handoff"] as const
  const [queueQ, setQueueQ] = useState("")

  const tenantsFiltrados = useMemo(() => {
    const term = queueQ.trim().toLowerCase()
    if (!term) return tenants
    return tenants.filter((t) => {
      const hay = [t.nombre, t.email, t.cuit, t.rubro, String(t.empresaId)]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
      return hay.includes(term)
    })
  }, [tenants, queueQ])

  if (loading && tenants.length === 0) {
    return <PageSkeleton kpis={4} tableRows={6} tableCols={2} />
  }

  return (
    <PageShell className="max-w-6xl">
      <PageHeader
        variant="surface"
        title="Go-live comercial"
        description="Cola de tenants y checklist de salida a producción. Sin checklist cerrado sigue siendo piloto, aunque la demo se vea bien."
        badge={
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-medium text-primary">
            <Rocket className="h-3.5 w-3.5" />
            Oleada 0 · PRD packs
          </span>
        }
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={() => void loadQueue()}
            disabled={loading}
            className="min-h-[40px]"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Actualizar
          </Button>
        }
      />

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {platform && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Env cobro (MP+JWT+DB)</CardDescription>
              <CardTitle className="text-lg">
                {platform.envOk ? (
                  <StatusBadge variant="success" label="OK" />
                ) : (
                  <StatusBadge variant="warning" label="Revisar" />
                )}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Mercado Pago</CardDescription>
              <CardTitle className="text-lg">
                {platform.mpMock ? (
                  <StatusBadge variant="warning" label="Mock" />
                ) : (
                  <StatusBadge variant="success" label="Real" />
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-muted-foreground">
              {platform.productionBlocksMock
                ? "Prod bloquea mock sin FORCE_MOCK_MP_PROD"
                : "Dev permite mock"}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Packs PRD catalogados</CardDescription>
              <CardTitle className="text-lg">{platform.packsPrd}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Tenants en cola</CardDescription>
              <CardTitle className="text-lg">{tenants.length}</CardTitle>
            </CardHeader>
          </Card>
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-5">
        <Card className="lg:col-span-2">
          <CardHeader className="space-y-3">
            <div>
              <CardTitle className="text-base">Cola de go-live</CardTitle>
              <CardDescription>Prioridad: checklist incompleto primero</CardDescription>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                className="pl-9 min-h-[40px]"
                placeholder="Buscar tenant, CUIT o email…"
                value={queueQ}
                onChange={(e) => setQueueQ(e.target.value)}
                aria-label="Buscar en cola de go-live"
              />
            </div>
          </CardHeader>
          <CardContent className="space-y-2 max-h-[70vh] overflow-y-auto">
            {tenantsFiltrados.length === 0 ? (
              <EmptyState
                icon={Building2}
                title={tenants.length === 0 ? "Sin tenants en cola" : "Ningún match"}
                description={
                  tenants.length === 0
                    ? "Cuando haya altas recientes van a aparecer acá para el checklist."
                    : "Probá otro término o limpiá la búsqueda."
                }
                actionLabel={tenants.length === 0 ? "Ir a Provisioning" : "Limpiar"}
                onAction={
                  tenants.length === 0
                    ? () => {
                        window.location.href = "/claver-cloud/provisioning"
                      }
                    : () => setQueueQ("")
                }
              />
            ) : (
              tenantsFiltrados.map((t) => (
                <button
                  key={t.empresaId}
                  type="button"
                  onClick={() => void loadDetail(t.empresaId)}
                  className={`w-full rounded-lg border p-3 text-left text-sm transition hover:bg-muted/50 min-h-[40px] ${
                    selectedId === t.empresaId ? "ring-2 ring-primary/40 border-primary/30" : ""
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium truncate">{t.nombre}</span>
                    {t.checklistProgress.closed ? (
                      <StatusBadge variant="success" label="Cerrado" />
                    ) : (
                      <StatusBadge
                        variant="warning"
                        label={`${t.checklistProgress.done}/${t.checklistProgress.required}`}
                      />
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 truncate">
                    {t.cuit ?? "sin CUIT"} · score {t.readinessScore}%
                    {t.tosAccepted ? " · ToS OK" : " · ToS pendiente"}
                  </p>
                </button>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle className="text-base">
              {detail ? detail.empresa.nombre : "Seleccioná un tenant"}
            </CardTitle>
            <CardDescription>
              {detail
                ? `Readiness ${detail.readiness.score}% · ToS ${detail.tos?.accepted ? "OK" : "pendiente"}`
                : "Checklist comercial (analista)"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!detail ? (
              <EmptyState
                icon={Rocket}
                title="Elegí un tenant de la cola"
                description="Marcá el checklist de go-live, abrí la ficha del tenant y cerrá cuando el pack esté listo para producción."
              />
            ) : (
              <div className="space-y-6">
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/claver-cloud/tenants/${detail.empresa.id}`}>
                      <ExternalLink className="h-3.5 w-3.5 mr-1" />
                      Ficha tenant
                    </Link>
                  </Button>
                  {detail.checklist.closedAt && (
                    <Badge className="bg-emerald-600">
                      Checklist cerrado {new Date(detail.checklist.closedAt).toLocaleDateString("es-AR")}
                    </Badge>
                  )}
                  {busy && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
                </div>

                {groups.map((g) => {
                  const items = catalog.filter((c) => c.group === g)
                  if (!items.length) return null
                  return (
                    <div key={g}>
                      <h3 className="text-xs font-semibold uppercase text-muted-foreground mb-2">
                        {g}
                      </h3>
                      <ul className="space-y-2">
                        {items.map((item) => {
                          const st = detail.checklist.items[item.id]
                          const done = Boolean(st?.done)
                          return (
                            <li
                              key={item.id}
                              className="flex items-start gap-3 rounded-lg border px-3 py-2"
                            >
                              <button
                                type="button"
                                disabled={busy}
                                onClick={() => void toggle(item.id, !done)}
                                className="mt-0.5 text-[var(--status-success)] min-h-[40px] min-w-[40px] flex items-center justify-center"
                                aria-label={done ? "Desmarcar" : "Marcar"}
                              >
                                {done ? (
                                  <CheckCircle2 className="h-5 w-5" />
                                ) : (
                                  <Circle className="h-5 w-5 text-muted-foreground" />
                                )}
                              </button>
                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-medium">
                                  {item.label}
                                  {item.required && (
                                    <span className="text-destructive ml-1">*</span>
                                  )}
                                </p>
                                {st?.by && (
                                  <p className="text-[11px] text-muted-foreground">
                                    {st.by}
                                    {st.at
                                      ? ` · ${new Date(st.at).toLocaleString("es-AR")}`
                                      : ""}
                                  </p>
                                )}
                              </div>
                            </li>
                          )
                        })}
                      </ul>
                    </div>
                  )
                })}

                <div>
                  <h3 className="text-xs font-semibold uppercase text-muted-foreground mb-2">
                    Readiness técnico (auto)
                  </h3>
                  <ul className="text-xs space-y-1 text-muted-foreground">
                    {detail.readiness.items.slice(0, 8).map((i) => (
                      <li key={i.id}>
                        <Badge
                          variant={
                            i.estado === "ok"
                              ? "default"
                              : i.estado === "warn"
                                ? "secondary"
                                : "destructive"
                          }
                          className="mr-2 text-[10px]"
                        >
                          {i.estado}
                        </Badge>
                        {i.label}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </PageShell>
  )
}
