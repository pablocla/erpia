"use client"

import { useCallback, useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useToast } from "@/hooks/use-toast"
import { authFetch } from "@/lib/stores"
import {
  Bot,
  Cable,
  ClipboardList,
  History,
  Play,
  RefreshCw,
  Save,
  Sparkles,
  Users,
  Zap,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { AutomationWizard } from "./automation-wizard"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { automationErrorMessage } from "@/lib/automation/ui-messages"
import type { ModoConexion } from "@/lib/automation/n8n-bridge"

const WIZARD_DONE_KEY = "nop_automation_wizard_done"

interface EventRow {
  key: string
  label: string
  activo: boolean
  configurado: boolean
  n8nWebhookUrl: string | null
}

interface SuscripcionUso {
  sku: string
  activo: boolean
  producto: { nombre: string; sku: string }
  uso: { mes: string; usado: number; limite: number | null }
}

interface AutomationConfig {
  n8nBaseUrl: string | null
  n8nApiKeySet: boolean
  webhookSecret: string
  activo: boolean
  metadata?: { modoConexion?: ModoConexion } | null
  eventMaps: Array<{ eventKey: string; n8nWebhookUrl: string; activo: boolean }>
  playbooks: Array<{
    id: number
    playbookKey: string
    nombre: string
    activo: boolean
    parametros: Record<string, unknown>
  }>
  virtualWorkers: Array<{
    id: number
    nombre: string
    rol: string
    playbooks: string[]
    cron: string | null
    activo: boolean
    lastRunAt: string | null
  }>
}

interface ExecutionRow {
  id: string
  direction: string
  eventKey: string | null
  status: string
  durationMs: number | null
  createdAt: string
}

interface CatalogWorker {
  nombre: string
  rol: string
  playbooks: string[]
  cron: string
  activo: boolean
  descripcion: string
  entitlementSku: string
}

export function AutomationHub() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)
  const [config, setConfig] = useState<AutomationConfig | null>(null)
  const [events, setEvents] = useState<EventRow[]>([])
  const [executions, setExecutions] = useState<ExecutionRow[]>([])
  const [n8nBaseUrl, setN8nBaseUrl] = useState("")
  const [n8nApiKey, setN8nApiKey] = useState("")
  const [webhookSecret, setWebhookSecret] = useState("")
  const [eventUrls, setEventUrls] = useState<Record<string, string>>({})
  const [eventActive, setEventActive] = useState<Record<string, boolean>>({})
  const [catalogWorkers, setCatalogWorkers] = useState<CatalogWorker[]>([])
  const [seeding, setSeeding] = useState(false)
  const [showWizard, setShowWizard] = useState(false)
  const [modoConexion, setModoConexion] = useState<ModoConexion>("webhook")
  const [suscripcion, setSuscripcion] = useState<SuscripcionUso | null>(null)

  const loadAll = useCallback(async () => {
    setLoading(true)
    try {
      const [cfgRes, evRes, exRes, catRes, subRes] = await Promise.all([
        authFetch("/api/automation/config"),
        authFetch("/api/automation/events"),
        authFetch("/api/automation/executions?take=50"),
        authFetch("/api/automation/catalog"),
        authFetch("/api/platform/suscripciones"),
      ])
      if (cfgRes.ok) {
        const cfg = (await cfgRes.json()) as AutomationConfig
        setConfig(cfg)
        setN8nBaseUrl(cfg.n8nBaseUrl ?? "")
        setWebhookSecret(cfg.webhookSecret ?? "")
        const modo = cfg.metadata?.modoConexion
        setModoConexion(modo === "poll" || modo === "both" ? modo : "webhook")
        const urls: Record<string, string> = {}
        const active: Record<string, boolean> = {}
        for (const m of cfg.eventMaps) {
          urls[m.eventKey] = m.n8nWebhookUrl
          active[m.eventKey] = m.activo
        }
        setEventUrls(urls)
        setEventActive(active)
      }
      if (evRes.ok) {
        const data = await evRes.json()
        setEvents(data.events ?? [])
      }
      if (exRes.ok) {
        setExecutions(await exRes.json())
      }
      if (catRes.ok) {
        const cat = await catRes.json()
        setCatalogWorkers(cat.virtualWorkers ?? [])
      }
      if (subRes.ok) {
        const subData = await subRes.json()
        const auto = (subData.suscripciones as SuscripcionUso[] | undefined)?.find(
          (s) => s.sku === "automation.n8n_hub"
        )
        setSuscripcion(auto ?? null)
      }
    } catch {
      toast({
        title: "Error al cargar",
        description: "No se pudo cargar la configuración de automatización.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    void loadAll()
  }, [loadAll])

  useEffect(() => {
    if (loading || !config) return
    const done = typeof window !== "undefined" && localStorage.getItem(WIZARD_DONE_KEY)
    if (!done && !config.activo) {
      setShowWizard(true)
    }
  }, [loading, config])

  async function persistConfig(activoOverride?: boolean) {
    const eventMaps = events
      .filter((e) => eventUrls[e.key]?.trim())
      .map((e) => ({
        eventKey: e.key,
        n8nWebhookUrl: eventUrls[e.key].trim(),
        activo: eventActive[e.key] ?? false,
      }))

    const res = await authFetch("/api/automation/config", {
      method: "PUT",
      body: JSON.stringify({
        n8nBaseUrl: n8nBaseUrl || null,
        n8nApiKey: n8nApiKey || undefined,
        webhookSecret: webhookSecret || undefined,
        activo: activoOverride ?? config?.activo ?? false,
        metadata: {
          ...(config?.metadata ?? {}),
          modoConexion,
        },
        eventMaps,
      }),
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.error ?? "Error al guardar")
    }
    setConfig(await res.json())
    setN8nApiKey("")
    return res
  }

  async function handleSave() {
    setSaving(true)
    try {
      await persistConfig()
      toast({ title: "Configuración guardada", description: "Los cambios se aplicaron correctamente." })
      void loadAll()
    } catch (err) {
      toast({
        title: "No se pudo guardar",
        description: err instanceof Error ? err.message : "Error desconocido",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  async function runConnectionTest(): Promise<{ ok: boolean; reason?: string }> {
    const res = await authFetch("/api/automation/test", { method: "POST" })
    const data = await res.json()
    return { ok: Boolean(data.ok), reason: data.reason }
  }

  async function handleTest() {
    setTesting(true)
    try {
      const data = await runConnectionTest()
      if (data.ok) {
        toast({
          title: "Evento de prueba enviado",
          description: "Revisá los logs para ver la respuesta de n8n.",
        })
      } else {
        toast({
          title: "Webhook no despachado",
          description: automationErrorMessage(data.reason),
          variant: "destructive",
        })
      }
      void loadAll()
    } catch {
      toast({
        title: "Error en prueba",
        description: automationErrorMessage("n8n_unreachable"),
        variant: "destructive",
      })
    } finally {
      setTesting(false)
    }
  }

  async function handleSeed(force = false) {
    setSeeding(true)
    try {
      const res = await authFetch("/api/automation/seed", {
        method: "POST",
        body: JSON.stringify({ force }),
      })
      const data = await res.json()
      toast({
        title: data.seeded ? "Catálogo instalado" : "Ya estaba configurado",
        description: data.seeded
          ? `${data.workers} workers y ${data.playbooks} playbooks listos.`
          : `${data.workers ?? 0} workers activos.`,
      })
      void loadAll()
    } catch {
      toast({ title: "Error al instalar catálogo", variant: "destructive" })
    } finally {
      setSeeding(false)
    }
  }

  async function runPlaybook(key: string) {
    const res = await authFetch(`/api/automation/playbooks/${key}/run`, {
      method: "POST",
      body: JSON.stringify({}),
    })
    const data = await res.json()
    toast({
      title: data.ok ? "Playbook ejecutado" : "Playbook con errores",
      description: data.actions?.join(", ") ?? data.error,
      variant: data.ok ? "default" : "destructive",
    })
    void loadAll()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-muted-foreground">
        <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
        Cargando Automation Hub…
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-primary" />
            Automatización NOP
          </h1>
          <p className="text-muted-foreground mt-1">
            Conectá n8n, mapeá eventos y delegá tareas a empleados virtuales.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {!showWizard && (
            <Button variant="outline" size="sm" onClick={() => setShowWizard(true)}>
              Configurar automatización
            </Button>
          )}
          <Badge variant={config?.activo ? "default" : "secondary"}>
            {config?.activo ? "Activo" : "Inactivo"}
          </Badge>
          <Switch
            checked={config?.activo ?? false}
            onCheckedChange={(v) => setConfig((c) => (c ? { ...c, activo: v } : c))}
          />
        </div>
      </div>

      {suscripcion && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Plan y uso del mes</CardTitle>
            <CardDescription>
              SKU {suscripcion.sku} · {suscripcion.producto.nombre}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap items-center gap-3 text-sm">
            <Badge variant={suscripcion.activo ? "default" : "secondary"}>
              {suscripcion.activo ? "Suscripción activa" : "Inactiva"}
            </Badge>
            <span className="text-muted-foreground">
              {suscripcion.uso.mes}:{" "}
              <strong>{suscripcion.uso.usado.toLocaleString("es-AR")}</strong>
              {suscripcion.uso.limite != null
                ? ` / ${suscripcion.uso.limite.toLocaleString("es-AR")} eventos`
                : " eventos (sin límite)"}
            </span>
            {suscripcion.uso.limite != null &&
              suscripcion.uso.usado >= suscripcion.uso.limite * 0.9 && (
                <span className="text-amber-600 text-xs">
                  {suscripcion.uso.usado >= suscripcion.uso.limite
                    ? automationErrorMessage("usage_limit_exceeded")
                    : "Cerca del límite mensual"}
                </span>
              )}
          </CardContent>
        </Card>
      )}

      {showWizard && (
        <AutomationWizard
          events={events}
          n8nBaseUrl={n8nBaseUrl}
          webhookSecret={webhookSecret}
          eventUrls={eventUrls}
          eventActive={eventActive}
          workersCount={config?.virtualWorkers.length ?? 0}
          onN8nBaseUrlChange={setN8nBaseUrl}
          onWebhookSecretChange={setWebhookSecret}
          onEventUrlChange={(key, url) => setEventUrls((u) => ({ ...u, [key]: url }))}
          onEventActiveChange={(key, active) => setEventActive((a) => ({ ...a, [key]: active }))}
          onSaveConfig={async () => {
            setSaving(true)
            try {
              await persistConfig()
            } finally {
              setSaving(false)
            }
          }}
          onSeed={async () => {
            await handleSeed(false)
          }}
          onTest={runConnectionTest}
          onActivate={async () => {
            setConfig((c) => (c ? { ...c, activo: true } : c))
            await persistConfig(true)
          }}
          onComplete={() => {
            localStorage.setItem(WIZARD_DONE_KEY, "1")
            setShowWizard(false)
            void loadAll()
          }}
        />
      )}

      <Tabs defaultValue="conexion" className="space-y-4">
        <TabsList className="flex flex-wrap h-auto gap-1">
          <TabsTrigger value="conexion" className="gap-1.5">
            <Cable className="h-3.5 w-3.5" /> Conexión
          </TabsTrigger>
          <TabsTrigger value="eventos" className="gap-1.5">
            <Zap className="h-3.5 w-3.5" /> Eventos
          </TabsTrigger>
          <TabsTrigger value="playbooks" className="gap-1.5">
            <ClipboardList className="h-3.5 w-3.5" /> Playbooks
          </TabsTrigger>
          <TabsTrigger value="workers" className="gap-1.5">
            <Users className="h-3.5 w-3.5" /> Empleados virtuales
          </TabsTrigger>
          <TabsTrigger value="logs" className="gap-1.5">
            <History className="h-3.5 w-3.5" /> Logs
          </TabsTrigger>
        </TabsList>

        <TabsContent value="conexion">
          <Card>
            <CardHeader>
              <CardTitle>Conectá tu motor n8n</CardTitle>
              <CardDescription>
                Vinculá tu servidor local o en la nube para procesar eventos.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 max-w-xl">
              <div className="space-y-2">
                <Label>URL Base n8n</Label>
                <Input
                  placeholder="https://n8n.tuempresa.com"
                  value={n8nBaseUrl}
                  onChange={(e) => setN8nBaseUrl(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>API Key n8n {config?.n8nApiKeySet && "(configurada)"}</Label>
                <Input
                  type="password"
                  placeholder="Dejar vacío para no cambiar"
                  value={n8nApiKey}
                  onChange={(e) => setN8nApiKey(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Webhook Secret (HMAC)</Label>
                <Input
                  value={webhookSecret}
                  onChange={(e) => setWebhookSecret(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Generá o pegá una llave segura para firmar los datos salientes.
                </p>
              </div>
              <div className="space-y-2">
                <Label>Modo de conexión n8n</Label>
                <Select
                  value={modoConexion}
                  onValueChange={(v) => setModoConexion(v as ModoConexion)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="webhook">
                      Webhook saliente (NOP → n8n)
                    </SelectItem>
                    <SelectItem value="poll">
                      Poll (n8n consulta /api/automation/poll)
                    </SelectItem>
                    <SelectItem value="both">Ambos (webhook + cola poll)</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Usá Poll si tu firewall bloquea POST salientes desde NOP.
                </p>
              </div>
              <div className="flex flex-wrap gap-2 pt-2">
                <Button onClick={handleSave} disabled={saving}>
                  <Save className="mr-2 h-4 w-4" />
                  {saving ? "Guardando…" : "Guardar"}
                </Button>
                <Button variant="outline" onClick={handleTest} disabled={testing}>
                  <Play className="mr-2 h-4 w-4" />
                  {testing ? "Enviando…" : "Probar conexión"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="eventos">
          <Card>
            <CardHeader>
              <CardTitle>Elegí qué eventos enviar</CardTitle>
              <CardDescription>
                Activá triggers que NOP disparará automáticamente hacia n8n.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {events.length === 0 ? (
                <p className="text-muted-foreground text-sm">Sin eventos en catálogo.</p>
              ) : (
                events.map((ev) => (
                  <div
                    key={ev.key}
                    className="flex flex-col gap-2 rounded-lg border p-4 sm:flex-row sm:items-center"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="font-medium">{ev.label}</div>
                      <code className="text-xs text-muted-foreground">{ev.key}</code>
                    </div>
                    <Input
                      className="sm:max-w-md"
                      placeholder="https://n8n.../webhook/..."
                      value={eventUrls[ev.key] ?? ""}
                      onChange={(e) =>
                        setEventUrls((u) => ({ ...u, [ev.key]: e.target.value }))
                      }
                    />
                    <Switch
                      checked={eventActive[ev.key] ?? ev.activo}
                      onCheckedChange={(v) =>
                        setEventActive((a) => ({ ...a, [ev.key]: v }))
                      }
                    />
                  </div>
                ))
              )}
              <Button onClick={handleSave} disabled={saving}>
                <Save className="mr-2 h-4 w-4" /> Guardar mapas
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="playbooks">
          <Card>
            <CardHeader>
              <CardTitle>Playbooks locales</CardTitle>
              <CardDescription>
                Reglas NOP que corren sin n8n (stock bajo, brief matutino).
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {(config?.playbooks ?? []).map((pb) => (
                  <div
                    key={pb.playbookKey}
                    className="flex items-center justify-between rounded-lg border p-4"
                  >
                    <div>
                      <div className="font-medium">{pb.nombre}</div>
                      <code className="text-xs text-muted-foreground">{pb.playbookKey}</code>
                    </div>
                    <Button size="sm" variant="outline" onClick={() => runPlaybook(pb.playbookKey)}>
                      <Bot className="mr-1 h-3.5 w-3.5" /> Ejecutar
                    </Button>
                  </div>
                )
              )}
              {(!config?.playbooks.length) && (
                <p className="text-sm text-muted-foreground">
                  Instalá el catálogo para cargar los 11 playbooks predefinidos.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="workers">
          <Card>
            <CardHeader>
              <CardTitle>Empleados virtuales</CardTitle>
              <CardDescription>
                Ana Reposición controlará faltantes y armará tareas en horario de depósito.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {(config?.virtualWorkers ?? []).map((w) => {
                const meta = catalogWorkers.find((c) => c.nombre === w.nombre)
                return (
                  <div key={w.id || w.nombre} className="rounded-lg border p-4 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Bot className="h-4 w-4 text-primary" />
                      <span className="font-medium">{w.nombre}</span>
                      <Badge variant="outline">{w.rol}</Badge>
                      {w.activo ? <Badge>Activo</Badge> : <Badge variant="secondary">Inactivo</Badge>}
                    </div>
                    {meta?.descripcion && (
                      <p className="text-sm text-muted-foreground">{meta.descripcion}</p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      Cron: {w.cron ?? "—"} · Playbooks: {w.playbooks.join(", ")}
                      {meta?.entitlementSku && ` · SKU: ${meta.entitlementSku}`}
                    </p>
                    {w.lastRunAt && (
                      <p className="text-xs text-muted-foreground">
                        Última ejecución: {new Date(w.lastRunAt).toLocaleString("es-AR")}
                      </p>
                    )}
                  </div>
                )
              })}
              {(!config?.virtualWorkers.length) && (
                <p className="text-sm text-muted-foreground py-4 text-center">
                  Tu negocio todavía no tiene flujos activos. Instalá el catálogo de 10 empleados virtuales.
                </p>
              )}
              <Button onClick={() => handleSeed(false)} disabled={seeding} variant="outline">
                {seeding ? "Instalando…" : "Instalar catálogo NOP (10 workers)"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="logs">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Logs de ejecución</CardTitle>
                <CardDescription>Webhooks salientes y entrantes recientes.</CardDescription>
              </div>
              <Button size="sm" variant="ghost" onClick={() => void loadAll()}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent>
              {executions.length === 0 ? (
                <p className="text-muted-foreground text-sm py-8 text-center">
                  Nada por acá todavía. Las ejecuciones aparecerán cuando empieces a procesar eventos.
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Dirección</TableHead>
                      <TableHead>Evento</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>ms</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {executions.map((ex) => (
                      <TableRow key={ex.id}>
                        <TableCell className="text-xs">
                          {new Date(ex.createdAt).toLocaleString("es-AR")}
                        </TableCell>
                        <TableCell>{ex.direction}</TableCell>
                        <TableCell>
                          <code className="text-xs">{ex.eventKey ?? "—"}</code>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={cn(
                              ex.status === "ok" && "border-green-500 text-green-600",
                              ex.status === "error" && "border-red-500 text-red-600",
                              ex.status === "timeout" && "border-amber-500 text-amber-600"
                            )}
                          >
                            {ex.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{ex.durationMs ?? "—"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}