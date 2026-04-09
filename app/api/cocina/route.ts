import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getAuthContext } from "@/lib/auth/empresa-guard"
import { z } from "zod"

/** GET /api/cocina — comandas activas para la pantalla de cocina */
export async function GET(request: NextRequest) {
  try {
    const ctx = await getAuthContext(request)
    if (!ctx.ok) return ctx.response

    const comandas = await prisma.comanda.findMany({
      where: {
        estado: { in: ["enviada_cocina", "en_preparacion"] },
        mesa: { salon: { empresaId: ctx.auth.empresaId } },
      },
      include: {
        lineas: { orderBy: { id: "asc" } },
        mesa: { select: { numero: true, id: true } },
      },
      orderBy: { createdAt: "asc" },
    })

    return NextResponse.json({ success: true, data: comandas })
  } catch (error) {
    console.error("Error cocina GET:", error)
    return NextResponse.json({ success: false, error: "Error al obtener comandas" }, { status: 500 })
  }
}

const patchSchema = z.discriminatedUnion("tipo", [
  z.object({
    tipo: z.literal("linea"),
    lineaId: z.number().int().positive(),
    estado: z.enum(["en_preparacion", "lista", "entregada"]),
  }),
  z.object({
    tipo: z.literal("comanda"),
    comandaId: z.number().int().positive(),
    estado: z.enum(["en_preparacion", "lista"]),
  }),
])

/**
 * PATCH /api/cocina — la cocina actualiza el estado de una línea o comanda completa.
 * Cuando todas las líneas pasan a "lista", la comanda se marca automáticamente.
 */
export async function PATCH(request: NextRequest) {
  try {
    const ctx = await getAuthContext(request)
    if (!ctx.ok) return ctx.response

    const body = await request.json()
    const parsed = patchSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: "Datos inválidos", detalles: parsed.error.errors }, { status: 400 })
    }

    if (parsed.data.tipo === "linea") {
      const { lineaId, estado } = parsed.data

      await prisma.$transaction(async (tx) => {
        await tx.lineaComanda.update({ where: { id: lineaId }, data: { estado } })

        // Recalcular estado de la comanda padre
        const lineaActualizada = await tx.lineaComanda.findUnique({ where: { id: lineaId } })
        if (!lineaActualizada) return

        const todasLineas = await tx.lineaComanda.findMany({
          where: { comandaId: lineaActualizada.comandaId },
        })
        const comanda = await tx.comanda.findUnique({ where: { id: lineaActualizada.comandaId } })
        if (!comanda) return

        // Computar estados con la línea ya actualizada
        const estadosEfectivos = todasLineas.map((l) => (l.id === lineaId ? estado : l.estado))
        const todasListas = estadosEfectivos.every((e) => e === "lista" || e === "entregada")
        const alguenEnPrep = estadosEfectivos.some((e) => e === "en_preparacion")

        if (todasListas) {
          await tx.comanda.update({ where: { id: comanda.id }, data: { estado: "lista" } })
        } else if (alguenEnPrep && comanda.estado === "enviada_cocina") {
          await tx.comanda.update({ where: { id: comanda.id }, data: { estado: "en_preparacion" } })
        }
      })

      return NextResponse.json({ success: true })
    }

    if (parsed.data.tipo === "comanda") {
      const { comandaId, estado } = parsed.data

      await prisma.$transaction(async (tx) => {
        await tx.comanda.update({ where: { id: comandaId }, data: { estado } })

        // Al marcar toda la comanda como lista, marcar todas las líneas también
        if (estado === "lista") {
          await tx.lineaComanda.updateMany({
            where: { comandaId, estado: { in: ["pendiente", "en_preparacion"] } },
            data: { estado: "lista" },
          })
        }
      })

      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ success: false, error: "Tipo desconocido" }, { status: 400 })
  } catch (error) {
    console.error("Error cocina PATCH:", error)
    return NextResponse.json({ success: false, error: "Error al actualizar" }, { status: 500 })
  }
}
