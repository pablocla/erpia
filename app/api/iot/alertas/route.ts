import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { verificarToken } from "@/lib/auth/middleware"

export async function GET(request: NextRequest) {
  try {
    const usuario = await verificarToken(request)
    if (!usuario) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const soloActivas = searchParams.get("soloActivas") !== "false"
    const nivel = searchParams.get("nivel") || ""

    const where: Record<string, unknown> = {}
    if (soloActivas) where.resuelta = false
    if (nivel) where.nivel = nivel

    const alertas = await prisma.alertaIoT.findMany({
      where,
      include: {
        dispositivo: { select: { id: true, nombre: true, codigo: true, tipo: true } },
      },
      orderBy: [{ nivel: "desc" }, { createdAt: "desc" }],
      take: 100,
    })

    return NextResponse.json(alertas)
  } catch (error) {
    console.error("Error al obtener alertas IoT:", error)
    return NextResponse.json({ error: "Error al obtener alertas IoT" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const usuario = await verificarToken(request)
    if (!usuario) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

    const body = await request.json()
    const { id } = body

    if (!id) return NextResponse.json({ error: "ID de alerta requerido" }, { status: 400 })

    const alerta = await prisma.alertaIoT.update({
      where: { id: parseInt(id) },
      data: { resuelta: true, resolvedAt: new Date() },
    })

    return NextResponse.json(alerta)
  } catch (error) {
    console.error("Error al resolver alerta IoT:", error)
    return NextResponse.json({ error: "Error al resolver alerta IoT" }, { status: 500 })
  }
}
