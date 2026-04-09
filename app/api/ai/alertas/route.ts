import { type NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { getAuthContext } from "@/lib/auth/empresa-guard"
import { generarAlertasInteligentes, isIAEnabled } from "@/lib/ai"
import { prisma } from "@/lib/prisma"

/**
 * POST /api/ai/alertas — Run intelligent alerts analysis + persist results
 */
export async function POST(request: NextRequest) {
  try {
    const ctx = await getAuthContext(request)
    if (!ctx.ok) return ctx.response

    if (!(await isIAEnabled(ctx.auth.empresaId))) {
      return NextResponse.json({ error: "Módulo IA no está habilitado para esta empresa" }, { status: 403 })
    }

    const empresa = await prisma.empresa.findUnique({
      where: { id: ctx.auth.empresaId },
      select: { rubro: true },
    })

    const rubro = empresa?.rubro || "comercio"

    // Use business-layer alertas (context-aware)
    const resultado = await generarAlertasInteligentes(ctx.auth.empresaId)

    // Persist alerts to DB
    if (resultado.alertas.length > 0) {
      await prisma.$transaction(
        resultado.alertas.map(a =>
          prisma.alertaIA.create({
            data: {
              empresaId: ctx.auth.empresaId,
              tipo: a.tipo,
              prioridad: a.prioridad,
              titulo: a.titulo,
              descripcion: a.descripcion,
              accion: a.accion_sugerida ?? null,
              datos: a.datos ?? undefined,
            },
          })
        )
      )
    }

    return NextResponse.json({ success: true, alertas: resultado.alertas, total: resultado.alertas.length })
  } catch (error) {
    console.error("[AI Alertas] Error:", error)
    return NextResponse.json({ error: "Error al generar alertas inteligentes" }, { status: 500 })
  }
}

/**
 * GET /api/ai/alertas — Fetch persisted alerts (today's or unread)
 */
export async function GET(request: NextRequest) {
  try {
    const ctx = await getAuthContext(request)
    if (!ctx.ok) return ctx.response

    const url = new URL(request.url)
    const soloNoLeidas = url.searchParams.get("no_leidas") === "true"
    const hoy = new Date()
    hoy.setHours(0, 0, 0, 0)

    const where: any = { empresaId: ctx.auth.empresaId }
    if (soloNoLeidas) {
      where.leida = false
    } else {
      where.createdAt = { gte: hoy }
    }

    const alertas = await prisma.alertaIA.findMany({
      where,
      orderBy: [{ prioridad: "asc" }, { createdAt: "desc" }],
      take: 20,
    })

    // Map prioridad to sort order (alta first)
    const priOrder: Record<string, number> = { alta: 0, media: 1, baja: 2 }
    alertas.sort((a, b) => (priOrder[a.prioridad] ?? 9) - (priOrder[b.prioridad] ?? 9))

    return NextResponse.json({ success: true, data: alertas, total: alertas.length })
  } catch (error) {
    console.error("[AI Alertas GET] Error:", error)
    return NextResponse.json({ error: "Error obteniendo alertas" }, { status: 500 })
  }
}

/**
 * PATCH /api/ai/alertas — Mark alert as read/resolved
 */
export async function PATCH(request: NextRequest) {
  try {
    const ctx = await getAuthContext(request)
    if (!ctx.ok) return ctx.response

    const body = await request.json()
    const PatchSchema = z.object({
      id: z.number().int().positive(),
      leida: z.boolean().optional(),
      resuelta: z.boolean().optional(),
    })
    const parsed = PatchSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: "Datos inválidos", detalles: parsed.error.errors }, { status: 400 })
    }
    const { id, leida, resuelta } = parsed.data

    const alerta = await prisma.alertaIA.findFirst({
      where: { id, empresaId: ctx.auth.empresaId },
    })
    if (!alerta) return NextResponse.json({ error: "Alerta no encontrada" }, { status: 404 })

    await prisma.alertaIA.update({
      where: { id },
      data: {
        ...(leida !== undefined && { leida }),
        ...(resuelta !== undefined && { resuelta }),
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[AI Alertas PATCH] Error:", error)
    return NextResponse.json({ error: "Error actualizando alerta" }, { status: 500 })
  }
}
