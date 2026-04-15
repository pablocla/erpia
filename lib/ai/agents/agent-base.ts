/**
 * Agent Base — Abstract base class for all autonomous agents
 *
 * Each agent extends this and implements execute().
 * The base handles: logging, error handling, timing, guard checks.
 */

import { prisma } from "@/lib/prisma"
import { isIAEnabled } from "../ia-guard"
import type { AgentConfig, AgentRunContext, AgentRunResult, AgentAction } from "./agent-types"

export abstract class AgentBase {
  abstract config: AgentConfig

  /** Core logic — implemented by each agent */
  protected abstract execute(ctx: AgentRunContext): Promise<{
    resumen: string
    acciones: AgentAction[]
  }>

  /** Run the agent with full lifecycle management */
  async run(ctx: AgentRunContext): Promise<AgentRunResult> {
    const start = Date.now()

    try {
      // Guard: check if IA is enabled for this empresa
      const iaEnabled = await isIAEnabled(ctx.empresaId)
      if (!iaEnabled) {
        return this.buildResult(ctx, start, {
          resumen: `IA deshabilitada para empresa ${ctx.empresaId}`,
          acciones: [],
          skipped: true,
        })
      }

      // Guard: check if this specific agent is enabled for the empresa
      const agentEnabled = await this.isAgentEnabled(ctx.empresaId)
      if (!agentEnabled) {
        return this.buildResult(ctx, start, {
          resumen: `Agente ${this.config.id} deshabilitado para empresa ${ctx.empresaId}`,
          acciones: [],
          skipped: true,
        })
      }

      // Execute the agent logic
      const result = await execute_with_timeout(
        () => this.execute(ctx),
        120_000 // 2 min timeout per agent
      )

      const runResult = this.buildResult(ctx, start, { ...result, skipped: false })

      // Persist execution log
      await this.persistLog(runResult)

      return runResult
    } catch (err) {
      const error = err instanceof Error ? err.message : String(err)
      const runResult: AgentRunResult = {
        agentId: this.config.id,
        empresaId: ctx.empresaId,
        success: false,
        resumen: `Error: ${error}`,
        accionesEjecutadas: 0,
        acciones: [],
        durationMs: Date.now() - start,
        error,
      }
      await this.persistLog(runResult).catch(() => {})
      return runResult
    }
  }

  /** Check if this agent is enabled for a specific empresa */
  private async isAgentEnabled(empresaId: number): Promise<boolean> {
    const row = await prisma.configuracionModulo.findUnique({
      where: { empresaId_modulo: { empresaId, modulo: `agente_${this.config.id}` } },
      select: { habilitado: true },
    })
    // Default to the agent config's defaultEnabled if no DB row
    return row?.habilitado ?? this.config.defaultEnabled
  }

  /** Persist execution log to DB */
  private async persistLog(result: AgentRunResult): Promise<void> {
    try {
      await prisma.agenteLog.create({
        data: {
          agenteId: result.agentId,
          empresaId: result.empresaId,
          triggeredBy: "api",
          status: result.success ? "success" : "error",
          resumen: result.resumen.slice(0, 500),
          accionesEjecutadas: result.accionesEjecutadas,
          durationMs: result.durationMs,
          error: result.error?.slice(0, 1000) ?? null,
          detalles: result.acciones as any,
        },
      })
    } catch (err) {
      console.error(`[Agent:${this.config.id}] Failed to persist log:`, err)
    }
  }

  private buildResult(
    ctx: AgentRunContext,
    startTime: number,
    data: { resumen: string; acciones: AgentAction[]; skipped?: boolean }
  ): AgentRunResult {
    return {
      agentId: this.config.id,
      empresaId: ctx.empresaId,
      success: !data.skipped,
      resumen: data.resumen,
      accionesEjecutadas: data.acciones.length,
      acciones: data.acciones,
      durationMs: Date.now() - startTime,
    }
  }
}

/** Execute with timeout */
async function execute_with_timeout<T>(fn: () => Promise<T>, timeoutMs: number): Promise<T> {
  return Promise.race([
    fn(),
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(`Agent timeout after ${timeoutMs}ms`)), timeoutMs)
    ),
  ])
}
