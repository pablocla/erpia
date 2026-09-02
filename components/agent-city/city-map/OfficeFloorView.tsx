"use client"

/**
 * Oficina pixel + capa Gather (virtual office).
 * Caminás vos (WASD), proximidad para hablar, zonas privadas, objetos, focus/mute.
 * Sin WebRTC: “walk up and talk” abre el agente (Gemini). Multiplayer humano pediría un SFU.
 */

import { useCallback, useEffect, useRef, useState, type MutableRefObject } from "react"
import { useAgentCity } from "@/lib/agent-city/agent-city-state"
import type { Agent, AgentStatus, DepartmentId } from "@/types/agent-city"

const PW = 480
const PH = 270
const HALL_Y = 132
const PROX = 22
const TOP_ROOMS: DepartmentId[] = ["BILLING", "SALES", "FINANCE", "ACCOUNTING"]

type Pt = { x: number; y: number }

const ROOMS: Record<
  DepartmentId,
  { x: number; y: number; w: number; h: number; desk: Pt; short: string }
> = {
  BILLING: { x: 6, y: 6, w: 114, h: 86, desk: { x: 58, y: 48 }, short: "BILLING" },
  SALES: { x: 124, y: 6, w: 114, h: 86, desk: { x: 176, y: 48 }, short: "SALES" },
  FINANCE: { x: 242, y: 6, w: 114, h: 86, desk: { x: 294, y: 48 }, short: "FINANCE" },
  ACCOUNTING: { x: 360, y: 6, w: 114, h: 86, desk: { x: 412, y: 48 }, short: "ACCT" },
  CUSTOMER_SERVICE: { x: 6, y: 178, w: 114, h: 86, desk: { x: 58, y: 220 }, short: "CUSTOMER" },
  OPERATIONS: { x: 124, y: 178, w: 114, h: 86, desk: { x: 176, y: 220 }, short: "OPS" },
  FUNCTIONAL_SUPPORT: { x: 242, y: 178, w: 114, h: 86, desk: { x: 294, y: 220 }, short: "FUNC" },
  INFRASTRUCTURE: { x: 360, y: 178, w: 114, h: 86, desk: { x: 412, y: 220 }, short: "INFRA" },
}

const COS: Pt = { x: 240, y: HALL_Y }
const STANDUP: Pt = { x: 88, y: HALL_Y }

type Pose = "walk" | "sit" | "stand" | "wait"

type Body = {
  id: string
  x: number
  y: number
  path: Pt[]
  pose: Pose
  frame: number
  bubble: string
  flag: string
  progress: number
  color: string
  name: string
  status: AgentStatus
  dept: DepartmentId
}

type Player = {
  x: number
  y: number
  frame: number
  dir: number
  emoji: string
  emojiUntil: number
}

function dist(a: Pt, b: Pt) {
  return Math.hypot(a.x - b.x, a.y - b.y)
}

function route(from: Pt, to: Pt): Pt[] {
  if (Math.abs(from.y - to.y) < 10 && Math.abs(from.x - to.x) < 10) return [to]
  return [
    { x: from.x, y: HALL_Y },
    { x: to.x, y: HALL_Y },
    to,
  ]
}

function destFor(agent: Agent, latestType?: string, latestDept?: DepartmentId): Pt {
  const home = ROOMS[agent.departmentId]?.desk ?? COS
  if (agent.status === "WAITING" || agent.status === "BLOCKED") return COS
  if (agent.status === "ESCALATED") return ROOMS.FUNCTIONAL_SUPPORT.desk
  if (latestType === "approval" && latestDept === agent.departmentId) return COS
  return home
}

function poseFor(status: AgentStatus, moving: boolean): Pose {
  if (moving) return "walk"
  if (status === "WAITING" || status === "BLOCKED") return "wait"
  if (status === "EXECUTING" || status === "THINKING") return "sit"
  return "stand"
}

