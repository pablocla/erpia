/**
 * Campus Store — Zustand state for MetaSwarm Campus 2D
 * 
 * Bridges Phaser.js game events ↔ React overlay panels.
 * The game emits events (agent clicked, metric updated), React reads them here.
 */

import { create } from "zustand"

// ─── Types ─────────────────────────────────────────────────────────────────────

export type CampusAgentStatus = "idle" | "working" | "thinking" | "blocked" | "error"

export interface CampusAgent {
  id: string
  nombre: string
  icono: string
  rol: string
  edificio: string
  piso: string
  estado: CampusAgentStatus
  tareaActual: string | null
  x: number
  y: number
  nivel: number
  xp: number
  tokensHoy: number
  costoUSD: number
}

export interface CampusLog {
  timestamp: string
  tipo: "TAREA" | "ERROR" | "TOKENS" | "ACCION" | "COBRO"
  mensaje: string
  tokens?: number
  costoUSD?: number
}

export interface CampusMetrics {
  ventasHoy: number
  cobrosHoy: number
  agentesActivos: number
  tareasCompletadas: number
  tokensUsados: number
  costoTotalUSD: number
}

export interface CampusFloor {
  id: string
  edificio: string
  nombre: string
  agentes: string[]
}

// ─── Store ─────────────────────────────────────────────────────────────────────

interface CampusState {
  // Navigation
  currentFloor: string
  floors: CampusFloor[]

  // Agents
  agents: CampusAgent[]
  selectedAgentId: string | null
  agentLogs: CampusLog[]

  // Metrics
  metrics: CampusMetrics

  // UI state
  showPanel: boolean
  showMetrics: boolean
  notifications: Array<{ id: string; level: "info" | "warn" | "error"; title: string; body: string }>

  // Actions
  setCurrentFloor: (floorId: string) => void
  selectAgent: (agentId: string | null) => void
  updateAgentStatus: (agentId: string, status: CampusAgentStatus, tarea?: string) => void
  addLog: (log: CampusLog) => void
  updateMetrics: (metrics: Partial<CampusMetrics>) => void
  addNotification: (n: { level: "info" | "warn" | "error"; title: string; body: string }) => void
  dismissNotification: (id: string) => void
  initializeAgents: (agents: CampusAgent[]) => void
}

// ─── Default agents (mapped from the real agent registry) ──────────────────────

const DEFAULT_AGENTS: CampusAgent[] = [
  {
    id: "cobranzas",
    nombre: "Leo",
    icono: "💰",
    rol: "Cobrador Digital",
    edificio: "Ventas",
    piso: "piso-1",
    estado: "idle",
    tareaActual: null,
    x: 180, y: 200,
    nivel: 3, xp: 127,
    tokensHoy: 0, costoUSD: 0,
  },
  {
    id: "alertas-stock",
    nombre: "Ramiro",
    icono: "📦",
    rol: "Reponedor JIT",
    edificio: "Depósito",
    piso: "piso-1",
    estado: "idle",
    tareaActual: null,
    x: 340, y: 200,
    nivel: 2, xp: 64,
    tokensHoy: 0, costoUSD: 0,
  },
  {
    id: "anomalias",
    nombre: "Guardián",
    icono: "🛡️",
    rol: "Guardián de Caja",
    edificio: "Finanzas",
    piso: "piso-2",
    estado: "idle",
    tareaActual: null,
    x: 500, y: 200,
    nivel: 4, xp: 210,
    tokensHoy: 0, costoUSD: 0,
  },
  {
    id: "reportes",
    nombre: "Clara",
    icono: "📊",
    rol: "CAE Monitor & Reportes",
    edificio: "Finanzas",
    piso: "piso-1",
    estado: "idle",
    tareaActual: null,
    x: 500, y: 340,
    nivel: 5, xp: 312,
    tokensHoy: 0, costoUSD: 0,
  },
  {
    id: "ventas-leads",
    nombre: "Ana",
    icono: "🎯",
    rol: "CRM & Leads",
    edificio: "Ventas",
    piso: "piso-3",
    estado: "idle",
    tareaActual: null,
    x: 180, y: 340,
    nivel: 2, xp: 55,
    tokensHoy: 0, costoUSD: 0,
  },
  {
    id: "marketing",
    nombre: "Sofía",
    icono: "📱",
    rol: "Agenda & Turnos",
    edificio: "Ventas",
    piso: "piso-3",
    estado: "idle",
    tareaActual: null,
    x: 180, y: 480,
    nivel: 1, xp: 18,
    tokensHoy: 0, costoUSD: 0,
  },
]

const DEFAULT_FLOORS: CampusFloor[] = [
  { id: "piso-1", edificio: "🏢 Ventas", nombre: "Atención & WhatsApp", agentes: ["cobranzas"] },
  { id: "piso-2", edificio: "🏦 Finanzas", nombre: "Caja & AFIP", agentes: ["anomalias"] },
  { id: "piso-3", edificio: "🏢 Ventas", nombre: "CRM & Agenda", agentes: ["ventas-leads", "marketing"] },
  { id: "deposito-1", edificio: "📦 Depósito", nombre: "Stock & Reposición", agentes: ["alertas-stock"] },
]

export const useCampusStore = create<CampusState>((set, get) => ({
  // State
  currentFloor: "all",
  floors: DEFAULT_FLOORS,
  agents: DEFAULT_AGENTS,
  selectedAgentId: null,
  agentLogs: [],
  metrics: {
    ventasHoy: 0,
    cobrosHoy: 0,
    agentesActivos: 0,
    tareasCompletadas: 0,
    tokensUsados: 0,
    costoTotalUSD: 0,
  },
  showPanel: false,
  showMetrics: true,
  notifications: [],

  // Actions
  setCurrentFloor: (floorId) => set({ currentFloor: floorId }),

  selectAgent: (agentId) =>
    set({
      selectedAgentId: agentId,
      showPanel: agentId !== null,
      agentLogs: agentId ? [] : get().agentLogs,
    }),

  updateAgentStatus: (agentId, estado, tarea) =>
    set((s) => ({
      agents: s.agents.map((a) =>
        a.id === agentId ? { ...a, estado, tareaActual: tarea ?? a.tareaActual } : a
      ),
    })),

  addLog: (log) =>
    set((s) => ({
      agentLogs: [log, ...s.agentLogs].slice(0, 50),
    })),

  updateMetrics: (partial) =>
    set((s) => ({
      metrics: { ...s.metrics, ...partial },
    })),

  addNotification: (n) =>
    set((s) => ({
      notifications: [...s.notifications, { ...n, id: `n-${Date.now()}` }],
    })),

  dismissNotification: (id) =>
    set((s) => ({
      notifications: s.notifications.filter((n) => n.id !== id),
    })),

  initializeAgents: (agents) => set({ agents }),
}))
