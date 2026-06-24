"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Bell, BellRing, AlertTriangle, Check, CheckCircle, Clock, CircleDot,
  Loader2, MessageCircle, PhoneForwarded, RefreshCw, Send, Settings,
  Sparkles, X, Zap, Bot, ExternalLink,
} from "lucide-react"
import { ReglasAlertasPanel } from "./reglas-alertas-panel"
import { useToast } from "@/hooks/use-toast"

interface Resumen {
  alertasActivas: number
  alertasNoLeidas: number
  reglasActivas: number
  reglasDisparadas: number
  whatsappPendientes: number
  whatsappAprobados: number
  telegramConfigurado: boolean
  whatsappConfigurado: boolean
  telegramVinculos: number
}

interface EntradaSeguimiento {
  fecha: string
  usuarioNombre: string
  accion: string
  nota?: string
}

interface AlertaBandeja {
  id: number
  titulo: string
  descripcion: string
  prioridad: string
  tipo: string
  accion: string | null
  leida: boolean
  resuelta: boolean
  createdAt: string
  origen?: string
  canales: Array<"app" | "email" | "telegram" | "whatsapp">
  seguimiento: {
    estadoSeguimiento: string
    asignadoANombre?: string
    seguimiento: EntradaSeguimiento[]
    notificacionesEnviadas: Array<{ canal: string; usuarioNombre: string; fecha: string }>
  }
}

interface MensajeWA {
  id: number
  destinatario: string
  telefono: string
  mensaje: string
  tipo: string
  prioridad: number
  estado: string
  createdAt: string
}

interface EstadoCanales {
  telegram: {
    configurado: boolean
    botUsername: string | null
    vinculos: number
    grupo: boolean
    destinatarios: number
    reglasActivas: number
  }
  whatsapp: {
    configurado: boolean
    reglasActivas: number
    destinatarios: number
    autoReglas: boolean
    autoCobranza: boolean
  }
}

const PRI_COLOR: Record<string, string> = {
  alta: "text-red-500", media: "text-yellow-500", baja: "text-green-500",
}
const PRI_BADGE: Record<string, "destructive" | "secondary" | "outline"> = {
  alta: "destructive", media: "secondary", baja: "outline",
}
const ORIGEN_LABEL: Record<string, string> = {
  regla: "Regla", ia_agente: "Agente IA", cron: "Cron", manual: "IA manual",
}
const CANAL_ICON: Record<string, typeof Bell> = {
  app: Bell, email: Send, telegram: Send, whatsapp: MessageCircle,
}

type Filtro = "activas" | "no_leidas" | "regla" | "ia" | "todas"

