"use client"

import { useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Bot, X, Minimize2, Maximize2,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useUIStore } from "@/lib/stores/ui-store"
import { AiChatPanel } from "@/components/ia/ai-chat-panel"
import { useState } from "react"

export function ChatWidget() {
  const chatOpen = useUIStore((s) => s.chatWidgetOpen)
  const setChatOpen = useUIStore((s) => s.setChatWidgetOpen)
  const [expanded, setExpanded] = useState(false)

  const authHeaders = useCallback((): HeadersInit => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null
    return token ? { Authorization: `Bearer ${token}` } : {}
  }, [])

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

  useEffect(() => {
    if (!chatOpen) return
    const prev = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => { document.body.style.overflow = prev }
  }, [chatOpen])

  if (!chatOpen) return null

  return (
    <>
      <div
        className="fixed inset-0 z-[59] bg-black/40 sm:bg-transparent sm:pointer-events-none"
        aria-hidden
        onClick={() => setChatOpen(false)}
      />
      <div
        className={cn(
          "fixed z-[60] flex flex-col bg-background border border-border shadow-2xl transition-all duration-200",
          "inset-0 rounded-none sm:inset-auto sm:bottom-20 sm:right-4 sm:rounded-xl",
          expanded
            ? "sm:w-[min(560px,calc(100vw-2rem))] sm:h-[min(700px,85dvh)]"
            : "sm:w-[min(400px,calc(100vw-2rem))] sm:h-[min(560px,80dvh)]",
        )}
        role="dialog"
        aria-label="Asistente IA"
      >
      <AiChatPanel
        variant="widget"
        authHeaders={authHeaders}
        showCapabilitiesSidebar={false}
        className="h-full rounded-none sm:rounded-xl overflow-hidden"
        header={(
          <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/30 shrink-0">
            <div className="flex items-center gap-2 min-w-0">
              <div className="relative shrink-0">
                <Bot className="h-5 w-5 text-primary" />
                <span className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full bg-green-500 ring-2 ring-background" />
              </div>
              <div className="min-w-0">
                <span className="font-semibold text-sm block truncate">Asistente IA</span>
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0 mt-0.5">
                  Ctrl+Shift+I
                </Badge>
              </div>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 hidden sm:inline-flex"
                onClick={() => setExpanded(!expanded)}
                aria-label={expanded ? "Reducir chat" : "Expandir chat"}
              >
                {expanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 hover:text-destructive"
                onClick={() => setChatOpen(false)}
                aria-label="Cerrar asistente"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      />
      </div>
    </>
  )
}