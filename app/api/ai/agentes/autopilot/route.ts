/**
 * POST /api/ai/agentes/autopilot — Enable/disable ALL agents at once
 *
 * Body: { enabled: boolean }
 * Toggles all 10 agents for the empresa in a single call.
 */

import { NextRequest, NextResponse } from "next/server"
import { getAuthContext } from "@/lib/auth/empresa-guard"
import { prisma } from "@/lib/prisma"
import { agentRegistry } from "@/lib/ai/agents"

export async function POST(request: NextRequest) {
  const ctx = await getAuthContext(request)
  if (!ctx.ok) return ctx.response

  const body = await request.json()
  const { enabled } = body as { enabled: boolean }

  if (typeof enabled !== "boolean") {
    return NextResponse.json({ error: "enabled (boolean) requerido" }, { status: 400 })
  }

  const allAgents = agentRegistry.getAll()
  const results: Array<{ agentId: string; modulo: string }> = []

  // Upsert all agent configs in a transaction
  await prisma.$transaction(
    allAgents.map((agent) => {
      const modulo = `agente_${agent.config.id}`
      results.push({ agentId: agent.config.id, modulo })
      return prisma.configuracionModulo.upsert({
        where: { empresaId_modulo: { empresaId: ctx.auth.empresaId, modulo } },
        create: { empresaId: ctx.auth.empresaId, modulo, habilitado: enabled },
        update: { habilitado: enabled },
      })
    })
  )

  return NextResponse.json({
    ok: true,
    enabled,
    agentes: results.length,
    mensaje: enabled
      ? `Piloto automático ACTIVADO — ${results.length} agentes habilitados`
      : `Piloto automático DESACTIVADO — ${results.length} agentes deshabilitados`,
  })
}

export async function GET(request: NextRequest) {
  const ctx = await getAuthContext(request)
  if (!ctx.ok) return ctx.response

  const allAgents = agentRegistry.getAll()
  const modulos = allAgents.map((a) => `agente_${a.config.id}`)

  const configs = await prisma.configuracionModulo.findMany({
    where: { empresaId: ctx.auth.empresaId, modulo: { in: modulos } },
    select: { modulo: true, habilitado: true },
  })

  const enabledMap = new Map(configs.map((c) => [c.modulo, c.habilitado]))

  // Auto-pilot is ON if ALL agents with defaultEnabled are enabled
  const allEnabled = allAgents.every((a) => {
    const db = enabledMap.get(`agente_${a.config.id}`)
    return db ?? a.config.defaultEnabled
  })

  return NextResponse.json({
    autopilot: allEnabled,
    agentes: allAgents.map((a) => ({
      id: a.config.id,
      enabled: enabledMap.get(`agente_${a.config.id}`) ?? a.config.defaultEnabled,
    })),
  })
}