function flagFor(status: AgentStatus) {
  if (status === "EXECUTING") return "FOCUS"
  if (status === "THINKING") return "SCAN"
  if (status === "WAITING" || status === "BLOCKED") return "FREE?"
  if (status === "ESCALATED") return "HANDOFF"
  if (status === "ERROR") return "ERROR"
  return "FREE"
}

function inRect(x: number, y: number, r: { x: number; y: number; w: number; h: number }, pad: number) {
  return x >= r.x + pad && x <= r.x + r.w - pad && y >= r.y + pad && y <= r.y + r.h - pad
}

function inDoor(x: number, y: number, r: { x: number; y: number; w: number; h: number }, top: boolean) {
  const cx = r.x + r.w / 2
  if (Math.abs(x - cx) > 11) return false
  if (top) return y >= r.y + r.h - 7 && y <= r.y + r.h + 7
  return y >= r.y - 7 && y <= r.y + 7
}

function blocked(x: number, y: number) {
  if (x < 4 || y < 4 || x > PW - 4 || y > PH - 4) return true
  for (const id of Object.keys(ROOMS) as DepartmentId[]) {
    const r = ROOMS[id]
    const top = TOP_ROOMS.includes(id)
    const onWall = inRect(x, y, r, 0) && !inRect(x, y, r, 3)
    if (onWall && !inDoor(x, y, r, top)) return true
  }
  return false
}

function zoneAt(x: number, y: number): string {
  if (dist({ x, y }, COS) < 28) return "COS / firma"
  if (dist({ x, y }, STANDUP) < 28) return "Standup"
  for (const id of Object.keys(ROOMS) as DepartmentId[]) {
    if (inRect(x, y, ROOMS[id], 2)) return ROOMS[id].short
  }
  return "Pasillo"
}

function typing() {
  const el = document.activeElement
  if (!el) return false
  const tag = el.tagName
  return tag === "INPUT" || tag === "TEXTAREA" || (el as HTMLElement).isContentEditable
}

