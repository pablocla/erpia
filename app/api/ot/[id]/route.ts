import { type NextRequest, NextResponse } from "next/server"
import { getAuthContext } from "@/lib/auth/empresa-guard"
import { OTService } from "@/lib/ot/ot-service"

async function handler(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await getAuthContext(request)
  if (!auth.ok) return auth.response

  try {
    const { id } = await params
    const otId = parseInt(id, 10)
    if (isNaN(otId)) return NextResponse.json({ error: "ID inválido" }, { status: 400 })

    const body = await request.json().catch(() => ({}))

    const patch: {
      estado?: string
      tecnicoAsignado?: string | null
      fechaPrometida?: Date | string | null
      descripcion?: string | null
      titulo?: string
      metadata?: Record<string, unknown>
    } = {}

    if (typeof body.estado === "string") patch.estado = body.estado
    if (body.tecnicoAsignado !== undefined) patch.tecnicoAsignado = body.tecnicoAsignado
    if (body.fechaPrometida !== undefined) patch.fechaPrometida = body.fechaPrometida
    if (body.descripcion !== undefined) patch.descripcion = body.descripcion
    if (typeof body.titulo === "string") patch.titulo = body.titulo
    if (body.metadata && typeof body.metadata === "object") patch.metadata = body.metadata

    if (Object.keys(patch).length === 0) {
      return NextResponse.json({ error: "No se enviaron campos para actualizar" }, { status: 400 })
    }

    const ot = await new OTService().actualizarOrden(auth.auth.empresaId, otId, patch)
    return NextResponse.json(ot)
  } catch (error: any) {
    console.error("[PUT/PATCH /api/ot/:id]", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error al actualizar la orden de servicio" },
      { status: 500 },
    )
  }
}

export async function PUT(request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  return handler(request, ctx)
}

export async function PATCH(request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  return handler(request, ctx)
}
