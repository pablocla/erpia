import { type NextRequest, NextResponse } from "next/server"
import { getClaverAnalystContext } from "@/lib/auth/claver-analyst"
import { createRelevamiento, listRelevamientos } from "@/lib/ops/comercial-relevamiento-service"

export async function GET(request: NextRequest) {
  try {
    const ctx = await getClaverAnalystContext(request)
    if (!ctx.ok) return ctx.response

    const limit = Number(request.nextUrl.searchParams.get("limit") ?? 50)
    const rows = await listRelevamientos(Number.isFinite(limit) ? limit : 50)
    return NextResponse.json(rows)
  } catch (error) {
    console.error("Error listando relevamientos:", error)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const ctx = await getClaverAnalystContext(request)
    if (!ctx.ok) return ctx.response

    const body = await request.json()
    if (!body.negocio?.trim()) {
      return NextResponse.json({ error: "El nombre del comercio es obligatorio" }, { status: 400 })
    }

    const result = await createRelevamiento(body, ctx.auth.email)
    return NextResponse.json(result, { status: 201 })
  } catch (error) {
    console.error("Error creando relevamiento:", error)
    return NextResponse.json(
      { error: "No se pudo guardar. ¿Corriste db push para comercial_relevamiento_visitas?" },
      { status: 500 },
    )
  }
}