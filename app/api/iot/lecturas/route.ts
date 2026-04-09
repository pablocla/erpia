import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { verificarToken } from "@/lib/auth/middleware"
import { z } from "zod"

const lecturaSchema = z.object({
  dispositivoId: z.number().int().positive(),
  valor: z.number(),
  unidad: z.string().min(1),
  calidad: z.enum(["ok", "alerta", "error"]).default("ok"),
  timestamp: z.string().optional(),
})

export async function GET(request: NextRequest) {
  try {
    const usuario = await verificarToken(request)
    if (!usuario) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const dispositivoId = searchParams.get("dispositivoId")
    const limit = parseInt(searchParams.get("limit") || "50")

    const where: Record<string, unknown> = {}
    if (dispositivoId) where.dispositivoId = parseInt(dispositivoId)

    const lecturas = await prisma.lecturaIoT.findMany({
      where,
      include: {
        dispositivo: { select: { id: true, nombre: true, codigo: true, tipo: true } },
      },
      orderBy: { timestamp: "desc" },
      take: Math.min(limit, 200),
    })

    return NextResponse.json(lecturas)
  } catch (error) {
    console.error("Error al obtener lecturas IoT:", error)
    return NextResponse.json({ error: "Error al obtener lecturas IoT" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    // Lecturas pueden venir de dispositivos sin usuario autenticado; usamos token o clave de dispositivo
    const usuario = await verificarToken(request)
    if (!usuario) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

    const body = await request.json()
    const parsed = lecturaSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: "Datos inválidos", detalles: parsed.error.flatten() }, { status: 400 })
    }

    const lectura = await prisma.lecturaIoT.create({
      data: {
        dispositivoId: parsed.data.dispositivoId,
        valor: parsed.data.valor,
        unidad: parsed.data.unidad,
        calidad: parsed.data.calidad,
        timestamp: parsed.data.timestamp ? new Date(parsed.data.timestamp) : new Date(),
      },
    })

    // Actualizar última conexión del dispositivo
    await prisma.dispositivoIoT.update({
      where: { id: parsed.data.dispositivoId },
      data: { ultimaConexion: new Date() },
    })

    return NextResponse.json(lectura, { status: 201 })
  } catch (error) {
    console.error("Error al registrar lectura IoT:", error)
    return NextResponse.json({ error: "Error al registrar lectura IoT" }, { status: 500 })
  }
}
