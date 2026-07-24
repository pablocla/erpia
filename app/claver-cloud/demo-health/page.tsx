"use client"

import { useCallback, useEffect, useState } from "react"
import { authFetch } from "@/lib/stores/auth-store"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, PlayCircle, Sparkles, ShieldCheck } from "lucide-react"
import { PageShell, PageHeader, StatusBadge } from "@/components/layout"
import { PageSkeleton } from "@/components/layout/page-skeleton"
import { EmptyState } from "@/components/ui/empty-state"
import type { StatusVariant } from "@/lib/ui/status-map"

type FeaturedRow = {
  industryId: string
  label: string
  emoji: string
  goldenPath: string
  engancheId: string | null
  autoSubscribe: {
    auto: string[]
    paid: string[]
    analyst: string[]
    blocked: string[]
  }
}

type HealthReport = {
  industryId: string
  label: string
  ok: boolean
  verdict: "auto" | "needs_analyst" | "failed"
  goldenPath?: string
  durationMs: number
  checks: Array<{ id: string; label: string; status: string; detail?: string }>
  autoSubscribe: FeaturedRow["autoSubscribe"]
  error?: string
}

type Audit = {
  provider: string
  model?: string
  usedAi: boolean
  resumen: string
  acciones: string[]
  priorizacion: Array<{ industryId: string; prioridad: string; motivo: string }>
}

