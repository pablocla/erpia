import { type NextRequest, NextResponse } from "next/server"
import { getClaverAnalystContext } from "@/lib/auth/claver-analyst"
import { updateParadaEstado } from "@/lib/ops/hoja-ruta-service"

type Params = { params: Promise<{ id: string }> }

export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const ctx = await getClaverAnalystContext(request)
    if (!ctx.ok) return ctx.response

    const { id } = await params
    const paradaId = Number(id)
    if (!Number.isFinite(paradaId)) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 })
    }

    const body = await request.json()
    if (!body.estado?.trim()) {
      return NextResponse.json({ error: "estado es obligatorio" }, { status: 400 })
    }

    const hoja = await updateParadaEstado(paradaId, body.estado.trim())
    if (!hoja) return NextResponse.json({ error: "Parada no encontrada" }, { status: 404 })
    return NextResponse.json(hoja)
  } catch (error) {
    console.error("Error actualizando parada:", error)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}