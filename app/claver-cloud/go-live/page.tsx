"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { authFetch } from "@/lib/stores/auth-store"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, CheckCircle2, Circle, Rocket, RefreshCw, ExternalLink } from "lucide-react"

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

  return (
    <div className="space-y-6 p-4 md:p-6 max-w-6xl">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
            <Rocket className="h-6 w-6 text-emerald-600" />
            Go-live comercial (Oleada 0)
          </h1>
          <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
            Cola de tenants y checklist §6. Solo packs PRD. Sin checklist cerrado = sigue siendo
            piloto aunque la demo se vea bien.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => void loadQueue()} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          Actualizar
        </Button>
      </div>

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
                  <span className="text-emerald-600">OK</span>
                ) : (
                  <span className="text-amber-600">Revisar</span>
                )}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Mercado Pago</CardDescription>
              <CardTitle className="text-lg">
                {platform.mpMock ? (
                  <span className="text-amber-600">Mock</span>
                ) : (
                  <span className="text-emerald-600">Real</span>
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
          <CardHeader>
            <CardTitle className="text-base">Cola de go-live</CardTitle>
            <CardDescription>Prioridad: checklist incompleto primero</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 max-h-[70vh] overflow-y-auto">
            {loading && tenants.length === 0 ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : tenants.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4">Sin tenants recientes.</p>
            ) : (
              tenants.map((t) => (
                <button
                  key={t.empresaId}
                  type="button"
                  onClick={() => void loadDetail(t.empresaId)}
                  className={`w-full rounded-lg border p-3 text-left text-sm transition hover:bg-muted/50 ${
                    selectedId === t.empresaId ? "ring-2 ring-emerald-500/50" : ""
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium truncate">{t.nombre}</span>
                    {t.checklistProgress.closed ? (
                      <Badge className="bg-emerald-600 shrink-0">Cerrado</Badge>
                    ) : (
                      <Badge variant="secondary" className="shrink-0">
                        {t.checklistProgress.done}/{t.checklistProgress.required}
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 truncate">
                    {t.cuit ?? "sin CUIT"} · score {t.readinessScore}%
                    {t.tosAccepted ? " · ToS ✓" : " · ToS ✗"}
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
              <p className="text-sm text-muted-foreground py-12 text-center">
                Elegí un tenant de la cola para marcar el checklist de go-live.
              </p>
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
                                className="mt-0.5 text-emerald-600"
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
    </div>
  )
}
