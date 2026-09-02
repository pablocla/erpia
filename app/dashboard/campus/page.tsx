/**
 * MetaSwarm Campus 2D — Main Page
 *
 * This is the MMORPG-style campus where the business owner walks around
 * their virtual office and interacts with AI agent NPCs in real-time.
 *
 * Route: /dashboard/campus
 */
"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import Link from "next/link"
import { useCampusStore, type CampusAgent, type CampusAgentStatus } from "@/lib/stores/campus-store"

// ─── Constants ──────────────────────────────────────────────────────────────────

const CANVAS_W = 960
const CANVAS_H = 640
const TILE = 32
const AGENT_SIZE = 28
const PLAYER_SPEED = 3

const EDIFICIO_COLORS: Record<string, { bg: string; border: string; label: string }> = {
  "Ventas":    { bg: "#1a2744", border: "#3b82f6", label: "🏢 VENTAS" },
  "Finanzas":  { bg: "#1a2e1a", border: "#22c55e", label: "🏦 FINANZAS" },
  "Depósito":  { bg: "#2e1a2e", border: "#a855f7", label: "📦 DEPÓSITO" },
}

const STATUS_COLORS: Record<CampusAgentStatus, string> = {
  idle: "#6b7280",
  working: "#22c55e",
  thinking: "#eab308",
  blocked: "#ef4444",
  error: "#ef4444",
}

const STATUS_GLOW: Record<CampusAgentStatus, string> = {
  idle: "transparent",
  working: "rgba(34,197,94,0.4)",
  thinking: "rgba(234,179,8,0.4)",
  blocked: "rgba(239,68,68,0.6)",
  error: "rgba(239,68,68,0.6)",
}

// ─── Types ──────────────────────────────────────────────────────────────────────

interface PlayerState {
  x: number
  y: number
}

interface Bubble {
  agentId: string
  text: string
  expiresAt: number
}

// ─── Component ──────────────────────────────────────────────────────────────────