export function OfficeFloorView() {
  const { agents, departments, events, approvals, selectAgent, selectedAgent, metrics, setActiveTab, backendLive } =
    useAgentCity()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const bodies = useRef<Map<string, Body>>(new Map())
  const dossiers = useRef<Array<{ x: number; y: number; path: Pt[]; color: string; life: number }>>([])
  const player = useRef<Player>({ x: COS.x, y: COS.y + 18, frame: 0, dir: 0, emoji: "", emojiUntil: 0 })
  const keys = useRef<Record<string, boolean>>({})
  const hoverId = useRef<string | null>(null)
  const selectedId = useRef<string | null>(null)
  const tick = useRef(0)
  selectedId.current = selectedAgent?.id ?? null

  const [nearbyId, setNearbyId] = useState<string | null>(null)
  const [zone, setZone] = useState("Pasillo")
  const [focusMode, setFocusMode] = useState(false)
  const [muted, setMuted] = useState(true)
  const [help, setHelp] = useState(true)

  const sync = useCallback(() => {
    const latest = events[0]
    const map = bodies.current
    for (const agent of agents) {
      const home = ROOMS[agent.departmentId]?.desk ?? COS
      let body = map.get(agent.id)
      if (!body) {
        body = {
          id: agent.id,
          x: home.x,
          y: home.y,
          path: [],
          pose: "sit",
          frame: 0,
          bubble: "",
          flag: "",
          progress: 0,
          color: agent.color || "#3DFF8B",
          name: agent.name,
          status: agent.status,
          dept: agent.departmentId,
        }
        map.set(agent.id, body)
      }
      body.color = agent.color || body.color
      body.name = agent.name
      body.status = agent.status
      body.dept = agent.departmentId
      body.progress = agent.currentTask?.progress ?? (agent.status === "EXECUTING" ? 55 : 0)
      body.flag = flagFor(agent.status)
      body.bubble = agent.statusMessage || (latest?.agentId === agent.id ? latest.title : "") || ""
      if (body.bubble.length > 28) body.bubble = body.bubble.slice(0, 26) + "…"

      let target = destFor(agent, latest?.type, latest?.departmentId)
      if ((agent.status === "ONLINE" || agent.status === "IDLE") && !body.path.length && Math.random() < 0.03) {
        const room = ROOMS[agent.departmentId]
        target = {
          x: room.x + 16 + Math.random() * (room.w - 32),
          y: room.y + 28 + Math.random() * (room.h - 40),
        }
      }
      if (dist(body, target) > 6 && !body.path.length) {
        const from = { x: body.x, y: body.y }
        body.path = route(body, target)
        if (latest && latest.agentId === agent.id && latest.departmentId !== agent.departmentId) {
          const other = ROOMS[latest.departmentId]?.desk
          if (other) {
            dossiers.current.push({
              x: from.x,
              y: from.y - 6,
              path: route(from, other),
              color: agent.color,
              life: 1,
            })
          }
        }
      }
      body.pose = poseFor(agent.status, body.path.length > 0)
    }
    for (const id of [...map.keys()]) {
      if (!agents.some((a) => a.id === id)) map.delete(id)
    }
  }, [agents, events])

  useEffect(() => {
    sync()
  }, [sync])

  useEffect(() => {
    const t = window.setTimeout(() => setHelp(false), 10000)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (typing()) return
      keys.current[e.key.toLowerCase()] = true
      if (["arrowup", "arrowdown", "arrowleft", "arrowright", " ", "w", "a", "s", "d"].includes(e.key.toLowerCase())) {
        e.preventDefault()
      }
      if (e.key === "f" || e.key === "F") setFocusMode((v) => !v)
      if (e.key === "m" || e.key === "M") setMuted((v) => !v)
      if (e.key === "h" || e.key === "H" || e.key === "?") setHelp((v) => !v)
      if (e.key === "1") {
        player.current.emoji = "👋"
        player.current.emojiUntil = tick.current + 90
      }
      if (e.key === "2") {
        player.current.emoji = "🔥"
        player.current.emojiUntil = tick.current + 90
      }
      if (e.key === "3") {
        player.current.emoji = "✅"
        player.current.emojiUntil = tick.current + 90
      }
    }
    const up = (e: KeyboardEvent) => {
      keys.current[e.key.toLowerCase()] = false
    }
    window.addEventListener("keydown", down)
    window.addEventListener("keyup", up)
    return () => {
      window.removeEventListener("keydown", down)
      window.removeEventListener("keyup", up)
    }
  }, [])

  useEffect(() => {
    const onUse = (e: KeyboardEvent) => {
      if (typing()) return
      const p = player.current
      if (e.key === "x" || e.key === "X") {
        let nearest: Body | null = null
        let best = PROX
        for (const b of bodies.current.values()) {
          const d = dist(p, b)
          if (d < best) {
            best = d
            nearest = b
          }
        }
        if (nearest) selectAgent(nearest.id)
      }
      if (e.key === "e" || e.key === "E") {
        if (dist(p, COS) < 26) {
          setActiveTab("approvals")
          return
        }
        if (dist(p, STANDUP) < 26) {
          setActiveTab("network")
          return
        }
        for (const id of Object.keys(ROOMS) as DepartmentId[]) {
          if (dist(p, ROOMS[id].desk) < 18) {
            const occupant = agents.find((a) => a.departmentId === id)
            if (occupant) selectAgent(occupant.id)
            return
          }
        }
      }
    }
    window.addEventListener("keydown", onUse)
    return () => window.removeEventListener("keydown", onUse)
  }, [agents, selectAgent, setActiveTab])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return
    let raf = 0

    const loop = () => {
      tick.current += 1
      const t = tick.current
      const p = player.current
      if (!typing()) {
        let nx = p.x
        let ny = p.y
        const k = keys.current
        const sp = 1.05
        if (k.w || k.arrowup) ny -= sp
        if (k.s || k.arrowdown) ny += sp
        if (k.a || k.arrowleft) nx -= sp
        if (k.d || k.arrowright) nx += sp
        if (nx !== p.x || ny !== p.y) {
          if (!blocked(nx, p.y)) p.x = nx
          if (!blocked(p.x, ny)) p.y = ny
          p.dir = nx < p.x ? -1 : nx > p.x ? 1 : p.dir
          if (t % 8 === 0) p.frame ^= 1
        }
      }
      if (t % 12 === 0) {
        let near: Body | null = null
        let best = PROX
        for (const b of bodies.current.values()) {
          const d = dist(p, b)
          if (d < best) {
            best = d
            near = b
          }
        }
        const nid = near?.id ?? null
        setNearbyId((prev) => (prev === nid ? prev : nid))
        const z = zoneAt(p.x, p.y)
        setZone((prev) => (prev === z ? prev : z))
      }

      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      const rect = canvas.getBoundingClientRect()
      const cssW = Math.max(1, rect.width)
      const cssH = Math.max(1, rect.height)
      if (canvas.width !== Math.floor(cssW * dpr) || canvas.height !== Math.floor(cssH * dpr)) {
        canvas.width = Math.floor(cssW * dpr)
        canvas.height = Math.floor(cssH * dpr)
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.imageSmoothingEnabled = false
      const use = Math.max(2, Math.floor(Math.min(cssW / PW, cssH / PH)))
      const ox = Math.floor((cssW - PW * use) / 2)
      const oy = Math.floor((cssH - PH * use) / 2)
      ctx.clearRect(0, 0, cssW, cssH)
      ctx.fillStyle = "#050508"
      ctx.fillRect(0, 0, cssW, cssH)
      ctx.save()
      ctx.translate(ox, oy)
      ctx.scale(use, use)
      ctx.imageSmoothingEnabled = false

      drawOffice(ctx, t, departments)

      for (const d of dossiers.current) {
        stepAlong(d, 0.9)
        if (!d.path.length) d.life -= 0.03
        ctx.globalAlpha = Math.max(0, d.life)
        ctx.fillStyle = d.color
        ctx.fillRect(Math.floor(d.x) - 2, Math.floor(d.y) - 3, 5, 4)
        ctx.fillStyle = "#fff"
        ctx.fillRect(Math.floor(d.x) - 1, Math.floor(d.y) - 2, 3, 1)
        ctx.globalAlpha = 1
      }
      dossiers.current = dossiers.current.filter((d) => d.life > 0)

      const list = [...bodies.current.values()].sort((a, b) => a.y - b.y)
      const nearNow = list.find((b) => dist(p, b) < PROX)
      if (nearNow && !focusMode) {
        ctx.strokeStyle = "rgba(61,255,139,0.45)"
        ctx.beginPath()
        ctx.arc(Math.floor(p.x), Math.floor(p.y), PROX, 0, Math.PI * 2)
        ctx.stroke()
        ctx.beginPath()
        ctx.arc(Math.floor(nearNow.x), Math.floor(nearNow.y), 10, 0, Math.PI * 2)
        ctx.stroke()
      }

      for (const b of list) {
        if (b.path.length) {
          stepAlong(b, 0.7)
          b.pose = "walk"
          if (t % 10 === 0) b.frame ^= 1
        }
        drawDude(ctx, b, selectedId.current === b.id || hoverId.current === b.id || nearbyId === b.id)
      }
      drawPlayer(ctx, p, t, focusMode)

      ctx.restore()
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [departments, focusMode, nearbyId])

  const hit = (cx: number, cy: number) => {
    const canvas = canvasRef.current
    if (!canvas) return null
    const rect = canvas.getBoundingClientRect()
    const use = Math.max(2, Math.floor(Math.min(rect.width / PW, rect.height / PH)))
    const ox = Math.floor((rect.width - PW * use) / 2)
    const oy = Math.floor((rect.height - PH * use) / 2)
    const x = (cx - rect.left - ox) / use
    const y = (cy - rect.top - oy) / use
    let best: Body | null = null
    let bestD = 12
    for (const b of bodies.current.values()) {
      const d = Math.hypot(b.x - x, b.y - 8 - y)
      if (d < bestD) {
        bestD = d
        best = b
      }
    }
    return best
  }

  const pending = approvals.filter((a) => a.status === "PENDING").length
  const nearAgent = agents.find((a) => a.id === nearbyId)
  const huddle = zone !== "Pasillo"

  return (
    <div className="relative flex h-full min-h-0 bg-[#050508]">
      <canvas
        ref={canvasRef}
        className="h-full min-h-0 flex-1 cursor-pointer"
        style={{ imageRendering: "pixelated" }}
        onClick={(e) => {
          const h = hit(e.clientX, e.clientY)
          if (h) selectAgent(h.id)
        }}
        onMouseMove={(e) => {
          hoverId.current = hit(e.clientX, e.clientY)?.id ?? null
        }}
      />

      <aside className="hidden w-72 shrink-0 flex-col border-l border-white/10 bg-black/40 font-mono text-[10px] text-white/70 md:flex">
        <div className="border-b border-white/10 px-3 py-2 text-[9px] uppercase tracking-widest text-[#3DFF8B]">
          Quién está · Gather-style
        </div>
        <div className="space-y-1 border-b border-white/10 p-3">
          {agents.map((a) => {
            const free = a.status === "ONLINE" || a.status === "IDLE" || a.status === "WAITING"
            return (
              <button
                key={a.id}
                type="button"
                onClick={() => selectAgent(a.id)}
                className="flex w-full items-center justify-between rounded px-1 py-1 text-left hover:bg-white/5"
              >
                <span className="truncate text-white/85">
                  {a.avatar} {a.name.split(" ")[0]}
                </span>
                <span className={free ? "text-[#3DFF8B]" : "text-amber-300"}>
                  {free ? "free" : "focus"}
                </span>
              </button>
            )
          })}
        </div>
        <div className="border-b border-white/10 px-3 py-2 text-[9px] uppercase tracking-widest text-white/40">
          Activity
        </div>
        <div className="flex-1 space-y-2 overflow-y-auto p-3">
          {events.slice(0, 14).map((ev) => (
            <button
              key={ev.id}
              type="button"
              onClick={() => selectAgent(ev.agentId)}
              className="block w-full rounded border border-white/5 bg-white/5 px-2 py-1.5 text-left hover:border-[#3DFF8B]/30"
            >
              <div className="text-white/30">{ev.timestamp}</div>
              <div className="text-[11px] text-white/90">{ev.title}</div>
            </button>
          ))}
        </div>
      </aside>

      <div className="pointer-events-none absolute left-3 right-3 top-3 flex flex-wrap gap-2 font-mono text-[10px] uppercase tracking-wider md:right-80">
        <HudChip label="Backend" value={backendLive ? "ERP LIVE" : "DEMO"} warn={!backendLive} />
        <HudChip label="Zona" value={zone} />
        <HudChip label="Vos" value={focusMode ? "FOCUS" : "AVAILABLE"} warn={focusMode} />
        <HudChip label="Mic" value={muted ? "MUTED" : "LIVE"} warn={!muted} />
        <HudChip label="Firma" value={String(pending)} warn={pending > 0} />
        <HudChip label="OK" value={`${metrics.successRate}%`} />
      </div>

      {help && (
        <div className="pointer-events-none absolute bottom-24 left-1/2 z-10 w-[min(92vw,420px)] -translate-x-1/2 rounded-lg border border-[#3DFF8B]/30 bg-black/80 px-4 py-3 font-mono text-[11px] text-white/80">
          <div className="mb-1 text-[#3DFF8B]">Oficina espacial (Gather-style)</div>
          WASD / flechas caminar · X hablar al de al lado · E usar escritorio/COS/standup
          <br />
          F focus · M mute · 1 👋 2 🔥 3 ✅ · H ayuda
        </div>
      )}

      {nearAgent && !focusMode && (
        <div className="absolute bottom-10 left-1/2 z-10 w-[min(92vw,380px)] -translate-x-1/2 rounded-xl border border-[#3DFF8B]/40 bg-black/85 px-4 py-3 md:left-[calc(50%-9rem)]">
          <div className="text-[10px] uppercase tracking-widest text-[#3DFF8B]">Walk up and talk</div>
          <div className="mt-1 text-sm text-white">
            {nearAgent.avatar} {nearAgent.name}
            <span className="ml-2 text-xs text-white/40">{nearAgent.status}</span>
          </div>
          <div className="mt-1 text-xs text-white/50">{nearAgent.statusMessage || nearAgent.role}</div>
          <div className="mt-2 font-mono text-[10px] text-white/60">X hablar · E escritorio · alejate para salir</div>
        </div>
      )}

      {huddle && (
        <div className="pointer-events-none absolute left-3 top-12 rounded-sm border border-violet-400/30 bg-black/70 px-2 py-1 font-mono text-[10px] text-violet-200">
          Private space · {zone}
          {nearAgent ? " · in conversation" : ""}
        </div>
      )}

      <MiniMap player={player} bodies={bodies} />
    </div>
  )
}

