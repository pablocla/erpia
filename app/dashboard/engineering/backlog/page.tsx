"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { PageShell, PageHeader } from "@/components/layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { useToast } from "@/hooks/use-toast"
import { authFetch } from "@/lib/stores"
import { cn } from "@/lib/utils"
import {
  BookOpen,
  Copy,
  Loader2,
  RefreshCw,
  Rocket,
  AlertTriangle,
  GitBranch,
  Star,
  Lock,
  Zap,
  ChevronRight,
} from "lucide-react"

type Ticket = {
  id: string
  title: string
  description: string
  epic: string
  priority: string
  wave: string
  assignee: string
  lifecycle: string
  estimate: string
  paths: string[]
  dod: string
  status: string
  statusNote?: string
  valueNote?: string
  blockedBy?: string[]
  cascadeBlocked: boolean
  cascadeBlockedBy: string[]
  cascadeDepth: number
  onCriticalPath: boolean
  prereqProgress: number
  tags?: string[]
  agentPrompt?: string
}

type WaveRow = {
  id: string
  name: string
  goal: string
  horizon: string
  color: string
  total: number
  done: number
  open: number
  percent: number
  criticalOpen: number
}

type AssigneeRow = {
  assignee: string
  label: string
  short: string
  does: string
  total: number
  open: number
  done: number
  actionable: number
  next: Array<{ id: string; title: string; priority: string; wave: string }>
}

type LifecycleRow = {
  id: string
  label: string
  total: number
  done: number
  open: number
  percent: number
}

type Payload = {
  source: string
  note: string
  counts: Record<string, number>
  waves: WaveRow[]
  assignees: AssigneeRow[]
  lifecycles: LifecycleRow[]
  next: Ticket[]
  nextGrok: Ticket[]
  nextGemini: Ticket[]
  tickets: Ticket[]
  edges: Array<{ from: string; to: string; satisfied: boolean }>
}

const WAVE_STYLES: Record<string, string> = {
  W0: "from-slate-500/20 via-slate-500/5 to-transparent border-slate-500/30",
  W1: "from-emerald-500/25 via-emerald-500/5 to-transparent border-emerald-500/40",
  W2: "from-sky-500/25 via-sky-500/5 to-transparent border-sky-500/40",
  W3: "from-violet-500/25 via-violet-500/5 to-transparent border-violet-500/40",
  W4: "from-amber-500/20 via-amber-500/5 to-transparent border-amber-500/30",
}

const WAVE_DOT: Record<string, string> = {
  W0: "bg-slate-400",
  W1: "bg-emerald-500",
  W2: "bg-sky-500",
  W3: "bg-violet-500",
  W4: "bg-amber-500",
}

const PRI_STYLE: Record<string, string> = {
  P0: "bg-red-500/15 text-red-700 border-red-500/40 dark:text-red-300",
  P1: "bg-orange-500/15 text-orange-700 border-orange-500/40 dark:text-orange-300",
  P2: "bg-blue-500/15 text-blue-700 border-blue-500/40 dark:text-blue-300",
  P3: "bg-muted text-muted-foreground border-border",
}

const GROK_PROMPT = `Sos Grok Build en el monorepo Claver (pos-system-argentina).

1) Leé docs/engineering/ASSIGNMENT.md, PRODUCT_BACKLOG.md, backlog-status.json, product-backlog-catalog.ts
2) Filtrá tickets assignee=grok o pair, status todo/doing, cascadeBlocked=false, prioridad P0/P1, ola W1 primero.
3) Implementá SOLO ese ticket (código). Agents.md multi-tenant.
4) backlog-status.json → done + note. No uses DB como backlog.`

const GEMINI_PROMPT = `Sos Gemini trabajando el monorepo Claver (solo lectura de docs + escritura de Markdown/docs).

1) Leé docs/engineering/ASSIGNMENT.md, PRODUCT_BACKLOG.md, backlog-status.json, GEMINI_QUEUE.md
2) Tomá el primer ticket assignee=gemini (o pair fase "spec") abierto, P0/P1, desbloqueado.
3) Ejecutá el agentPrompt del ticket. Guardá entregables en docs/ (comercial, engineering, qa, marketplace).
4) NO reescribas lib/ ni app/ sin que Grok lo pida. Al terminar, indicá el path del MD creado y pedí actualizar backlog-status.json a done (o dejá nota para Grok/humano).
5) Criterio: docs, copy es-AR, auditorías, playbooks, matrices QA, runbooks — no runtime TypeScript de producción.`

