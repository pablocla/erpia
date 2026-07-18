import { prisma } from "@/lib/prisma"
import { agentRegistry } from "@/lib/ai/agents"
import { shouldRunInWindow } from "@/lib/ai/agents/cron-matcher"
import type { AgentRunContext, AgentRunResult } from "@/lib/ai/agents"
import { getSchedulerWindowMinutes } from "../scheduler-config"

export async function runScheduledAgents(now = new Date()) {
  const windowMinutes = Math.max(getSchedulerWindowMinutes(), 60)

  const empresas = await prisma.empresa.findMany({
    where: { deletedAt: null },
    select: { id: true, nombre: true },
  })

  const allAgents = agentRegistry.getAll()
  const results: Array<{ empresaId: number; agentId: string; result: AgentRunResult }> = []
  let skipped = 0

  for (const empresa of empresas) {
    for (const agent of allAgents) {
      if (agent.config.schedule.type !== "cron") continue

      const cronExpr = (agent.config.schedule as { expression: string }).expression
      if (!shouldRunInWindow(cronExpr, windowMinutes, now)) {
        skipped++
        continue
      }

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

      const ctx: AgentRunContext = {
        empresaId: empresa.id,
        triggeredBy: "schedule",
      }

      const result = await agentRegistry.executeAgent(agent.config.id, ctx)
      results.push({ empresaId: empresa.id, agentId: agent.config.id, result })
    }
  }

  return {
    timestamp: now.toISOString(),
    empresas: empresas.length,
    ejecutados: results.length,
    omitidos: skipped,
    exitosos: results.filter((r) => r.result.success).length,
    errores: results.filter((r) => !r.result.success).length,
    accionesTotales: results.reduce((s, r) => s + r.result.accionesEjecutadas, 0),
  }
}