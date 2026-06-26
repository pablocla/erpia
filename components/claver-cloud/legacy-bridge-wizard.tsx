"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Database,
  Loader2,
  Network,
  Play,
  RefreshCw,
  XCircle,
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
import { cn } from "@/lib/utils"
import type {
  AccesoCanal,
  LegacyBridgeTestResult,
  ModoErp,
  OpoEntityBridgeMapping,
  OpoTenantConfig,
  SqlModo,
} from "@/lib/opo/types"

function authHeaders(): HeadersInit {
  const token = localStorage.getItem("token")
  return token
    ? { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }
    : { "Content-Type": "application/json" }
}

const STEPS = [
  { id: 1, title: "Modo ERP" },
  { id: 2, title: "Canal de acceso" },
  { id: 3, title: "Conexión" },
  { id: 4, title: "Mapeo OPO" },
  { id: 5, title: "Prueba ida/vuelta" },
]

const ENTITIES = ["Customer", "Product", "Invoice", "Order", "Supplier"] as const

export function LegacyBridgeWizard({ empresaId }: { empresaId: number }) {
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)
  const [config, setConfig] = useState<OpoTenantConfig | null>(null)
  const [testResult, setTestResult] = useState<LegacyBridgeTestResult | null>(null)

  const cargar = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/claver/tenants/${empresaId}/legacy-bridge`, {
        headers: authHeaders(),
      })
      if (res.ok) {
        const data = await res.json()
        setConfig(data.config)
      }
    } finally {
      setLoading(false)
    }
  }, [empresaId])

  useEffect(() => {
    void cargar()
  }, [cargar])

  async function guardar(patch: Partial<OpoTenantConfig>, runTest = false) {
    setSaving(true)
    try {
      const res = await fetch(`/api/claver/tenants/${empresaId}/legacy-bridge`, {
        method: "PATCH",
        headers: authHeaders(),
        body: JSON.stringify({ ...patch, runTest }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? "Error al guardar")
      setConfig(data.config)
      if (data.testResult) setTestResult(data.testResult)
    } catch (e) {
      alert(e instanceof Error ? e.message : "Error")
    } finally {
      setSaving(false)
    }
  }

  async function probar() {
    if (!config) return
    setTesting(true)
    try {
      const res = await fetch(`/api/claver/tenants/${empresaId}/legacy-bridge/test`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ config }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? "Error en prueba")
      setTestResult(data.testResult)
      await cargar()
    } catch (e) {
      alert(e instanceof Error ? e.message : "Error")
    } finally {
      setTesting(false)
    }
  }

  function updateMapping(entity: string, field: "lectura" | "escritura", endpoint: string) {
    if (!config) return
    const mappings = [...(config.entityMappings ?? [])]
    const idx = mappings.findIndex((m) => m.entity === entity)
    const base: OpoEntityBridgeMapping =
      idx >= 0
        ? mappings[idx]
        : { entity: entity as OpoEntityBridgeMapping["entity"], nativeTable: "", lectura: null, escritura: null }
    if (field === "lectura") {
      base.lectura = endpoint
        ? { modo: config.conector, endpoint, method: "GET" }
        : null
    }
    if (idx >= 0) mappings[idx] = base
    else mappings.push(base)
    setConfig({ ...config, entityMappings: mappings })
  }

  if (loading || !config) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground py-8">
        <Loader2 className="h-4 w-4 animate-spin" />
        Cargando bridge legacy…
      </div>
    )
  }

  const isLegacy = config.modoErp !== "full"

  return (
    <div className="space-y-6">
      <div>
        <div className="flex flex-wrap items-center gap-2 mb-1">
          <h2 className="text-lg font-semibold">Plug &amp; Play — Enlace Legacy (OPO)</h2>
          <Button asChild variant="outline" size="sm">
            <Link href="/claver-cloud/protheus-api">Catálogo REST Protheus (3.432 servicios)</Link>
          </Button>
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          El analista define si el tenant usa ERP nativo o front legacy (Protheus) y prueba lectura/escritura
          antes del go-live.
        </p>
        {config.bridgeTestOk != null && (
          <Badge
            variant="outline"
            className={cn(
              "mt-2",
              config.bridgeTestOk
                ? "bg-emerald-500/10 text-emerald-700"
                : "bg-amber-500/10 text-amber-800",
            )}
          >
            {config.bridgeTestOk ? "Bridge verificado" : "Bridge sin verificar"}
            {config.bridgeTestedAt ? ` · ${new Date(config.bridgeTestedAt).toLocaleString("es-AR")}` : ""}
          </Badge>
        )}
      </div>

      <div className="flex gap-2 flex-wrap">
        {STEPS.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => setStep(s.id)}
            className={cn(
              "text-xs px-3 py-1.5 rounded-full border transition-colors",
              step === s.id
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-muted/50 text-muted-foreground hover:bg-muted",
            )}
          >
            {s.id}. {s.title}
          </button>
        ))}
      </div>

      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">¿Cómo opera este cliente?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-3">
              {(
                [
                  {
                    value: "full",
                    label: "ERP normal",
                    desc: "Datos en Clavis DB. Sin bridge legacy.",
                  },
                  {
                    value: "legacy_front",
                    label: "Front legacy",
                    desc: "UI Clavis; lectura/escritura en Protheus u otro ERP.",
                  },
                  {
                    value: "hibrido",
                    label: "Híbrido",
                    desc: "Maestros en legacy; operación diaria en Clavis.",
                  },
                ] as const
              ).map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() =>
                    setConfig({
                      ...config,
                      modoErp: opt.value,
                      origen: opt.value === "full" ? "clavis_db" : "protheus",
                      activo: opt.value !== "full",
                    })
                  }
                  className={cn(
                    "text-left rounded-lg border p-4 transition-colors",
                    config.modoErp === opt.value
                      ? "border-primary bg-primary/5"
                      : "hover:border-muted-foreground/30",
                  )}
                >
                  <p className="font-medium text-sm">{opt.label}</p>
                  <p className="text-xs text-muted-foreground mt-1">{opt.desc}</p>
                </button>
              ))}
            </div>
            <div className="flex justify-end gap-2">
              <Button
                onClick={() => {
                  if (isLegacy) {
                    setConfig((c) =>
                      c
                        ? {
                            ...c,
                            accesoCanal: c.accesoCanal ?? "rest_directo",
                          }
                        : c,
                    )
                    setStep(2)
                  }
                }}
                disabled={!isLegacy}
              >
                Siguiente
                <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
              {!isLegacy && (
                <Button variant="secondary" onClick={() => void guardar({ modoErp: "full", origen: "clavis_db" })}>
                  Guardar ERP normal
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {step === 2 && isLegacy && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Canal de acceso a datos legacy</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3">
              {(
                [
                  {
                    value: "rest_directo",
                    icon: Network,
                    label: "REST API directa (Protheus /rest)",
                    desc: "Discovery en /tlpp/rest/list/service. Ideal si hay VPN al AppServer.",
                  },
                  {
                    value: "edge_agent",
                    icon: Database,
                    label: "OPO Edge Agent (PC con VPN)",
                    desc: "Agente on-prem hace hybrid SQL + REST. Recomendado producción.",
                  },
                  {
                    value: "sql_vistas",
                    icon: Database,
                    label: "Vistas SQL (solo lectura)",
                    desc: "Vistas vw_opo_* en SQL Server. Si no hay permiso CREATE VIEW → vía REST.",
                  },
                  {
                    value: "sql_directo",
                    icon: Database,
                    label: "SQL directo (SX2/SX3/SA1)",
                    desc: "Lee tablas Protheus en SQL Server sin REST. Ideal introspección y lectura masiva.",
                  },
                ] as const
              ).map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() =>
                    setConfig({
                      ...config,
                      accesoCanal: opt.value as AccesoCanal,
                      conector: opt.value === "sql_vistas" || opt.value === "sql_directo" ? "sql" : "rest",
                    })
                  }
                  className={cn(
                    "flex gap-3 text-left rounded-lg border p-4 transition-colors",
                    config.accesoCanal === opt.value
                      ? "border-primary bg-primary/5"
                      : "hover:border-muted-foreground/30",
                  )}
                >
                  <opt.icon className="h-5 w-5 shrink-0 text-primary mt-0.5" />
                  <div>
                    <p className="font-medium text-sm">{opt.label}</p>
                    <p className="text-xs text-muted-foreground mt-1">{opt.desc}</p>
                  </div>
                </button>
              ))}
            </div>

            {config.accesoCanal === "sql_vistas" && (
              <div className="space-y-2 rounded-lg border p-4">
                <Label>Modo vistas SQL</Label>
                <Select
                  value={config.sqlModo ?? "direct"}
                  onValueChange={(v) => setConfig({ ...config, sqlModo: v as SqlModo })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="direct">Directo en BD (agente lee vw_opo_*)</SelectItem>
                    <SelectItem value="via_rest">Vía REST AdvPL (sin CREATE VIEW en BD)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep(1)}>
                <ArrowLeft className="h-4 w-4 mr-1" />
                Atrás
              </Button>
              <Button onClick={() => setStep(3)}>
                Siguiente
                <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 3 && isLegacy && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Credenciales y URLs</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {(config.accesoCanal === "rest_directo" || config.sqlModo === "via_rest") && (
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2 sm:col-span-2">
                  <Label>URL base REST Protheus</Label>
                  <Input
                    value={config.restDirectUrl ?? ""}
                    onChange={(e) => setConfig({ ...config, restDirectUrl: e.target.value })}
                    placeholder="http://10.12.35.70:8073/rest"
                  />
                  <p className="text-xs text-muted-foreground">
                    Discovery: {"{url}"}/tlpp/rest/list/service
                  </p>
                </div>
                <div className="space-y-2">
                  <Label>Usuario REST</Label>
                  <Input
                    value={config.restAuthUser ?? ""}
                    onChange={(e) => setConfig({ ...config, restAuthUser: e.target.value })}
                    placeholder="admin"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Contraseña REST</Label>
                  <Input
                    type="password"
                    value={config.restAuthPassword ?? ""}
                    onChange={(e) => setConfig({ ...config, restAuthPassword: e.target.value })}
                    placeholder="••••••••"
                  />
                </div>
              </div>
            )}

            {config.accesoCanal === "edge_agent" && (
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2 sm:col-span-2">
                  <Label>URL OPO Edge Agent</Label>
                  <Input
                    value={config.baseUrl ?? ""}
                    onChange={(e) => setConfig({ ...config, baseUrl: e.target.value })}
                    placeholder="http://192.168.100.3:4077"
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label>API Key del agente</Label>
                  <Input
                    type="password"
                    value={config.agentApiKey ?? ""}
                    onChange={(e) => setConfig({ ...config, agentApiKey: e.target.value })}
                  />
                </div>
              </div>
            )}

            {config.accesoCanal === "sql_vistas" && (
              <div className="space-y-2">
                <Label>Prefijo vistas SQL</Label>
                <Input
                  value={config.sqlViewPrefix ?? "vw_opo_"}
                  onChange={(e) => setConfig({ ...config, sqlViewPrefix: e.target.value })}
                />
              </div>
            )}

            {config.accesoCanal === "sql_directo" && (
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2 sm:col-span-2">
                  <Label>Servidor SQL Server</Label>
                  <Input
                    value={config.sqlServer ?? ""}
                    onChange={(e) => setConfig({ ...config, sqlServer: e.target.value })}
                    placeholder="10.12.35.70"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Base de datos</Label>
                  <Input
                    value={config.sqlDatabase ?? ""}
                    onChange={(e) => setConfig({ ...config, sqlDatabase: e.target.value })}
                    placeholder="PROTHEUS"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Sufijo tablas</Label>
                  <Input
                    value={config.tableSuffix ?? "010"}
                    onChange={(e) => setConfig({ ...config, tableSuffix: e.target.value })}
                    placeholder="010"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Usuario SQL</Label>
                  <Input
                    value={config.sqlUser ?? ""}
                    onChange={(e) => setConfig({ ...config, sqlUser: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Contraseña SQL</Label>
                  <Input
                    type="password"
                    value={config.sqlPassword ?? ""}
                    onChange={(e) => setConfig({ ...config, sqlPassword: e.target.value })}
                  />
                </div>
              </div>
            )}

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep(2)}>
                <ArrowLeft className="h-4 w-4 mr-1" />
                Atrás
              </Button>
              <Button onClick={() => void guardar(config)} disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
                Guardar y continuar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 4 && isLegacy && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Mapeo entidades OPO → Protheus</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-xs text-muted-foreground">
              OPO traduce entidades canónicas (Customer, Product…) a tablas SA1/SB1 o endpoints REST. Ajustá
              tras el discovery.
            </p>
            {ENTITIES.map((entity) => {
              const mapping = config.entityMappings?.find((m) => m.entity === entity)
              return (
                <div key={entity} className="grid gap-2 sm:grid-cols-3 items-end border rounded-lg p-3">
                  <div>
                    <p className="font-medium text-sm">{entity}</p>
                    <p className="text-xs text-muted-foreground">
                      Tabla: {mapping?.nativeTable ?? "—"}
                      {mapping?.sqlView ? ` · Vista: ${mapping.sqlView}` : ""}
                    </p>
                  </div>
                  <div className="space-y-1 sm:col-span-2">
                    <Label className="text-xs">Endpoint lectura (GET)</Label>
                    <Input
                      value={mapping?.lectura?.endpoint ?? ""}
                      onChange={(e) => updateMapping(entity, "lectura", e.target.value)}
                      placeholder="/api/acproduct/v1/products"
                    />
                  </div>
                </div>
              )
            })}
            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep(3)}>
                <ArrowLeft className="h-4 w-4 mr-1" />
                Atrás
              </Button>
              <Button onClick={() => void guardar(config)} disabled={saving}>
                Guardar mapeo
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 5 && isLegacy && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Play className="h-4 w-4" />
              Prueba ida y vuelta
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Verifica discovery REST, lectura de Customer/Product y conexión al agente (si aplica).
            </p>
            <Button onClick={() => void probar()} disabled={testing}>
              {testing ? (
                <Loader2 className="h-4 w-4 animate-spin mr-1" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-1" />
              )}
              Ejecutar prueba completa
            </Button>

            {testResult && (
              <div className="space-y-2">
                <Badge variant={testResult.ok ? "default" : "destructive"}>
                  {testResult.ok ? "OK" : "Con errores"}
                  {testResult.servicesCount ? ` · ${testResult.servicesCount} servicios` : ""}
                </Badge>
                {testResult.steps.map((s) => (
                  <div
                    key={s.id}
                    className="flex items-start gap-2 text-sm border rounded-lg px-3 py-2"
                  >
                    {s.ok ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="font-medium">{s.label}</p>
                      {s.detail && <p className="text-xs text-muted-foreground">{s.detail}</p>}
                      {s.ms != null && <p className="text-xs text-muted-foreground">{s.ms} ms</p>}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="flex justify-between pt-2">
              <Button variant="outline" onClick={() => setStep(4)}>
                <ArrowLeft className="h-4 w-4 mr-1" />
                Atrás
              </Button>
              <Button
                onClick={() => void guardar({ ...config, activo: true, bridgeTestOk: testResult?.ok })}
                disabled={saving || !testResult?.ok}
              >
                Activar bridge y cerrar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}