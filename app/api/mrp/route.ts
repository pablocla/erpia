import { NextRequest, NextResponse } from "next/server"
import { getAuthContext } from "@/lib/auth/empresa-guard"
import {
  ejecutarMRP,
  ultimaCorrida,
  aceptarSugerencia,
  rechazarSugerencia,
} from "@/lib/industria/mrp-service"

// GET — Última corrida MRP con sugerencias
export async function GET(request: NextRequest) {
  const authResult = await getAuthContext(request)
  if (!authResult.ok) return authResult.response
  const { auth } = authResult

  const corrida = await ultimaCorrida(auth.empresaId)
  return NextResponse.json({ success: true, data: corrida })
}

// POST — Ejecutar nueva corrida o procesar sugerencia
export async function POST(request: NextRequest) {
  const authResult = await getAuthContext(request)
  if (!authResult.ok) return authResult.response
  const { auth } = authResult

  const body = await request.json().catch(() => ({}))

  if (body.sugerenciaId) {
    if (body.accion === "aceptar") {
      const s = await aceptarSugerencia(body.sugerenciaId)
      return NextResponse.json({ success: true, data: s })
    }
    if (body.accion === "rechazar") {
      const s = await rechazarSugerencia(body.sugerenciaId)
      return NextResponse.json({ success: true, data: s })
    }
  }

  const resultado = await ejecutarMRP(auth.empresaId, body.horizonte ?? 30)
  return NextResponse.json({ success: true, data: resultado }, { status: 201 })
}
