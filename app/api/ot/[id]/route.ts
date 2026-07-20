import { type NextRequest, NextResponse } from "next/server"
import { getAuthContext } from "@/lib/auth/empresa-guard"
import { OTService } from "@/lib/ot/ot-service"

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await getAuthContext(request)
  if (!auth.ok) return auth.response

  try {
    const { id } = await params
    const otId = parseInt(id)
    if (isNaN(otId)) return NextResponse.json({ error: "ID inválido" }, { status: 400 })

    const body = await request.json()
    const nuevoEstado = typeof body.estado === "string" ? body.estado : null

    if (!nuevoEstado) {
      return NextResponse.json({ error: "estado requerido" }, { status: 400 })
    }

    const ot = await new OTService().cambiarEstado(auth.auth.empresaId, otId, nuevoEstado)
    return NextResponse.json(ot)
  } catch (error: any) {
    console.error("[PUT /api/ot/:id]", error)
    return NextResponse.json({ error: "Error al actualizar la OT" }, { status: 500 })
  }
}
