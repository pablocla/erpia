import { NextRequest, NextResponse } from "next/server"
import { getAuthContext } from "@/lib/auth/empresa-guard"
import { iotService } from "@/lib/iot/iot-service"

export async function GET(request: NextRequest) {
  try {
    const ctx = await getAuthContext(request)
    if (!ctx.ok) return ctx.response

    const { searchParams } = new URL(request.url)
    const soloActivas = searchParams.get("soloActivas") !== "false"
    const nivel = searchParams.get("nivel") || ""

    const alertas = await iotService.listarAlertas(ctx.auth.empresaId, {
      resuelta: soloActivas ? false : undefined,
      nivel: nivel || undefined,
    })

    return NextResponse.json(alertas)
  } catch (error) {
    console.error("Error al obtener alertas IoT:", error)
    return NextResponse.json({ error: "Error al obtener alertas IoT" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const ctx = await getAuthContext(request)
    if (!ctx.ok) return ctx.response

    const body = await request.json()
    const { id } = body

    if (!id) return NextResponse.json({ error: "ID de alerta requerido" }, { status: 400 })

    const alerta = await iotService.resolverAlerta(parseInt(id), ctx.auth.empresaId)
    if (!alerta) {
      return NextResponse.json({ error: "Alerta no encontrada" }, { status: 404 })
    }

    return NextResponse.json(alerta)
  } catch (error) {
    console.error("Error al resolver alerta IoT:", error)
    return NextResponse.json({ error: "Error al resolver alerta IoT" }, { status: 500 })
  }
}