function MiniMap({
  player,
  bodies,
}: {
  player: MutableRefObject<Player>
  bodies: MutableRefObject<Map<string, Body>>
}) {
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const c = ref.current
    if (!c) return
    const ctx = c.getContext("2d")
    if (!ctx) return
    let raf = 0
    const loop = () => {
      ctx.imageSmoothingEnabled = false
      ctx.fillStyle = "#08080c"
      ctx.fillRect(0, 0, 120, 68)
      ctx.strokeStyle = "#3DFF8B33"
      ctx.strokeRect(0, 0, 119, 67)
      const sx = 120 / PW
      const sy = 68 / PH
      for (const r of Object.values(ROOMS)) {
        ctx.fillStyle = "#1a1a24"
        ctx.fillRect(r.x * sx, r.y * sy, r.w * sx, r.h * sy)
      }
      for (const b of bodies.current.values()) {
        ctx.fillStyle = b.color
        ctx.fillRect(b.x * sx, b.y * sy, 2, 2)
      }
      const p = player.current
      ctx.fillStyle = "#fff"
      ctx.fillRect(p.x * sx, p.y * sy, 3, 3)
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [bodies, player])
  return (
    <canvas
      ref={ref}
      width={120}
      height={68}
      className="absolute bottom-3 left-3 rounded-sm border border-white/10 bg-black/70"
      style={{ imageRendering: "pixelated" }}
    />
  )
}

