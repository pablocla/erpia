/**
 * Campus Agents Status API
 * Returns current status of all registered agents for the campus 2D view.
 */

import { NextResponse } from "next/server"

// Agent configs matching the real agent-registry (hardcoded for now to avoid
// importing the full agent system which has side effects via bootstrap.ts)
const CAMPUS_AGENTS = [
  {
    id: "cobranzas",
    nombre: "Leo",
    icono: "💰",
    rol: "Cobrador Digital — Fiados & WhatsApp",
    edificio: "Ventas",
    piso: "piso-1",
    estado: "idle" as const,
    tareaActual: null,
    x: 180, y: 200,
    nivel: 3, xp: 127,
    tokensHoy: 1240, costoUSD: 0.0018,
  },
  {
    id: "alertas-stock",
    nombre: "Ramiro",
    icono: "📦",
    rol: "Reponedor JIT — Stock bajo mínimo",
    edificio: "Depósito",
    piso: "deposito-1",
    estado: "idle" as const,
    tareaActual: null,
    x: 340, y: 200,
    nivel: 2, xp: 64,
    tokensHoy: 320, costoUSD: 0.0005,
  },
  {
    id: "anomalias",
    nombre: "Guardián",
    icono: "🛡️",
    rol: "Guardián de Caja — Anulaciones sospechosas",
    edificio: "Finanzas",
    piso: "piso-2",
    estado: "idle" as const,
    tareaActual: null,
    x: 500, y: 200,
    nivel: 4, xp: 210,
    tokensHoy: 890, costoUSD: 0.0013,
  },
  {
    id: "reportes",
    nombre: "Clara",
    icono: "📊",
    rol: "CAE Monitor & Libro IVA",
    edificio: "Finanzas",
    piso: "piso-1",
    estado: "idle" as const,
    tareaActual: null,
    x: 500, y: 340,
    nivel: 5, xp: 312,
    tokensHoy: 2100, costoUSD: 0.0031,
  },
  {
    id: "ventas-leads",
    nombre: "Ana",
    icono: "🎯",
    rol: "CRM & Calificación de Leads",
    edificio: "Ventas",
    piso: "piso-3",
    estado: "idle" as const,
    tareaActual: null,
    x: 180, y: 340,
    nivel: 2, xp: 55,
    tokensHoy: 450, costoUSD: 0.0007,
  },
  {
    id: "marketing",
    nombre: "Sofía",
    icono: "📱",
    rol: "Agenda, Turnos & Recordatorios",
    edificio: "Ventas",
    piso: "piso-3",
    estado: "idle" as const,
    tareaActual: null,
    x: 180, y: 480,
    nivel: 1, xp: 18,
    tokensHoy: 180, costoUSD: 0.0003,
  },
]

export async function GET() {
  // Simulate some agents being active
  const now = new Date()
  const hour = now.getHours()
  const agentsWithState = CAMPUS_AGENTS.map((agent) => {
    // Simulate different states based on time
    if (agent.id === "cobranzas" && hour >= 9 && hour <= 18) {
      return { ...agent, estado: "working" as const, tareaActual: "Enviando recordatorios de fiado por WhatsApp..." }
    }
    if (agent.id === "anomalias" && hour >= 8 && hour <= 20) {
      return { ...agent, estado: "working" as const, tareaActual: "Monitoreando anulaciones de caja..." }
    }
    if (agent.id === "reportes" && now.getMinutes() % 15 === 0) {
      return { ...agent, estado: "thinking" as const, tareaActual: "Verificando cola de facturas sin CAE..." }
    }
    return agent
  })

  return NextResponse.json({
    agents: agentsWithState,
    metrics: {
      ventasHoy: 47_350,
      cobrosHoy: 23_100,
      agentesActivos: agentsWithState.filter((a) => a.estado !== "idle").length,
      tareasCompletadas: 34,
      tokensUsados: agentsWithState.reduce((sum, a) => sum + a.tokensHoy, 0),
      costoTotalUSD: agentsWithState.reduce((sum, a) => sum + a.costoUSD, 0),
    },
  })
}
