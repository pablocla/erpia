"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import {
  BookOpen,
  Database,
  Loader2,
  Network,
  Play,
  RefreshCw,
  Save,
  Table2,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import {
  loadOpoConsoleCreds,
  saveOpoConsoleCreds,
  type OpoConsoleStoredCreds,
} from "@/lib/opo/opo-console-storage"
import { useToast } from "@/hooks/use-toast"

function authHeaders(): HeadersInit {
  const token = localStorage.getItem("token")
  return token
    ? { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }
    : { "Content-Type": "application/json" }
}

type SxRow = {
  id: string
  nombre: string
  descripcion: string
  apiHint: string
  claveParaOpo?: boolean
}

type StepResult = {
  id: string
  label: string
  path: string
  method: string
  ok: boolean
  status: number
  ms: number
  sample?: unknown
  error?: string
}

export default function OpoConsolePage() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [running, setRunning] = useState(false)
  const [sxTables, setSxTables] = useState<SxRow[]>([])
  const [steps, setSteps] = useState<StepResult[]>([])
  const [discoveredTables, setDiscoveredTables] = useState<string[]>([])
  const [selectedStep, setSelectedStep] = useState<StepResult | null>(null)
  const [canal, setCanal] = useState<"rest" | "sql" | "hybrid">(() => loadOpoConsoleCreds().canal)
  const [restCreds, setRestCreds] = useState(() => loadOpoConsoleCreds().rest)
  const [sqlCreds, setSqlCreds] = useState(() => loadOpoConsoleCreds().sql)

  // Feedback states for user logs & redirect
  const [activeTab, setActiveTab] = useState("sx")
  const [logLines, setLogLines] = useState<string[]>([])

  function snapshotCreds(): OpoConsoleStoredCreds {
    return { canal, rest: restCreds, sql: sqlCreds }
  }

  function guardarConexion() {
    saveOpoConsoleCreds(snapshotCreds())
    toast({ title: "Conexión guardada en este navegador" })
  }

  const cargarMeta = useCallback(async () => {
    setLoading(true)
    try {
      const stored = loadOpoConsoleCreds()
      setCanal(stored.canal)
      setRestCreds(stored.rest)
      setSqlCreds(stored.sql)

      const res = await fetch("/api/claver-cloud/protheus-api/introspect", {
        headers: authHeaders(),
      })
      if (res.ok) {
        const data = await res.json()
        setSxTables(data.sxTables ?? [])
        // .env solo rellena campos vacíos en la consola (la consola manda)
        if (data.restDefaults?.baseUrl && !stored.rest.baseUrl) {
          setRestCreds((c) => ({
            ...c,
            baseUrl: data.restDefaults.baseUrl,
            user: data.restDefaults.user ?? c.user,
          }))
        }
        if (data.sqlDefaults?.server && !stored.sql.sqlServer) {
          setSqlCreds((c) => ({
            ...c,
            sqlServer: data.sqlDefaults.server,
            sqlPort: String(data.sqlDefaults.port ?? 1433),
            sqlDatabase: data.sqlDefaults.database ?? c.sqlDatabase,
            sqlUser: data.sqlDefaults.user ?? c.sqlUser,
            tableSuffix: data.sqlDefaults.tableSuffix ?? c.tableSuffix,
          }))
        }
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void cargarMeta()
  }, [cargarMeta])

  async function ejecutarIntrospeccion(endpointIds?: string[]) {
    saveOpoConsoleCreds(snapshotCreds())
    setRunning(true)
    
    const timestamp = () => new Date().toLocaleTimeString("es-AR")
    const initialLogs = [
      `[${timestamp()}] [INFO] Starting introspection via ${canal.toUpperCase()}...`,
    ]
    setLogLines(initialLogs)

    try {
      const res = await fetch("/api/claver-cloud/protheus-api/introspect", {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({
          canal,
          baseUrl: restCreds.baseUrl,
          user: restCreds.user,
          password: restCreds.password,
          sqlServer: sqlCreds.sqlServer,
          sqlPort: Number(sqlCreds.sqlPort) || 1433,
          sqlDatabase: sqlCreds.sqlDatabase,
          sqlUser: sqlCreds.sqlUser,
          sqlPassword: sqlCreds.sqlPassword,
          tableSuffix: sqlCreds.tableSuffix,
          endpointIds,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        const errMsg =
          typeof data.error === "string"
            ? data.error
            : JSON.stringify(data.error ?? "Error")
        throw new Error(errMsg)
      }
      setSteps(data.steps ?? [])
      setDiscoveredTables(data.discoveredTables ?? [])
      const firstOk = (data.steps as StepResult[])?.find((s) => s.ok)
      if (firstOk) setSelectedStep(firstOk)

      // Format log entries for steps
      const finalLogs = [...initialLogs]
      ;(data.steps as StepResult[] || []).forEach((s) => {
        finalLogs.push(`[${timestamp()}] [${s.ok ? 'SUCCESS' : 'FAILED'}] ${s.label} (${s.ms}ms)`)
        if (s.error) {
          finalLogs.push(`    -> ERROR: ${s.error}`)
        }
      })
      finalLogs.push(`[${timestamp()}] [INFO] Introspection finished. ${data.discoveredTables?.length || 0} tables discovered.`)
      setLogLines(finalLogs)

      // Direct view to API / tables depending on discovery scope
      setActiveTab(endpointIds?.length ? "api" : "tablas")
    } catch (e: any) {
      const errorMsg = e instanceof Error ? e.message : "Error"
      setLogLines(prev => [...prev, `[${timestamp()}] [FATAL] ${errorMsg}`])
      alert(errorMsg)
    } finally {
      setRunning(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground py-12">
        <Loader2 className="h-5 w-5 animate-spin" />
        Cargando OPO Console…
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Network className="h-6 w-6 text-violet-500" />
          OPO Console — Introspección Protheus
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Lee tablas SX (diccionario Framework), estructura de campos y genera el mapa semántico para el
          mini front legacy. No requiere entrar al ERP.
        </p>
        <div className="flex flex-wrap gap-2 mt-3">
          <Button asChild variant="outline" size="sm">
            <Link href="/claver-cloud/protheus-setup">Guía preparar ambiente</Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href="/claver-cloud/protheus-api">Catálogo REST (3.432)</Link>
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Canal de introspección</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2 sm:grid-cols-3">
            {(
              [
                { id: "rest", label: "Solo REST", icon: Network },
                { id: "sql", label: "Solo SQL", icon: Database },
                { id: "hybrid", label: "Híbrido", icon: RefreshCw },
              ] as const
            ).map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setCanal(opt.id)}
                className={cn(
                  "flex items-center gap-2 rounded-lg border p-3 text-sm text-left",
                  canal === opt.id ? "border-primary bg-primary/5" : "hover:border-muted-foreground/30",
                )}
              >
                <opt.icon className="h-4 w-4 shrink-0" />
                {opt.label}
              </button>
            ))}
          </div>

          {(canal === "rest" || canal === "hybrid") && (
            <div className="grid gap-3 sm:grid-cols-3 border rounded-lg p-3">
              <p className="sm:col-span-3 text-xs font-medium text-muted-foreground">REST API Protheus</p>
              <div className="space-y-1 sm:col-span-3">
                <Label className="text-xs">Base URL REST</Label>
                <Input
                  value={restCreds.baseUrl}
                  onChange={(e) => setRestCreds((c) => ({ ...c, baseUrl: e.target.value }))}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Usuario</Label>
                <Input
                  value={restCreds.user}
                  onChange={(e) => setRestCreds((c) => ({ ...c, user: e.target.value }))}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Contraseña</Label>
                <Input
                  type="password"
                  value={restCreds.password}
                  onChange={(e) => setRestCreds((c) => ({ ...c, password: e.target.value }))}
                  placeholder="cwsarg"
                />
              </div>
            </div>
          )}

          <div
            className={cn(
              "grid gap-3 sm:grid-cols-3 border rounded-lg p-3",
              canal === "rest" && "opacity-60",
            )}
          >
            <p className="sm:col-span-3 text-xs font-medium flex items-center gap-2">
              <Database className="h-3.5 w-3.5" />
              SQL Server Protheus (SX2/SX3/SA1) — configurá acá, no hace falta .env
            </p>
              <div className="space-y-1 sm:col-span-2">
                <Label className="text-xs">Servidor SQL</Label>
                <Input
                  value={sqlCreds.sqlServer}
                  onChange={(e) => setSqlCreds((c) => ({ ...c, sqlServer: e.target.value }))}
                  placeholder="10.12.35.70"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Puerto</Label>
                <Input
                  value={sqlCreds.sqlPort}
                  onChange={(e) => setSqlCreds((c) => ({ ...c, sqlPort: e.target.value }))}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Base de datos</Label>
                <Input
                  value={sqlCreds.sqlDatabase}
                  onChange={(e) => setSqlCreds((c) => ({ ...c, sqlDatabase: e.target.value }))}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Usuario SQL</Label>
                <Input
                  value={sqlCreds.sqlUser}
                  onChange={(e) => setSqlCreds((c) => ({ ...c, sqlUser: e.target.value }))}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Contraseña SQL</Label>
                <Input
                  type="password"
                  value={sqlCreds.sqlPassword}
                  onChange={(e) => setSqlCreds((c) => ({ ...c, sqlPassword: e.target.value }))}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Sufijo tablas (empresa)</Label>
                <Input
                  value={sqlCreds.tableSuffix}
                  onChange={(e) => setSqlCreds((c) => ({ ...c, tableSuffix: e.target.value }))}
                  placeholder="010 → SA1010, SX2010"
                />
              </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button className="w-full sm:w-auto" onClick={() => void ejecutarIntrospeccion()} disabled={running}>
              {running ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Play className="h-4 w-4 mr-1" />}
              Introspección {canal === "hybrid" ? "REST + SQL" : canal.toUpperCase()}
            </Button>
            <Button type="button" variant="outline" onClick={guardarConexion}>
              <Save className="h-4 w-4 mr-1" />
              Guardar conexión
            </Button>
          </div>

          {/* Real-time styled terminal logs console */}
          {logLines.length > 0 && (
            <div className="space-y-1.5 border border-zinc-800 rounded-lg p-3 bg-zinc-950/60 mt-4">
              <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">OPO Execution Console Log</p>
              <div className="bg-black text-emerald-400 font-mono text-xs p-3 rounded-md overflow-y-auto max-h-[180px] border border-zinc-900 space-y-1 scrollbar-thin text-left">
                {logLines.map((line, idx) => (
                  <div key={idx} className={
                    line.includes('[FAILED]') || line.includes('[FATAL]') ? 'text-red-400' :
                    line.includes('[SUCCESS]') ? 'text-emerald-400' :
                    line.includes('[INFO]') ? 'text-blue-400' :
                    'text-zinc-400'
                  }>
                    {line}
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="sx">Tablas SX (1–9)</TabsTrigger>
          <TabsTrigger value="api">Resultados API</TabsTrigger>
          <TabsTrigger value="tablas">Tablas descubiertas</TabsTrigger>
          <TabsTrigger value="opo">Mapeo OPO</TabsTrigger>
        </TabsList>

        <TabsContent value="sx" className="mt-4 space-y-2">
          {sxTables.map((sx) => (
            <div
              key={sx.id}
              className={cn(
                "border rounded-lg p-3 text-sm",
                sx.claveParaOpo && "border-violet-300/50 bg-violet-500/5",
              )}
            >
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="outline" className="font-mono">
                  {sx.id}
                </Badge>
                <span className="font-medium">{sx.nombre}</span>
                {sx.claveParaOpo && (
                  <Badge className="text-[10px]">Clave para OPO</Badge>
                )}
              </div>
              <p className="text-muted-foreground text-xs mt-1">{sx.descripcion}</p>
              <p className="text-[11px] font-mono text-muted-foreground mt-1">{sx.apiHint}</p>
              <Button
                size="sm"
                variant="ghost"
                className="mt-2 h-7 text-xs"
                disabled={running}
                onClick={() => {
                  const map: Record<string, string[]> = {
                    SX1: ["dictionary"],
                    SX2: ["tables", "dictionary"],
                    SX3: ["fields", "struct_object", "fieldsstruct"],
                    SX5: ["generic_tables"],
                    SX9: ["indexes"],
                  }
                  void ejecutarIntrospeccion(map[sx.id])
                }}
              >
                Probar introspección {sx.id}
              </Button>
            </div>
          ))}
        </TabsContent>

        <TabsContent value="api" className="mt-4 space-y-2">
          {steps.length === 0 ? (
            <p className="text-sm text-muted-foreground">Ejecutá introspección completa para ver resultados.</p>
          ) : (
            steps.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setSelectedStep(s)}
                className={cn(
                  "w-full text-left border rounded-lg p-3 text-sm hover:bg-muted/40",
                  selectedStep?.id === s.id && "border-primary",
                )}
              >
                <div className="flex justify-between gap-2">
                  <span className="font-medium">{s.label}</span>
                  <Badge variant={s.ok ? "default" : "destructive"}>{s.ok ? `OK ${s.status}` : "Error"}</Badge>
                </div>
                <p className="font-mono text-xs text-muted-foreground mt-1">
                  {s.method} {s.path} · {s.ms}ms
                </p>
                {s.error && <p className="text-xs text-destructive mt-1">{s.error}</p>}
              </button>
            ))
          )}
          {selectedStep?.sample != null && (
            <Textarea
              readOnly
              className="font-mono text-xs min-h-[280px] mt-2"
              value={JSON.stringify(selectedStep.sample, null, 2)}
            />
          )}
        </TabsContent>

        <TabsContent value="tablas" className="mt-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Table2 className="h-4 w-4" />
                Tablas detectadas (SA1, SB1, SF2…)
              </CardTitle>
            </CardHeader>
            <CardContent>
              {discoveredTables.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Corré introspección SX2/Dictionary para listar tablas.
                </p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {discoveredTables.map((t) => (
                    <Badge key={t} variant="secondary" className="font-mono">
                      {t}
                    </Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="opo" className="mt-4 space-y-3">
          <Card>
            <CardContent className="pt-4 text-sm space-y-2">
              <p>
                <strong>Flujo OPO:</strong> SX2 define tablas → SX3 define campos → OPO mapea a entidades
                canónicas (Customer, Product, Invoice…).
              </p>
              <div className="grid gap-2 sm:grid-cols-2 text-xs">
                {[
                  ["SA1", "opo:Customer", "/api/fin/v1/dictionary/SA1"],
                  ["SB1", "opo:Product", "/api/acproduct/v1/products"],
                  ["SF2", "opo:Invoice", "/api/ctb/accountingentry"],
                  ["SC5", "opo:Order", "/api/tgv/salesorders"],
                  ["SA2", "opo:Supplier", "SQL vista / REST custom"],
                ].map(([tabla, entidad, ep]) => (
                  <div key={tabla} className="border rounded p-2">
                    <span className="font-mono font-medium">{tabla}</span>
                    <span className="text-muted-foreground"> → </span>
                    <span>{entidad}</span>
                    <p className="font-mono text-[10px] text-muted-foreground mt-1">{ep}</p>
                  </div>
                ))}
              </div>
              <Button asChild size="sm" className="mt-2">
                <Link href="/claver-cloud/organizations">
                  <Database className="h-4 w-4 mr-1" />
                  Aplicar en tenant → Legacy Bridge
                </Link>
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Card className="border-dashed">
        <CardContent className="pt-4 text-xs text-muted-foreground flex items-start gap-2">
          <BookOpen className="h-4 w-4 shrink-0 mt-0.5" />
          <p>
            Todas las variables REST y SQL se cargan en esta consola. Se guardan en el navegador al
            ejecutar introspección o con &quot;Guardar conexión&quot;. El <code>.env.local</code> es
            opcional y solo rellena campos vacíos.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}