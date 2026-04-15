import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getAuthContext } from "@/lib/auth/empresa-guard"
import { z } from "zod"

const crearSchema = z.object({
  titulo: z.string().min(1).max(200),
  descripcion: z.string().optional(),
  prioridad: z.enum(["baja", "media", "alta", "urgente"]).default("media"),
  fechaVencimiento: z.string().optional().nullable(),
  visibleJefe: z.boolean().default(false),
})

const actualizarSchema = z.object({
  titulo: z.string().min(1).max(200).optional(),
  descripcion: z.string().optional().nullable(),
  prioridad: z.enum(["baja", "media", "alta", "urgente"]).optional(),
  fechaVencimiento: z.string().optional().nullable(),
  visibleJefe: z.boolean().optional(),
  completada: z.boolean().optional(),
})

export async function GET(request: NextRequest) {
  try {
    const ctx = await getAuthContext(request)
    if (!ctx.ok) return ctx.response

    const { searchParams } = new URL(request.url)
    const soloMias = searchParams.get("soloMias") !== "false"
    const incluirCompletadas = searchParams.get("incluirCompletadas") === "true"

    const where: Record<string, unknown> = {
      empresaId: ctx.auth.empresaId,
    }

    // Si es admin/jefe puede ver las tareas visibles de otros usuarios
    const esAdmin = ctx.auth.rol === "administrador"
    if (soloMias || !esAdmin) {
      where.usuarioId = ctx.auth.usuarioId
    } else {
      // Admin ve sus tareas + las que otros marcaron visibleJefe
      where.OR = [
        { usuarioId: ctx.auth.usuarioId },
        { visibleJefe: true },
      ]
    }

    if (!incluirCompletadas) {
      where.completada = false
    }

    const tareas = await prisma.tareaPendiente.findMany({
      where,
      include: {
        usuario: { select: { id: true, nombre: true } },
      },
      orderBy: [
        { completada: "asc" },
        { prioridad: "desc" },
        { fechaVencimiento: "asc" },
        { createdAt: "desc" },
      ],
    })

    return NextResponse.json(tareas)
  } catch (err) {
    console.error("[mis-tareas GET]", err)
    return NextResponse.json({ error: "Error al obtener tareas" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const ctx = await getAuthContext(request)
    if (!ctx.ok) return ctx.response

    const body = await request.json()
    const parsed = crearSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Datos inválidos", detalles: parsed.error.flatten() },
        { status: 400 },
      )
    }

    const { titulo, descripcion, prioridad, fechaVencimiento, visibleJefe } = parsed.data

    const tarea = await prisma.tareaPendiente.create({
      data: {
        titulo,
        descripcion,
        prioridad,
        fechaVencimiento: fechaVencimiento ? new Date(fechaVencimiento) : null,
        visibleJefe,
        usuarioId: ctx.auth.usuarioId,
        empresaId: ctx.auth.empresaId,
      },
    })

    return NextResponse.json(tarea, { status: 201 })
  } catch (err) {
    console.error("[mis-tareas POST]", err)
    return NextResponse.json({ error: "Error al crear tarea" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const ctx = await getAuthContext(request)
    if (!ctx.ok) return ctx.response

    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")
    if (!id) return NextResponse.json({ error: "Falta id" }, { status: 400 })

    const body = await request.json()
    const parsed = actualizarSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Datos inválidos", detalles: parsed.error.flatten() },
        { status: 400 },
      )
    }

    // Verificar que la tarea pertenece al usuario (o empresa si es admin)
    const existente = await prisma.tareaPendiente.findFirst({
      where: {
        id: parseInt(id),
        empresaId: ctx.auth.empresaId,
        usuarioId: ctx.auth.usuarioId,
      },
    })
    if (!existente) {
      return NextResponse.json({ error: "Tarea no encontrada" }, { status: 404 })
    }

    const { titulo, descripcion, prioridad, fechaVencimiento, visibleJefe, completada } = parsed.data

    const tarea = await prisma.tareaPendiente.update({
      where: { id: parseInt(id) },
      data: {
        ...(titulo !== undefined && { titulo }),
        ...(descripcion !== undefined && { descripcion }),
        ...(prioridad !== undefined && { prioridad }),
        ...(fechaVencimiento !== undefined && { fechaVencimiento: fechaVencimiento ? new Date(fechaVencimiento) : null }),
        ...(visibleJefe !== undefined && { visibleJefe }),
        ...(completada !== undefined && { completada }),
      },
    })

    return NextResponse.json(tarea)
  } catch (err) {
    console.error("[mis-tareas PATCH]", err)
    return NextResponse.json({ error: "Error al actualizar tarea" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const ctx = await getAuthContext(request)
    if (!ctx.ok) return ctx.response

    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")
    if (!id) return NextResponse.json({ error: "Falta id" }, { status: 400 })

    const existente = await prisma.tareaPendiente.findFirst({
      where: {
        id: parseInt(id),
        empresaId: ctx.auth.empresaId,
        usuarioId: ctx.auth.usuarioId,
      },
    })
    if (!existente) {
      return NextResponse.json({ error: "Tarea no encontrada" }, { status: 404 })
    }

    await prisma.tareaPendiente.delete({ where: { id: parseInt(id) } })

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error("[mis-tareas DELETE]", err)
    return NextResponse.json({ error: "Error al eliminar tarea" }, { status: 500 })
  }
}
