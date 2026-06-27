import { type NextRequest, NextResponse } from "next/server"
import { getClaverAnalystContext } from "@/lib/auth/claver-analyst"
import { createHojaRuta, listHojasRuta } from "@/lib/ops/hoja-ruta-service"

export async function GET(request: NextRequest) {
  try {
    const ctx = await getClaverAnalystContext(request)
    if (!ctx.ok) return ctx.response

    const limit = Number(request.nextUrl.searchParams.get("limit") ?? 30)
    const rows = await listHojasRuta(Number.isFinite(limit) ? limit : 30)
    return NextResponse.json(rows)
  } catch (error) {
    console.error("Error listando hojas de ruta:", error)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const ctx = await getClaverAnalystContext(request)
    if (!ctx.ok) return ctx.response

    const body = await request.json()
    if (!body.titulo?.trim()) {
      return NextResponse.json({ error: "El título es obligatorio" }, { status: 400 })
    }
    if (!body.fecha) {
      return NextResponse.json({ error: "La fecha es obligatoria" }, { status: 400 })
    }
    if (!Array.isArray(body.paradas) || body.paradas.length === 0) {
      return NextResponse.json({ error: "Agregá al menos una parada" }, { status: 400 })
    }

    const hoja = await createHojaRuta(body, ctx.auth.email)
    return NextResponse.json(hoja, { status: 201 })
  } catch (error) {
    console.error("Error creando hoja de ruta:", error)
    return NextResponse.json(
      { error: "No se pudo crear. ¿Corriste db push para comercial_hojas_ruta?" },
      { status: 500 },
    )
  }
}