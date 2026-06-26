"use client"

import { useState, useEffect, useCallback, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Bot, AlertTriangle, CheckCircle, Clock, MessageSquare,
  TrendingUp, RefreshCw, Sparkles, X, Edit, Check, Trash2,
  Loader2, CircleDot, PhoneForwarded, Lock, Settings, BellRing,
} from "lucide-react"
import Link from "next/link"
import { ConfigNotificacionesPanel } from "@/components/ia/config-notificaciones-panel"
import { AiChatPanel } from "@/components/ia/ai-chat-panel"
import { PageShell, PageHeader } from "@/components/layout"

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface EntradaSeguimiento {
  fecha: string
  usuarioNombre: string
  accion: string
  nota?: string
}

interface AlertaSeguimiento {
  estadoSeguimiento: string
  asignadoANombre?: string
  seguimiento: EntradaSeguimiento[]
}

interface Alerta {
  id: number
  tipo: string
  prioridad: string
  titulo: string
  descripcion: string
  accion: string | null
  leida: boolean
  resuelta: boolean
  createdAt: string
  seguimiento?: AlertaSeguimiento
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

interface Proyeccion {
  proyeccion_semana: number
  proyeccion_mes: number
  confianza: string
  factores: string[]
  recomendaciones_stock: Array<{ producto: string; cantidad_sugerida: number; razon: string }>
}

// ─── Hook compartido de auth ──────────────────────────────────────────────────

function useAuthHeaders(): () => Record<string, string> {
  return useCallback(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null
    return token ? { Authorization: `Bearer ${token}` } : {}
  }, [])
}

// ─── Root page ────────────────────────────────────────────────────────────────

function IAPageContent() {
  const [iaEnabled, setIaEnabled] = useState<boolean | null>(null)
  const authHeaders = useAuthHeaders()
  const searchParams = useSearchParams()
  const tabInicial = searchParams.get("tab") ?? "chat"

  useEffect(() => {
    fetch("/api/config/modulos", { headers: authHeaders() })
      .then(r => r.json())
      .then(d => setIaEnabled(d.ia === true))
      .catch(() => setIaEnabled(false))
  }, [authHeaders])

  if (iaEnabled === null) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (iaEnabled === false) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center p-6">
        <Lock className="h-16 w-16 text-muted-foreground/30" />
        <h1 className="text-2xl font-bold">Módulo IA desactivado</h1>
        <p className="text-muted-foreground max-w-md">
          El módulo de Inteligencia Artificial no está habilitado para esta empresa.
          Un administrador puede activarlo desde Configuración → Módulos.
        </p>
        <Link href="/dashboard/configuracion">
          <Button variant="outline" className="gap-2">
            <Settings className="h-4 w-4" />
            Ir a Configuración
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <PageShell>
      <PageHeader
        title="Asistente IA"
        description="Consultá tu negocio, generá alertas y automatizá comunicaciones con datos reales del ERP."
      />

      <Tabs defaultValue={tabInicial} className="flex-1">
        <TabsList className="flex w-full sm:w-fit max-w-full overflow-x-auto scrollbar-thin flex-nowrap sm:flex-wrap bg-transparent gap-2 p-0 h-auto pb-1">
          <TabsTrigger value="chat" className="data-[state=active]:bg-muted data-[state=active]:shadow-none rounded-full px-4 py-2 border border-transparent data-[state=active]:border-border"><MessageSquare className="h-4 w-4 mr-2" />Chat</TabsTrigger>
          <TabsTrigger value="alertas" className="data-[state=active]:bg-muted data-[state=active]:shadow-none rounded-full px-4 py-2 border border-transparent data-[state=active]:border-border"><AlertTriangle className="h-4 w-4 mr-2" />Alertas</TabsTrigger>
          <TabsTrigger value="whatsapp" className="data-[state=active]:bg-muted data-[state=active]:shadow-none rounded-full px-4 py-2 border border-transparent data-[state=active]:border-border"><PhoneForwarded className="h-4 w-4 mr-2" />WhatsApp</TabsTrigger>
          <TabsTrigger value="proyeccion" className="data-[state=active]:bg-muted data-[state=active]:shadow-none rounded-full px-4 py-2 border border-transparent data-[state=active]:border-border"><TrendingUp className="h-4 w-4 mr-2" />Proyección</TabsTrigger>
          <TabsTrigger value="notificaciones" className="data-[state=active]:bg-muted data-[state=active]:shadow-none rounded-full px-4 py-2 border border-transparent data-[state=active]:border-border"><Settings className="h-4 w-4 mr-2" />Notificaciones</TabsTrigger>
        </TabsList>

        <TabsContent value="chat" className="mt-4">
          <ChatSection authHeaders={authHeaders} />
        </TabsContent>
        <TabsContent value="alertas" className="mt-4">
          <AlertasSection authHeaders={authHeaders} />
        </TabsContent>
        <TabsContent value="whatsapp" className="mt-4">
          <WhatsAppSection authHeaders={authHeaders} />
        </TabsContent>
        <TabsContent value="proyeccion" className="mt-4">
          <ProyeccionSection authHeaders={authHeaders} />
        </TabsContent>
        <TabsContent value="notificaciones" className="mt-4">
          <ConfigNotificacionesPanel authHeaders={authHeaders} />
        </TabsContent>
      </Tabs>
    </PageShell>
  )
}

