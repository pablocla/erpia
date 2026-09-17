"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { Activity, Loader2, Radio, RefreshCw, Server } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CloudPageHeader } from "@/components/claver-cloud/cloud-page-header"
import { getAuthHeaders } from "@/lib/stores/auth-store"

type Tenant = {
  empresaId: number
  nombre: string
  cuit: string
  modoLite: string | null
  restUrl: string
  restUser: string
  restReady: boolean
  origen: string
  lastPingAt: string | null
  lastPingOk: boolean | null
  licenseActive: boolean
  licenseUntil: string | null
}

type Audit = {
  id: number
  empresaId: number
  categoria: string
  severidad: string
  mensaje: string
  createdAt: string
}

export default function ProtheusFleetPage() {
  const [loading, setLoading] = useState(true)
  const [pinging, setPinging] = useState<number | "all" | null>(null)
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [audit, setAudit] = useState<Audit[]>([])
  const [summary, setSummary] = useState({ total: 0, restReady: 0, pingOk: 0, pingFail: 0 })

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/claver-cloud/protheus-fleet", { headers: getAuthHeaders() })
      if (!res.ok) return
      const data = await res.json()
      setTenants(data.tenants ?? [])
      setAudit(data.audit ?? [])
      setSummary(data.summary ?? { total: 0, restReady: 0, pingOk: 0, pingFail: 0 })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  async function ping(empresaId?: number) {
    setPinging(empresaId ?? "all")
    await fetch("/api/claver-cloud/protheus-fleet", {
      method: "POST",
      headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
      body: JSON.stringify(empresaId ? { empresaId } : { pingAll: true }),
    })
    setPinging(null)
    await load()
  }

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <CloudPageHeader
        icon={Radio}
        eyebrow="Integraciones"
        title="Flota Protheus"
        description="Tenants enlazados a un AppServer: ping de salud, licencia anual y auditoría de peticiones REST."
        onRefresh={() => void load()}
        loading={loading}
        actions={
          <Button size="sm" onClick={() => void ping()} disabled={pinging !== null}>
            {pinging === "all" ? <Loader2 className="size-3.5 animate-spin" /> : <Activity className="size-3.5" />}
            Ping a todos
          </Button>
        }
      />

      <div className="grid gap-3 sm:grid-cols-4">
        <Kpi label="Tenants" value={String(summary.total)} />
        <Kpi label="REST listo" value={String(summary.restReady)} />
        <Kpi label="Ping OK" value={String(summary.pingOk)} />
        <Kpi label="Ping fail" value={String(summary.pingFail)} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Tenants enlazados</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="text-xs uppercase text-muted-foreground">
              <tr>
                {["Empresa", "REST", "Licencia", "Último ping", ""].map((h) => (
                  <th key={h} className="px-2 py-2 font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tenants.map((t) => (
                <tr key={t.empresaId} className="border-t">
                  <td className="px-2 py-2">
                    <Link href={`/claver-cloud/tenants/${t.empresaId}`} className="font-medium hover:underline">
                      {t.nombre}
                    </Link>
                    <p className="text-xs text-muted-foreground">{t.cuit}</p>
                  </td>
                  <td className="px-2 py-2 font-mono text-xs">
                    {t.restReady ? t.restUrl : "sin URL"}
                    <div>
                      <Badge variant={t.restReady ? "default" : "secondary"}>
                        {t.origen}
                      </Badge>
                    </div>
                  </td>
                  <td className="px-2 py-2">
                    <Badge variant={t.licenseActive ? "default" : "outline"}>
                      {t.licenseActive ? "activa" : "no"}
                    </Badge>
                  </td>
                  <td className="px-2 py-2 text-xs">
                    {t.lastPingAt ? new Date(t.lastPingAt).toLocaleString("es-AR") : "—"}
                    {t.lastPingOk === true && <span className="ml-1 text-emerald-600">ok</span>}
                    {t.lastPingOk === false && <span className="ml-1 text-red-600">fail</span>}
                  </td>
                  <td className="px-2 py-2">
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={!t.restReady || pinging !== null}
                      onClick={() => void ping(t.empresaId)}
                    >
                      {pinging === t.empresaId ? <Loader2 className="size-3 animate-spin" /> : <Server className="size-3" />}
                      Ping
                    </Button>
                  </td>
                </tr>
              ))}
              {tenants.length === 0 && !loading && (
                <tr>
                  <td colSpan={5} className="px-2 py-6 text-sm text-muted-foreground">
                    Todavía no hay tenants con origen Protheus. El alta con licencia o Legacy Bridge los lista acá.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Auditoría de peticiones</CardTitle>
          <RefreshCw className="size-4 text-muted-foreground" />
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="text-xs uppercase text-muted-foreground">
              <tr>
                {["Cuando", "Tenant", "Tipo", "Detalle"].map((h) => (
                  <th key={h} className="px-2 py-2 font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {audit.map((a) => (
                <tr key={a.id} className="border-t">
                  <td className="px-2 py-2 text-xs text-muted-foreground">
                    {new Date(a.createdAt).toLocaleString("es-AR")}
                  </td>
                  <td className="px-2 py-2">
                    <Link href={`/claver-cloud/tenants/${a.empresaId}`} className="hover:underline">
                      #{a.empresaId}
                    </Link>
                  </td>
                  <td className="px-2 py-2">
                    <Badge variant="outline">{a.categoria.replace("protheus_", "")}</Badge>
                  </td>
                  <td className="px-2 py-2 font-mono text-xs">{a.mensaje}</td>
                </tr>
              ))}
              {audit.length === 0 && !loading && (
                <tr>
                  <td colSpan={4} className="px-2 py-6 text-sm text-muted-foreground">
                    Cuando un tesorero use la app o Cloud haga ping, aparece acá.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  )
}

function Kpi({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
        <p className="mt-1 text-2xl font-semibold tabular-nums">{value}</p>
      </CardContent>
    </Card>
  )
}
