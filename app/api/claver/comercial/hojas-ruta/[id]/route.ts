import { type NextRequest, NextResponse } from "next/server"
import { getClaverAnalystContext } from "@/lib/auth/claver-analyst"
import { getHojaRuta, updateHojaRutaEstado } from "@/lib/ops/hoja-ruta-service"

type Params = { params: Promise<{ id: string }> }

export async function GET(request: NextRequest, { params }: Params) {
  try {
    const ctx = await getClaverAnalystContext(request)
    if (!ctx.ok) return ctx.response

    const { id } = await params
    const hojaId = Number(id)
    if (!Number.isFinite(hojaId)) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 })
    }

    const hoja = await getHojaRuta(hojaId)
    if (!hoja) return NextResponse.json({ error: "No encontrada" }, { status: 404 })
    return NextResponse.json(hoja)
  } catch (error) {
    console.error("Error obteniendo hoja de ruta:", error)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const ctx = await getClaverAnalystContext(request)
    if (!ctx.ok) return ctx.response

    const { id } = await params
    const hojaId = Number(id)
    if (!Number.isFinite(hojaId)) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 })
    }

    const body = await request.json()
    if (!body.estado?.trim()) {
      return NextResponse.json({ error: "estado es obligatorio" }, { status: 400 })
    }

    const hoja = await updateHojaRutaEstado(hojaId, body.estado.trim())
    if (!hoja) return NextResponse.json({ error: "No encontrada" }, { status: 404 })
    return NextResponse.json(hoja)
  } catch (error) {
    console.error("Error actualizando hoja de ruta:", error)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}