// ─── CHAT ─────────────────────────────────────────────────────────────────────

function ChatSection({ authHeaders }: { authHeaders: () => HeadersInit }) {
  return (
    <AiChatPanel
      variant="page"
      authHeaders={authHeaders}
      showCapabilitiesSidebar
      header={(
        <div className="px-4 py-3 border-b shrink-0">
          <h2 className="font-semibold text-base flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-primary" />
            Chat con tu negocio
          </h2>
          <p className="text-xs text-muted-foreground mt-1">
            Respuestas basadas en ventas, stock, clientes y caja de tu empresa.
          </p>
        </div>
      )}
    />
  )
}

// ─── ALERTAS ──────────────────────────────────────────────────────────────────

function AlertasSection({ authHeaders }: { authHeaders: () => HeadersInit }) {
  const [alertas, setAlertas] = useState<Alerta[]>([])
  const [loading, setLoading] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [seguimientoId, setSeguimientoId] = useState<number | null>(null)
  const [nota, setNota] = useState("")

  const fetchAlertas = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/ai/alertas?seguimiento=true", { headers: authHeaders() })
      const data = await res.json()
      if (data.success) setAlertas(data.data ?? [])
    } catch {}
    finally { setLoading(false) }
  }, [authHeaders])

  useEffect(() => { fetchAlertas() }, [fetchAlertas])

  const generateNew = async () => {
    setGenerating(true)
    try {
      await fetch("/api/ai/alertas", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
      })
      await fetchAlertas()
    } catch {}
    finally { setGenerating(false) }
  }

  const patchAlerta = async (id: number, body: Record<string, unknown>) => {
    await fetch("/api/ai/alertas", {
      method: "PATCH",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify({ id, ...body }),
    })
    await fetchAlertas()
  }

  const markResolved = async (id: number) => {
    await patchAlerta(id, { resuelta: true, leida: true, estadoSeguimiento: "resuelta" })
  }

  const alertaActiva = alertas.find((a) => a.id === seguimientoId)

  const priColor: Record<string, string> = {
    alta: "text-red-500", media: "text-yellow-500", baja: "text-green-500",
  }
  const priBadge: Record<string, "destructive" | "secondary" | "outline"> = {
    alta: "destructive", media: "secondary", baja: "outline",
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h2 className="text-lg font-semibold">Alertas del día</h2>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" asChild>
            <Link href="/dashboard/centro-alertas">
              <BellRing className="h-4 w-4 mr-1" /> Centro de alertas
            </Link>
          </Button>
          <Button size="sm" onClick={generateNew} disabled={generating}>
            {generating ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Sparkles className="h-4 w-4 mr-1" />}
            Generar alertas
          </Button>
        </div>
      </div>

      {loading && <div className="text-center py-8"><Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" /></div>}

      {!loading && alertas.length === 0 && (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            <CheckCircle className="h-12 w-12 mx-auto mb-3 text-green-500 opacity-50" />
            <p className="font-medium">Todo en orden hoy</p>
            <p className="text-xs mt-1">Generá alertas para que la IA analice tu negocio.</p>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-3">
        {alertas.map(alerta => (
          <Card key={alerta.id} className={alerta.resuelta ? "opacity-50" : ""}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <CircleDot className={`h-4 w-4 shrink-0 ${priColor[alerta.prioridad] ?? "text-gray-400"}`} />
                    <span className="font-medium text-sm">{alerta.titulo}</span>
                    <Badge variant={priBadge[alerta.prioridad] ?? "outline"} className="text-[10px]">
                      {alerta.prioridad}
                    </Badge>
                    <Badge variant="outline" className="text-[10px]">{alerta.tipo}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{alerta.descripcion}</p>
                  {alerta.accion && (
                    <p className="text-xs text-primary mt-1">💡 {alerta.accion}</p>
                  )}
                  {alerta.seguimiento && (
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      <Badge variant="outline" className="text-[10px]">
                        {alerta.seguimiento.estadoSeguimiento}
                      </Badge>
                      {alerta.seguimiento.asignadoANombre && (
                        <span className="text-[10px] text-muted-foreground">
                          → {alerta.seguimiento.asignadoANombre}
                        </span>
                      )}
                    </div>
                  )}
                </div>
                <div className="flex flex-col gap-1">
                  <Button variant="ghost" size="icon" onClick={() => setSeguimientoId(alerta.id)} title="Seguimiento">
                    <Clock className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => markResolved(alerta.id)} title="Marcar como resuelta">
                    <Check className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {alertaActiva && (
        <Card className="border-primary/30">
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
            <Textarea placeholder="Agregar nota de seguimiento..." value={nota} onChange={(e) => setNota(e.target.value)} rows={2} />
            <Button size="sm" disabled={!nota.trim()}
              onClick={async () => {
                await patchAlerta(alertaActiva.id, { nota, leida: true })
                setNota("")
              }}>
              Guardar nota
            </Button>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {(alertaActiva.seguimiento?.seguimiento ?? []).slice().reverse().map((s, i) => (
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
    </div>
  )
}

// ─── WHATSAPP ─────────────────────────────────────────────────────────────────

function WhatsAppSection({ authHeaders }: { authHeaders: () => HeadersInit }) {
  const [mensajes, setMensajes] = useState<MensajeWA[]>([])
  const [loading, setLoading] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editText, setEditText] = useState("")

  const fetchMensajes = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/ai/whatsapp-mensajes?estado=pendiente", { headers: authHeaders() })
      const data = await res.json()
      if (data.success) setMensajes(data.data ?? [])
    } catch {}
    finally { setLoading(false) }
  }, [authHeaders])

  useEffect(() => { fetchMensajes() }, [fetchMensajes])

  const generateNew = async (tipo: string) => {
    setGenerating(true)
    try {
      await fetch("/api/ai/whatsapp-mensajes", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({ tipo }),
      })
      await fetchMensajes()
    } catch {}
    finally { setGenerating(false) }
  }

  const updateMensaje = async (id: number, accion: "aprobar" | "descartar" | "editar", mensajeEditado?: string) => {
    await fetch("/api/ai/whatsapp-mensajes", {
      method: "PATCH",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify({ id, accion, mensajeEditado }),
    })
    if (accion !== "editar") {
      setMensajes(prev => prev.filter(m => m.id !== id))
    } else {
      setEditingId(null)
      await fetchMensajes()
    }
  }

  const tipoBadge: Record<string, string> = {
    cobranza: "bg-red-100 text-red-700",
    cliente_inactivo: "bg-yellow-100 text-yellow-700",
    recordatorio_turno: "bg-blue-100 text-blue-700",
    general: "bg-gray-100 text-gray-700",
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h2 className="text-lg font-semibold">Mensajes WhatsApp</h2>
        <div className="flex gap-2 flex-wrap">
          {(["cobranza", "inactivos", "turnos"] as const).map(tipo => (
            <Button key={tipo} size="sm" variant="outline" onClick={() => generateNew(tipo)} disabled={generating}>
              {tipo.charAt(0).toUpperCase() + tipo.slice(1)}
            </Button>
          ))}
          <Button size="sm" onClick={() => generateNew("todos")} disabled={generating}>
            {generating ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Sparkles className="h-4 w-4 mr-1" />}
            Generar todos
          </Button>
        </div>
      </div>

      {loading && <div className="text-center py-8"><Loader2 className="h-6 w-6 animate-spin mx-auto" /></div>}

      {!loading && mensajes.length === 0 && (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p>No hay mensajes pendientes.</p>
            <p className="text-xs mt-1">Generá mensajes para que la IA redacte WhatsApps personalizados.</p>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-3">
        {mensajes.map(msg => (
          <Card key={msg.id}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="font-medium text-sm">{msg.destinatario}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full ${tipoBadge[msg.tipo] ?? "bg-gray-100"}`}>
                      {msg.tipo}
                    </span>
                    <span className="text-xs text-muted-foreground">Prioridad: {msg.prioridad}</span>
                  </div>

                  {editingId === msg.id ? (
                    <div className="flex gap-2 mt-2">
                      <Textarea value={editText} onChange={e => setEditText(e.target.value)} rows={3} className="flex-1 text-sm" />
                      <div className="flex flex-col gap-1">
                        <Button size="icon" variant="ghost" onClick={() => updateMensaje(msg.id, "editar", editText)}>
                          <Check className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="ghost" onClick={() => setEditingId(null)}>
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm bg-green-50 dark:bg-green-950/30 rounded-lg p-3 mt-1 border border-green-200 dark:border-green-800">
                      {msg.mensaje}
                    </p>
                  )}
                </div>

                {editingId !== msg.id && (
                  <div className="flex flex-col gap-1">
                    <Button size="icon" variant="ghost" title="Aprobar" onClick={() => updateMensaje(msg.id, "aprobar")}>
                      <Check className="h-4 w-4 text-green-500" />
                    </Button>
                    <Button size="icon" variant="ghost" title="Editar" onClick={() => { setEditingId(msg.id); setEditText(msg.mensaje) }}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="ghost" title="Descartar" onClick={() => updateMensaje(msg.id, "descartar")}>
                      <Trash2 className="h-4 w-4 text-red-400" />
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

// ─── PROYECCIÓN ───────────────────────────────────────────────────────────────

function ProyeccionSection({ authHeaders }: { authHeaders: () => HeadersInit }) {
  const [data, setData] = useState<Proyeccion | null>(null)
  const [loading, setLoading] = useState(false)

  const fetchProyeccion = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/ai/proyeccion", { headers: authHeaders() })
      const json = await res.json()
      if (json.success) setData(json.data)
    } catch {}
    finally { setLoading(false) }
  }

  const fmt = (n: number) => n.toLocaleString("es-AR", { maximumFractionDigits: 0 })
  const confianzaColor: Record<string, string> = {
    alta: "text-green-600", media: "text-yellow-600", baja: "text-red-500",
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Proyección de ventas</h2>
        <Button size="sm" onClick={fetchProyeccion} disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <RefreshCw className="h-4 w-4 mr-1" />}
          Generar proyección
        </Button>
      </div>

      {!data && !loading && (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            <TrendingUp className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p>Generá una proyección para ver las ventas estimadas.</p>
          </CardContent>
        </Card>
      )}

      {data && (
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Proyección Semana</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-3xl font-bold">${fmt(data.proyeccion_semana)}</p>
              <p className={`text-sm mt-1 ${confianzaColor[data.confianza]}`}>
                Confianza: {data.confianza}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Proyección Mes</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-3xl font-bold">${fmt(data.proyeccion_mes)}</p>
            </CardContent>
          </Card>

          {data.factores.length > 0 && (
            <Card className="md:col-span-2">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Factores que influyen</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <ul className="space-y-1">
                  {data.factores.map((f, i) => (
                    <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                      <span className="text-primary mt-0.5">•</span>{f}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {data.recomendaciones_stock.length > 0 && (
            <Card className="md:col-span-2">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Productos a reponer</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-2">
                  {data.recomendaciones_stock.map((r, i) => (
                    <div key={i} className="flex items-start justify-between gap-3 py-2 border-b last:border-0">
                      <div>
                        <p className="text-sm font-medium">{r.producto}</p>
                        <p className="text-xs text-muted-foreground">{r.razon}</p>
                      </div>
                      <Badge variant="secondary" className="shrink-0">{r.cantidad_sugerida} unidades</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}

export default function IAPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    }>
      <IAPageContent />
    </Suspense>
  )
}
