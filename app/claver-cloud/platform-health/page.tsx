"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { authFetch } from "@/lib/stores/auth-store"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, RefreshCw, Shield, Activity, AlertTriangle } from "lucide-react"

type PlatformHealth = {
  ok: boolean
  health: { ok: boolean; db: string; timestamp: string }
  securityScore: number
  securityFactors: Record<string, boolean>
  envPresence: Record<string, boolean | string>
  webhookUrl: string
  counters24h: Record<string, number>
  events: Array<{
    id: number
    severidad: string
    mensaje: string
    code?: string
    categoria: string
    createdAt: string
  }>
}

export default function PlatformHealthPage() {
  const [data, setData] = useState<PlatformHealth | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const load = useCallback(async () => {
    setLoading(true)
    setError("")
    try {
      const res = await authFetch("/api/claver/platform-health")
      const json = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`)
      setData(json)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error cargando salud de plataforma")
      setData(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const scoreColor =
    (data?.securityScore ?? 0) >= 80
      ? "text-emerald-600"
      : (data?.securityScore ?? 0) >= 50
        ? "text-amber-600"
        : "text-red-600"

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-4 sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight">
            <Shield className="h-6 w-6 text-violet-600" />
            Salud y seguridad de plataforma
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Eventos SEV, higiene de secretos y estado de base. Solo analistas Claver.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => void load()} disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            <span className="ml-2">Actualizar</span>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href="/claver-cloud/superadmin">Super Admin</Link>
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {loading && !data && (
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Cargando…
        </div>
      )}

      {data && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Security score</CardDescription>
                <CardTitle className={`text-3xl ${scoreColor}`}>{data.securityScore}</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-1">
                {Object.entries(data.securityFactors).map(([k, v]) => (
                  <Badge key={k} variant={v ? "default" : "outline"} className="text-[10px]">
                    {k}: {v ? "ok" : "no"}
                  </Badge>
                ))}
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Base de datos</CardDescription>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <Activity className="h-5 w-5" />
                  {data.health.db === "ok" ? (
                    <span className="text-emerald-600">OK</span>
                  ) : (
                    <span className="text-red-600">ERROR</span>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="text-xs text-muted-foreground">
                {new Date(data.health.timestamp).toLocaleString("es-AR")}
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Eventos 24h</CardDescription>
                <CardTitle className="text-3xl">{data.counters24h.total ?? 0}</CardTitle>
              </CardHeader>
              <CardContent className="text-xs text-muted-foreground space-y-0.5">
                <p>fatal: {data.counters24h.fatal ?? 0}</p>
                <p>error: {data.counters24h.error ?? 0}</p>
                <p>firmas webhook: {data.counters24h.WEBHOOK_SIG_INVALID ?? 0}</p>
                <p>cron 401: {data.counters24h.CRON_UNAUTHORIZED ?? 0}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Webhook MP canónico</CardDescription>
                <CardTitle className="text-sm font-mono break-all">{data.webhookUrl}</CardTitle>
              </CardHeader>
              <CardContent className="text-xs text-muted-foreground">
                Ruta legacy `/api/mercadopago/webhook` también exige firma.
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Presencia de configuración</CardTitle>
              <CardDescription>Booleans de entorno (sin valores de secretos)</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              {Object.entries(data.envPresence).map(([k, v]) => (
                <Badge key={k} variant={v ? "secondary" : "outline"} className="font-mono text-[11px]">
                  {k}={String(v)}
                </Badge>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Últimos eventos de plataforma</CardTitle>
              <CardDescription>security + platform (SistemaLog)</CardDescription>
            </CardHeader>
            <CardContent>
              {data.events.length === 0 ? (
                <p className="text-sm text-muted-foreground">Sin eventos registrados aún.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-left text-muted-foreground">
                        <th className="py-2 pr-2">Cuándo</th>
                        <th className="py-2 pr-2">Sev</th>
                        <th className="py-2 pr-2">Code</th>
                        <th className="py-2">Mensaje</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.events.map((e) => (
                        <tr key={e.id} className="border-b border-border/50">
                          <td className="py-2 pr-2 whitespace-nowrap text-xs">
                            {new Date(e.createdAt).toLocaleString("es-AR")}
                          </td>
                          <td className="py-2 pr-2">
                            <Badge
                              variant={
                                e.severidad === "fatal" || e.severidad === "error"
                                  ? "destructive"
                                  : "outline"
                              }
                              className="text-[10px]"
                            >
                              {e.severidad}
                            </Badge>
                          </td>
                          <td className="py-2 pr-2 font-mono text-xs">{e.code || "—"}</td>
                          <td className="py-2 text-xs">{e.mensaje}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