export default function DemoHealthPage() {
  const [featured, setFeatured] = useState<FeaturedRow[]>([])
  const [loadingCatalog, setLoadingCatalog] = useState(true)
  const [running, setRunning] = useState(false)
  const [error, setError] = useState("")
  const [summary, setSummary] = useState("")
  const [reports, setReports] = useState<HealthReport[]>([])
  const [audit, setAudit] = useState<Audit | null>(null)
  const [withGemini, setWithGemini] = useState(true)

  const loadCatalog = useCallback(async () => {
    setLoadingCatalog(true)
    setError("")
    try {
      const res = await authFetch("/api/claver/demo-health")
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error ?? `HTTP ${res.status}`)
      }
      const data = await res.json()
      setFeatured(data.featured ?? [])
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error cargando catálogo")
    } finally {
      setLoadingCatalog(false)
    }
  }, [])

  useEffect(() => {
    void loadCatalog()
  }, [loadCatalog])

  async function runValidation(mode: "featured" | "one", industryId?: string) {
    setRunning(true)
    setError("")
    setReports([])
    setAudit(null)
    setSummary("")
    try {
      const res = await authFetch("/api/claver/demo-health", {
        method: "POST",
        body: JSON.stringify({
          mode,
          industryId,
          withGemini,
          skipHttp: true,
          keepTenant: false,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error ?? `HTTP ${res.status}`)

      if (mode === "one" && data.report) {
        setReports([data.report])
        setSummary(`${data.report.industryId}: ${data.report.verdict}`)
      } else {
        setReports(data.reports ?? [])
        setSummary(data.summary ?? "")
      }
      setAudit(data.audit ?? null)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error validando")
    } finally {
      setRunning(false)
    }
  }

  function verdictVariant(v: string): StatusVariant {
    if (v === "auto") return "success"
    if (v === "needs_analyst") return "warning"
    return "error"
  }

  function verdictLabel(v: string) {
    if (v === "auto") return "Auto"
    if (v === "needs_analyst") return "Analista"
    return "Falló"
  }

  if (loadingCatalog && featured.length === 0) {
    return <PageSkeleton kpis={0} tableRows={6} tableCols={3} />
  }

  return (
    <PageShell className="max-w-5xl">
      <PageHeader
        variant="surface"
        title="Salud de demos"
        description="Valida demos de punta a punta: SKUs, seeds y auto-suscripción. Gemini resume solo si hay problemas (o si lo forzás)."
        badge={
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-medium text-primary">
            <ShieldCheck className="h-3.5 w-3.5" />
            Sensor comercial
          </span>
        }
        actions={
          <Button variant="outline" size="sm" disabled={running} onClick={() => void loadCatalog()} className="min-h-[40px]">
            Refrescar catálogo
          </Button>
        }
      />

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Correr validación</CardTitle>
          <CardDescription>
            Provisiona demos QA aisladas, chequea SKUs/seeds y opcionalmente pide informe a Gemini.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-2 text-sm min-h-[40px]">
            <input
              type="checkbox"
              checked={withGemini}
              onChange={(e) => setWithGemini(e.target.checked)}
              className="rounded border"
            />
            Incluir Gemini
          </label>
          <Button disabled={running} onClick={() => void runValidation("featured")} className="min-h-[40px]">
            {running ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <PlayCircle className="h-4 w-4 mr-2" />
            )}
            Validar demos featured
          </Button>
          {summary && <span className="text-sm text-muted-foreground">{summary}</span>}
        </CardContent>
      </Card>

      {!loadingCatalog && featured.length === 0 && !error && (
        <EmptyState
          icon={ShieldCheck}
          title="Sin demos en el catálogo featured"
          description="No hay industrias featured para validar. Revisá el catálogo de demos o reintentá."
          actionLabel="Reintentar"
          onAction={() => void loadCatalog()}
        />
      )}

      {audit && (
        <Card className="border-emerald-500/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              Informe {audit.usedAi ? audit.provider : "local"}
              {audit.model ? (
                <span className="text-xs font-normal text-muted-foreground">{audit.model}</span>
              ) : null}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>{audit.resumen}</p>
            <ul className="list-disc pl-5 space-y-1">
              {audit.acciones.map((a) => (
                <li key={a}>{a}</li>
              ))}
            </ul>
            {audit.priorizacion?.length > 0 && (
              <div className="pt-2 space-y-1">
                <p className="font-medium">Prioridad intervención</p>
                {audit.priorizacion.map((p) => (
                  <div key={`${p.industryId}-${p.prioridad}`} className="flex gap-2 text-xs">
                    <Badge variant={p.prioridad === "P0" ? "destructive" : "secondary"}>
                      {p.prioridad}
                    </Badge>
                    <span>
                      {p.industryId}: {p.motivo}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {reports.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-medium">Resultados</h2>
          {reports.map((r) => (
            <Card key={r.industryId}>
              <CardHeader className="pb-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <CardTitle className="text-base">
                    {r.label}{" "}
                    <span className="text-muted-foreground font-normal text-sm">
                      ({r.industryId})
                    </span>
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <StatusBadge variant={verdictVariant(r.verdict)} label={verdictLabel(r.verdict)} />
                    <span className="text-xs text-muted-foreground">{r.durationMs}ms</span>
                  </div>
                </div>
                <CardDescription>{r.goldenPath}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-1 text-sm">
                {r.checks.map((c) => (
                  <div key={c.id} className="flex gap-2">
                    <span className="w-14 shrink-0 text-xs uppercase text-muted-foreground">
                      {c.status}
                    </span>
                    <span>
                      {c.label}
                      {c.detail ? `: ${c.detail}` : ""}
                    </span>
                  </div>
                ))}
                {r.error && <p className="text-destructive text-xs">{r.error}</p>}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Política por demo featured</CardTitle>
          <CardDescription>
            Qué se auto-activa vs qué pide intervención (sin provisionar).
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loadingCatalog ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Cargando…
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {featured.map((f) => (
                <div
                  key={f.industryId}
                  className="rounded-lg border p-3 space-y-2 text-sm"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-medium">
                        {f.emoji} {f.label}
                      </p>
                      <p className="text-xs text-muted-foreground">{f.goldenPath}</p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={running}
                      onClick={() => void runValidation("one", f.industryId)}
                    >
                      Validar
                    </Button>
                  </div>
                  <p className="text-xs">
                    <span className="text-[var(--status-success-foreground)]">auto:</span>{" "}
                    {f.autoSubscribe.auto.join(", ") || "—"}
                  </p>
                  {(f.autoSubscribe.analyst.length > 0 || f.autoSubscribe.blocked.length > 0) && (
                    <p className="text-xs text-[var(--status-warning-foreground)]">
                      manual: {[...f.autoSubscribe.analyst, ...f.autoSubscribe.blocked].join(", ")}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </PageShell>
  )
}
