import { NextRequest, NextResponse } from "next/server"
import { getAuthContext } from "@/lib/auth/empresa-guard"
import { liquidarSemanaOperario } from "@/lib/oficios/cuadrilla-service"

export async function POST(request: NextRequest) {
  const auth = await getAuthContext(request)
  if (!auth.ok) return auth.response

  try {
    const body = await request.json()
    const { operarioId, fechaDesde, fechaHasta } = body

    if (!operarioId || !fechaDesde || !fechaHasta) {
      return NextResponse.json(
        { ok: false, error: "operarioId, fechaDesde y fechaHasta son requeridos" },
        { status: 400 },
      )
    }

    const liquidacion = await liquidarSemanaOperario(
      auth.auth.empresaId,
      operarioId,
      new Date(fechaDesde),
      new Date(fechaHasta),
    )

    return NextResponse.json({ ok: true, data: liquidacion })
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
  }
}
