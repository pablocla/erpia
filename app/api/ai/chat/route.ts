import { type NextRequest, NextResponse } from "next/server"
import { getAuthContext } from "@/lib/auth/empresa-guard"
import { chatConNegocio, isIAEnabled } from "@/lib/ai"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const ChatSchema = z.object({
  mensaje: z.string().min(1).max(2000),
  historial: z.array(z.object({
    role: z.enum(["user", "assistant"]),
    content: z.string(),
  })).optional().default([]),
})

/**
 * POST /api/ai/chat — Chat libre con contexto del negocio
 * Persiste historial en ChatIAHistorial para continuidad.
 */
export async function POST(request: NextRequest) {
  try {
    const ctx = await getAuthContext(request)
    if (!ctx.ok) return ctx.response

    if (!(await isIAEnabled(ctx.auth.empresaId))) {
      return NextResponse.json({ error: "Módulo IA no está habilitado para esta empresa" }, { status: 403 })
    }

    const body = await request.json()
    const parsed = ChatSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: "Mensaje inválido", detalles: parsed.error.errors }, { status: 400 })
    }

    const { mensaje, historial } = parsed.data
    const respuesta = await chatConNegocio(ctx.auth.empresaId, mensaje, historial)

    // Persist both messages in a transaction
    await prisma.$transaction([
      prisma.chatIAHistorial.create({
        data: {
          empresaId: ctx.auth.empresaId,
          usuarioId: ctx.auth.userId,
          role: "user",
          content: mensaje,
        },
      }),
      prisma.chatIAHistorial.create({
        data: {
          empresaId: ctx.auth.empresaId,
          usuarioId: ctx.auth.userId,
          role: "assistant",
          content: respuesta,
        },
      }),
    ])

    return NextResponse.json({ success: true, data: { respuesta } })
  } catch (error) {
    console.error("[AI Chat] Error:", error)
    return NextResponse.json({ error: "Error en chat IA" }, { status: 500 })
  }
}

/**
 * GET /api/ai/chat — Obtener historial de chat para el usuario actual
 */
export async function GET(request: NextRequest) {
  try {
    const ctx = await getAuthContext(request)
    if (!ctx.ok) return ctx.response

    const url = new URL(request.url)
    const limit = Math.min(Number(url.searchParams.get("limit") ?? "50"), 100)

    const mensajes = await prisma.chatIAHistorial.findMany({
      where: { empresaId: ctx.auth.empresaId, usuarioId: ctx.auth.userId },
      orderBy: { createdAt: "desc" },
      take: limit,
      select: { id: true, role: true, content: true, createdAt: true },
    })

    return NextResponse.json({ success: true, data: mensajes.reverse() })
  } catch (error) {
    console.error("[AI Chat History] Error:", error)
    return NextResponse.json({ error: "Error obteniendo historial" }, { status: 500 })
  }
}