const ASSIGNEE_STYLE: Record<string, string> = {
  grok: "bg-emerald-500/15 text-emerald-800 border-emerald-500/40 dark:text-emerald-300",
  gemini: "bg-violet-500/15 text-violet-800 border-violet-500/40 dark:text-violet-300",
  pair: "bg-sky-500/15 text-sky-800 border-sky-500/40 dark:text-sky-300",
  human: "bg-amber-500/15 text-amber-900 border-amber-500/40 dark:text-amber-200",
}

export default function EngineeringBacklogPage() {
  const { toast } = useToast()
  const [data, setData] = useState<Payload | null>(null)
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState("open")
  const [priorityFilter, setPriorityFilter] = useState("all")
  const [waveFilter, setWaveFilter] = useState("all")
  const [assigneeFilter, setAssigneeFilter] = useState("all")
  const [lifecycleFilter, setLifecycleFilter] = useState("all")
  const [criticalOnly, setCriticalOnly] = useState(false)
  const [q, setQ] = useState("")
  const [busyId, setBusyId] = useState<string | null>(null)
  const [view, setView] = useState<"cascade" | "list" | "lifecycle">("cascade")

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await authFetch("/api/engineering/backlog")
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || "Error")
      setData(json)
    } catch (e) {
      toast({
        title: "No se pudo cargar backlog",
        description: e instanceof Error ? e.message : "Error",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    void load()
  }, [load])

  const filtered = useMemo(() => {
    if (!data?.tickets) return []
    return data.tickets.filter((t) => {
      if (statusFilter === "open" && (t.status === "done" || t.status === "cancelled")) return false
      if (statusFilter !== "open" && statusFilter !== "all" && t.status !== statusFilter) return false
      if (priorityFilter !== "all" && t.priority !== priorityFilter) return false
      if (waveFilter !== "all" && t.wave !== waveFilter) return false
      if (assigneeFilter !== "all" && t.assignee !== assigneeFilter) return false
      if (lifecycleFilter !== "all" && t.lifecycle !== lifecycleFilter) return false
      if (criticalOnly && !t.onCriticalPath) return false
      if (q.trim()) {
        const s = q.toLowerCase()
        if (
          !t.id.toLowerCase().includes(s) &&
          !t.title.toLowerCase().includes(s) &&
          !t.description.toLowerCase().includes(s) &&
          !t.assignee?.includes(s) &&
          !t.lifecycle?.includes(s)
        ) {
          return false
        }
      }
      return true
    })
  }, [data, statusFilter, priorityFilter, waveFilter, assigneeFilter, lifecycleFilter, criticalOnly, q])

  const byWave = useMemo(() => {
    const map = new Map<string, Ticket[]>()
    for (const t of filtered) {
      const arr = map.get(t.wave) ?? []
      arr.push(t)
      map.set(t.wave, arr)
    }
    return map
  }, [filtered])

  async function setStatus(id: string, status: string) {
    setBusyId(id)
    try {
      const res = await authFetch("/api/engineering/backlog", {
        method: "PATCH",
        body: JSON.stringify({ id, status }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || "Error")
      toast({
        title: `${id} → ${status}`,
        description: json.reminder || "Commiteá backlog-status.json",
      })
      await load()
    } catch (e) {
      toast({
        title: "No se pudo actualizar",
        description: e instanceof Error ? e.message : "Error",
        variant: "destructive",
      })
    } finally {
      setBusyId(null)
    }
  }

  async function copyPrompt(kind: "grok" | "gemini") {
    await navigator.clipboard.writeText(kind === "grok" ? GROK_PROMPT : GEMINI_PROMPT)
    toast({
      title: kind === "grok" ? "Prompt Grok copiado" : "Prompt Gemini copiado",
      description: kind === "gemini" ? "Cola docs/playbooks/QA" : "Cola código monorepo",
    })
  }

  const overallPct = data
    ? Math.round(((data.counts.done ?? 0) / Math.max(1, data.counts.total ?? 1)) * 100)
    : 0

  return (
    <PageShell>
      <div className="relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/10 via-background to-violet-500/5 p-6 mb-6">
        <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-emerald-500/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-12 left-1/3 h-40 w-40 rounded-full bg-sky-500/10 blur-3xl" />
        <PageHeader
          title="Engineering Cascade"
          description="Backlog de producto con olas W0→W4, DAG de dependencias y critical path a pesos recuperados. Fuente: repo (Grok no necesita DB)."
          className="relative"
          actions={
            <div className="flex flex-wrap gap-2">
              <Button
                variant={view === "cascade" ? "default" : "outline"}
                size="sm"
                onClick={() => setView("cascade")}
              >
                <GitBranch className="mr-1 h-4 w-4" />
                Cascada
              </Button>
              <Button
                variant={view === "list" ? "default" : "outline"}
                size="sm"
                onClick={() => setView("list")}
              >
                Lista
              </Button>
              <Button variant="outline" size="sm" onClick={() => void load()}>
                <RefreshCw className="mr-1 h-4 w-4" />
              </Button>
              <Button size="sm" variant="secondary" className="bg-emerald-600 text-white hover:bg-emerald-500" onClick={() => void copyPrompt("grok")}>
                <Copy className="mr-1 h-4 w-4" />
                Prompt Grok
              </Button>
              <Button size="sm" className="bg-violet-600 text-white hover:bg-violet-500" onClick={() => void copyPrompt("gemini")}>
                <Copy className="mr-1 h-4 w-4" />
                Prompt Gemini
              </Button>
            </div>
          }
        />
        {data && (
          <div className="relative mt-4 space-y-2">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>
                {data.counts.done}/{data.counts.total} done · {data.counts.criticalOpen} críticos abiertos
              </span>
              <span className="font-mono">{overallPct}%</span>
            </div>
            <Progress value={overallPct} className="h-2" />
          </div>
        )}
      </div>

      <Alert className="mb-4 border-sky-500/30 bg-sky-500/5">
        <BookOpen className="h-4 w-4 text-sky-600" />
        <AlertTitle className="flex items-center gap-2">
          Grok Build lee el repo
          <Badge variant="outline" className="font-mono text-[10px]">
            no Postgres
          </Badge>
        </AlertTitle>
        <AlertDescription className="text-sm">
          <code className="text-[11px]">product-backlog-catalog.ts</code> +{" "}
          <code className="text-[11px]">backlog-status.json</code> · Cascada ={" "}
          <code className="text-[11px]">wave</code> + <code className="text-[11px]">blockedBy</code> · ★ =
          critical path a $ recuperados
        </AlertDescription>
      </Alert>

      {/* Wave pipeline */}
      {data?.waves && (
        <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {data.waves.map((w, i) => (
            <button
              key={w.id}
              type="button"
              onClick={() => setWaveFilter(waveFilter === w.id ? "all" : w.id)}
              className={cn(
                "group relative overflow-hidden rounded-xl border bg-gradient-to-br p-4 text-left transition-all hover:scale-[1.02]",
                WAVE_STYLES[w.id],
                waveFilter === w.id && "ring-2 ring-primary",
              )}
            >
              <div className="flex items-center gap-2">
                <span className={cn("h-2 w-2 rounded-full", WAVE_DOT[w.id])} />
                <span className="text-[10px] font-bold tracking-wider text-muted-foreground">
                  {w.id}
                </span>
                {i < data.waves.length - 1 && (
                  <ChevronRight className="ml-auto h-3 w-3 text-muted-foreground/50" />
                )}
              </div>
              <p className="mt-1 text-sm font-semibold leading-tight">{w.name.replace(/^W\d · /, "")}</p>
              <p className="mt-1 line-clamp-2 text-[10px] text-muted-foreground">{w.goal}</p>
              <div className="mt-3 flex items-end justify-between">
                <span className="text-2xl font-bold tabular-nums">{w.percent}%</span>
                <span className="text-[10px] text-muted-foreground">
                  {w.done}/{w.total}
                  {w.criticalOpen > 0 && (
                    <span className="ml-1 text-amber-600">· {w.criticalOpen}★</span>
                  )}
                </span>
              </div>
              <Progress value={w.percent} className="mt-2 h-1" />
            </button>
          ))}
        </div>
      )}

      {/* Dual agent queues */}
      {data && (
        <div className="mb-4 grid gap-3 lg:grid-cols-2">
          <Card className="overflow-hidden border-emerald-500/40">
            <div className="bg-gradient-to-r from-emerald-500/20 to-transparent px-4 py-2">
              <CardTitle className="flex items-center gap-2 text-sm">
                <Rocket className="h-4 w-4 text-emerald-600" />
                Cola GROK Build
                <Badge className="bg-emerald-600 text-[10px]">{data.counts.grokOpen ?? 0} abiertos</Badge>
              </CardTitle>
              <CardDescription className="text-[11px]">Código, APIs, tests, runtime</CardDescription>
            </div>
            <CardContent className="flex flex-wrap gap-2 pt-3">
              {(data.nextGrok ?? data.next ?? []).map((t) => (
                <Badge key={t.id} variant="outline" className={cn("gap-1 py-1 font-mono text-[10px]", ASSIGNEE_STYLE.grok)}>
                  {t.onCriticalPath && <Star className="h-3 w-3 text-amber-500" />}
                  {t.id} · {t.priority}
                  <span className="max-w-[120px] truncate font-sans font-normal">{t.title}</span>
                </Badge>
              ))}
              {(data.nextGrok ?? []).length === 0 && (
                <p className="text-xs text-muted-foreground">Sin P0/P1 desbloqueados</p>
              )}
            </CardContent>
          </Card>
          <Card className="overflow-hidden border-violet-500/40">
            <div className="bg-gradient-to-r from-violet-500/20 to-transparent px-4 py-2">
              <CardTitle className="flex items-center gap-2 text-sm">
                <Zap className="h-4 w-4 text-violet-600" />
                Cola GEMINI
                <Badge className="bg-violet-600 text-[10px]">{data.counts.geminiOpen ?? 0} abiertos</Badge>
              </CardTitle>
              <CardDescription className="text-[11px]">Docs, copy, playbooks, QA, runbooks</CardDescription>
            </div>
            <CardContent className="flex flex-wrap gap-2 pt-3">
              {(data.nextGemini ?? []).map((t) => (
                <Badge key={t.id} variant="outline" className={cn("gap-1 py-1 font-mono text-[10px]", ASSIGNEE_STYLE.gemini)}>
                  {t.id} · {t.priority}
                  <span className="max-w-[120px] truncate font-sans font-normal">{t.title}</span>
                </Badge>
              ))}
              {(data.nextGemini ?? []).length === 0 && (
                <p className="text-xs text-muted-foreground">Sin P0/P1 desbloqueados</p>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Lifecycle strip */}
      {data?.lifecycles && data.lifecycles.length > 0 && (
        <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
          {data.lifecycles.map((lc) => (
            <button
              key={lc.id}
              type="button"
              onClick={() => setLifecycleFilter(lifecycleFilter === lc.id ? "all" : lc.id)}
              className={cn(
                "min-w-[120px] shrink-0 rounded-lg border px-3 py-2 text-left transition-colors",
                lifecycleFilter === lc.id ? "border-primary bg-primary/10" : "border-border/60 hover:bg-muted/40",
              )}
            >
              <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{lc.label}</p>
              <p className="text-lg font-bold tabular-nums">{lc.percent}%</p>
              <p className="text-[10px] text-muted-foreground">{lc.done}/{lc.total}</p>
            </button>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="mb-4 flex flex-wrap gap-2">
        <Input
          placeholder="Buscar ED-01, leo, gemini…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="max-w-xs"
        />
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="open">Abiertos</SelectItem>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="todo">todo</SelectItem>
            <SelectItem value="doing">doing</SelectItem>
            <SelectItem value="done">done</SelectItem>
          </SelectContent>
        </Select>
        <Select value={priorityFilter} onValueChange={setPriorityFilter}>
          <SelectTrigger className="w-28">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Pri</SelectItem>
            <SelectItem value="P0">P0</SelectItem>
            <SelectItem value="P1">P1</SelectItem>
            <SelectItem value="P2">P2</SelectItem>
            <SelectItem value="P3">P3</SelectItem>
          </SelectContent>
        </Select>
        <Select value={waveFilter} onValueChange={setWaveFilter}>
          <SelectTrigger className="w-28">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Olas</SelectItem>
            <SelectItem value="W0">W0</SelectItem>
            <SelectItem value="W1">W1</SelectItem>
            <SelectItem value="W2">W2</SelectItem>
            <SelectItem value="W3">W3</SelectItem>
            <SelectItem value="W4">W4</SelectItem>
          </SelectContent>
        </Select>
        <Select value={assigneeFilter} onValueChange={setAssigneeFilter}>
          <SelectTrigger className="w-32">
            <SelectValue placeholder="Assignee" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="grok">Grok</SelectItem>
            <SelectItem value="gemini">Gemini</SelectItem>
            <SelectItem value="pair">Pair</SelectItem>
            <SelectItem value="human">Humano</SelectItem>
          </SelectContent>
        </Select>
        <Button
          size="sm"
          variant={criticalOnly ? "default" : "outline"}
          onClick={() => setCriticalOnly((v) => !v)}
          className="gap-1"
        >
          <Star className="h-3.5 w-3.5" />
          Critical path
        </Button>
        <Button
          size="sm"
          variant={view === "lifecycle" ? "default" : "outline"}
          onClick={() => setView(view === "lifecycle" ? "cascade" : "lifecycle")}
        >
          Ciclo de vida
        </Button>
      </div>

      {loading && (
        <div className="flex justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      )}

      {!loading && view === "cascade" && (
        <div className="space-y-8">
          {(["W0", "W1", "W2", "W3", "W4"] as const).map((waveId) => {
            const tickets = byWave.get(waveId) ?? []
            if (tickets.length === 0 && waveFilter !== "all" && waveFilter !== waveId) return null
            if (tickets.length === 0 && statusFilter === "open" && waveId === "W0") {
              // still show wave header if filter open and all W0 done
            }
            const meta = data?.waves.find((w) => w.id === waveId)
            if (!meta) return null
            if (tickets.length === 0 && waveFilter === "all" && statusFilter === "open" && waveId !== "W0") {
              // show empty waves only if they have open tickets or all view
            }
            if (tickets.length === 0) {
              if (statusFilter === "open" && (meta.open ?? 0) === 0 && waveId !== "W1") return null
              if (tickets.length === 0 && statusFilter === "open") return null
            }

            // Group by cascade depth within wave
            const maxDepth = Math.max(0, ...tickets.map((t) => t.cascadeDepth))
            const depthCols: Ticket[][] = []
            for (let d = 0; d <= maxDepth; d++) {
              depthCols.push(tickets.filter((t) => t.cascadeDepth === d))
            }

            return (
              <section key={waveId} className="space-y-3">
                <div
                  className={cn(
                    "flex flex-wrap items-center gap-3 rounded-xl border bg-gradient-to-r px-4 py-3",
                    WAVE_STYLES[waveId],
                  )}
                >
                  <span className={cn("h-3 w-3 rounded-full shadow-lg", WAVE_DOT[waveId])} />
                  <div>
                    <h2 className="text-sm font-bold tracking-tight">{meta.name}</h2>
                    <p className="text-[11px] text-muted-foreground">
                      {meta.horizon} · {meta.goal}
                    </p>
                  </div>
                  <div className="ml-auto flex items-center gap-3">
                    <span className="font-mono text-xs text-muted-foreground">
                      {meta.done}/{meta.total}
                    </span>
                    <div className="w-24">
                      <Progress value={meta.percent} className="h-1.5" />
                    </div>
                  </div>
                </div>

                {/* Depth cascade columns */}
                <div className="flex gap-3 overflow-x-auto pb-2">
                  {depthCols.map((col, depth) => {
                    if (col.length === 0) return null
                    return (
                      <div key={depth} className="min-w-[280px] max-w-[320px] flex-shrink-0 space-y-2">
                        <div className="sticky top-0 z-10 flex items-center gap-2 px-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                          <GitBranch className="h-3 w-3" />
                          Depth {depth}
                          {depth > 0 && (
                            <span className="font-normal normal-case">← requiere depth {depth - 1}</span>
                          )}
                        </div>
                        {col.map((t) => (
                          <TicketCard
                            key={t.id}
                            t={t}
                            busy={busyId === t.id}
                            onStatus={setStatus}
                          />
                        ))}
                      </div>
                    )
                  })}
                </div>
              </section>
            )
          })}
        </div>
      )}

      {!loading && (view === "list" || view === "lifecycle") && (
        <div className="space-y-3">
          {view === "lifecycle" &&
            (data?.lifecycles ?? []).map((lc) => {
              const items = filtered.filter((t) => t.lifecycle === lc.id)
              if (items.length === 0) return null
              return (
                <section key={lc.id} className="space-y-2">
                  <h3 className="text-sm font-bold tracking-tight">
                    {lc.label}{" "}
                    <span className="font-mono text-xs font-normal text-muted-foreground">
                      {lc.done}/{lc.total}
                    </span>
                  </h3>
                  <div className="grid gap-2 md:grid-cols-2">
                    {items.map((t) => (
                      <TicketCard key={t.id} t={t} busy={busyId === t.id} onStatus={setStatus} />
                    ))}
                  </div>
                </section>
              )
            })}
          {view === "list" &&
            filtered.map((t) => (
              <TicketCard key={t.id} t={t} busy={busyId === t.id} onStatus={setStatus} wide />
            ))}
          {filtered.length === 0 && (
            <p className="py-12 text-center text-sm text-muted-foreground">Sin tickets con ese filtro.</p>
          )}
        </div>
      )}
    </PageShell>
  )
}

function TicketCard({
  t,
  busy,
  onStatus,
  wide,
}: {
  t: Ticket
  busy: boolean
  onStatus: (id: string, s: string) => void
  wide?: boolean
}) {
  return (
    <Card
      className={cn(
        "relative overflow-hidden border transition-shadow hover:shadow-md",
        t.onCriticalPath && "border-amber-500/40 shadow-amber-500/5",
        t.status === "done" && "opacity-70",
        t.cascadeBlocked && t.status !== "done" && "border-dashed",
        wide && "w-full",
      )}
    >
      {t.onCriticalPath && (
        <div className="absolute right-0 top-0 rounded-bl-md bg-amber-500/20 px-1.5 py-0.5">
          <Star className="h-3 w-3 text-amber-600" />
        </div>
      )}
      <CardHeader className="space-y-2 p-3 pb-2">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="font-mono text-xs font-bold text-primary">{t.id}</span>
          <span
            className={cn(
              "rounded border px-1 py-0 text-[9px] font-bold uppercase",
              ASSIGNEE_STYLE[t.assignee] ?? ASSIGNEE_STYLE.grok,
            )}
          >
            {t.assignee}
          </span>
          <span
            className={cn(
              "rounded border px-1.5 py-0 text-[10px] font-semibold",
              PRI_STYLE[t.priority],
            )}
          >
            {t.priority}
          </span>
          <Badge variant="outline" className="text-[9px]">
            {t.wave}
          </Badge>
          <Badge variant="outline" className="text-[9px]">
            {t.lifecycle}
          </Badge>
          <Badge
            variant={
              t.status === "done"
                ? "secondary"
                : t.status === "doing"
                  ? "default"
                  : t.cascadeBlocked
                    ? "destructive"
                    : "outline"
            }
            className="text-[9px]"
          >
            {t.cascadeBlocked && t.status !== "done" ? "locked" : t.status}
          </Badge>
        </div>
        <CardTitle className="text-sm font-semibold leading-snug">{t.title}</CardTitle>
        <CardDescription className="line-clamp-2 text-[11px]">{t.description}</CardDescription>
        {t.valueNote && (
          <p className="text-[10px] font-medium text-emerald-700 dark:text-emerald-400">
            → {t.valueNote}
          </p>
        )}
      </CardHeader>
      <CardContent className="space-y-2 p-3 pt-0">
        {(t.blockedBy?.length ?? 0) > 0 && (
          <div className="space-y-1">
            <div className="flex items-center justify-between text-[10px] text-muted-foreground">
              <span className="flex items-center gap-1">
                {t.cascadeBlocked ? (
                  <Lock className="h-3 w-3 text-amber-600" />
                ) : (
                  <GitBranch className="h-3 w-3" />
                )}
                Prereqs
              </span>
              <span>{Math.round(t.prereqProgress * 100)}%</span>
            </div>
            <Progress value={t.prereqProgress * 100} className="h-1" />
            <p className="font-mono text-[9px] text-muted-foreground">
              {t.blockedBy?.join(" → ")}
              {t.cascadeBlockedBy.length > 0 && (
                <span className="text-amber-600"> · falta: {t.cascadeBlockedBy.join(", ")}</span>
              )}
            </p>
          </div>
        )}
        <p className="line-clamp-2 text-[10px] text-muted-foreground">
          <AlertTriangle className="mr-0.5 inline h-3 w-3" />
          DoD: {t.dod}
        </p>
        <p className="truncate font-mono text-[9px] text-muted-foreground/80">
          {t.estimate} · {t.paths[0]}
        </p>
        <div className="flex flex-wrap gap-1 pt-1">
          {(["todo", "doing", "done"] as const).map((s) => (
            <Button
              key={s}
              size="sm"
              variant={t.status === s ? "default" : "ghost"}
              className="h-6 px-2 text-[10px]"
              disabled={busy || t.status === s}
              onClick={() => onStatus(t.id, s)}
            >
              {s}
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
