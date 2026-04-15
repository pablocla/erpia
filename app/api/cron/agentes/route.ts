/**
 * GET/POST /api/cron/agentes — Automatic agent scheduler
 *
 * Called by external cron (Railway/Vercel/GitHub Actions) every hour.
 * Checks each agent's cron expression, runs the ones that are due.
 *
 * Security: uses CRON_SECRET header to prevent unauthorized execution.
 *
 * Setup:
 *   - Railway: add cron job calling POST /api/cron/agentes every hour
 *   - Vercel: add to vercel.json crons config
 *   - curl: curl -X POST https://your-app/api/cron/agentes -H "Authorization: Bearer $CRON_SECRET"
 */

import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { agentRegistry } from "@/lib/ai/agents"
import { shouldRunInWindow } from "@/lib/ai/agents/cron-matcher"
import type { AgentRunContext, AgentRunResult } from "@/lib/ai/agents"

const CRON_SECRET = process.env.CRON_SECRET

export async function POST(request: NextRequest) {
  // Auth: verify cron secret (skip in dev)
  if (CRON_SECRET) {
    const auth = request.headers.get("authorization")
    if (auth !== `Bearer ${CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
  }

  const now = new Date()
  const windowMinutes = 60 // Check if agent was due in the last 60 min (hourly cron)

  // Get all active empresas
  const empresas = await prisma.empresa.findMany({
    where: { activa: true },
    select: { id: true, nombre: true },
  })

  const allAgents = agentRegistry.getAll()
  const results: Array<{ empresaId: number; agentId: string; result: AgentRunResult }> = []
  let skipped = 0

  for (const empresa of empresas) {
    for (const agent of allAgents) {
      // Skip non-cron agents (manual, event-only)
      if (agent.config.schedule.type !== "cron") continue

      const cronExpr = (agent.config.schedule as { expression: string }).expression

      // Check if this agent should run within the cron window
      if (!shouldRunInWindow(cronExpr, windowMinutes, now)) {
        skipped++
        continue
      }

      // Check if already ran recently (avoid double-execution on retry)
      const recentLog = await prisma.agenteLog.findFirst({
        where: {
          agenteId: agent.config.id,
          empresaId: empresa.id,
          createdAt: { gte: new Date(now.getTime() - windowMinutes * 60_000) },
        },
      })

      if (recentLog) {
        skipped++
        continue
      }

      // Execute the agent
      const ctx: AgentRunContext = {
        empresaId: empresa.id,
        triggeredBy: "schedule",
      }

      const result = await agentRegistry.executeAgent(agent.config.id, ctx)
      results.push({ empresaId: empresa.id, agentId: agent.config.id, result })
    }
  }

  const summary = {
    timestamp: now.toISOString(),
    empresas: empresas.length,
    ejecutados: results.length,
    omitidos: skipped,
    exitosos: results.filter((r) => r.result.success).length,
    errores: results.filter((r) => !r.result.success).length,
    accionesTotales: results.reduce((s, r) => s + r.result.accionesEjecutadas, 0),
    detalle: results.map((r) => ({
      empresaId: r.empresaId,
      agentId: r.agentId,
      success: r.result.success,
      resumen: r.result.resumen,
      acciones: r.result.accionesEjecutadas,
      durationMs: r.result.durationMs,
    })),
  }

  console.log(`[Cron] ${summary.ejecutados} agentes ejecutados, ${summary.omitidos} omitidos, ${summary.errores} errores`)

  return NextResponse.json(summary)
}

// GET also works (for health checks / manual browser trigger in dev)
export async function GET(request: NextRequest) {
  return POST(request)
}
