/**
 * GET /api/ai/agentes — List all agents and their status
 * POST /api/ai/agentes — Execute a specific agent manually
 * PATCH /api/ai/agentes — Enable/disable an agent for the empresa
 */

import { NextRequest, NextResponse } from "next/server"
import { getAuthContext } from "@/lib/auth/empresa-guard"
import { prisma } from "@/lib/prisma"
import { agentRegistry } from "@/lib/ai/agents"
import type { AgentId, AgentRunContext } from "@/lib/ai/agents"

export async function GET(request: NextRequest) {
  const ctx = getAuthContext(request)
  if (!ctx.ok) return ctx.response

  const statuses = await agentRegistry.getStatusForEmpresa(ctx.auth.empresaId)

  return NextResponse.json({
    agentes: statuses,
    total: statuses.length,
    activos: statuses.filter((s) => s.enabled).length,
    ejecutando: statuses.filter((s) => s.status === "running").length,
  })
}

export async function POST(request: NextRequest) {
  const ctx = getAuthContext(request)
  if (!ctx.ok) return ctx.response

  const body = await request.json()
  const { agentId } = body as { agentId: AgentId }

  if (!agentId) {
    return NextResponse.json({ error: "agentId requerido" }, { status: 400 })
  }

  const agent = agentRegistry.get(agentId)
  if (!agent) {
    return NextResponse.json({ error: `Agente ${agentId} no encontrado` }, { status: 404 })
  }

  const runCtx: AgentRunContext = {
    empresaId: ctx.auth.empresaId,
    userId: ctx.auth.userId,
    triggeredBy: "manual",
  }

  const result = await agentRegistry.executeAgent(agentId, runCtx)

  return NextResponse.json(result, { status: result.success ? 200 : 500 })
}

export async function PATCH(request: NextRequest) {
  const ctx = getAuthContext(request)
  if (!ctx.ok) return ctx.response

  const body = await request.json()
  const { agentId, enabled } = body as { agentId: string; enabled: boolean }

  if (!agentId || typeof enabled !== "boolean") {
    return NextResponse.json({ error: "agentId y enabled requeridos" }, { status: 400 })
  }

  const modulo = `agente_${agentId}`

  await prisma.configuracionModulo.upsert({
    where: { empresaId_modulo: { empresaId: ctx.auth.empresaId, modulo } },
    create: { empresaId: ctx.auth.empresaId, modulo, habilitado: enabled },
    update: { habilitado: enabled },
  })

  return NextResponse.json({ ok: true, agentId, enabled })
}