export function CentroAlertasPanel({
  authHeaders,
  tabInicial = "bandeja",
  alertaIdInicial,
}: {
  authHeaders: () => HeadersInit
  tabInicial?: string
  alertaIdInicial?: number | null
}) {
  const [tab, setTab] = useState(tabInicial)
  const [resumen, setResumen] = useState<Resumen | null>(null)
  const [bandeja, setBandeja] = useState<AlertaBandeja[]>([])
  const [whatsapp, setWhatsapp] = useState<MensajeWA[]>([])
  const [canales, setCanales] = useState<EstadoCanales | null>(null)
  const [filtro, setFiltro] = useState<Filtro>("activas")
  const [loading, setLoading] = useState(true)
  const [accionando, setAccionando] = useState(false)
  const [seguimientoId, setSeguimientoId] = useState<number | null>(alertaIdInicial ?? null)
  const [nota, setNota] = useState("")
  const [iaHabilitada, setIaHabilitada] = useState(true)
  const { toast } = useToast()

  const fetchCentro = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(
        `/api/centro-alertas?filtro=${filtro}&whatsapp=true&canales=true`,
        { headers: authHeaders() },
      )
      const data = await res.json()
      if (data.success) {
        setResumen(data.resumen)
        setBandeja(data.bandeja ?? [])
        setWhatsapp(data.whatsapp ?? [])
        setCanales(data.canales)
        setIaHabilitada(data.iaHabilitada !== false)
      }
    } finally {
      setLoading(false)
    }
  }, [authHeaders, filtro])

  useEffect(() => { fetchCentro() }, [fetchCentro])

  useEffect(() => {
    if (alertaIdInicial) setSeguimientoId(alertaIdInicial)
  }, [alertaIdInicial])

  const patchAlerta = async (id: number, body: Record<string, unknown>) => {
    await fetch("/api/ai/alertas", {
      method: "PATCH",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify({ id, ...body }),
    })
    await fetchCentro()
  }

  const ejecutarAccion = async (accion: "evaluar_reglas" | "generar_ia") => {
    setAccionando(true)
    try {
      const res = await fetch("/api/centro-alertas", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({ accion }),
      })
      const data = await res.json()
      if (res.ok) {
        if (accion === "evaluar_reglas") {
          const disparadas = (data.resultado ?? []).filter((r: { disparada: boolean }) => r.disparada).length
          toast({ title: "Reglas evaluadas", description: `${disparadas} regla(s) disparada(s)` })
        } else {
          toast({ title: "Alertas IA generadas", description: `${data.alertasGeneradas ?? 0} nuevas` })
        }
        await fetchCentro()
      } else {
        toast({ title: "Error", description: data.error, variant: "destructive" })
      }
    } finally {
      setAccionando(false)
    }
  }

  const updateMensajeWA = async (id: number, accion: "aprobar" | "descartar") => {
    await fetch("/api/ai/whatsapp-mensajes", {
      method: "PATCH",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify({ id, accion }),
    })
    setWhatsapp((prev) => prev.filter((m) => m.id !== id))
    await fetchCentro()
  }

  const alertaActiva = bandeja.find((a) => a.id === seguimientoId)

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-amber-500/20">
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Alertas activas</p>
                <p className="text-2xl font-bold">{resumen?.alertasActivas ?? "—"}</p>
                <p className="text-xs text-muted-foreground">{resumen?.alertasNoLeidas ?? 0} sin leer</p>
              </div>
              <BellRing className="h-8 w-8 text-amber-500/60" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-violet-500/20">
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Reglas</p>
                <p className="text-2xl font-bold">{resumen?.reglasActivas ?? "—"}</p>
                <p className="text-xs text-red-600">{resumen?.reglasDisparadas ?? 0} disparadas</p>
              </div>
              <Zap className="h-8 w-8 text-violet-500/60" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-green-500/20">
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">WhatsApp cola</p>
                <p className="text-2xl font-bold">{resumen?.whatsappPendientes ?? "—"}</p>
                <p className="text-xs text-muted-foreground">{resumen?.whatsappAprobados ?? 0} aprobados</p>
              </div>
              <MessageCircle className="h-8 w-8 text-green-500/60" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-sky-500/20">
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Canales</p>
                <div className="flex gap-2 mt-1">
                  <Badge variant={resumen?.telegramConfigurado ? "default" : "outline"} className="text-[10px]">
                    TG {resumen?.telegramVinculos ?? 0}
                  </Badge>
                  <Badge variant={resumen?.whatsappConfigurado ? "default" : "outline"} className="text-[10px]">
                    WA {resumen?.whatsappConfigurado ? "OK" : "—"}
                  </Badge>
                </div>
              </div>
              <Send className="h-8 w-8 text-sky-500/60" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Acciones rápidas */}
      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant="outline" onClick={() => ejecutarAccion("evaluar_reglas")} disabled={accionando}>
          {accionando ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Zap className="h-4 w-4 mr-1" />}
          Evaluar reglas
        </Button>
        {iaHabilitada && (
          <Button size="sm" variant="outline" onClick={() => ejecutarAccion("generar_ia")} disabled={accionando}>
            <Sparkles className="h-4 w-4 mr-1" /> Generar alertas IA
          </Button>
        )}
        <Button size="sm" variant="ghost" onClick={fetchCentro} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-1 ${loading ? "animate-spin" : ""}`} /> Actualizar
        </Button>
        <Button size="sm" variant="ghost" asChild>
          <Link href="/dashboard/ia?tab=notificaciones">
            <Settings className="h-4 w-4 mr-1" /> Configurar canales
          </Link>
        </Button>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="flex flex-wrap h-auto gap-1 bg-transparent p-0">
          <TabsTrigger value="bandeja" className="rounded-full px-4 data-[state=active]:bg-muted">
            <Bell className="h-4 w-4 mr-1" /> Bandeja
            {(resumen?.alertasNoLeidas ?? 0) > 0 && (
              <Badge className="ml-1 h-5 px-1.5 text-[10px]">{resumen?.alertasNoLeidas}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="reglas" className="rounded-full px-4 data-[state=active]:bg-muted">
            <Zap className="h-4 w-4 mr-1" /> Reglas
          </TabsTrigger>
          <TabsTrigger value="whatsapp" className="rounded-full px-4 data-[state=active]:bg-muted">
            <PhoneForwarded className="h-4 w-4 mr-1" /> WhatsApp
            {(resumen?.whatsappPendientes ?? 0) > 0 && (
              <Badge className="ml-1 h-5 px-1.5 text-[10px]">{resumen?.whatsappPendientes}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="canales" className="rounded-full px-4 data-[state=active]:bg-muted">
            <Send className="h-4 w-4 mr-1" /> Canales
          </TabsTrigger>
        </TabsList>

        {/* BANDEJA */}
        <TabsContent value="bandeja" className="mt-4 space-y-4">
          <div className="flex flex-wrap gap-2">
            {(["activas", "no_leidas", "regla", "ia", "todas"] as Filtro[]).map((f) => (
              <Button key={f} size="sm" variant={filtro === f ? "default" : "outline"}
                onClick={() => setFiltro(f)}>
                {f === "activas" ? "Activas" : f === "no_leidas" ? "Sin leer" : f === "regla" ? "Por regla" : f === "ia" ? "Por IA" : "Todas"}
              </Button>
            ))}
          </div>

          {loading && (
            <div className="text-center py-12"><Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" /></div>
          )}

          {!loading && bandeja.length === 0 && (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                <CheckCircle className="h-12 w-12 mx-auto mb-3 text-emerald-500/50" />
                <p className="font-medium">Sin alertas en esta vista</p>
                <p className="text-xs mt-1">Evaluá reglas o generá alertas IA para poblar la bandeja.</p>
              </CardContent>
            </Card>
          )}

          <div className="grid gap-3">
            {bandeja.map((alerta) => (
              <Card key={alerta.id} className={alerta.resuelta ? "opacity-50" : ""}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <CircleDot className={`h-4 w-4 shrink-0 ${PRI_COLOR[alerta.prioridad] ?? ""}`} />
                        <span className="font-medium text-sm">{alerta.titulo}</span>
                        <Badge variant={PRI_BADGE[alerta.prioridad] ?? "outline"} className="text-[10px]">
                          {alerta.prioridad}
                        </Badge>
                        {alerta.origen && (
                          <Badge variant="outline" className="text-[10px]">
                            {ORIGEN_LABEL[alerta.origen] ?? alerta.origen}
                          </Badge>
                        )}
                        <Badge variant="outline" className="text-[10px]">{alerta.tipo}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{alerta.descripcion}</p>
                      {alerta.accion && <p className="text-xs text-primary mt-1">💡 {alerta.accion}</p>}
                      <div className="flex items-center gap-2 mt-2 flex-wrap">
                        {alerta.canales.map((c) => {
                          const Icon = CANAL_ICON[c] ?? Bell
                          return (
                            <Badge key={c} variant="secondary" className="text-[10px] gap-1">
                              <Icon className="h-3 w-3" />{c}
                            </Badge>
                          )
                        })}
                        <Badge variant="outline" className="text-[10px]">
                          {alerta.seguimiento.estadoSeguimiento}
                        </Badge>
                        <span className="text-[10px] text-muted-foreground">
                          {new Date(alerta.createdAt).toLocaleString("es-AR")}
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-col gap-1 shrink-0">
                      <Button variant="ghost" size="icon" onClick={() => setSeguimientoId(alerta.id)} title="Seguimiento">
                        <Clock className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon"
                        onClick={() => patchAlerta(alerta.id, { resuelta: true, leida: true, estadoSeguimiento: "resuelta" })}
                        title="Resolver">
                        <Check className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {alertaActiva && (
            <Card className="border-primary/30 sticky bottom-4 shadow-lg">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center justify-between">
                  Seguimiento: {alertaActiva.titulo}
                  <Button variant="ghost" size="icon" onClick={() => setSeguimientoId(null)}><X className="h-4 w-4" /></Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex gap-2 flex-wrap">
                  <Button size="sm" variant="outline"
                    onClick={() => patchAlerta(alertaActiva.id, { estadoSeguimiento: "en_revision", leida: true })}>
                    En revisión
                  </Button>
                  <Button size="sm" variant="outline"
                    onClick={() => patchAlerta(alertaActiva.id, { estadoSeguimiento: "descartada" })}>
                    Descartar
                  </Button>
                </div>
                <Textarea placeholder="Nota de seguimiento..." value={nota} onChange={(e) => setNota(e.target.value)} rows={2} />
                <Button size="sm" disabled={!nota.trim()}
                  onClick={async () => { await patchAlerta(alertaActiva.id, { nota, leida: true }); setNota("") }}>
                  Guardar nota
                </Button>
                {alertaActiva.seguimiento.notificacionesEnviadas.length > 0 && (
                  <div className="text-xs space-y-1 border-t pt-2">
                    <p className="font-medium text-muted-foreground">Notificaciones enviadas</p>
                    {alertaActiva.seguimiento.notificacionesEnviadas.map((n, i) => (
                      <p key={i} className="text-muted-foreground">
                        {n.canal} → {n.usuarioNombre} · {new Date(n.fecha).toLocaleString("es-AR")}
                      </p>
                    ))}
                  </div>
                )}
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {(alertaActiva.seguimiento.seguimiento ?? []).slice().reverse().map((s, i) => (
                    <div key={i} className="text-xs border-l-2 border-muted pl-3 py-1">
                      <span className="font-medium">{s.usuarioNombre}</span>
                      <span className="text-muted-foreground"> · {new Date(s.fecha).toLocaleString("es-AR")}</span>
                      {s.nota && <p className="text-muted-foreground mt-0.5">{s.nota}</p>}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* REGLAS */}
        <TabsContent value="reglas" className="mt-4">
          <ReglasAlertasPanel authHeaders={authHeaders} />
        </TabsContent>

        {/* WHATSAPP */}
        <TabsContent value="whatsapp" className="mt-4 space-y-4">
          <p className="text-sm text-muted-foreground">
            Cola de mensajes desde reglas CxC, alertas internas y agente ventas/leads.
            Los aprobados los envía el cron automáticamente.
          </p>
          {whatsapp.length === 0 ? (
            <Card><CardContent className="py-8 text-center text-muted-foreground">Cola vacía</CardContent></Card>
          ) : (
            <div className="grid gap-3">
              {whatsapp.map((msg) => (
                <Card key={msg.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="font-medium text-sm">{msg.destinatario}</span>
                          <Badge variant="outline" className="text-[10px]">{msg.tipo}</Badge>
                          <Badge variant={msg.estado === "aprobado" ? "default" : "secondary"} className="text-[10px]">
                            {msg.estado}
                          </Badge>
                          <span className="text-xs text-muted-foreground">P{msg.prioridad}</span>
                        </div>
                        <p className="text-sm bg-green-50 dark:bg-green-950/30 rounded-lg p-3 border border-green-200/50">
                          {msg.mensaje}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">{msg.telefono}</p>
                      </div>
                      {msg.estado === "pendiente" && (
                        <div className="flex flex-col gap-1">
                          <Button size="sm" onClick={() => updateMensajeWA(msg.id, "aprobar")}>
                            <Check className="h-4 w-4 mr-1" /> Aprobar
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => updateMensajeWA(msg.id, "descartar")}>
                            Descartar
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
          <Button size="sm" variant="outline" asChild>
            <Link href="/dashboard/ia?tab=whatsapp">
              <ExternalLink className="h-4 w-4 mr-1" /> Generar más con IA
            </Link>
          </Button>
        </TabsContent>

        {/* CANALES */}
        <TabsContent value="canales" className="mt-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card className="border-sky-500/20">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Send className="h-4 w-4 text-sky-500" /> Telegram
                </CardTitle>
                <CardDescription>Alertas push y comandos /alertas, /stock, /ot</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Bot configurado</span>
                  <Badge variant={canales?.telegram.configurado ? "default" : "outline"}>
                    {canales?.telegram.configurado ? "Sí" : "No"}
                  </Badge>
                </div>
                {canales?.telegram.botUsername && (
                  <p className="text-xs">@{canales.telegram.botUsername}</p>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Usuarios vinculados</span>
                  <span>{canales?.telegram.vinculos ?? 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Reglas con Telegram</span>
                  <span>{canales?.telegram.reglasActivas ?? 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Grupo críticas</span>
                  <span>{canales?.telegram.grupo ? "Configurado" : "—"}</span>
                </div>
              </CardContent>
            </Card>

            <Card className="border-green-500/20">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <MessageCircle className="h-4 w-4 text-green-500" /> WhatsApp
                </CardTitle>
                <CardDescription>Twilio — cobranza, reglas y alertas internas</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Twilio configurado</span>
                  <Badge variant={canales?.whatsapp.configurado ? "default" : "outline"}>
                    {canales?.whatsapp.configurado ? "Sí" : "No"}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Reglas activas WA</span>
                  <span>{canales?.whatsapp.reglasActivas ?? 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Auto-envío interno</span>
                  <span>{canales?.whatsapp.autoReglas ? "Sí" : "Requiere aprobación"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Auto-envío cobranza</span>
                  <span>{canales?.whatsapp.autoCobranza ? "Sí" : "Requiere aprobación"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Destinatarios WA</span>
                  <span>{canales?.whatsapp.destinatarios ?? 0}</span>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="mt-4">
            <CardContent className="py-4 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Bot className="h-4 w-4" />
                Destinatarios, umbrales y vinculación Telegram en configuración IA
              </div>
              <Button size="sm" asChild>
                <Link href="/dashboard/ia?tab=notificaciones">
                  <Settings className="h-4 w-4 mr-1" /> Abrir configuración
                </Link>
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}