/**
 * Agent Registry — Central registry + orchestrator for all agents
 *
 * Manages: agent registration, execution for all empresas,
 * status tracking, and event-based triggering.
 */

import { prisma } from "@/lib/prisma"
import { AgentBase } from "./agent-base"
import type { AgentId, AgentRunContext, AgentRunResult, AgentStatusInfo, AgentConfig } from "./agent-types"

class AgentRegistry {
  private agents = new Map<AgentId, AgentBase>()
  private runningAgents = new Set<string>() // "agentId:empresaId"

  /** Register an agent */
  register(agent: AgentBase): void {
    this.agents.set(agent.config.id, agent)
  }

  /** Get all registered agents */
  getAll(): AgentBase[] {
    return Array.from(this.agents.values())
  }

  /** Get a specific agent */
  get(id: AgentId): AgentBase | undefined {
    return this.agents.get(id)
  }

  /** Get all agent configs */
  getConfigs(): AgentConfig[] {
    return this.getAll().map((a) => a.config)
  }

  /** Check if an agent is currently running for a specific empresa */
  isRunning(agentId: AgentId, empresaId: number): boolean {
    return this.runningAgents.has(`${agentId}:${empresaId}`)
  }

  /**
   * Execute a specific agent for a specific empresa
   * Prevents concurrent execution of the same agent for the same empresa.
   */
  async executeAgent(agentId: AgentId, ctx: AgentRunContext): Promise<AgentRunResult> {
    const agent = this.agents.get(agentId)
    if (!agent) {
      return {
        agentId,
        empresaId: ctx.empresaId,
        success: false,
        resumen: `Agente ${agentId} no registrado`,
        accionesEjecutadas: 0,
        acciones: [],
        durationMs: 0,
        error: "Agent not found",
      }
    }

    const key = `${agentId}:${ctx.empresaId}`
    if (this.runningAgents.has(key)) {
      return {
        agentId,
        empresaId: ctx.empresaId,
        success: false,
        resumen: `Agente ${agentId} ya está ejecutándose para empresa ${ctx.empresaId}`,
        accionesEjecutadas: 0,
        acciones: [],
        durationMs: 0,
        error: "Already running",
      }
    }

    this.runningAgents.add(key)
    try {
      return await agent.run(ctx)
    } finally {
      this.runningAgents.delete(key)
    }
  }

  /**
   * Execute ALL agents for a specific empresa (nightly batch)
   * Runs agents sequentially to avoid GPU saturation.
   */
  async executeAllForEmpresa(empresaId: number, triggeredBy: AgentRunContext["triggeredBy"] = "schedule"): Promise<AgentRunResult[]> {
    const results: AgentRunResult[] = []

    for (const agent of this.agents.values()) {
      const ctx: AgentRunContext = { empresaId, triggeredBy }
      const result = await this.executeAgent(agent.config.id, ctx)
      results.push(result)
    }

    return results
  }

  /**
   * Execute ALL agents for ALL active empresas (global nightly run)
   * Processes one empresa at a time to avoid GPU overload.
   */
  async executeGlobalBatch(): Promise<Map<number, AgentRunResult[]>> {
    const empresas = await prisma.empresa.findMany({
      where: { activa: true },
      select: { id: true },
    })

    const allResults = new Map<number, AgentRunResult[]>()

    for (const empresa of empresas) {
      const results = await this.executeAllForEmpresa(empresa.id, "schedule")
      allResults.set(empresa.id, results)
    }

    return allResults
  }

  /**
   * Handle an ERP event — trigger all agents that react to this event type
   */
  async handleEvent(eventType: string, empresaId: number, payload: unknown): Promise<AgentRunResult[]> {
    const results: AgentRunResult[] = []

    for (const agent of this.agents.values()) {
      if (agent.config.reactsTo.includes(eventType)) {
        const ctx: AgentRunContext = {
          empresaId,
          triggeredBy: "event",
          eventPayload: payload,
        }
        const result = await this.executeAgent(agent.config.id, ctx)
        results.push(result)
      }
    }

    return results
  }

  /**
   * Get status info for all agents for a specific empresa
   */
  async getStatusForEmpresa(empresaId: number): Promise<AgentStatusInfo[]> {
    const statuses: AgentStatusInfo[] = []

    for (const agent of this.agents.values()) {
      // Get last log
      const lastLog = await prisma.agenteLog.findFirst({
        where: { agenteId: agent.config.id, empresaId },
        orderBy: { createdAt: "desc" },
        select: { createdAt: true, status: true },
      })

      // Get totals
      const [totalRuns, totalActions] = await Promise.all([
        prisma.agenteLog.count({
          where: { agenteId: agent.config.id, empresaId },
        }),
        prisma.agenteLog.aggregate({
          where: { agenteId: agent.config.id, empresaId },
          _sum: { accionesEjecutadas: true },
        }),
      ])

      // Check if enabled
      const moduleRow = await prisma.configuracionModulo.findUnique({
        where: { empresaId_modulo: { empresaId, modulo: `agente_${agent.config.id}` } },
        select: { habilitado: true },
      })
      const enabled = moduleRow?.habilitado ?? agent.config.defaultEnabled

      const isRunning = this.isRunning(agent.config.id, empresaId)

      statuses.push({
        agentId: agent.config.id,
        config: agent.config,
        status: !enabled ? "disabled" : isRunning ? "running" : "idle",
        enabled,
        lastRun: lastLog?.createdAt ?? undefined,
        lastResult: lastLog?.status as "success" | "error" | undefined,
        totalRuns,
        totalActions: totalActions._sum.accionesEjecutadas ?? 0,
      })
    }

    return statuses
  }
}

// Singleton
export const agentRegistry = new AgentRegistry()
