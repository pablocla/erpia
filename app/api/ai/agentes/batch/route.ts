/**
 * POST /api/ai/agentes/batch — Run all agents for the empresa (nightly batch)
 * This endpoint is designed to be called by a cron job.
 */

import { NextRequest, NextResponse } from "next/server"
import { getAuthContext } from "@/lib/auth/empresa-guard"
import { agentRegistry } from "@/lib/ai/agents"

export async function POST(request: NextRequest) {
  const ctx = getAuthContext(request)
  if (!ctx.ok) return ctx.response

  // Only admin/superadmin can trigger batch
  if (!["admin", "superadmin"].includes(ctx.auth.rol)) {
    return NextResponse.json({ error: "Solo administradores pueden ejecutar batch" }, { status: 403 })
  }

  const results = await agentRegistry.executeAllForEmpresa(ctx.auth.empresaId, "manual")

  const summary = {
    total: results.length,
    exitosos: results.filter((r) => r.success).length,
    errores: results.filter((r) => !r.success).length,
    accionesTotales: results.reduce((sum, r) => sum + r.accionesEjecutadas, 0),
    tiempoTotalMs: results.reduce((sum, r) => sum + r.durationMs, 0),
    resultados: results.map((r) => ({
      agentId: r.agentId,
      success: r.success,
      resumen: r.resumen,
      acciones: r.accionesEjecutadas,
      durationMs: r.durationMs,
      error: r.error,
    })),
  }

  return NextResponse.json(summary)
}
