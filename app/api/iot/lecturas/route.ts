import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getAuthContext } from "@/lib/auth/empresa-guard"
import { iotService } from "@/lib/iot/iot-service"
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
    const ctx = await getAuthContext(request)
    if (!ctx.ok) return ctx.response

    const { searchParams } = new URL(request.url)
    const dispositivoIdRaw = searchParams.get("dispositivoId")
    const limit = parseInt(searchParams.get("limit") || "50")
    const dispositivoId = dispositivoIdRaw ? parseInt(dispositivoIdRaw) : undefined

    const lecturas = await iotService.listarLecturas(ctx.auth.empresaId, {
      dispositivoId: Number.isFinite(dispositivoId) ? dispositivoId : undefined,
      limit,
    })

    return NextResponse.json(lecturas)
  } catch (error) {
    console.error("Error al obtener lecturas IoT:", error)
    return NextResponse.json({ error: "Error al obtener lecturas IoT" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const ctx = await getAuthContext(request)
    if (!ctx.ok) return ctx.response

    const body = await request.json()
    const parsed = lecturaSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: "Datos inválidos", detalles: parsed.error.flatten() }, { status: 400 })
    }

    const dispositivo = await iotService.obtenerDispositivoDeEmpresa(
      parsed.data.dispositivoId,
      ctx.auth.empresaId,
    )
    if (!dispositivo) {
      return NextResponse.json({ error: "Dispositivo no encontrado" }, { status: 404 })
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