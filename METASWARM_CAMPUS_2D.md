# 🏗️ METASWARM — CAMPUS 2D: ESPECIFICACIÓN TÉCNICA FRONTEND
## La oficina virtual que entra por el navegador en `campus.claver.com.ar`

> **Stack:** Phaser.js 3 + React/Next.js (overlay) + WebSockets  
> **Ruta en ClavERP:** `/dashboard/campus` (embebido) o `campus.claver.com.ar` (standalone)  
> **Meta de performance:** < 1s de carga inicial · 60 FPS · < 1MB de bundle

---

## 1. ARQUITECTURA DE CAPAS DEL FRONTEND

```
┌─────────────────────────────────────────────────────────────┐
│  CAPA 3 — OVERLAY REACT (z-index alto)                      │
│  Paneles flotantes, modales, métricas, notificaciones        │
│  Tecnología: React + Tailwind CSS (ya en el proyecto)        │
├─────────────────────────────────────────────────────────────┤
│  CAPA 2 — MOTOR 2D PHASER.JS (canvas HTML5)                  │
│  Mapa de la oficina, avatares, animaciones, globos de texto  │
│  Tecnología: Phaser.js 3 (< 1MB gzipped)                    │
├─────────────────────────────────────────────────────────────┤
│  CAPA 1 — SYNC ENGINE (WebSocket / SSE)                      │
│  Canal de eventos bidireccional con el servidor de campus    │
│  Protocolo: JSON over WebSocket · Latencia < 30ms           │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. ESTRUCTURA DE ARCHIVOS

```
app/
└── dashboard/
    └── campus/
        ├── page.tsx                     # Entry point Next.js (SSR mínimo)
        ├── layout.tsx                   # Layout sin sidebar pesado del ERP
        └── _components/
            ├── CampusWrapper.tsx        # Inicializa Phaser y React overlay
            ├── GameCanvas.tsx           # <canvas> de Phaser montado como ref
            ├── AgentPanel.tsx           # Panel lateral: logs, tokens, acciones
            ├── FloorSelector.tsx        # Selector de piso / edificio (navbar)
            ├── MetricsBar.tsx           # Barra inferior: ventas, agentes, costo
            └── NotificationToast.tsx    # Alertas en tiempo real (🚨 agente bloqueado)

services/
└── campus-ws/
    ├── server.ts                        # WebSocket server (Node.js / ws)
    ├── room-manager.ts                  # Gestión de salas por empresaId + floorId
    ├── event-dispatcher.ts             # Despacha eventos del ERP a los clientes
    └── avatar-state.ts                  # Estado de posición y tarea de cada avatar

public/
└── campus/
    ├── maps/
    │   ├── edificio-a-piso-1.json       # Mapa Tiled JSON: Ventas & Atención
    │   ├── edificio-a-piso-2.json       # Mapa Tiled JSON: E-commerce & Portal B2B
    │   ├── edificio-b-piso-1.json       # Mapa Tiled JSON: AFIP & Compliance
    │   └── edificio-d-control.json      # Mapa Tiled JSON: Torre Matriz
    ├── tilesets/
    │   ├── office_tiles.png             # Tileset 16x16px: escritorios, paredes, plantas
    │   └── floor_tiles.png             # Suelo, alfombras, pasillos
    └── sprites/
        ├── agent_leo.png               # Spritesheet 4 direcciones + idle + trabajo
        ├── agent_clara.png
        ├── agent_ramon.png
        ├── agent_sofia.png
        ├── agent_guardian.png
        └── avatar_player.png           # Tu avatar (el dueño)
```

---

## 3. PROTOCOLO DE MENSAJES WEBSOCKET

### Mensajes del Servidor → Cliente (lo que el campus muestra)

```typescript
// Tipos de mensajes recibidos por el frontend

