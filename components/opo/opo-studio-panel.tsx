"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import {
  ArrowLeft,
  Database,
  GitBranch,
  Loader2,
  Network,
  Play,
  RefreshCw,
  Sparkles,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { getAuthHeaders } from "@/lib/stores/auth-store"
import { useToast } from "@/hooks/use-toast"
import type { ModoErp, OpoConector, OpoOrigen, OpoTenantConfig } from "@/lib/opo/types"

interface EntityRow {
  canonical: string
  nativeReference: string
  confidence: number
  limitations?: string
}

interface ConfigResponse {
  config: OpoTenantConfig
  entities: EntityRow[]
  discoveryUrl: string
  wellKnownUrl: string
}

const ENTITIES = ["Customer", "Product", "Invoice", "Order", "Supplier"] as const

export function OpoStudioPanel() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [querying, setQuerying] = useState(false)
  const [entities, setEntities] = useState<EntityRow[]>([])
  const [discoveryUrl, setDiscoveryUrl] = useState("")
  const [wellKnownUrl, setWellKnownUrl] = useState("")
  const [config, setConfig] = useState<OpoTenantConfig>({
    activo: false,
    modoErp: "full",
    origen: "clavis_db",
    conector: "rest",
    baseUrl: "",
    sqlViewPrefix: "vw_opo_",
  })
  const [queryEntity, setQueryEntity] = useState<(typeof ENTITIES)[number]>("Customer")
  const [querySearch, setQuerySearch] = useState("")
  const [queryResult, setQueryResult] = useState("")
  const [pingStatus, setPingStatus] = useState<string | null>(null)

  const cargar = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/opo/config", { headers: getAuthHeaders() })
      if (!res.ok) throw new Error("No se pudo cargar la configuración OPO")
      const data: ConfigResponse = await res.json()
      setConfig(data.config)
      setEntities(data.entities)
      setDiscoveryUrl(data.discoveryUrl)
      setWellKnownUrl(data.wellKnownUrl)
    } catch (e) {
      toast({
        variant: "destructive",
        title: "OPO Studio",
        description: e instanceof Error ? e.message : "Error",
      })
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    void cargar()
  }, [cargar])

  async function guardar(patch: Partial<OpoTenantConfig>) {
    setSaving(true)
    try {
      const res = await fetch("/api/opo/config", {
        method: "PATCH",
        headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? "Error al guardar")
      setConfig(json.config)
      await cargar()
      window.dispatchEvent(new Event("productos-updated"))
      toast({ title: "Configuración OPO guardada" })
    } catch (e) {
      toast({
        variant: "destructive",
        title: "No se pudo guardar",
        description: e instanceof Error ? e.message : "Error",
      })
    } finally {
      setSaving(false)
    }
  }

  async function ejecutarQuery() {
    setQuerying(true)
    try {
      const res = await fetch("/api/opo/query", {
        method: "POST",
        headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify({
          entity: queryEntity,
          limit: 10,
          search: querySearch || undefined,
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.message ?? "Error en consulta")
      setQueryResult(JSON.stringify(json, null, 2))
    } catch (e) {
      setQueryResult(
        JSON.stringify(
          { status: "error", message: e instanceof Error ? e.message : "Error" },
          null,
          2,
        ),
      )
    } finally {
      setQuerying(false)
    }
  }

  function cargarDemoProtheus() {
    void guardar({
      activo: true,
      modoErp: "legacy_front",
      origen: "protheus",
      conector: "rest",
      baseUrl: "http://192.168.100.3:4077",
    })
  }

  async function probarAgente() {
    setPingStatus("Probando…")
    try {
      const res = await fetch("/api/opo/agent/ping", { headers: getAuthHeaders() })
      const json = await res.json()
      setPingStatus(json.ok ? "Agente OK" : (json.message ?? "Sin conexión"))
    } catch {
      setPingStatus("Error de red")
    }
  }

  function usarClavisNativo() {
    void guardar({
      activo: true,
      modoErp: "full",
      origen: "clavis_db",
      conector: "rest",
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground gap-2">
        <Loader2 className="h-5 w-5 animate-spin" />
        Cargando OPO Studio…
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl font-semibold tracking-tight">OPO Studio Bridge</h1>
            <Badge variant={config.activo ? "default" : "secondary"}>
              {config.activo ? "Activo" : "Inactivo"}
            </Badge>
            <Badge variant="outline">beta · 80%</Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Capa semántica entre Clavis y sistemas legacy (Protheus, SQL, REST).
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button asChild variant="ghost" size="sm">
            <Link href="/dashboard/apps">
              <ArrowLeft className="h-4 w-4 mr-1" />
              App Store
            </Link>
          </Button>
          <Button variant="outline" size="sm" onClick={() => void cargar()}>
            <RefreshCw className="h-4 w-4 mr-1" />
            Actualizar
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button size="sm" onClick={cargarDemoProtheus} disabled={saving}>
          <Sparkles className="h-4 w-4 mr-1" />
          Demo Protheus
        </Button>
        <Button size="sm" variant="secondary" onClick={usarClavisNativo} disabled={saving}>
          <Database className="h-4 w-4 mr-1" />
          Datos Clavis nativos
        </Button>
        <Button asChild size="sm" variant="outline">
          <Link href="/dashboard/ia">Asistente IA</Link>
        </Button>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <GitBranch className="h-4 w-4 text-violet-500" />
              Ontología
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {entities.map((e) => (
              <div
                key={e.canonical}
                className="rounded-lg border px-3 py-2 text-sm flex items-start justify-between gap-2"
              >
                <div>
                  <p className="font-medium">{e.canonical.replace("opo:", "")}</p>
                  <p className="text-xs text-muted-foreground">→ {e.nativeReference}</p>
                  {e.limitations ? (
                    <p className="text-[11px] text-muted-foreground mt-1">{e.limitations}</p>
                  ) : null}
                </div>
                <Badge variant="outline" className="shrink-0">
                  {(e.confidence * 100).toFixed(0)}%
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Network className="h-4 w-4 text-sky-500" />
              Conector
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Modo ERP</Label>
              <Tabs
                value={config.modoErp}
                onValueChange={(v) => setConfig((c) => ({ ...c, modoErp: v as ModoErp }))}
              >
                <TabsList className="grid grid-cols-3 w-full">
                  <TabsTrigger value="full">Full</TabsTrigger>
                  <TabsTrigger value="legacy_front">Legacy</TabsTrigger>
                  <TabsTrigger value="hibrido">Híbrido</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            <div className="space-y-2">
              <Label>Origen de datos</Label>
              <Select
                value={config.origen}
                onValueChange={(v) => setConfig((c) => ({ ...c, origen: v as OpoOrigen }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="clavis_db">Clavis DB (Prisma)</SelectItem>
                  <SelectItem value="protheus">Protheus (demo / bridge)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Conector</Label>
              <Select
                value={config.conector}
                onValueChange={(v) => setConfig((c) => ({ ...c, conector: v as OpoConector }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="rest">REST API</SelectItem>
                  <SelectItem value="sql">Vistas SQL</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="rounded-lg border border-dashed px-3 py-2 text-xs text-muted-foreground space-y-1">
              <p><strong>PC VPN:</strong> 192.168.100.3 — corré el agente con <code>services/opo-edge-agent/start.ps1</code></p>
              <p><strong>PC Clavis:</strong> 192.168.100.2 — apuntá baseUrl al agente, no a Protheus directo.</p>
            </div>

            <div className="space-y-2">
              <Label>URL OPO Edge Agent</Label>
              <Input
                value={config.baseUrl ?? ""}
                onChange={(e) => setConfig((c) => ({ ...c, baseUrl: e.target.value }))}
                placeholder="http://192.168.100.3:4077"
              />
            </div>

            <div className="space-y-2">
              <Label>API Key del agente</Label>
              <Input
                type="password"
                value={config.agentApiKey ?? ""}
                onChange={(e) => setConfig((c) => ({ ...c, agentApiKey: e.target.value }))}
                placeholder="Misma clave que config.json del agente"
              />
            </div>

            <Button type="button" variant="outline" size="sm" className="w-full" onClick={() => void probarAgente()}>
              Probar conexión al agente
            </Button>
            {pingStatus ? <p className="text-xs text-muted-foreground">{pingStatus}</p> : null}

            {config.conector === "sql" ? (
              <div className="space-y-2">
                <Label>Prefijo vistas SQL</Label>
                <Input
                  value={config.sqlViewPrefix ?? "vw_opo_"}
                  onChange={(e) => setConfig((c) => ({ ...c, sqlViewPrefix: e.target.value }))}
                />
              </div>
            ) : null}

            <div className="text-xs text-muted-foreground space-y-1">
              <p>Discovery: {discoveryUrl}</p>
              <p>Well-known: {wellKnownUrl}</p>
            </div>

            <Button
              className="w-full"
              disabled={saving}
              onClick={() => void guardar({ ...config, activo: true })}
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
              Guardar conexión
            </Button>
          </CardContent>
        </Card>

        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Play className="h-4 w-4 text-emerald-500" />
              Playground OPOQL
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <Label>Entidad canónica</Label>
              <Select
                value={queryEntity}
                onValueChange={(v) => setQueryEntity(v as (typeof ENTITIES)[number])}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ENTITIES.map((e) => (
                    <SelectItem key={e} value={e}>
                      {e}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Búsqueda (opcional)</Label>
              <Input
                value={querySearch}
                onChange={(e) => setQuerySearch(e.target.value)}
                placeholder="cliente, SKU, estado…"
              />
            </div>
            <Button className="w-full" onClick={() => void ejecutarQuery()} disabled={querying}>
              {querying ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Play className="h-4 w-4 mr-1" />}
              Ejecutar consulta
            </Button>
            <Textarea
              readOnly
              className="font-mono text-xs min-h-[220px]"
              value={queryResult || "{\n  \"hint\": \"Ejecutá una consulta para ver el JSON OPO\"\n}"}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}