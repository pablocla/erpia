"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import {
  Bot, Send, X, Sparkles, AlertTriangle, Loader2,
  TrendingUp, Clock, Minimize2, Maximize2,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useUIStore } from "@/lib/stores/ui-store"

/* ═══════════════════════════════════════════════════════════════════════════
   FLOATING CHAT WIDGET — Persistente sobre todas las páginas
   Se abre/cierra desde topbar (Sparkles) o keyboard shortcut (Ctrl+Shift+I)
   ═══════════════════════════════════════════════════════════════════════════ */

interface ChatMessage {
  id?: number
  role: "user" | "assistant"
  content: string
  createdAt?: string
}

const QUICK_ACTIONS = [
  { label: "¿Cómo estoy hoy?", icon: Sparkles },
  { label: "¿Qué repongo?", icon: AlertTriangle },
  { label: "¿Quién me debe?", icon: Clock },
  { label: "Dame el reporte", icon: TrendingUp },
]

export function ChatWidget() {
  const chatOpen = useUIStore((s) => s.chatWidgetOpen)
  const setChatOpen = useUIStore((s) => s.setChatWidgetOpen)

  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [expanded, setExpanded] = useState(false)
  const [historyLoaded, setHistoryLoaded] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const authHeaders = useCallback((): HeadersInit => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null
    return token ? { Authorization: `Bearer ${token}` } : {}
  }, [])

  // Keyboard shortcut: Ctrl+Shift+I
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === "I") {
        e.preventDefault()
        setChatOpen(!chatOpen)
      }
      if (e.key === "Escape" && chatOpen) {
        setChatOpen(false)
      }
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [chatOpen, setChatOpen])

  // Load history once when first opened
  useEffect(() => {
    if (!chatOpen || historyLoaded) return
    fetch("/api/ai/chat?limit=20", { headers: authHeaders() })
      .then((r) => (r.ok ? r.json() : Promise.reject(r.statusText)))
      .then((d) => {
        if (d.success) setMessages(d.data)
      })
      .catch(() => {})
      .finally(() => setHistoryLoaded(true))
  }, [chatOpen, historyLoaded, authHeaders])

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, loading])

  // Focus input when opened
  useEffect(() => {
    if (chatOpen) {
      setTimeout(() => inputRef.current?.focus(), 150)
    }
  }, [chatOpen])

  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim() || loading) return
      const userMsg: ChatMessage = { role: "user", content: text.trim() }
      setMessages((prev) => [...prev, userMsg])
      setInput("")
      setLoading(true)
      setError(null)

      try {
        const historial = messages.slice(-10).map((m) => ({ role: m.role, content: m.content }))
        const res = await fetch("/api/ai/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json", ...authHeaders() },
          body: JSON.stringify({ mensaje: text.trim(), historial }),
        })
        const data = await res.json()
        if (!res.ok) {
          setError(data.error || `Error ${res.status}`)
          setLoading(false)
          return
        }
        const assistantMsg: ChatMessage = {
          role: "assistant",
          content: data.data?.respuesta ?? data.respuesta ?? "No pude procesar tu consulta.",
        }
        setMessages((prev) => [...prev, assistantMsg])
      } catch {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: "Error de conexión. Intentá de nuevo." },
        ])
      } finally {
        setLoading(false)
      }
    },
    [loading, messages, authHeaders],
  )

  if (!chatOpen) return null

  return (
    <div
      className={cn(
        "fixed z-50 flex flex-col bg-background border border-border rounded-xl shadow-2xl transition-all duration-200",
        expanded
          ? "bottom-4 right-4 w-[560px] h-[700px] max-h-[85vh]"
          : "bottom-4 right-4 w-[380px] h-[520px] max-h-[75vh]",
        "max-w-[calc(100vw-2rem)]",
      )}
    >
      {/* ── Header ── */}
      <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/30 rounded-t-xl shrink-0">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Bot className="h-5 w-5 text-primary" />
            <span className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full bg-green-500 ring-2 ring-background" />
          </div>
          <div>
            <span className="font-semibold text-sm">Asistente IA</span>
            <Badge variant="secondary" className="ml-2 text-[10px] px-1.5 py-0">
              Online
            </Badge>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 hover:text-destructive"
            onClick={() => setChatOpen(false)}
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* ── Quick actions ── */}
      {messages.length === 0 && (
        <div className="px-4 pt-3 pb-1 shrink-0">
          <p className="text-xs text-muted-foreground mb-2">Acciones rápidas</p>
          <div className="flex flex-wrap gap-1.5">
            {QUICK_ACTIONS.map((action) => (
              <Button
                key={action.label}
                variant="outline"
                size="sm"
                className="text-xs h-7 px-2.5"
                onClick={() => sendMessage(action.label)}
                disabled={loading}
              >
                <action.icon className="h-3 w-3 mr-1" />
                {action.label}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* ── Messages ── */}
      <div className="flex-1 min-h-0 overflow-hidden">
        <ScrollArea ref={scrollRef} className="h-full px-4 py-3">
          <div className="flex flex-col gap-3">
            {messages.length === 0 && (
              <div className="text-center text-muted-foreground py-8">
                <Bot className="h-10 w-10 mx-auto mb-2 opacity-30" />
                <p className="text-sm">Preguntame lo que quieras sobre tu negocio.</p>
                <p className="text-xs mt-1 text-muted-foreground/70">
                  Conozco tus ventas, stock, clientes y más.
                </p>
                <p className="text-[10px] mt-3 text-muted-foreground/50">
                  Ctrl+Shift+I para abrir/cerrar · Esc para cerrar
                </p>
              </div>
            )}
            {messages.map((msg, i) => (
              <div
                key={i}
                className={cn("flex", msg.role === "user" ? "justify-end" : "justify-start")}
              >
                <div
                  className={cn(
                    "max-w-[85%] rounded-lg px-3 py-2 text-sm whitespace-pre-wrap",
                    msg.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted",
                  )}
                >
                  {msg.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-muted rounded-lg px-3 py-2 text-sm flex items-center gap-2">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Pensando...
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      </div>

      {/* ── Error ── */}
      {error && (
        <div className="mx-4 mb-2 flex items-center gap-2 text-xs text-destructive bg-destructive/10 rounded-lg px-3 py-2">
          <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
          <span className="flex-1 truncate">{error}</span>
          <Button variant="ghost" size="sm" onClick={() => setError(null)} className="h-5 px-1.5">
            <X className="h-3 w-3" />
          </Button>
        </div>
      )}

      {/* ── Input ── */}
      <form
        className="flex gap-2 px-4 py-3 border-t shrink-0"
        onSubmit={(e) => {
          e.preventDefault()
          sendMessage(input)
        }}
      >
        <Input
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Preguntá algo..."
          disabled={loading}
          className="flex-1 h-9 text-sm"
          maxLength={2000}
        />
        <Button type="submit" size="icon" className="h-9 w-9" disabled={loading || !input.trim()}>
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  )
}
