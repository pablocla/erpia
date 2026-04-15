/**
 * GET /api/ai/agentes/logs — Get agent execution logs
 * Query params: agentId?, limit?, status?
 */

import { NextRequest, NextResponse } from "next/server"
import { getAuthContext } from "@/lib/auth/empresa-guard"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  const ctx = await getAuthContext(request)
  if (!ctx.ok) return ctx.response

  const { searchParams } = request.nextUrl
  const agentId = searchParams.get("agentId")
  const status = searchParams.get("status")
  const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 200)

  const where: any = { empresaId: ctx.auth.empresaId }
  if (agentId) where.agenteId = agentId
  if (status) where.status = status

  const [logs, total] = await Promise.all([
    prisma.agenteLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit,
    }),
    prisma.agenteLog.count({ where }),
  ])

  // Summary stats
  const stats = await prisma.agenteLog.groupBy({
    by: ["agenteId"],
    where: { empresaId: ctx.auth.empresaId },
    _count: { id: true },
    _sum: { accionesEjecutadas: true, durationMs: true },
    _avg: { durationMs: true },
  })

  return NextResponse.json({
    logs,
    total,
    stats: stats.map((s) => ({
      agenteId: s.agenteId,
      totalEjecuciones: s._count.id,
      totalAcciones: s._sum.accionesEjecutadas ?? 0,
      tiempoTotalMs: s._sum.durationMs ?? 0,
      tiempoPromedioMs: Math.round(s._avg.durationMs ?? 0),
    })),
  })
}
