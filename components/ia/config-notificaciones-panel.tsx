"use client"

import { useCallback, useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Bell, ExternalLink, Loader2, MessageCircle, Save, Unlink, Users } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface Usuario {
  id: number
  nombre: string
  email: string
  rol: string
}

interface Agente {
  id: string
  nombre: string
}

interface Config {
  umbrales: {
    stockCriticoProductos: number
    diasCxcVencida: number
    diasCxpVencida: number
    ventaSemanalMinima: number
    diferenciaCajaMaxima: number
  }
  prioridades: {
    notificarAlta: boolean
    notificarMedia: boolean
    notificarBaja: boolean
  }
  destinatarios: Array<{
    usuarioId: number
    canales: Array<"app" | "email" | "telegram" | "whatsapp">
  }>
  agentesNotificacion: Record<string, boolean>
  evaluarReglasEnCron: boolean
  telegramVinculos?: Record<string, string>
  telegramUsernames?: Record<string, string>
  telegramGrupoChatId?: string | null
  whatsappReglasAutoAprobar?: boolean
  whatsappCobranzaAutoAprobar?: boolean
  whatsappCobranzaMaxPorRegla?: number
}

interface TelegramInfo {
  configured: boolean
  botUsername: string | null
}

export function ConfigNotificacionesPanel({ authHeaders }: { authHeaders: () => HeadersInit }) {
  const [config, setConfig] = useState<Config | null>(null)
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [agentes, setAgentes] = useState<Agente[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [nuevoUsuarioId, setNuevoUsuarioId] = useState<string>("")
  const [telegramInfo, setTelegramInfo] = useState<TelegramInfo | null>(null)
  const [miTelegramLink, setMiTelegramLink] = useState<string | null>(null)
  const [miTelegramVinculado, setMiTelegramVinculado] = useState(false)
  const { toast } = useToast()

  const fetchConfig = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/ai/config-notificaciones", { headers: authHeaders() })
      const data = await res.json()
      if (data.success) {
        setConfig(data.config)
        setUsuarios(data.usuarios ?? [])
        setAgentes(data.agentes ?? [])
        setTelegramInfo(data.telegram ?? null)
      }
      const linkRes = await fetch("/api/ai/telegram/vincular", { headers: authHeaders() })
      if (linkRes.ok) {
        const linkData = await linkRes.json()
        setMiTelegramLink(linkData.deepLink ?? null)
        setMiTelegramVinculado(Boolean(linkData.vinculado))
      }
    } finally {
      setLoading(false)
    }
  }, [authHeaders])

  useEffect(() => { fetchConfig() }, [fetchConfig])

  async function desvincularTelegram() {
    await fetch("/api/ai/telegram/vincular", { method: "DELETE", headers: authHeaders() })
    setMiTelegramVinculado(false)
    toast({ title: "Telegram desvinculado" })
    fetchConfig()
  }

  async function guardar() {
    if (!config) return
    setSaving(true)
    try {
      const res = await fetch("/api/ai/config-notificaciones", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify(config),
      })
      if (res.ok) {
        toast({ title: "Configuración guardada", description: "Las notificaciones IA quedaron actualizadas." })
        fetchConfig()
      } else {
        const err = await res.json()
        toast({ title: "Error", description: err.error ?? "No se pudo guardar", variant: "destructive" })
      }
    } finally {
      setSaving(false)
    }
  }

  function agregarDestinatario() {
    if (!config || !nuevoUsuarioId) return
    const uid = Number(nuevoUsuarioId)
    if (config.destinatarios.some((d) => d.usuarioId === uid)) return
    setConfig({
      ...config,
      destinatarios: [...config.destinatarios, { usuarioId: uid, canales: ["app"] }],
    })
    setNuevoUsuarioId("")
  }

  if (loading || !config) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Bell className="h-5 w-5" /> Notificaciones automáticas
          </h2>
          <p className="text-sm text-muted-foreground">
            Umbrales, destinatarios y seguimiento fuera del chat
          </p>
        </div>
        <Button onClick={guardar} disabled={saving}>
          {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
          Guardar
        </Button>
      </div>

      <Card className="border-sky-500/20 bg-sky-500/5">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <MessageCircle className="h-4 w-4 text-sky-500" /> Telegram (equipo interno)
          </CardTitle>
          <CardDescription>
            Alertas push y comandos /stock, /ot, /alertas desde el celular
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!telegramInfo?.configured ? (
            <p className="text-sm text-amber-600">
              Configurá <code className="text-xs">TELEGRAM_BOT_TOKEN</code> y{" "}
              <code className="text-xs">TELEGRAM_BOT_USERNAME</code> en el servidor.
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">
              Bot: @{telegramInfo.botUsername ?? "—"}
            </p>
          )}
          <div className="flex flex-wrap gap-2 items-center">
            {miTelegramVinculado ? (
              <>
                <Badge className="bg-emerald-500/15 text-emerald-700">Tu cuenta vinculada</Badge>
                <Button size="sm" variant="outline" onClick={desvincularTelegram}>
                  <Unlink className="h-3 w-3 mr-1" /> Desvincular
                </Button>
              </>
            ) : miTelegramLink ? (
              <Button size="sm" asChild>
                <a href={miTelegramLink} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-3 w-3 mr-1" /> Vincular mi Telegram
                </a>
              </Button>
            ) : null}
          </div>
          <div>
            <Label>Chat ID de grupo (alertas críticas)</Label>
            <Input
              placeholder="-1001234567890"
              value={config.telegramGrupoChatId ?? ""}
              onChange={(e) => setConfig({
                ...config,
                telegramGrupoChatId: e.target.value || null,
              })}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Opcional. Agregá el bot al grupo y usá @userinfobot para obtener el chat_id.
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Umbrales de monitoreo</CardTitle>
            <CardDescription>Variables que disparan alertas automáticas</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label>Productos bajo stock mínimo (cantidad)</Label>
              <Input type="number" value={config.umbrales.stockCriticoProductos}
                onChange={(e) => setConfig({
                  ...config,
                  umbrales: { ...config.umbrales, stockCriticoProductos: Number(e.target.value) },
                })} />
            </div>
            <div>
              <Label>CxC vencida (días)</Label>
              <Input type="number" value={config.umbrales.diasCxcVencida}
                onChange={(e) => setConfig({
                  ...config,
                  umbrales: { ...config.umbrales, diasCxcVencida: Number(e.target.value) },
                })} />
            </div>
            <div>
              <Label>Venta semanal mínima ($)</Label>
              <Input type="number" value={config.umbrales.ventaSemanalMinima}
                onChange={(e) => setConfig({
                  ...config,
                  umbrales: { ...config.umbrales, ventaSemanalMinima: Number(e.target.value) },
                })} />
            </div>
            <div>
              <Label>Diferencia de caja máxima ($)</Label>
              <Input type="number" value={config.umbrales.diferenciaCajaMaxima}
                onChange={(e) => setConfig({
                  ...config,
                  umbrales: { ...config.umbrales, diferenciaCajaMaxima: Number(e.target.value) },
                })} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Prioridades a notificar</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {(["notificarAlta", "notificarMedia", "notificarBaja"] as const).map((key) => (
              <div key={key} className="flex items-center justify-between">
                <Label>{key === "notificarAlta" ? "Alta" : key === "notificarMedia" ? "Media" : "Baja"}</Label>
                <Switch checked={config.prioridades[key]}
                  onCheckedChange={(v) => setConfig({
                    ...config,
                    prioridades: { ...config.prioridades, [key]: v },
                  })} />
              </div>
            ))}
            <div className="flex items-center justify-between pt-2 border-t">
              <Label>Evaluar reglas en cron diario</Label>
              <Switch checked={config.evaluarReglasEnCron}
                onCheckedChange={(v) => setConfig({ ...config, evaluarReglasEnCron: v })} />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="h-4 w-4" /> Destinatarios
          </CardTitle>
          <CardDescription>Usuarios que reciben alertas (app, email, Telegram y/o WhatsApp)</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Select value={nuevoUsuarioId} onValueChange={setNuevoUsuarioId}>
              <SelectTrigger className="flex-1"><SelectValue placeholder="Agregar usuario..." /></SelectTrigger>
              <SelectContent>
                {usuarios.map((u) => (
                  <SelectItem key={u.id} value={String(u.id)}>{u.nombre} ({u.rol})</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={agregarDestinatario} disabled={!nuevoUsuarioId}>Agregar</Button>
          </div>
          {config.destinatarios.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sin destinatarios: se notifica a administradores por defecto.</p>
          ) : (
            <div className="space-y-2">
              {config.destinatarios.map((d, idx) => {
                const u = usuarios.find((x) => x.id === d.usuarioId)
                const tgVinculado = Boolean(config.telegramVinculos?.[String(d.usuarioId)])
                return (
                  <div key={d.usuarioId} className="flex items-center justify-between rounded-lg border p-3">
                    <div>
                      <p className="font-medium text-sm">{u?.nombre ?? `Usuario #${d.usuarioId}`}</p>
                      <p className="text-xs text-muted-foreground">{u?.email}</p>
                      {tgVinculado && (
                        <p className="text-xs text-sky-600">
                          TG: @{config.telegramUsernames?.[String(d.usuarioId)] ?? "vinculado"}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button size="sm" variant={d.canales.includes("telegram") ? "default" : "outline"}
                        disabled={!tgVinculado}
                        title={!tgVinculado ? "El usuario debe vincular Telegram primero" : undefined}
                        onClick={() => {
                          const canales = d.canales.includes("telegram")
                            ? d.canales.filter((c) => c !== "telegram")
                            : [...d.canales, "telegram" as const]
                          const next = [...config.destinatarios]
                          next[idx] = { ...d, canales: canales.length ? canales : ["app"] }
                          setConfig({ ...config, destinatarios: next })
                        }}>
                        Telegram
                      </Button>
                      <Button size="sm" variant={d.canales.includes("email") ? "default" : "outline"}
                        onClick={() => {
                          const canales = d.canales.includes("email")
                            ? d.canales.filter((c) => c !== "email")
                            : [...d.canales, "email" as const]
                          const next = [...config.destinatarios]
                          next[idx] = { ...d, canales: canales.length ? canales : ["app"] }
                          setConfig({ ...config, destinatarios: next })
                        }}>
                        Email
                      </Button>
                      <Button size="sm" variant={d.canales.includes("whatsapp") ? "default" : "outline"}
                        title="Requiere teléfono en ficha de empleado vinculada al usuario"
                        onClick={() => {
                          const canales = d.canales.includes("whatsapp")
                            ? d.canales.filter((c) => c !== "whatsapp")
                            : [...d.canales, "whatsapp" as const]
                          const next = [...config.destinatarios]
                          next[idx] = { ...d, canales: canales.length ? canales : ["app"] }
                          setConfig({ ...config, destinatarios: next })
                        }}>
                        WhatsApp
                      </Button>
                      <Button size="sm" variant="ghost"
                        onClick={() => setConfig({
                          ...config,
                          destinatarios: config.destinatarios.filter((_, i) => i !== idx),
                        })}>
                        Quitar
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">WhatsApp (reglas y cobranza)</CardTitle>
          <CardDescription>
            Reglas con acción WhatsApp en Centro de Alertas → Reglas
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label>Auto-enviar alertas internas (stock, caja…)</Label>
            <Switch
              checked={config.whatsappReglasAutoAprobar !== false}
              onCheckedChange={(v) => setConfig({ ...config, whatsappReglasAutoAprobar: v })}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label>Auto-enviar cobranza a clientes (sin aprobación)</Label>
            <Switch
              checked={config.whatsappCobranzaAutoAprobar === true}
              onCheckedChange={(v) => setConfig({ ...config, whatsappCobranzaAutoAprobar: v })}
            />
          </div>
          <div>
            <Label>Máx. clientes por regla CxC</Label>
            <Input
              type="number"
              min={1}
              max={20}
              value={config.whatsappCobranzaMaxPorRegla ?? 5}
              onChange={(e) => setConfig({
                ...config,
                whatsappCobranzaMaxPorRegla: Number(e.target.value) || 5,
              })}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Los mensajes a clientes aparecen en IA → WhatsApp para revisión (salvo auto-envío).
            El cron <code className="text-xs">/api/cron/enviar-whatsapp</code> envía los aprobados.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Agentes que notifican</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {agentes.map((a) => (
            <Badge key={a.id} variant={config.agentesNotificacion[a.id] ? "default" : "outline"}
              className="cursor-pointer"
              onClick={() => setConfig({
                ...config,
                agentesNotificacion: {
                  ...config.agentesNotificacion,
                  [a.id]: !config.agentesNotificacion[a.id],
                },
              })}>
              {a.nombre}
            </Badge>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}