function HudChip({ label, value, warn }: { label: string; value: string; warn?: boolean }) {
  return (
    <span className="rounded-sm border border-white/10 bg-black/60 px-2 py-1">
      <span className="text-white/35">{label} </span>
      <span className={warn ? "text-amber-300" : "text-[#3DFF8B]"}>{value}</span>
    </span>
  )
}

function stepAlong(obj: { x: number; y: number; path: Pt[] }, speed: number) {
  if (!obj.path.length) return
  const next = obj.path[0]
  const dx = next.x - obj.x
  const dy = next.y - obj.y
  const len = Math.hypot(dx, dy) || 1
  if (len <= speed) {
    obj.x = next.x
    obj.y = next.y
    obj.path.shift()
  } else {
    obj.x += (dx / len) * speed
    obj.y += (dy / len) * speed
  }
}

function drawOffice(
  ctx: CanvasRenderingContext2D,
  t: number,
  departments: { id: string; color: string; name: string }[],
) {
  for (let y = 0; y < PH; y += 8) {
    for (let x = 0; x < PW; x += 8) {
      ctx.fillStyle = ((x + y) / 8) % 2 ? "#12121a" : "#0e0e16"
      ctx.fillRect(x, y, 8, 8)
    }
  }

  ctx.fillStyle = "#0a0a12"
  ctx.fillRect(0, 96, PW, 78)
  ctx.fillStyle = "#1c1c28"
  for (let x = 8; x < PW; x += 16) ctx.fillRect(x, HALL_Y, 8, 1)
  ctx.fillStyle = "#3DFF8B"
  ctx.font = "5px monospace"
  ctx.fillText("WALK UP  ·  NO ZOOM LINK", 168, 108)

  ctx.fillStyle = "#2a2040"
  ctx.fillRect(STANDUP.x - 22, STANDUP.y - 8, 44, 16)
  ctx.fillStyle = "#a78bfa"
  ctx.fillRect(STANDUP.x - 20, STANDUP.y - 6, 40, 12)
  ctx.fillStyle = "#1a1028"
  ctx.font = "5px monospace"
  ctx.fillText("STANDUP", STANDUP.x - 16, STANDUP.y + 2)

  ctx.fillStyle = "#0d2a18"
  ctx.fillRect(COS.x - 28, COS.y - 16, 56, 32)
  ctx.fillStyle = "#3DFF8B"
  ctx.fillRect(COS.x - 26, COS.y - 14, 52, 3)
  ctx.fillStyle = "#102818"
  ctx.fillRect(COS.x - 22, COS.y - 6, 44, 14)
  ctx.fillStyle = "#3DFF8B"
  ctx.font = "6px monospace"
  ctx.fillText("COS / YOU", COS.x - 18, COS.y + 4)
  if (t % 40 < 20) {
    ctx.fillStyle = "#fbbf24"
    ctx.fillRect(COS.x + 20, COS.y - 12, 2, 2)
  }

  for (const id of Object.keys(ROOMS) as DepartmentId[]) {
    const r = ROOMS[id]
    const color = departments.find((d) => d.id === id)?.color || "#3DFF8B"
    ctx.fillStyle = "#16161f"
    ctx.fillRect(r.x, r.y, r.w, r.h)
    ctx.fillStyle = color
    ctx.fillRect(r.x, r.y, r.w, 3)
    ctx.fillStyle = color
    ctx.font = "6px monospace"
    ctx.fillText(r.short, r.x + 4, r.y + 12)

    const doorX = r.x + r.w / 2 - 10
    const top = TOP_ROOMS.includes(id)
    ctx.fillStyle = "#0a0a12"
    if (top) ctx.fillRect(doorX, r.y + r.h - 3, 20, 5)
    else ctx.fillRect(doorX, r.y - 2, 20, 5)

    const dx = r.desk.x
    const dy = r.desk.y
    ctx.fillStyle = "#3a2a1a"
    ctx.fillRect(dx - 14, dy + 2, 28, 8)
    ctx.fillStyle = "#5a4030"
    ctx.fillRect(dx - 12, dy - 2, 24, 6)
    ctx.fillStyle = t % 16 < 8 ? color : "#88ffcc"
    ctx.fillRect(dx - 5, dy - 12, 10, 8)
    ctx.fillStyle = "#0a0a0c"
    ctx.fillRect(dx - 4, dy - 11, 8, 6)
    ctx.fillStyle = "#14532d"
    ctx.fillRect(r.x + r.w - 10, r.y + 16, 6, 10)
  }
}

