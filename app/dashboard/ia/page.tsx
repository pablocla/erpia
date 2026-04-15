"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Bot, Send, AlertTriangle, CheckCircle, Clock, MessageSquare,
  TrendingUp, RefreshCw, Sparkles, X, Edit, Check, Trash2,
  Loader2, CircleDot, PhoneForwarded, Lock, Settings,
} from "lucide-react"
import Link from "next/link"

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface ChatMessage {
  id?: number
  role: "user" | "assistant"
  content: string
  createdAt?: string
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

function useAuthHeaders(): () => HeadersInit {
  return useCallback(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null
    return token ? { Authorization: `Bearer ${token}` } : {}
  }, [])
}

// ─── Quick Actions ────────────────────────────────────────────────────────────

const QUICK_ACTIONS = [
  { label: "¿Cómo estoy hoy?", icon: Sparkles },
  { label: "¿Qué repongo?", icon: AlertTriangle },
  { label: "¿Quién me debe?", icon: Clock },
  { label: "Dame el reporte", icon: TrendingUp },
]

// ─── Root page ────────────────────────────────────────────────────────────────

export default function IAPage() {
  const [iaEnabled, setIaEnabled] = useState<boolean | null>(null)
  const authHeaders = useAuthHeaders()

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
    <div className="flex flex-col gap-6 p-4 md:p-6">
      <div className="flex items-center gap-3">
        <Bot className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-2xl font-bold">Asistente IA</h1>
          <p className="text-sm text-muted-foreground">Inteligencia artificial integrada al negocio</p>
        </div>
      </div>

      <Tabs defaultValue="chat" className="flex-1">
        <TabsList className="flex flex-wrap w-fit bg-transparent gap-2 p-0 h-auto">
          <TabsTrigger value="chat" className="data-[state=active]:bg-muted data-[state=active]:shadow-none rounded-full px-4 py-2 border border-transparent data-[state=active]:border-border"><MessageSquare className="h-4 w-4 mr-2" />Chat</TabsTrigger>
          <TabsTrigger value="alertas" className="data-[state=active]:bg-muted data-[state=active]:shadow-none rounded-full px-4 py-2 border border-transparent data-[state=active]:border-border"><AlertTriangle className="h-4 w-4 mr-2" />Alertas</TabsTrigger>
          <TabsTrigger value="whatsapp" className="data-[state=active]:bg-muted data-[state=active]:shadow-none rounded-full px-4 py-2 border border-transparent data-[state=active]:border-border"><PhoneForwarded className="h-4 w-4 mr-2" />WhatsApp</TabsTrigger>
          <TabsTrigger value="proyeccion" className="data-[state=active]:bg-muted data-[state=active]:shadow-none rounded-full px-4 py-2 border border-transparent data-[state=active]:border-border"><TrendingUp className="h-4 w-4 mr-2" />Proyección</TabsTrigger>
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
      </Tabs>
    </div>
  )
}

// ─── CHAT ─────────────────────────────────────────────────────────────────────

function ChatSection({ authHeaders }: { authHeaders: () => HeadersInit }) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const scrollEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetch("/api/ai/chat?limit=30", { headers: authHeaders() })
      .then(r => r.json())
      .then(d => { if (d.success) setMessages(d.data) })
      .catch(() => {})
  }, [authHeaders])

  useEffect(() => {
    scrollEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || loading) return
    const userMsg: ChatMessage = { role: "user", content: text.trim() }
    setMessages(prev => [...prev, userMsg])
    setInput("")
    setLoading(true)

    try {
      const historial = messages.slice(-10).map(m => ({ role: m.role, content: m.content }))
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({ mensaje: text.trim(), historial }),
      })
      const data = await res.json()
      setMessages(prev => [...prev, {
        role: "assistant",
        content: data.data?.respuesta ?? (data.error ?? "No pude procesar tu consulta."),
      }])
    } catch {
      setMessages(prev => [...prev, { role: "assistant", content: "Error de conexión. Intentá de nuevo." }])
    } finally {
      setLoading(false)
    }
  }, [loading, messages, authHeaders])

  return (
    <Card className="flex flex-col h-[calc(100vh-280px)] min-h-[500px]">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Bot className="h-5 w-5" />
          Chat con tu negocio
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col gap-3 overflow-hidden">
        <div className="flex flex-wrap gap-2">
          {QUICK_ACTIONS.map(action => (
            <Button key={action.label} variant="outline" size="sm" className="rounded-full"
              onClick={() => sendMessage(action.label)} disabled={loading}>
              <action.icon className="h-3 w-3 mr-1" />
              {action.label}
            </Button>
          ))}
        </div>

        <ScrollArea className="flex-1 min-h-0 pr-2">
          <div className="flex flex-col gap-3">
            {messages.length === 0 && (
              <div className="text-center text-muted-foreground py-12">
                <Bot className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p>Preguntame lo que quieras sobre tu negocio.</p>
                <p className="text-xs mt-1">Conozco tus ventas, stock, clientes y más.</p>
              </div>
            )}
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm whitespace-pre-wrap shadow-sm ${
                  msg.role === "user" ? "bg-zinc-900 text-zinc-50 dark:bg-zinc-100 dark:text-zinc-900" : "bg-background border border-border"
                }`}>
                  {msg.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-muted rounded-lg px-4 py-2 text-sm flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Pensando...
                </div>
              </div>
            )}
            <div ref={scrollEndRef} />
          </div>
        </ScrollArea>

        <form className="flex gap-2" onSubmit={e => { e.preventDefault(); sendMessage(input) }}>
          <Input
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Preguntá algo sobre tu negocio..."
            disabled={loading}
            className="flex-1"
            maxLength={2000}
          />
          <Button type="submit" size="icon" disabled={loading || !input.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

// ─── ALERTAS ──────────────────────────────────────────────────────────────────

function AlertasSection({ authHeaders }: { authHeaders: () => HeadersInit }) {
  const [alertas, setAlertas] = useState<Alerta[]>([])
  const [loading, setLoading] = useState(false)
  const [generating, setGenerating] = useState(false)

  const fetchAlertas = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/ai/alertas?no_leidas=false", { headers: authHeaders() })
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

  const markResolved = async (id: number) => {
    await fetch("/api/ai/alertas", {
      method: "PATCH",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify({ id, resuelta: true, leida: true }),
    })
    setAlertas(prev => prev.filter(a => a.id !== id))
  }

  const priColor: Record<string, string> = {
    alta: "text-red-500", media: "text-yellow-500", baja: "text-green-500",
  }
  const priBadge: Record<string, "destructive" | "secondary" | "outline"> = {
    alta: "destructive", media: "secondary", baja: "outline",
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Alertas del día</h2>
        <Button size="sm" onClick={generateNew} disabled={generating}>
          {generating ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Sparkles className="h-4 w-4 mr-1" />}
          Generar alertas
        </Button>
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
                </div>
                <Button variant="ghost" size="icon" onClick={() => markResolved(alerta.id)} title="Marcar como resuelta">
                  <Check className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
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
