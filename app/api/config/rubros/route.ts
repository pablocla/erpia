import { NextRequest, NextResponse } from "next/server"
import { getAuthContext } from "@/lib/auth/empresa-guard"
import { prisma } from "@/lib/prisma"
import {
  listarRubrosConStats,
  seedCompletoRubro,
  getFeaturesAgrupadasPorRubro,
  getWorkflowsConPasos,
} from "@/lib/config/configuracion-feature-service"

// GET — Listar rubros con stats de features y workflows
export async function GET(req: NextRequest) {
  const ctx = await getAuthContext(req)
  if (!ctx.ok) return ctx.response

  const rubros = await listarRubrosConStats()
  return NextResponse.json(rubros)
}

// POST — Seed completo de features + workflows para un rubro
export async function POST(req: NextRequest) {
  const ctx = await getAuthContext(req)
  if (!ctx.ok) return ctx.response
  if (ctx.auth.rol !== "administrador") {
    return NextResponse.json({ error: "Solo administradores" }, { status: 403 })
  }

  const body = await req.json()
  const { rubroId, rubroCodigo } = body as { rubroId: number; rubroCodigo: string }

  if (!rubroId || !rubroCodigo) {
    return NextResponse.json({ error: "rubroId y rubroCodigo requeridos" }, { status: 400 })
  }

  const result = await seedCompletoRubro(rubroId, rubroCodigo)
  return NextResponse.json(result)
}
