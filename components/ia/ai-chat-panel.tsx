"use client"

import {
  useState, useEffect, useRef, useCallback, useLayoutEffect, type ReactNode,
} from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import {
  Bot, Send, AlertTriangle, Loader2, User, Info, ChevronDown,
} from "lucide-react"
import { cn } from "@/lib/utils"
import {
  AI_QUICK_ACTIONS,
  AI_EXAMPLE_PROMPTS,
  AI_FOLLOW_UPS,
  type ChatMessage,
} from "./ai-chat-constants"
import { AiCapabilitiesPanel } from "./ai-capabilities-panel"
import { AiMessageContent } from "./ai-message-content"


export interface AiChatPanelProps {
  variant?: "page" | "widget"
  authHeaders: () => HeadersInit
  header?: ReactNode
  className?: string
  showCapabilitiesSidebar?: boolean
}

function formatTime(iso?: string) {
  if (!iso) return null
  try {
    return new Date(iso).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })
  } catch {
    return null
  }
}

export function AiChatPanel({
  variant = "page",
  authHeaders,
  header,
  className,
  showCapabilitiesSidebar = variant === "page",
}: AiChatPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [historyLoaded, setHistoryLoaded] = useState(false)
  const [showHelp, setShowHelp] = useState(false)
  const [stickToBottom, setStickToBottom] = useState(true)

  const scrollRef = useRef<HTMLDivElement>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const formRef = useRef<HTMLFormElement>(null)

  const scrollToBottom = useCallback((behavior: ScrollBehavior = "smooth") => {
    const container = scrollRef.current
    if (container) {
      container.scrollTo({ top: container.scrollHeight, behavior })
    }
    bottomRef.current?.scrollIntoView({ behavior, block: "end" })
  }, [])

  const handleScroll = useCallback(() => {
    const container = scrollRef.current
    if (!container) return
    const distance = container.scrollHeight - container.scrollTop - container.clientHeight
    setStickToBottom(distance < 96)
  }, [])

  useEffect(() => {
    fetch("/api/ai/chat?limit=30", { headers: authHeaders() })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) => { if (d.success) setMessages(d.data ?? []) })
      .catch(() => {})
      .finally(() => setHistoryLoaded(true))
  }, [authHeaders])

  useLayoutEffect(() => {
    if (!stickToBottom) return
    scrollToBottom(messages.length <= 1 ? "auto" : "smooth")
  }, [messages, loading, stickToBottom, scrollToBottom])

  useLayoutEffect(() => {
    const ta = textareaRef.current
    if (!ta) return
    ta.style.height = "auto"
    ta.style.height = `${Math.min(ta.scrollHeight, 128)}px`
    if (stickToBottom) scrollToBottom("auto")
  }, [input, stickToBottom, scrollToBottom])

  useEffect(() => {
    const container = scrollRef.current
    if (!container) return

    const observer = new ResizeObserver(() => {
      if (stickToBottom) scrollToBottom("auto")
    })
    observer.observe(container)
    if (formRef.current) observer.observe(formRef.current)

    return () => observer.disconnect()
  }, [stickToBottom, scrollToBottom])

  const sendMessage = useCallback(async (text: string) => {
    const trimmed = text.trim()
    if (!trimmed || loading) return

    const userMsg: ChatMessage = { role: "user", content: trimmed }
    setStickToBottom(true)
    setMessages((prev) => [...prev, userMsg])
    setInput("")
    setLoading(true)
    setError(null)

    try {
      const historial = messages.slice(-10).map((m) => ({ role: m.role, content: m.content }))
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({ mensaje: trimmed, historial }),
      })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error ?? `Error ${res.status}`)
        return
      }

      setMessages((prev) => [...prev, {
        role: "assistant",
        content: data.data?.respuesta ?? data.respuesta ?? "No pude procesar tu consulta.",
      }])
    } catch {
      setMessages((prev) => [...prev, {
        role: "assistant",
        content: "Error de conexión. Intentá de nuevo.",
      }])
    } finally {
      setLoading(false)
      textareaRef.current?.focus()
    }
  }, [loading, messages, authHeaders, scrollToBottom])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      sendMessage(input)
    }
  }

  const chatColumn = (
    <div
      className={cn(
        "flex flex-col min-h-0 bg-background",
        variant === "page" ? "rounded-xl border border-border shadow-sm" : "h-full",
        className,
      )}
    >
      {header}

      {/* Quick actions — siempre visibles, scroll horizontal en móvil */}
      <div className="shrink-0 border-b border-border/60 px-3 py-2 sm:px-4">
        <div className="flex items-center justify-between gap-2 mb-2">
          <p className="text-xs text-muted-foreground font-medium">Acciones rápidas</p>
          {variant === "widget" && (
            <Button
              variant="ghost"
              size="sm"
              className={cn("h-7 text-xs gap-1", showHelp && "text-primary bg-primary/10")}
              onClick={() => {
                const next = !showHelp
                setShowHelp(next)
                if (next) {
                  setTimeout(() => scrollRef.current?.scrollTo({ top: 0, behavior: "smooth" }), 50)
                }
              }}
            >
              <Info className="h-3.5 w-3.5" />
              {showHelp ? "Ocultar ayuda" : "Qué puede hacer"}
            </Button>
          )}
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
          {AI_QUICK_ACTIONS.map((action) => (
            <Button
              key={action.label}
              variant="outline"
              size="sm"
              className="rounded-full shrink-0 h-8 text-xs"
              onClick={() => sendMessage(action.label)}
              disabled={loading}
            >
              <action.icon className="h-3 w-3 mr-1.5" />
              {action.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Mensajes — scroll nativo (fix auto-scroll) */}
      <div className="relative flex-1 min-h-0 flex flex-col">
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 min-h-0 overflow-y-auto overscroll-contain scroll-smooth px-3 py-4 sm:px-4"
        aria-live="polite"
        aria-relevant="additions"
      >
        {/* Panel de ayuda — dentro del scroll para no empujar el input */}
        {showHelp && variant === "widget" && (
          <div className="mb-4 border border-dashed border-border/80 rounded-xl p-3 bg-muted/20">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Info className="h-3.5 w-3.5 text-primary" />
                Capacidades del asistente
              </h4>
              <Button variant="ghost" size="sm" className="h-6 px-2 text-[10px]" onClick={() => setShowHelp(false)}>
                Ocultar
              </Button>
            </div>
            <AiCapabilitiesPanel compact onSelectPrompt={sendMessage} />
          </div>
        )}

        {!historyLoaded && (
          <div className="flex justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        )}

        {historyLoaded && messages.length === 0 && (
          <div className="flex flex-col items-center text-center py-8 sm:py-12 px-2">
            <div className="rounded-2xl bg-primary/10 p-4 mb-4">
              <Bot className="h-10 w-10 text-primary" />
            </div>
            <h3 className="font-semibold text-base">Asistente de negocio</h3>
            <p className="text-sm text-muted-foreground mt-2 max-w-md">
              Preguntá en lenguaje natural. Uso los datos de ventas, stock, clientes y caja de tu empresa.
            </p>
            <div className="mt-6 grid gap-2 w-full max-w-lg sm:grid-cols-2">
              {AI_EXAMPLE_PROMPTS.map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => sendMessage(q)}
                  className="text-left text-sm rounded-lg border px-3 py-2.5 hover:bg-muted/50 transition-colors"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="flex flex-col gap-4">
          {messages.map((msg, i) => {
            const isUser = msg.role === "user"
            const time = formatTime(msg.createdAt)
            return (
              <div
                key={msg.id ?? `msg-${i}`}
                className={cn("flex gap-2.5", isUser ? "flex-row-reverse" : "flex-row")}
              >
                <div
                  className={cn(
                    "shrink-0 h-8 w-8 rounded-full flex items-center justify-center",
                    isUser ? "bg-primary text-primary-foreground" : "bg-muted border border-border",
                  )}
                >
                  {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4 text-primary" />}
                </div>
                <div className={cn("flex flex-col gap-1 max-w-[min(85%,32rem)]", isUser && "items-end")}>
                  <div
                    className={cn(
                      "rounded-2xl px-4 py-2.5 text-sm whitespace-pre-wrap leading-relaxed",
                      isUser
                        ? "bg-primary text-primary-foreground rounded-tr-md"
                        : "bg-muted/80 border border-border/60 rounded-tl-md",
                    )}
                  >
                    {isUser ? msg.content : <AiMessageContent content={msg.content} />}
                  </div>
                  {time && (
                    <span className="text-[10px] text-muted-foreground px-1">{time}</span>
                  )}
                  {!isUser && !loading && i === messages.length - 1 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {AI_FOLLOW_UPS.map((q) => (
                        <button
                          key={q}
                          type="button"
                          onClick={() => sendMessage(q)}
                          className="text-[11px] rounded-full border border-border/80 bg-background px-2.5 py-1 hover:bg-muted/60 transition-colors"
                        >
                          {q}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )
          })}

          {loading && (
            <div className="flex gap-2.5">
              <div className="h-8 w-8 rounded-full bg-muted border flex items-center justify-center shrink-0">
                <Bot className="h-4 w-4 text-primary" />
              </div>
              <div className="bg-muted/80 border border-border/60 rounded-2xl rounded-tl-md px-4 py-3 text-sm flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
                Analizando tu negocio...
              </div>
            </div>
          )}
          <div ref={bottomRef} className="h-px shrink-0" aria-hidden />
        </div>
      </div>

      {!stickToBottom && messages.length > 0 && (
        <Button
          type="button"
          variant="secondary"
          size="icon"
          className="absolute bottom-2 right-4 h-8 w-8 rounded-full shadow-md z-10"
          onClick={() => { setStickToBottom(true); scrollToBottom("smooth") }}
          aria-label="Ir al último mensaje"
        >
          <ChevronDown className="h-4 w-4" />
        </Button>
      )}
      </div>

      {error && (
        <div className="mx-3 sm:mx-4 mb-2 flex items-start gap-2 text-xs text-destructive bg-destructive/10 rounded-lg px-3 py-2 shrink-0">
          <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
          <span className="flex-1">{error}</span>
          <Button variant="ghost" size="sm" className="h-6 px-2" onClick={() => setError(null)}>
            Cerrar
          </Button>
        </div>
      )}

      {/* Input fijo abajo */}
      <form
        ref={formRef}
        className="shrink-0 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 px-3 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:px-4 sm:pb-3"
        onSubmit={(e) => { e.preventDefault(); sendMessage(input) }}
      >
        <div className="flex gap-2 items-end">
          <Textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Escribí tu consulta… Enter envía, Shift+Enter nueva línea"
            disabled={loading}
            rows={variant === "widget" ? 2 : 2}
            className="flex-1 min-h-[44px] max-h-32 resize-none text-sm"
            maxLength={2000}
          />
          <Button
            type="submit"
            size="icon"
            className="h-11 w-11 shrink-0"
            disabled={loading || !input.trim()}
            aria-label="Enviar mensaje"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex items-center justify-between gap-2 mt-2">
          <p className="text-[10px] text-muted-foreground">
            {variant === "widget"
              ? "Datos de tu empresa · no reemplaza asesoramiento fiscal"
              : "La IA usa datos de tu empresa. No reemplaza decisiones fiscales ni contables."}
          </p>
          {input.length > 0 && (
            <span className="text-[10px] text-muted-foreground tabular-nums shrink-0">
              {input.length}/2000
            </span>
          )}
        </div>
      </form>
    </div>
  )

  if (!showCapabilitiesSidebar) {
    return chatColumn
  }

  return (
    <div className="space-y-4 min-h-0">
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_280px] lg:gap-6 min-h-0">
        <div className={cn("flex flex-col min-h-0", variant === "page" && "h-[min(720px,calc(100dvh-12rem))] min-h-[420px] sm:min-h-[480px]")}>
          {chatColumn}
        </div>
        <aside className="hidden lg:block overflow-y-auto max-h-[720px] pr-1 sticky top-4 self-start">
          <AiCapabilitiesPanel onSelectPrompt={sendMessage} />
        </aside>
      </div>
      <div className="lg:hidden">
        <AiCapabilitiesPanel onSelectPrompt={sendMessage} />
      </div>
    </div>
  )
}