function drawDude(ctx: CanvasRenderingContext2D, b: Body, glow: boolean) {
  const x = Math.floor(b.x)
  const y = Math.floor(b.y)
  const sit = b.pose === "sit"
  const walk = b.pose === "walk" && b.frame

  ctx.fillStyle = "rgba(0,0,0,0.45)"
  ctx.fillRect(x - 4, y + 2, 8, 2)

  if (glow) {
    ctx.fillStyle = "#3DFF8B"
    ctx.fillRect(x - 6, y - 20, 12, 1)
  }

  ctx.fillStyle = b.color
  ctx.fillRect(x - 3, sit ? -8 + y : -11 + y, 6, sit ? 8 : 10)
  ctx.fillStyle = "#f0d2b0"
  ctx.fillRect(x - 2, sit ? y - 13 : y - 16, 4, 4)
  ctx.fillStyle = b.color
  ctx.fillRect(x - 3, sit ? y - 16 : y - 19, 6, 3)

  ctx.fillStyle = "#1a1a24"
  if (sit) {
    ctx.fillRect(x - 4, y + 1, 3, 3)
    ctx.fillRect(x + 1, y + 1, 3, 3)
    ctx.fillStyle = b.color
    ctx.fillRect(x - 7, y - 5, 4, 2)
    ctx.fillRect(x + 3, y - 5, 4, 2)
  } else {
    ctx.fillRect(x - 4 + (walk ? 1 : 0), y + 1, 3, 5)
    ctx.fillRect(x + 1 - (walk ? 1 : 0), y + 1, 3, 5)
  }

  if (b.progress > 0 && sit) {
    ctx.fillStyle = "#111"
    ctx.fillRect(x - 8, y + 6, 16, 2)
    ctx.fillStyle = "#3DFF8B"
    ctx.fillRect(x - 8, y + 6, Math.floor((16 * b.progress) / 100), 2)
  }

  if (b.flag) {
    const w = b.flag.length * 4 + 4
    ctx.fillStyle = "#000"
    ctx.fillRect(x - w / 2, y - 28, w, 7)
    ctx.fillStyle = b.flag === "FREE" || b.flag === "FREE?" ? "#3DFF8B" : "#fbbf24"
    ctx.font = "5px monospace"
    ctx.fillText(b.flag, x - w / 2 + 2, y - 23)
  }

  if (b.bubble && (sit || glow || b.pose === "wait")) {
    const w = Math.min(90, b.bubble.length * 4 + 6)
    ctx.fillStyle = "#0a0a10"
    ctx.fillRect(x - w / 2, y - 38, w, 9)
    ctx.fillStyle = "#d4d4d8"
    ctx.font = "5px monospace"
    ctx.fillText(b.bubble.slice(0, 22), x - w / 2 + 2, y - 32)
  }

  ctx.fillStyle = "#fff"
  ctx.font = "5px monospace"
  ctx.fillText(b.name.split(" ")[0], x - 10, y + 12)
}