type CampusEvent =
  | { type: "AVATAR_MOVE";       agentId: string; x: number; y: number; direction: "up"|"down"|"left"|"right" }
  | { type: "AGENT_THINKING";    agentId: string; bubble: string; duration: number }
  | { type: "AGENT_WORKING";     agentId: string; task: string; progressPct: number }
  | { type: "AGENT_IDLE";        agentId: string }
  | { type: "AGENT_ERROR";       agentId: string; error: string; retryCount: number }
  | { type: "AGENT_BLOCKED";     agentId: string; reason: string; requiresHuman: true }
  | { type: "SWARM_START";       roomId: string; agents: string[]; task: string }
  | { type: "SWARM_END";         roomId: string; result: "SUCCESS"|"FAILED" }
  | { type: "METRIC_UPDATE";     ventasHoy: number; agentesActivos: number; costosUSD: number }
  | { type: "NOTIFICATION";      level: "info"|"warn"|"error"; title: string; body: string }
```

### Mensajes del Cliente → Servidor (acciones del dueño)

```typescript
type CampusCommand =
  | { type: "PLAYER_MOVE";       x: number; y: number }
  | { type: "INSPECT_AGENT";     agentId: string }       // Click sobre un agente
  | { type: "PAUSE_AGENT";       agentId: string }
  | { type: "RESUME_AGENT";      agentId: string }
  | { type: "OVERRIDE_TASK";     agentId: string; instruction: string }
  | { type: "APPROVE_ACTION";    actionId: string }      // Aprobar desde alerta 🚨
  | { type: "REJECT_ACTION";     actionId: string; reason?: string }
  | { type: "CHANGE_FLOOR";      buildingId: string; floorId: string }
```

---

## 4. CÓDIGO BASE: INICIALIZACIÓN DEL CAMPUS (Phaser.js)

```typescript
// services/campus-engine/CampusGame.ts

import Phaser from "phaser"
import { OfficeScene } from "./scenes/OfficeScene"
import { UIScene } from "./scenes/UIScene"

export function createCampusGame(containerId: string, config: CampusConfig): Phaser.Game {
  return new Phaser.Game({
    type: Phaser.AUTO,           // WebGL si disponible, Canvas como fallback
    width: window.innerWidth,
    height: window.innerHeight,
    backgroundColor: "#1a1a2e",
    parent: containerId,
    pixelArt: true,              // Pixel art sin blur
    roundPixels: true,
    physics: {
      default: "arcade",
      arcade: { gravity: { y: 0 }, debug: false }
    },
    scene: [OfficeScene, UIScene],
  })
}

// services/campus-engine/scenes/OfficeScene.ts

import Phaser from "phaser"

export class OfficeScene extends Phaser.Scene {
  private map!: Phaser.Tilemaps.Tilemap
  private playerSprite!: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody
  private agentSprites: Map<string, Phaser.GameObjects.Sprite> = new Map()
  private speechBubbles: Map<string, Phaser.GameObjects.Text> = new Map()
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys
  private wsClient!: WebSocket

  constructor() { super("OfficeScene") }

  preload() {
    this.load.tilemapTiledJSON("map", "/campus/maps/edificio-a-piso-1.json")
    this.load.image("tiles", "/campus/tilesets/office_tiles.png")
    this.load.spritesheet("player", "/campus/sprites/avatar_player.png", { frameWidth: 16, frameHeight: 16 })
    this.load.spritesheet("agent_leo", "/campus/sprites/agent_leo.png", { frameWidth: 16, frameHeight: 16 })
    this.load.spritesheet("agent_clara", "/campus/sprites/agent_clara.png", { frameWidth: 16, frameHeight: 16 })
  }

