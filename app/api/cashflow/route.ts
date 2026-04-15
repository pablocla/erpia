import { NextRequest, NextResponse } from "next/server"
import { getAuthContext } from "@/lib/auth/empresa-guard"
import {
  generarProyeccionFlujoCaja,
  obtenerFlujoPorSemana,
  resumenFlujoCaja,
} from "@/lib/banco/cashflow-service"

// GET — Obtener flujo de caja proyectado
export async function GET(request: NextRequest) {
  const authResult = await getAuthContext(request)
  if (!authResult.ok) return authResult.response
  const { auth } = authResult

  const vista = request.nextUrl.searchParams.get("vista") ?? "semanal"
  const semanas = Number(request.nextUrl.searchParams.get("semanas") ?? 12)

  if (vista === "resumen") {
    const resumen = await resumenFlujoCaja(auth.empresaId)
    return NextResponse.json({ success: true, data: resumen })
  }

  const flujo = await obtenerFlujoPorSemana(auth.empresaId, semanas)
  return NextResponse.json({ success: true, data: flujo })
}

// POST — Regenerar proyección
export async function POST(request: NextRequest) {
  const authResult = await getAuthContext(request)
  if (!authResult.ok) return authResult.response
  const { auth } = authResult

  const body = await request.json().catch(() => ({}))
  const dias = body.diasHorizonte ?? 90

  const resultado = await generarProyeccionFlujoCaja(auth.empresaId, dias)
  return NextResponse.json({ success: true, data: resultado })
}
