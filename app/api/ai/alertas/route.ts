import { type NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { getAuthContext } from "@/lib/auth/empresa-guard"
import { generarAlertasInteligentes, isIAEnabled } from "@/lib/ai"
import { crearAlertaIAConNotificacion, actualizarSeguimientoAlerta, alertaVisibleParaUsuario } from "@/lib/ai/notificacion-ia-service"
import { parseAlertaMetadata } from "@/lib/ai/alerta-seguimiento"
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

    if (resultado.alertas.length > 0) {
      for (const a of resultado.alertas) {
        await crearAlertaIAConNotificacion({
          empresaId: ctx.auth.empresaId,
          tipo: a.tipo,
          prioridad: a.prioridad as "alta" | "media" | "baja",
          titulo: a.titulo,
          descripcion: a.descripcion,
          accion: a.accion_sugerida,
          origen: "manual",
          datosExtra: a.datos ?? undefined,
        })
      }
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

    const soloSeguimiento = url.searchParams.get("seguimiento") === "true"

    const alertasRaw = await prisma.alertaIA.findMany({
      where,
      orderBy: [{ createdAt: "desc" }],
      take: soloSeguimiento ? 50 : 20,
    })

    const alertas = alertasRaw
      .filter((a) => alertaVisibleParaUsuario(a.datos, ctx.auth.userId, ctx.auth.rol))
      .map((a) => {
        const meta = parseAlertaMetadata(a.datos)
        return {
          ...a,
          seguimiento: meta,
        }
      })

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
      estadoSeguimiento: z.enum(["pendiente", "en_revision", "resuelta", "descartada"]).optional(),
      asignadoAId: z.number().int().positive().optional(),
      nota: z.string().max(1000).optional(),
    })
    const parsed = PatchSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: "Datos inválidos", detalles: parsed.error.errors }, { status: 400 })
    }
    const { id, leida, resuelta, estadoSeguimiento, asignadoAId, nota } = parsed.data

    const usuario = await prisma.usuario.findFirst({
      where: { id: ctx.auth.userId, empresaId: ctx.auth.empresaId },
      select: { nombre: true },
    })

    const updated = await actualizarSeguimientoAlerta(
      ctx.auth.empresaId,
      id,
      ctx.auth.userId,
      usuario?.nombre ?? "Usuario",
      { leida, resuelta, estadoSeguimiento, asignadoAId, nota },
    )

    return NextResponse.json({ success: true, data: updated })
  } catch (error) {
    console.error("[AI Alertas PATCH] Error:", error)
    return NextResponse.json({ error: "Error actualizando alerta" }, { status: 500 })
  }
}
