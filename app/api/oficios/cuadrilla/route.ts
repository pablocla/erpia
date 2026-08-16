import { NextRequest, NextResponse } from "next/server"
import { getAuthContext } from "@/lib/auth/empresa-guard"
import { getOperarios, createOperario, asignarOperario } from "@/lib/oficios/cuadrilla-service"

export async function GET(request: NextRequest) {
  const auth = getAuthContext(request)
  if (!auth.ok) return auth.response

  try {
    const operarios = await getOperarios(auth.auth.empresaId)
    return NextResponse.json({ ok: true, data: operarios })
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const auth = getAuthContext(request)
  if (!auth.ok) return auth.response

  try {
    const body = await request.json()
    if (body.action === "asignar") {
      const asignacion = await asignarOperario(
        auth.auth.empresaId,
        body.trabajoId,
        body.operarioId,
        body.notas,
      )
      return NextResponse.json({ ok: true, data: asignacion }, { status: 201 })
    }

    const operario = await createOperario(auth.auth.empresaId, body)
    return NextResponse.json({ ok: true, data: operario }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 400 })
  }
}