export default function CampusPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const playerRef = useRef<PlayerState>({ x: 480, y: 320 })
  const keysRef = useRef<Set<string>>(new Set())
  const bubblesRef = useRef<Bubble[]>([])
  const animFrameRef = useRef<number>(0)
  const pulseRef = useRef(0)

  const {
    agents, selectedAgentId, agentLogs, metrics,
    showPanel, notifications,
    selectAgent, updateAgentStatus, addLog, updateMetrics,
    addNotification, dismissNotification,
  } = useCampusStore()

  const [instruction, setInstruction] = useState("")
  const [loaded, setLoaded] = useState(false)
  const [showVoiceModal, setShowVoiceModal] = useState(false)
  const [selectedVoiceSample, setSelectedVoiceSample] = useState(0)
  const [voiceProcessing, setVoiceProcessing] = useState(false)

  // ─── Fetch agent status from API ────────────────────────────────────────────
  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/campus/agents/status")
      if (!res.ok) return
      const data = await res.json()
      // Update each agent's status
      for (const a of data.agents) {
        updateAgentStatus(a.id, a.estado, a.tareaActual)
      }
      updateMetrics(data.metrics)
    } catch {
      // Silently fail — campus still works with local state
    }
  }, [updateAgentStatus, updateMetrics])

  useEffect(() => {
    fetchStatus()
    const interval = setInterval(fetchStatus, 5000) // Poll every 5s
    return () => clearInterval(interval)
  }, [fetchStatus])

  // ─── Simulate agent activity ────────────────────────────────────────────────
  useEffect(() => {
    const demoInterval = setInterval(() => {
      const randomAgent = agents[Math.floor(Math.random() * agents.length)]
      const actions = [
        { estado: "working" as const, tarea: "Enviando recordatorio de fiado por WhatsApp...", bubble: "💬 Enviando mensaje..." },
        { estado: "thinking" as const, tarea: "Analizando stock bajo mínimo...", bubble: "💭 Calculando reposición..." },
        { estado: "working" as const, tarea: "Generando factura con CAE...", bubble: "📄 Emitiendo factura AFIP..." },
        { estado: "working" as const, tarea: "Cobro recibido $12.500 por MercadoPago", bubble: "💰 ¡Cobro recibido!" },
        { estado: "thinking" as const, tarea: "Calificando nuevo lead...", bubble: "🎯 Evaluando lead..." },
      ]
      const action = actions[Math.floor(Math.random() * actions.length)]

      updateAgentStatus(randomAgent.id, action.estado, action.tarea)
      bubblesRef.current = [
        ...bubblesRef.current.filter((b) => b.agentId !== randomAgent.id),
        { agentId: randomAgent.id, text: action.bubble, expiresAt: Date.now() + 4000 },
      ]

      addLog({
        timestamp: new Date().toLocaleTimeString("es-AR"),
        tipo: action.bubble.includes("Cobro") ? "COBRO" : "TAREA",
        mensaje: `${randomAgent.nombre}: ${action.tarea}`,
        tokens: Math.floor(Math.random() * 200) + 50,
        costoUSD: Math.random() * 0.002,
      })

      // Reset to idle after a delay
      setTimeout(() => {
        updateAgentStatus(randomAgent.id, "idle", "Esperando tarea...")
      }, 3000 + Math.random() * 2000)
    }, 4000)

    return () => clearInterval(demoInterval)
  }, [agents, updateAgentStatus, addLog])

  // ─── Keyboard handlers ──────────────────────────────────────────────────────
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return
      keysRef.current.add(e.key.toLowerCase())
    }
    const up = (e: KeyboardEvent) => {
      keysRef.current.delete(e.key.toLowerCase())
    }
    window.addEventListener("keydown", down)
    window.addEventListener("keyup", up)
    return () => {
      window.removeEventListener("keydown", down)
      window.removeEventListener("keyup", up)
    }
  }, [])

  // ─── Canvas game loop ───────────────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return
    setLoaded(true)

    function gameLoop() {
      if (!ctx || !canvas) return
      const keys = keysRef.current
      const player = playerRef.current
      pulseRef.current += 0.05

      // ─── Move player ─────────────────────────
      if (keys.has("w") || keys.has("arrowup"))    player.y = Math.max(20, player.y - PLAYER_SPEED)
      if (keys.has("s") || keys.has("arrowdown"))  player.y = Math.min(CANVAS_H - 20, player.y + PLAYER_SPEED)
      if (keys.has("a") || keys.has("arrowleft"))  player.x = Math.max(20, player.x - PLAYER_SPEED)
      if (keys.has("d") || keys.has("arrowright")) player.x = Math.min(CANVAS_W - 20, player.x + PLAYER_SPEED)

      // ─── Clear canvas ─────────────────────────
      ctx.fillStyle = "#0f0f1a"
      ctx.fillRect(0, 0, CANVAS_W, CANVAS_H)

      // ─── Draw grid (subtle) ───────────────────
      ctx.strokeStyle = "rgba(255,255,255,0.03)"
      ctx.lineWidth = 1
      for (let x = 0; x < CANVAS_W; x += TILE) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, CANVAS_H); ctx.stroke()
      }
      for (let y = 0; y < CANVAS_H; y += TILE) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(CANVAS_W, y); ctx.stroke()
      }

      // ─── Draw buildings ───────────────────────
      const buildings = [
        { name: "Ventas",   x: 40,  y: 40,  w: 280, h: 560 },
        { name: "Finanzas", x: 340, y: 40,  w: 280, h: 280 },
        { name: "Depósito", x: 340, y: 340, w: 280, h: 260 },
      ]

      for (const b of buildings) {
        const colors = EDIFICIO_COLORS[b.name]
        if (!colors) continue

        // Building background
        ctx.fillStyle = colors.bg
        ctx.fillRect(b.x, b.y, b.w, b.h)

        // Building border
        ctx.strokeStyle = colors.border
        ctx.lineWidth = 2
        ctx.strokeRect(b.x, b.y, b.w, b.h)

        // Building label
        ctx.fillStyle = colors.border
        ctx.font = "bold 14px 'Inter', system-ui, sans-serif"
        ctx.fillText(colors.label, b.x + 10, b.y + 22)

        // Floor separator lines
        ctx.strokeStyle = "rgba(255,255,255,0.1)"
        ctx.lineWidth = 1
        ctx.setLineDash([4, 4])
        if (b.name === "Ventas") {
          ctx.beginPath(); ctx.moveTo(b.x, b.y + 187); ctx.lineTo(b.x + b.w, b.y + 187); ctx.stroke()
          ctx.beginPath(); ctx.moveTo(b.x, b.y + 374); ctx.lineTo(b.x + b.w, b.y + 374); ctx.stroke()
          // Floor labels
          ctx.fillStyle = "rgba(255,255,255,0.3)"
          ctx.font = "11px 'Inter', system-ui, sans-serif"
          ctx.fillText("P1: WhatsApp & Cobros", b.x + 10, b.y + 42)
          ctx.fillText("P2: E-commerce & B2B", b.x + 10, b.y + 207)
          ctx.fillText("P3: CRM & Agenda", b.x + 10, b.y + 394)
        }
        if (b.name === "Finanzas") {
          ctx.beginPath(); ctx.moveTo(b.x, b.y + 140); ctx.lineTo(b.x + b.w, b.y + 140); ctx.stroke()
          ctx.fillStyle = "rgba(255,255,255,0.3)"
          ctx.font = "11px 'Inter', system-ui, sans-serif"
          ctx.fillText("P1: AFIP & CAE", b.x + 10, b.y + 42)
          ctx.fillText("P2: Caja & CxC", b.x + 10, b.y + 162)
        }
        if (b.name === "Depósito") {
          ctx.fillStyle = "rgba(255,255,255,0.3)"
          ctx.font = "11px 'Inter', system-ui, sans-serif"
          ctx.fillText("P1: Stock & Reposición", b.x + 10, b.y + 42)
        }
        ctx.setLineDash([])
      }

      // ─── Draw desks (small furniture) ─────────
      ctx.fillStyle = "rgba(255,255,255,0.08)"
      const desks = [
        // Ventas P1
        { x: 100, y: 100, w: 50, h: 24 }, { x: 200, y: 100, w: 50, h: 24 },
        // Finanzas P1
        { x: 400, y: 100, w: 50, h: 24 }, { x: 520, y: 100, w: 50, h: 24 },
        // Finanzas P2
        { x: 400, y: 240, w: 50, h: 24 },
        // Depósito
        { x: 400, y: 420, w: 50, h: 24 },
        // Ventas P3
        { x: 100, y: 480, w: 50, h: 24 }, { x: 200, y: 480, w: 50, h: 24 },
      ]
      for (const d of desks) {
        ctx.fillRect(d.x, d.y, d.w, d.h)
        ctx.strokeStyle = "rgba(255,255,255,0.12)"
        ctx.lineWidth = 1
        ctx.strokeRect(d.x, d.y, d.w, d.h)
      }

      // ─── Draw Torre Matriz (HUD zone) ─────────
      ctx.fillStyle = "#1a1a1a"
      ctx.fillRect(640, 40, 280, 560)
      ctx.strokeStyle = "#f59e0b"
      ctx.lineWidth = 2
      ctx.strokeRect(640, 40, 280, 560)
      ctx.fillStyle = "#f59e0b"
      ctx.font = "bold 14px 'Inter', system-ui, sans-serif"
      ctx.fillText("🗼 TORRE MATRIZ — CEO", 650, 62)

      // Metrics inside Torre Matriz
      const m = useCampusStore.getState().metrics
      const currentAgents = useCampusStore.getState().agents
      ctx.font = "12px 'Inter', system-ui, sans-serif"
      ctx.fillStyle = "#d1d5db"
      const metricLines = [
        `💰 Ventas Hoy: $${m.ventasHoy.toLocaleString("es-AR")}`,
        `📥 Cobros Hoy: $${m.cobrosHoy.toLocaleString("es-AR")}`,
        `🤖 Agentes Activos: ${currentAgents.filter((a) => a.estado !== "idle").length}/${currentAgents.length}`,
        `✅ Tareas Completadas: ${m.tareasCompletadas}`,
        `🔢 Tokens Hoy: ${m.tokensUsados.toLocaleString()}`,
        `💵 Costo IA: $${m.costoTotalUSD.toFixed(4)} USD`,
      ]
      metricLines.forEach((line, i) => {
        ctx.fillText(line, 660, 95 + i * 22)
      })

      // Agent roster in Torre Matriz
      ctx.fillStyle = "rgba(255,255,255,0.15)"
      ctx.fillRect(650, 250, 260, 2)
      ctx.fillStyle = "#f59e0b"
      ctx.font = "bold 12px 'Inter', system-ui, sans-serif"
      ctx.fillText("EQUIPO DE AGENTES", 660, 275)

      currentAgents.forEach((agent, i) => {
        const ay = 295 + i * 42
        const statusColor = STATUS_COLORS[agent.estado]

        // Status dot
        ctx.beginPath()
        ctx.arc(670, ay + 4, 5, 0, Math.PI * 2)
        ctx.fillStyle = statusColor
        ctx.fill()

        // Agent info
        ctx.fillStyle = "#e5e7eb"
        ctx.font = "bold 12px 'Inter', system-ui, sans-serif"
        ctx.fillText(`${agent.icono} ${agent.nombre}`, 682, ay + 8)
        ctx.fillStyle = "#9ca3af"
        ctx.font = "10px 'Inter', system-ui, sans-serif"
        ctx.fillText(agent.tareaActual ?? "Esperando tarea...", 682, ay + 22)
      })

      // ─── Draw agents on the map ───────────────
      // Clean expired bubbles
      bubblesRef.current = bubblesRef.current.filter((b) => b.expiresAt > Date.now())

      for (const agent of currentAgents) {
        const ax = agent.x
        const ay = agent.y
        const statusColor = STATUS_COLORS[agent.estado]
        const glow = STATUS_GLOW[agent.estado]
        const pulse = Math.sin(pulseRef.current * 2) * 0.3 + 0.7

        // Glow effect for active agents
        if (agent.estado !== "idle") {
          ctx.beginPath()
          ctx.arc(ax, ay, AGENT_SIZE + 8, 0, Math.PI * 2)
          ctx.fillStyle = glow.replace(/[\d.]+\)$/, `${pulse * 0.5})`)
          ctx.fill()
        }

        // Agent circle body
        ctx.beginPath()
        ctx.arc(ax, ay, AGENT_SIZE / 2, 0, Math.PI * 2)
        const grad = ctx.createRadialGradient(ax, ay, 0, ax, ay, AGENT_SIZE / 2)
        grad.addColorStop(0, statusColor)
        grad.addColorStop(1, "#111827")
        ctx.fillStyle = grad
        ctx.fill()
        ctx.strokeStyle = statusColor
        ctx.lineWidth = 2
        ctx.stroke()

        // Agent icon
        ctx.font = "16px serif"
        ctx.textAlign = "center"
        ctx.fillText(agent.icono, ax, ay + 6)

        // Agent name label
        ctx.font = "bold 10px 'Inter', system-ui, sans-serif"
        ctx.fillStyle = "#e5e7eb"
        ctx.fillText(agent.nombre, ax, ay + AGENT_SIZE / 2 + 14)

        // Level badge
        ctx.fillStyle = statusColor
        ctx.font = "bold 8px 'Inter', system-ui, sans-serif"
        ctx.fillText(`Lv.${agent.nivel}`, ax, ay - AGENT_SIZE / 2 - 6)

        // Speech bubble
        const bubble = bubblesRef.current.find((b) => b.agentId === agent.id)
        if (bubble) {
          const bx = ax
          const by = ay - AGENT_SIZE - 20
          const textWidth = ctx.measureText(bubble.text).width + 16
          const bubbleW = Math.min(textWidth, 160)

          // Bubble background
          ctx.fillStyle = "rgba(15,15,26,0.92)"
          ctx.strokeStyle = statusColor
          ctx.lineWidth = 1
          const bubbleX = bx - bubbleW / 2
          roundRect(ctx, bubbleX, by - 12, bubbleW, 20, 6)
          ctx.fill()
          ctx.stroke()

          // Bubble text
          ctx.fillStyle = "#e5e7eb"
          ctx.font = "10px 'Inter', system-ui, sans-serif"
          ctx.fillText(bubble.text, bx, by + 2)
        }

        ctx.textAlign = "start" // Reset
      }

      // ─── Draw player ──────────────────────────
      const px = player.x
      const py = player.y

      // Player glow
      ctx.beginPath()
      ctx.arc(px, py, 18, 0, Math.PI * 2)
      ctx.fillStyle = "rgba(59,130,246,0.2)"
      ctx.fill()

      // Player body
      ctx.beginPath()
      ctx.arc(px, py, 12, 0, Math.PI * 2)
      const pGrad = ctx.createRadialGradient(px, py, 0, px, py, 12)
      pGrad.addColorStop(0, "#60a5fa")
      pGrad.addColorStop(1, "#1e40af")
      ctx.fillStyle = pGrad
      ctx.fill()
      ctx.strokeStyle = "#93c5fd"
      ctx.lineWidth = 2
      ctx.stroke()

      // Player icon
      ctx.font = "12px serif"
      ctx.textAlign = "center"
      ctx.fillText("👤", px, py + 4)
      ctx.fillStyle = "#93c5fd"
      ctx.font = "bold 9px 'Inter', system-ui, sans-serif"
      ctx.fillText("TÚ", px, py + 22)
      ctx.textAlign = "start"

      // ─── Controls hint ────────────────────────
      ctx.fillStyle = "rgba(255,255,255,0.15)"
      ctx.font = "11px 'Inter', system-ui, sans-serif"
      ctx.fillText("WASD o ← → ↑ ↓ para moverte · Click en un agente para inspeccionar", 50, CANVAS_H - 12)

      animFrameRef.current = requestAnimationFrame(gameLoop)
    }

    animFrameRef.current = requestAnimationFrame(gameLoop)
    return () => cancelAnimationFrame(animFrameRef.current)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Click handler for agent inspection ─────────────────────────────────────
  const handleCanvasClick = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current
      if (!canvas) return
      const rect = canvas.getBoundingClientRect()
      const scaleX = CANVAS_W / rect.width
      const scaleY = CANVAS_H / rect.height
      const mx = (e.clientX - rect.left) * scaleX
      const my = (e.clientY - rect.top) * scaleY

      // Check if click is on an agent
      for (const agent of agents) {
        const dx = mx - agent.x
        const dy = my - agent.y
        if (dx * dx + dy * dy < (AGENT_SIZE * AGENT_SIZE)) {
          selectAgent(agent.id)
          addLog({
            timestamp: new Date().toLocaleTimeString("es-AR"),
            tipo: "ACCION",
            mensaje: `Inspeccionando a ${agent.nombre} (${agent.rol})`,
          })
          return
        }
      }
      // Clicked on empty space — close panel
      selectAgent(null)
    },
    [agents, selectAgent, addLog]
  )

  // ─── Get selected agent ─────────────────────────────────────────────────────
  const selectedAgent = agents.find((a) => a.id === selectedAgentId) ?? null

  return (
    <div className="h-screen w-full bg-[#0a0a12] flex flex-col overflow-hidden">
      {/* ─── Top Bar ─────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-4 py-2 bg-gradient-to-r from-[#0f172a] via-[#131b2e] to-[#1a1a2e] border-b border-slate-800">
        <div className="flex items-center gap-3">
          <span className="text-xl">🎮</span>
          <h1 className="text-white font-bold text-lg tracking-wide">MetaSwarm Campus</h1>
          <span className="text-xs bg-cyan-950 text-cyan-300 px-2 py-0.5 rounded-full border border-cyan-700/40">
            ERP LIVE
          </span>
          <button
            onClick={() => setShowVoiceModal(true)}
            className="ml-3 px-3 py-1 text-xs font-semibold rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black shadow-md shadow-cyan-500/20 flex items-center gap-1.5 transition"
          >
            <span>🎤 Simular Audio WhatsApp (3 Niveles)</span>
          </button>
          <Link
            href="/por-que-claver"
            className="text-xs text-slate-400 hover:text-white px-2.5 py-1 rounded bg-slate-800/60 border border-slate-700 transition"
          >
            📖 Manifiesto
          </Link>
        </div>
        <div className="flex items-center gap-4 text-xs text-slate-400">
          <span>🤖 {agents.filter((a) => a.estado !== "idle").length} activos</span>
          <span>💰 ${metrics.ventasHoy.toLocaleString("es-AR")}</span>
          <span>🔢 {metrics.tokensUsados.toLocaleString()} tokens</span>
          <span>💵 ${metrics.costoTotalUSD.toFixed(4)} USD</span>
          <Link
            href="/dashboard"
            className="text-slate-400 hover:text-white ml-2 text-xs px-2 py-1 bg-slate-800 rounded border border-slate-700"
          >
            ← Salir al Dashboard
          </Link>
        </div>
      </div>

      {/* ─── Main Area ───────────────────────────────────────────────── */}
      <div className="flex-1 flex overflow-hidden">
        {/* ─── Canvas ────────────────────────────────────────────────── */}
        <div className="flex-1 flex items-center justify-center p-4">
          <canvas
            ref={canvasRef}
            width={CANVAS_W}
            height={CANVAS_H}
            onClick={handleCanvasClick}
            className="rounded-xl border border-slate-800 shadow-2xl shadow-blue-950/20 cursor-crosshair"
            style={{ maxWidth: "100%", maxHeight: "100%", imageRendering: "auto" }}
          />
        </div>

        {/* ─── Agent Panel (Right Side) ──────────────────────────────── */}
        {showPanel && selectedAgent && (
          <div className="w-80 bg-slate-900/95 backdrop-blur border-l border-slate-700 flex flex-col animate-in slide-in-from-right duration-200">
            {/* Header */}
            <div className="p-4 border-b border-slate-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{selectedAgent.icono}</span>
                  <div>
                    <h3 className="font-bold text-white">{selectedAgent.nombre}</h3>
                    <p className="text-xs text-slate-400">{selectedAgent.rol}</p>
                  </div>
                </div>
                <button
                  onClick={() => selectAgent(null)}
                  className="text-slate-400 hover:text-white transition-colors"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Status */}
            <div className="p-4 border-b border-slate-700">
              <div className="flex items-center gap-2 mb-2">
                <div
                  className={`w-2.5 h-2.5 rounded-full ${
                    selectedAgent.estado === "working"
                      ? "bg-green-400"
                      : selectedAgent.estado === "thinking"
                        ? "bg-yellow-400 animate-pulse"
                        : selectedAgent.estado === "blocked"
                          ? "bg-red-400 animate-pulse"
                          : "bg-slate-400"
                  }`}
                />
                <span className="text-sm text-white capitalize">{selectedAgent.estado}</span>
                <span className="text-xs text-slate-500">Lv.{selectedAgent.nivel}</span>
                <span className="text-xs text-slate-600">({selectedAgent.xp} XP)</span>
              </div>
              <p className="text-xs text-slate-300">{selectedAgent.tareaActual ?? "Esperando tarea..."}</p>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <div className="bg-slate-800/60 rounded p-2 text-center">
                  <div className="text-xs text-slate-400">Tokens Hoy</div>
                  <div className="text-sm text-white font-mono">{selectedAgent.tokensHoy.toLocaleString()}</div>
                </div>
                <div className="bg-slate-800/60 rounded p-2 text-center">
                  <div className="text-xs text-slate-400">Costo USD</div>
                  <div className="text-sm text-white font-mono">${selectedAgent.costoUSD.toFixed(4)}</div>
                </div>
              </div>
            </div>

            {/* XP Bar */}
            <div className="px-4 py-2 border-b border-slate-700">
              <div className="flex justify-between text-[10px] text-slate-500 mb-1">
                <span>Nivel {selectedAgent.nivel}</span>
                <span>{selectedAgent.xp} / {selectedAgent.nivel * 100} XP</span>
              </div>
              <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all"
                  style={{ width: `${Math.min(100, (selectedAgent.xp / (selectedAgent.nivel * 100)) * 100)}%` }}
                />
              </div>
            </div>

            {/* Activity Log */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              <h4 className="text-xs text-slate-500 font-semibold uppercase tracking-wider mb-2">
                Actividad Reciente
              </h4>
              {agentLogs.length === 0 && (
                <p className="text-xs text-slate-600 italic">Sin actividad registrada aún...</p>
              )}
              {agentLogs.map((log, i) => (
                <div
                  key={i}
                  className={`text-xs p-2 rounded border-l-2 ${
                    log.tipo === "ERROR"
                      ? "bg-red-950/30 border-red-500 text-red-300"
                      : log.tipo === "COBRO"
                        ? "bg-green-950/30 border-green-500 text-green-300"
                        : log.tipo === "ACCION"
                          ? "bg-blue-950/30 border-blue-500 text-blue-300"
                          : "bg-slate-800/30 border-slate-600 text-slate-300"
                  }`}
                >
                  <div className="text-slate-500 text-[10px] mb-0.5">{log.timestamp}</div>
                  <div>{log.mensaje}</div>
                  {log.tokens !== undefined && (
                    <span className="text-slate-500 text-[10px]">
                      {log.tokens}t · ${log.costoUSD?.toFixed(6)}
                    </span>
                  )}
                </div>
              ))}
            </div>

            {/* Override instruction */}
            <div className="p-3 border-t border-slate-700">
              <p className="text-[10px] text-slate-500 mb-1.5">Instrucción al agente:</p>
              <div className="flex gap-1.5">
                <input
                  value={instruction}
                  onChange={(e) => setInstruction(e.target.value)}
                  placeholder={`Ej: ${selectedAgent.nombre}, cobrá los fiados > $20k`}
                  className="flex-1 bg-slate-800 text-white text-xs px-2 py-1.5 rounded border border-slate-600 focus:border-blue-500 focus:outline-none"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && instruction.trim()) {
                      addLog({
                        timestamp: new Date().toLocaleTimeString("es-AR"),
                        tipo: "ACCION",
                        mensaje: `Orden manual: "${instruction}"`,
                      })
                      updateAgentStatus(selectedAgent.id, "thinking", `Procesando: ${instruction}`)
                      bubblesRef.current.push({
                        agentId: selectedAgent.id,
                        text: `💭 "${instruction.slice(0, 30)}..."`,
                        expiresAt: Date.now() + 5000,
                      })
                      setInstruction("")
                      setTimeout(() => {
                        updateAgentStatus(selectedAgent.id, "working", `Ejecutando: ${instruction}`)
                        addLog({
                          timestamp: new Date().toLocaleTimeString("es-AR"),
                          tipo: "TAREA",
                          mensaje: `${selectedAgent.nombre} ejecutó la instrucción correctamente.`,
                          tokens: Math.floor(Math.random() * 300) + 100,
                          costoUSD: Math.random() * 0.003,
                        })
                      }, 2500)
                    }
                  }}
                />
                <button
                  onClick={() => {
                    if (instruction.trim()) {
                      addLog({
                        timestamp: new Date().toLocaleTimeString("es-AR"),
                        tipo: "ACCION",
                        mensaje: `Orden manual: "${instruction}"`,
                      })
                      setInstruction("")
                    }
                  }}
                  className="px-2.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs rounded transition-colors"
                >
                  ▶
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ─── Voice-to-Quote Simulator Modal ─────────────────────────── */}
      {showVoiceModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-3xl w-full p-6 shadow-2xl relative animate-in zoom-in-95">
            <button
              onClick={() => setShowVoiceModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              ✕
            </button>

            <div className="flex items-center gap-2 text-cyan-400 font-bold text-sm mb-1">
              <span>🎤</span>
              <span>SIMULADOR DE COTIZACIÓN POR AUDIO (WHATSAPP VOICE-TO-QUOTE)</span>
            </div>
            <p className="text-xs text-slate-400 mb-5">
              Elegí un audio simulado de la calle. El agente Leo (Ventas) procesa el requerimiento, consulta la lista de precios y arma el presupuesto en 3 niveles con link de seña Mercado Pago.
            </p>

            {/* Samples */}
            <div className="flex gap-2 mb-4">
              {["Plomería (Termotanque)", "Electricidad (Tablero)", "Kiosco (Fiado)"].map((title, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setSelectedVoiceSample(i)
                    setVoiceProcessing(true)
                    setTimeout(() => setVoiceProcessing(false), 800)
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${
                    selectedVoiceSample === i
                      ? "bg-cyan-500 text-black border-cyan-400 shadow-md shadow-cyan-500/20"
                      : "bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700"
                  }`}
                >
                  {title}
                </button>
              ))}
            </div>

            {/* Audio transcription box */}
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 mb-4 text-xs text-slate-300 italic">
              {selectedVoiceSample === 0 && '"Hola Leo, presupuesto para cambio de termotanque 80L en Belgrano: desmonte del viejo, flexibles inox, válvula de alivio y mano de obra completa."'}
              {selectedVoiceSample === 1 && '"Leo, cotizá cableado de taller en Munro: tablero 12 bocas, térmicas Schneider, disyuntor tetrapolar y puesta a tierra con jabalina."'}
              {selectedVoiceSample === 2 && '"Anotá que Don Carlos se lleva 2 packs de gaseosa, 3 aceites y 1kg de queso. Mandale recordatorio con link de pago el viernes."'}
            </div>

            {voiceProcessing ? (
              <div className="py-12 text-center text-cyan-400 flex flex-col items-center gap-2">
                <div className="w-6 h-6 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
                <span className="text-xs font-semibold">Leo está estructurando el presupuesto con precios de tu lista...</span>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-3">
                {selectedVoiceSample === 0 && (
                  <>
                    <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                      <div className="text-[10px] text-slate-400 font-bold">1. BÁSICO</div>
                      <div className="text-xs font-semibold text-white my-1">Solo Mano de Obra</div>
                      <div className="text-sm font-black text-white">$65.000</div>
                      <div className="text-[10px] text-cyan-400 font-semibold mt-2">Seña MP: $20.000</div>
                    </div>
                    <div className="bg-cyan-950/40 p-3 rounded-xl border-2 border-cyan-500 shadow-md">
                      <div className="text-[10px] text-cyan-400 font-bold">2. RECOMENDADO ★</div>
                      <div className="text-xs font-semibold text-white my-1">Con Materiales Inox</div>
                      <div className="text-base font-black text-white">$125.000</div>
                      <div className="text-[10px] text-cyan-300 font-semibold mt-2 bg-cyan-900/60 px-1.5 py-0.5 rounded">Seña MP: $45.000</div>
                    </div>
                    <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                      <div className="text-[10px] text-slate-400 font-bold">3. PREMIUM</div>
                      <div className="text-xs font-semibold text-white my-1">Llave en mano + Service</div>
                      <div className="text-sm font-black text-white">$175.000</div>
                      <div className="text-[10px] text-blue-400 font-semibold mt-2">Seña MP: $60.000</div>
                    </div>
                  </>
                )}
                {selectedVoiceSample === 1 && (
                  <>
                    <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                      <div className="text-[10px] text-slate-400 font-bold">1. BÁSICO</div>
                      <div className="text-xs font-semibold text-white my-1">Tablero Principal</div>
                      <div className="text-sm font-black text-white">$110.000</div>
                      <div className="text-[10px] text-cyan-400 font-semibold mt-2">Seña MP: $40.000</div>
                    </div>
                    <div className="bg-cyan-950/40 p-3 rounded-xl border-2 border-cyan-500 shadow-md">
                      <div className="text-[10px] text-cyan-400 font-bold">2. RECOMENDADO ★</div>
                      <div className="text-xs font-semibold text-white my-1">Schneider + Jabalina</div>
                      <div className="text-base font-black text-white">$240.000</div>
                      <div className="text-[10px] text-cyan-300 font-semibold mt-2 bg-cyan-900/60 px-1.5 py-0.5 rounded">Seña MP: $90.000</div>
                    </div>
                    <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                      <div className="text-[10px] text-slate-400 font-bold">3. PREMIUM</div>
                      <div className="text-xs font-semibold text-white my-1">Canalizado + Certificado</div>
                      <div className="text-sm font-black text-white">$380.000</div>
                      <div className="text-[10px] text-blue-400 font-semibold mt-2">Seña MP: $150.000</div>
                    </div>
                  </>
                )}
                {selectedVoiceSample === 2 && (
                  <>
                    <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                      <div className="text-[10px] text-slate-400 font-bold">1. LIBRETA</div>
                      <div className="text-xs font-semibold text-white my-1">Imputación a Don Carlos</div>
                      <div className="text-sm font-black text-white">$18.400</div>
                      <div className="text-[10px] text-slate-400 mt-2">Saldo: $42.100</div>
                    </div>
                    <div className="bg-cyan-950/40 p-3 rounded-xl border-2 border-cyan-500 shadow-md">
                      <div className="text-[10px] text-cyan-400 font-bold">2. WHATSAPP + MP ★</div>
                      <div className="text-xs font-semibold text-white my-1">Recordatorio Cordial</div>
                      <div className="text-sm font-black text-white">$18.400</div>
                      <div className="text-[10px] text-cyan-300 font-semibold mt-2 bg-cyan-900/60 px-1.5 py-0.5 rounded">Link Enviado</div>
                    </div>
                    <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                      <div className="text-[10px] text-slate-400 font-bold">3. AUTO-FACTURA</div>
                      <div className="text-xs font-semibold text-white my-1">Factura B con CAE</div>
                      <div className="text-sm font-black text-white">$18.400</div>
                      <div className="text-[10px] text-blue-400 font-semibold mt-2">AFIP Directo</div>
                    </div>
                  </>
                )}
              </div>
            )}

            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={() => setShowVoiceModal(false)}
                className="px-4 py-2 text-xs font-semibold rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700"
              >
                Cerrar
              </button>
              <Link
                href="/por-que-claver"
                className="px-4 py-2 text-xs font-bold rounded-lg bg-cyan-500 text-black hover:bg-cyan-400 shadow-md"
              >
                Ver Manifiesto Completo →
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Helper: Rounded rectangle ──────────────────────────────────────────────

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.lineTo(x + w - r, y)
  ctx.quadraticCurveTo(x + w, y, x + w, y + r)
  ctx.lineTo(x + w, y + h - r)
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
  ctx.lineTo(x + r, y + h)
  ctx.quadraticCurveTo(x, y + h, x, y + h - r)
  ctx.lineTo(x, y + r)
  ctx.quadraticCurveTo(x, y, x + r, y)
  ctx.closePath()
}
