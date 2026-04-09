import { type NextRequest, NextResponse } from "next/server"
import { getAuthContext } from "@/lib/auth/empresa-guard"
import { generarMensajesWhatsApp, isIAEnabled } from "@/lib/ai"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const tipoEnum = z.enum(["cobranza", "inactivos", "turnos", "todos"])

/**
 * POST /api/ai/whatsapp-mensajes — Genera mensajes de WhatsApp con IA
 * Los guarda como pendientes para aprobación del usuario.
 */
export async function POST(request: NextRequest) {
  try {
    const ctx = await getAuthContext(request)
    if (!ctx.ok) return ctx.response

    if (!(await isIAEnabled(ctx.auth.empresaId))) {
      return NextResponse.json({ error: "Módulo IA no está habilitado para esta empresa" }, { status: 403 })
    }

    const body = await request.json()
    const parsed = z.object({ tipo: tipoEnum }).safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: "tipo debe ser cobranza|inactivos|turnos|todos" }, { status: 400 })
    }

    const resultado = await generarMensajesWhatsApp(ctx.auth.empresaId, parsed.data.tipo)

    // Persist all messages as pending approval
    if (resultado.mensajes.length > 0) {
      await prisma.$transaction(
        resultado.mensajes.map(m =>
          prisma.mensajePendienteWhatsApp.create({
            data: {
              empresaId: ctx.auth.empresaId,
              destinatario: m.destinatario,
              telefono: m.telefono,
              mensaje: m.mensaje,
              tipo: m.tipo,
              prioridad: m.prioridad,
              estado: "pendiente",
            },
          })
        )
      )
    }

    return NextResponse.json({
      success: true,
      data: { mensajes: resultado.mensajes, total: resultado.mensajes.length },
    })
  } catch (error) {
    console.error("[AI WhatsApp] Error:", error)
    return NextResponse.json({ error: "Error generando mensajes WhatsApp" }, { status: 500 })
  }
}

/**
 * GET /api/ai/whatsapp-mensajes — Lista mensajes pendientes
 */
export async function GET(request: NextRequest) {
  try {
    const ctx = await getAuthContext(request)
    if (!ctx.ok) return ctx.response

    const url = new URL(request.url)
    const estado = url.searchParams.get("estado") ?? "pendiente"

    const mensajes = await prisma.mensajePendienteWhatsApp.findMany({
      where: { empresaId: ctx.auth.empresaId, estado },
      orderBy: [{ prioridad: "desc" }, { createdAt: "desc" }],
      take: 50,
    })

    return NextResponse.json({ success: true, data: mensajes })
  } catch (error) {
    console.error("[AI WhatsApp List] Error:", error)
    return NextResponse.json({ error: "Error obteniendo mensajes" }, { status: 500 })
  }
}

/**
 * PATCH /api/ai/whatsapp-mensajes — Aprobar/descartar un mensaje
 */
export async function PATCH(request: NextRequest) {
  try {
    const ctx = await getAuthContext(request)
    if (!ctx.ok) return ctx.response

    const body = await request.json()
    const parsed = z.object({
      id: z.number(),
      accion: z.enum(["aprobar", "descartar", "editar"]),
      mensajeEditado: z.string().optional(),
    }).safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ error: "Datos inválidos" }, { status: 400 })
    }

    const { id, accion, mensajeEditado } = parsed.data

    // Verify ownership
    const mensaje = await prisma.mensajePendienteWhatsApp.findFirst({
      where: { id, empresaId: ctx.auth.empresaId },
    })
    if (!mensaje) {
      return NextResponse.json({ error: "Mensaje no encontrado" }, { status: 404 })
    }

    if (accion === "descartar") {
      await prisma.mensajePendienteWhatsApp.update({
        where: { id },
        data: { estado: "descartado" },
      })
    } else if (accion === "aprobar") {
      await prisma.mensajePendienteWhatsApp.update({
        where: { id },
        data: { estado: "aprobado" },
      })
    } else if (accion === "editar" && mensajeEditado) {
      await prisma.mensajePendienteWhatsApp.update({
        where: { id },
        data: { mensaje: mensajeEditado },
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[AI WhatsApp Patch] Error:", error)
    return NextResponse.json({ error: "Error actualizando mensaje" }, { status: 500 })
  }
}