function drawPlayer(ctx: CanvasRenderingContext2D, p: Player, t: number, focus: boolean) {
  const x = Math.floor(p.x)
  const y = Math.floor(p.y)
  const walk = p.frame
  ctx.fillStyle = "rgba(255,255,255,0.15)"
  ctx.beginPath()
  ctx.arc(x, y, 14, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = "#e2e8f0"
  ctx.fillRect(x - 3, y - 12, 6, 11)
  ctx.fillStyle = "#fde68a"
  ctx.fillRect(x - 2, y - 17, 4, 4)
  ctx.fillStyle = "#38bdf8"
  ctx.fillRect(x - 3, y - 20, 6, 3)
  ctx.fillStyle = "#0f172a"
  ctx.fillRect(x - 4 + (walk ? 1 : 0), y + 1, 3, 5)
  ctx.fillRect(x + 1 - (walk ? 1 : 0), y + 1, 3, 5)
  ctx.fillStyle = focus ? "#fbbf24" : "#3DFF8B"
  ctx.font = "5px monospace"
  ctx.fillText(focus ? "VOS · FOCUS" : "VOS", x - 12, y + 14)
  if (p.emoji && t < p.emojiUntil) {
    ctx.font = "10px sans-serif"
    ctx.fillText(p.emoji, x - 4, y - 24)
  }
}
