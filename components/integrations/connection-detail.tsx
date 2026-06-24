"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import {
  ArrowLeft, CheckCircle2, AlertCircle, Loader2, Plug, Unplug,
  RefreshCw, Clock, ExternalLink, Copy, Info,
} from "lucide-react"
import { useSearchParams } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import type { CatalogEntry, SyncConfigForm } from "@/lib/integrations/types"
import { NIVEL_LABELS, type NivelImplementacion } from "@/lib/integrations/integration-meta"

interface LogRow {
  id: number
  direccion: string
  entidad: string
  estado: string
  mensaje: string | null
  createdAt: string
}

export function ConnectionDetail({
  slug,
  authHeaders,
}: {
  slug: string
  authHeaders: () => HeadersInit
}) {
  const [catalogo, setCatalogo] = useState<CatalogEntry | null>(null)
  const [estado, setEstado] = useState("desconectado")
  const [cuentaExterna, setCuentaExterna] = useState<string | null>(null)
  const [configSync, setConfigSync] = useState<SyncConfigForm>({ entidades: {} })
  const [credenciales, setCredenciales] = useState<Record<string, string>>({})
  const [logs, setLogs] = useState<LogRow[]>([])
  const [ultimoError, setUltimoError] = useState<string | null>(null)
  const [ultimaSyncAt, setUltimaSyncAt] = useState<string | null>(null)
  const [meta, setMeta] = useState<{
    nivel: NivelImplementacion
    webhookUrl?: string
    tips?: string[]
    quickLinks?: Array<{ label: string; href: string }>
    oauthRequiereDominio?: boolean
  } | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const searchParams = useSearchParams()
  const { toast } = useToast()

  const oauthProviders = ["mercado_libre", "tienda_nube", "shopify"]

  const fetchDetalle = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/integrations/${slug}`, { headers: authHeaders() })
      const data = await res.json()
      if (data.success) {
        setCatalogo(data.catalogo)
        setEstado(data.conexion.estado)
        setCuentaExterna(data.conexion.cuentaExterna)
        setConfigSync(data.conexion.configSync ?? { entidades: {} })
        setLogs(data.conexion.logs ?? [])
        setUltimoError(data.conexion.ultimoError)
        setUltimaSyncAt(data.conexion.ultimaSyncAt ?? null)
        setMeta(data.meta ?? null)
        const masked = data.conexion.credencialesMasked ?? {}
        setCredenciales(Object.fromEntries(
          Object.keys(masked).map((k) => [k, ""]),
        ))
      }
    } finally {
      setLoading(false)
    }
  }, [slug, authHeaders])

  useEffect(() => { fetchDetalle() }, [fetchDetalle])

  useEffect(() => {
    const oauth = searchParams.get("oauth")
    const msg = searchParams.get("msg")
    if (oauth === "ok") {
      toast({ title: "Cuenta conectada", description: "OAuth completado correctamente" })
    } else if (oauth === "error") {
      toast({ title: "Error OAuth", description: msg ?? "No se pudo conectar", variant: "destructive" })
    }
  }, [searchParams, toast])

  async function guardar() {
    setSaving(true)
    try {
      const payload: Record<string, string> = {}
      for (const [k, v] of Object.entries(credenciales)) {
        if (v.trim()) payload[k] = v.trim()
      }
      const res = await fetch("/api/integrations", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({ integracionId: slug, credenciales: payload, configSync }),
      })
      const data = await res.json()
      if (res.ok) {
        toast({
          title: data.test?.ok ? "Conectado" : "Guardado con advertencia",
          description: data.test?.mensaje,
          variant: data.test?.ok ? "default" : "destructive",
        })
        await fetchDetalle()
      } else {
        toast({ title: "Error", description: data.error, variant: "destructive" })
      }
    } finally {
      setSaving(false)
    }
  }

  async function probar() {
    const res = await fetch("/api/integrations", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify({ accion: "probar", integracionId: slug }),
    })
    const data = await res.json()
    toast({
      title: data.ok ? "Conexión OK" : "Falló la prueba",
      description: data.mensaje,
      variant: data.ok ? "default" : "destructive",
    })
    await fetchDetalle()
  }

  async function desconectar() {
    await fetch("/api/integrations", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify({ accion: "desconectar", integracionId: slug }),
    })
    toast({ title: "Desconectado" })
    await fetchDetalle()
  }

  async function guardarSync() {
    await fetch(`/api/integrations/${slug}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify({ configSync }),
    })
    toast({ title: "Sincronización actualizada" })
  }

  async function sincronizarAhora() {
    setSyncing(true)
    try {
      const res = await fetch(`/api/integrations/${slug}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({ accion: "sincronizar", configSync }),
      })
      const data = await res.json()
      const ok = data.sync?.ok
      toast({
        title: ok ? "Sincronización completa" : "Sincronización con errores",
        description: data.sync?.resultados?.map((r: { entidad: string; mensaje: string }) => `${r.entidad}: ${r.mensaje}`).join(" · "),
        variant: ok ? "default" : "destructive",
      })
      await fetchDetalle()
    } finally {
      setSyncing(false)
    }
  }

  async function iniciarOAuth() {
    const returnPath = `/dashboard/conexiones/${slug}`
    if (slug === "shopify" && !credenciales.shopDomain?.trim()) {
      toast({
        title: "Dominio requerido",
        description: "Ingresá tu dominio myshopify.com antes de conectar",
        variant: "destructive",
      })
      return
    }
    const shopParam = slug === "shopify"
      ? `&shop=${encodeURIComponent(credenciales.shopDomain.trim())}`
      : ""
    try {
      const res = await fetch(
        `/api/integrations/oauth/${slug}?return=${encodeURIComponent(returnPath)}${shopParam}`,
        { headers: authHeaders(), redirect: "manual" },
      )
      const loc = res.headers.get("Location")
      if (loc) {
        window.location.href = loc
        return
      }
      const data = await res.json().catch(() => ({}))
      toast({
        title: "No se pudo iniciar OAuth",
        description: data.error ?? "Verificá las variables de entorno OAuth",
        variant: "destructive",
      })
    } catch {
      toast({ title: "Error de red al iniciar OAuth", variant: "destructive" })
    }
  }

  if (loading || !catalogo) {
    return <div className="py-12 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto" /></div>
  }

  const estadoColor = estado === "conectado" ? "text-emerald-600" : estado === "error" ? "text-red-600" : "text-muted-foreground"
  const nivelStyle = meta ? NIVEL_LABELS[meta.nivel] : null

  function copiarWebhook() {
    if (!meta?.webhookUrl) return
    navigator.clipboard.writeText(meta.webhookUrl)
    toast({ title: "URL copiada al portapapeles" })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/conexiones"><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <span className="text-3xl">{catalogo.emoji}</span>
        <div className="flex-1">
          <h1 className="text-xl font-bold">{catalogo.nombre}</h1>
          <p className="text-sm text-muted-foreground">{catalogo.descripcion}</p>
        </div>
        <div className="flex flex-col items-end gap-1">
          {nivelStyle && (
            <Badge className={`text-[10px] ${nivelStyle.className}`}>{nivelStyle.label}</Badge>
          )}
          <Badge className={estado === "conectado" ? "bg-emerald-500/15 text-emerald-700" : ""}>
            {estado === "conectado" ? <CheckCircle2 className="h-3 w-3 mr-1" /> : <AlertCircle className="h-3 w-3 mr-1" />}
            <span className={estadoColor}>{estado}</span>
          </Badge>
        </div>
      </div>

      {ultimoError && (
        <Card className="border-red-500/30 bg-red-500/5">
          <CardContent className="py-3 text-sm text-red-700">{ultimoError}</CardContent>
        </Card>
      )}

      <Tabs defaultValue="resumen">
        <TabsList>
          <TabsTrigger value="resumen">Resumen</TabsTrigger>
          <TabsTrigger value="credenciales">Credenciales</TabsTrigger>
          {(catalogo.entidadesSync?.length ?? 0) > 0 && <TabsTrigger value="sync">Sincronización</TabsTrigger>}
          <TabsTrigger value="logs">Logs</TabsTrigger>
        </TabsList>

        <TabsContent value="resumen" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Estado de conexión</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {cuentaExterna && <p><span className="text-muted-foreground">Cuenta:</span> {cuentaExterna}</p>}
              {ultimaSyncAt && (
                <p><span className="text-muted-foreground">Última sync:</span>{" "}
                  {new Date(ultimaSyncAt).toLocaleString("es-AR")}
                </p>
              )}
              <p className="text-muted-foreground">{catalogo.descripcionComercial}</p>
              {meta?.webhookUrl && (
                <div className="flex items-center gap-2 p-2 rounded-md bg-muted/50 text-xs font-mono">
                  <span className="truncate flex-1">{meta.webhookUrl}</span>
                  <Button size="icon" variant="ghost" className="h-7 w-7 shrink-0" onClick={copiarWebhook}>
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              )}
              {meta?.tips && meta.tips.length > 0 && (
                <ul className="text-xs text-muted-foreground space-y-1">
                  {meta.tips.map((t) => (
                    <li key={t} className="flex gap-1.5"><Info className="h-3 w-3 shrink-0 mt-0.5" />{t}</li>
                  ))}
                </ul>
              )}
              <div className="flex gap-2 flex-wrap">
                <Button size="sm" onClick={probar}><RefreshCw className="h-4 w-4 mr-1" />Probar conexión</Button>
                {estado === "conectado" && (catalogo.entidadesSync?.length ?? 0) > 0 && (
                  <Button size="sm" variant="secondary" onClick={sincronizarAhora} disabled={syncing}>
                    {syncing ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-1" />}
                    Sincronizar ahora
                  </Button>
                )}
                {estado === "conectado" && (
                  <Button size="sm" variant="outline" onClick={desconectar}>
                    <Unplug className="h-4 w-4 mr-1" />Desconectar
                  </Button>
                )}
                {meta?.quickLinks?.map((link) => (
                  <Button key={link.href} size="sm" variant="outline" asChild>
                    <Link href={link.href}>{link.label}</Link>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="credenciales" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Configurar acceso</CardTitle>
              <CardDescription>
                {catalogo.authTipo === "oauth2" && oauthProviders.includes(slug)
                  ? "Conectá tu cuenta con un clic o ingresá credenciales manualmente."
                  : catalogo.authTipo === "oauth2"
                    ? "Ingresá las credenciales OAuth manualmente."
                    : "Completá los campos y guardá para conectar."}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {catalogo.authTipo === "oauth2" && oauthProviders.includes(slug) && (
                <Button
                  variant="outline"
                  onClick={iniciarOAuth}
                  disabled={slug === "shopify" && !credenciales.shopDomain?.trim()}
                >
                  <ExternalLink className="h-4 w-4 mr-1" />
                  Conectar con {catalogo.nombre}
                </Button>
              )}
              {slug === "shopify" && (
                <p className="text-xs text-muted-foreground">
                  Completá el dominio myshopify.com arriba y luego usá OAuth.
                </p>
              )}
              {(catalogo.campos ?? []).length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Esta integración se configura desde otra sección del ERP (ej. AFIP en Configuración → Fiscal).
                </p>
              ) : (
                catalogo.campos!.map((campo) => (
                  <div key={campo.key}>
                    <Label>{campo.label}{campo.requerido ? " *" : ""}</Label>
                    <Input
                      type={campo.tipo === "password" ? "password" : "text"}
                      placeholder={campo.placeholder}
                      value={credenciales[campo.key] ?? ""}
                      onChange={(e) => setCredenciales({ ...credenciales, [campo.key]: e.target.value })}
                    />
                    {campo.ayuda && <p className="text-xs text-muted-foreground mt-1">{campo.ayuda}</p>}
                  </div>
                ))
              )}
              <Button onClick={guardar} disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Plug className="h-4 w-4 mr-1" />}
                Guardar y conectar
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sync" className="space-y-4 mt-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Qué sincronizar</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {Object.entries(configSync.entidades).map(([id, cfg]) => {
                const meta = catalogo.entidadesSync?.find((e) => e.id === id)
                return (
                  <div key={id} className="flex flex-wrap items-center gap-4 border rounded-lg p-3">
                    <div className="flex items-center gap-2 min-w-[140px]">
                      <Switch
                        checked={cfg.activo}
                        onCheckedChange={(v) => setConfigSync({
                          ...configSync,
                          entidades: { ...configSync.entidades, [id]: { ...cfg, activo: v } },
                        })}
                      />
                      <span className="text-sm font-medium">{meta?.label ?? id}</span>
                    </div>
                    <Select
                      value={cfg.direccion}
                      onValueChange={(v) => setConfigSync({
                        ...configSync,
                        entidades: { ...configSync.entidades, [id]: { ...cfg, direccion: v as typeof cfg.direccion } },
                      })}
                    >
                      <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="entrada">Solo entrada</SelectItem>
                        <SelectItem value="salida">Solo salida</SelectItem>
                        <SelectItem value="bidireccional">Bidireccional</SelectItem>
                        <SelectItem value="manual">Manual</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select
                      value={cfg.frecuencia}
                      onValueChange={(v) => setConfigSync({
                        ...configSync,
                        entidades: { ...configSync.entidades, [id]: { ...cfg, frecuencia: v as typeof cfg.frecuencia } },
                      })}
                    >
                      <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="tiempo_real">Tiempo real</SelectItem>
                        <SelectItem value="5min">Cada 5 min</SelectItem>
                        <SelectItem value="15min">Cada 15 min</SelectItem>
                        <SelectItem value="1h">Cada 1 hora</SelectItem>
                        <SelectItem value="diario">Diario</SelectItem>
                        <SelectItem value="manual">Manual</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )
              })}
              <div className="flex gap-2 flex-wrap">
                <Button onClick={guardarSync}>Guardar sincronización</Button>
                {estado === "conectado" && (
                  <Button variant="secondary" onClick={sincronizarAhora} disabled={syncing}>
                    {syncing ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-1" />}
                    Sincronizar ahora
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="logs" className="mt-4">
          <Card>
            <CardContent className="p-0">
              {logs.length === 0 ? (
                <p className="p-6 text-sm text-muted-foreground text-center">Sin actividad registrada aún</p>
              ) : (
                <div className="divide-y">
                  {logs.map((log) => (
                    <div key={log.id} className="px-4 py-3 text-sm flex gap-3">
                      <Clock className="h-4 w-4 shrink-0 text-muted-foreground mt-0.5" />
                      <div>
                        <p>
                          <Badge variant="outline" className="text-[10px] mr-1">{log.estado}</Badge>
                          {log.entidad} — {log.mensaje ?? "—"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(log.createdAt).toLocaleString("es-AR")}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}