  create() {
    // Crear mapa de la oficina
    this.map = this.make.tilemap({ key: "map" })
    const tileset = this.map.addTilesetImage("office_tiles", "tiles")!
    this.map.createLayer("Floor", tileset)
    const wallLayer = this.map.createLayer("Walls", tileset)!
    wallLayer.setCollisionByProperty({ collides: true })

    // Player (el dueño)
    this.playerSprite = this.physics.add.sprite(200, 200, "player")
    this.physics.add.collider(this.playerSprite, wallLayer)
    this.cameras.main.startFollow(this.playerSprite, true, 0.1, 0.1)
    this.cameras.main.setZoom(3) // Zoom pixel art

    // Animaciones del player
    this.anims.create({ key: "player_walk_down",  frames: this.anims.generateFrameNumbers("player", { start: 0, end: 3 }), frameRate: 8, repeat: -1 })
    this.anims.create({ key: "player_walk_left",  frames: this.anims.generateFrameNumbers("player", { start: 4, end: 7 }), frameRate: 8, repeat: -1 })
    this.anims.create({ key: "player_walk_right", frames: this.anims.generateFrameNumbers("player", { start: 8, end: 11 }), frameRate: 8, repeat: -1 })
    this.anims.create({ key: "player_walk_up",    frames: this.anims.generateFrameNumbers("player", { start: 12, end: 15 }), frameRate: 8, repeat: -1 })
    this.anims.create({ key: "player_idle",       frames: [{ key: "player", frame: 0 }], frameRate: 1 })

    // Cursors + WASD
    this.cursors = this.input.keyboard!.createCursorKeys()
    this.input.keyboard!.addKeys("W,A,S,D")

    // Conectar WebSocket al servidor de campus
    this.connectWebSocket()

    // Colocar agentes iniciales en el mapa
    this.spawnAgent("leo-vendedor", 300, 200, "agent_leo")
    this.spawnAgent("facturador-afip", 400, 200, "agent_clara")
  }

  private spawnAgent(id: string, x: number, y: number, texture: string) {
    const sprite = this.add.sprite(x, y, texture)
    sprite.setInteractive()
    sprite.on("pointerdown", () => this.onAgentClick(id))
    sprite.on("pointerover", () => sprite.setTint(0xffffff))
    sprite.on("pointerout", () => sprite.clearTint())
    this.agentSprites.set(id, sprite)
  }

  private onAgentClick(agentId: string) {
    // Emite evento a la capa React para abrir el panel lateral
    this.game.events.emit("AGENT_INSPECTED", agentId)
  }

  private connectWebSocket() {
    this.wsClient = new WebSocket(`wss://campus.claver.com.ar/ws?empresaId=${getEmpresaId()}`)
    this.wsClient.onmessage = (event) => {
      const msg = JSON.parse(event.data)
      this.handleServerEvent(msg)
    }
  }

  private handleServerEvent(event: any) {
    switch (event.type) {
      case "AVATAR_MOVE":
        this.moveAgent(event.agentId, event.x, event.y)
        break
      case "AGENT_THINKING":
        this.showBubble(event.agentId, `💭 ${event.bubble}`, event.duration)
        break
      case "AGENT_WORKING":
        this.showBubble(event.agentId, `⚙️ ${event.task}`)
        break
      case "AGENT_BLOCKED":
        this.showAlert(event.agentId, `🚨 ${event.reason}`)
        this.game.events.emit("AGENT_BLOCKED", event)
        break
      case "SWARM_START":
        this.highlightRoom(event.roomId)
        break
    }
  }

  private showBubble(agentId: string, text: string, duration = 3000) {
    const sprite = this.agentSprites.get(agentId)
    if (!sprite) return

    const existing = this.speechBubbles.get(agentId)
    if (existing) existing.destroy()

    const bubble = this.add.text(sprite.x - 40, sprite.y - 30, text, {
      fontSize: "5px", color: "#ffffff", backgroundColor: "#1a1a2e",
      padding: { x: 3, y: 2 }, wordWrap: { width: 80 }
    })
    this.speechBubbles.set(agentId, bubble)

    this.time.delayedCall(duration, () => {
      bubble.destroy()
      this.speechBubbles.delete(agentId)
    })
  }

  private showAlert(agentId: string, text: string) {
    const sprite = this.agentSprites.get(agentId)
    if (!sprite) return
    // Parpadeo rojo y texto de alerta
    this.tweens.add({
      targets: sprite,
      tint: 0xff0000,
      duration: 500,
      yoyo: true,
      repeat: 5,
    })
    this.showBubble(agentId, text, 10000)
  }

