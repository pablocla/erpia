import { NextRequest, NextResponse } from "next/server"
import { calificarTrabajoPublico } from "@/lib/oficios/oficios-service"

export async function POST(
  request: NextRequest,
  props: { params: Promise<{ token: string }> },
) {
  const params = await props.params
  try {
    const body = await request.json()
    const { estrellas, comentario } = body

    if (!estrellas || typeof estrellas !== "number") {
      return NextResponse.json({ ok: false, error: "Calificación inválida" }, { status: 400 })
    }

    const actualizado = await calificarTrabajoPublico(
      params.token,
      estrellas,
      comentario,
    )

    return NextResponse.json({ ok: true, data: actualizado })
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
  }
}