  update() {
    const speed = 60
    const keys = this.input.keyboard!.addKeys("W,A,S,D") as any
    this.playerSprite.setVelocity(0)

    if (this.cursors.left.isDown || keys.A.isDown) {
      this.playerSprite.setVelocityX(-speed)
      this.playerSprite.anims.play("player_walk_left", true)
    } else if (this.cursors.right.isDown || keys.D.isDown) {
      this.playerSprite.setVelocityX(speed)
      this.playerSprite.anims.play("player_walk_right", true)
    } else if (this.cursors.up.isDown || keys.W.isDown) {
      this.playerSprite.setVelocityY(-speed)
      this.playerSprite.anims.play("player_walk_up", true)
    } else if (this.cursors.down.isDown || keys.S.isDown) {
      this.playerSprite.setVelocityY(speed)
      this.playerSprite.anims.play("player_walk_down", true)
    } else {
      this.playerSprite.anims.play("player_idle", true)
    }
  }
  
  private moveAgent(agentId: string, x: number, y: number) {
    const sprite = this.agentSprites.get(agentId)
    if (!sprite) return
    this.tweens.add({ targets: sprite, x, y, duration: 500, ease: "Linear" })
  }

  private highlightRoom(roomId: string) {
    // Ilumina la sala de reunión cuando hay un swarm activo
    // TODO: mapear roomId → coordenadas del rectángulo en el mapa
  }
}
```

---

## 5. COMPONENTE REACT: PANEL LATERAL DEL AGENTE

```tsx
// app/dashboard/campus/_components/AgentPanel.tsx
"use client"

import { useEffect, useState } from "react"
import { useCampusStore } from "@/lib/stores/campus-store"

interface AgentLog {
  timestamp: string
  tipo: "TAREA" | "ERROR" | "TOKENS" | "ACCION"
  mensaje: string
  tokens?: number
  costoUSD?: number
}

export function AgentPanel() {
  const { selectedAgent, agentLogs, closePanel, pauseAgent, overrideTask } = useCampusStore()
  const [instruction, setInstruction] = useState("")

  if (!selectedAgent) return null

  const totalTokens = agentLogs.reduce((sum, l) => sum + (l.tokens ?? 0), 0)
  const totalCosto = agentLogs.reduce((sum, l) => sum + (l.costoUSD ?? 0), 0)

  return (
    <div className="fixed right-0 top-0 h-full w-80 bg-slate-900/95 backdrop-blur border-l border-slate-700 z-50 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-slate-700 flex items-center justify-between">
        <div>
          <h3 className="font-bold text-white">{selectedAgent.nombre}</h3>
          <p className="text-xs text-slate-400">{selectedAgent.floorId}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => pauseAgent(selectedAgent.id)}
            className="px-2 py-1 bg-yellow-600 text-white text-xs rounded">⏸ Pausar</button>
          <button onClick={closePanel} className="text-slate-400 hover:text-white">✕</button>
        </div>
      </div>

      {/* Estado actual */}
      <div className="p-4 border-b border-slate-700">
        <div className="flex items-center gap-2 mb-2">
          <div className={`w-2 h-2 rounded-full ${selectedAgent.estado === "ACTIVO" ? "bg-green-400" : selectedAgent.estado === "BLOQUEADO" ? "bg-red-400 animate-pulse" : "bg-slate-400"}`} />
          <span className="text-sm text-white">{selectedAgent.estado}</span>
        </div>
        <p className="text-xs text-slate-300">{selectedAgent.tareaActual || "Esperando tarea..."}</p>
        <div className="mt-2 flex gap-4 text-xs text-slate-400">
          <span>🔢 {totalTokens.toLocaleString()} tokens</span>
          <span>💰 ${totalCosto.toFixed(4)} USD</span>
        </div>
      </div>

      {/* Log de actividad */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {agentLogs.map((log, i) => (
          <div key={i} className={`text-xs p-2 rounded border-l-2 ${
            log.tipo === "ERROR" ? "bg-red-950/50 border-red-500 text-red-300" :
            log.tipo === "ACCION" ? "bg-green-950/50 border-green-500 text-green-300" :
            "bg-slate-800/50 border-slate-600 text-slate-300"
          }`}>
            <div className="text-slate-500 text-[10px] mb-1">{log.timestamp}</div>
            {log.mensaje}
            {log.tokens && <span className="ml-2 text-slate-500">{log.tokens}t · ${log.costoUSD?.toFixed(6)}</span>}
          </div>
        ))}
      </div>

      {/* Override manual */}
      <div className="p-4 border-t border-slate-700">
        <p className="text-xs text-slate-400 mb-2">Instrucción manual al agente:</p>
        <div className="flex gap-2">
          <input
            value={instruction}
            onChange={e => setInstruction(e.target.value)}
            placeholder="Ej: Ofrece 10% de descuento..."
            className="flex-1 bg-slate-800 text-white text-xs px-2 py-1 rounded border border-slate-600"
          />
          <button onClick={() => { overrideTask(selectedAgent.id, instruction); setInstruction("") }}
            className="px-2 py-1 bg-blue-600 text-white text-xs rounded">▶</button>
        </div>
      </div>
    </div>
  )
}
```

---

## 6. ASSETS REQUERIDOS PARA EL MVP

### Sprites necesarios (16x16px, PNG, 4 frames por dirección):
| Sprite | Descripción | Cantidad de frames |
|:---|:---|:---|
| `avatar_player.png` | Tu avatar como dueño | 16 (4 dir × 4 walk) + 1 idle |
| `agent_leo.png` | Agente Vendedor WhatsApp | 16 + 1 idle + 2 "working" |
| `agent_clara.png` | Agente AFIP/Facturas | 16 + 1 idle + 2 "working" |
| `agent_guardian.png` | Guardián de Caja | 16 + 1 idle + 1 "alert" |
| `agent_ramiro.png` | Reponedor de Stock | 16 + 1 idle + 2 "working" |
| `agent_sofia.png` | Agenda/Turnos | 16 + 1 idle + 2 "working" |
| `office_tiles.png` | Tileset completo de oficina | 1 imagen (16x16 tiles) |
| `speech_bubble.png` | Globo de diálogo PNG | 1 (9-slice) |

### Mapas Tiled (JSON):
- `edificio-a-piso-1.json` — Oficina de Ventas (80×60 tiles)
- `edificio-a-piso-2.json` — Sala de E-commerce
- `edificio-b-piso-1.json` — Sala de AFIP y Finanzas
- `edificio-d-control.json` — Torre Matriz del dueño

> **Herramienta:** Tiled Map Editor (gratuito) → exportar en formato JSON → compatible con Phaser.js directamente.

---

## 7. CHECKLIST DE IMPLEMENTACIÓN FRONTEND

```
[ ] Instalar Phaser.js: pnpm add phaser
[ ] Crear /app/dashboard/campus/page.tsx con layout simplificado
[ ] Implementar CampusWrapper.tsx que monta Phaser en un <div> ref
[ ] Crear OfficeScene.ts con mapa de tiles básico (puede ser placeholder 40x30)
[ ] Crear WebSocket server en /services/campus-ws/
[ ] Implementar protocolo de eventos (AVATAR_MOVE, AGENT_THINKING, etc.)
[ ] Crear AgentPanel.tsx y conectarlo con game.events de Phaser
[ ] Crear MetricsBar.tsx con datos en tiempo real
[ ] Generar sprites de agentes (usar generador de imágenes si no hay diseñador)
[ ] Crear mapa básico en Tiled para Piso 1 Ventas
[ ] Testear en Chrome, Safari y Firefox
[ ] Asegurar responsive en tablet (iPad) 
[ ] Deploy en Vercel (mismo proyecto) o subdomain campus.claver.com.ar
```
