import { type NextRequest, NextResponse } from "next/server"
import { getAuthContext, whereEmpresa } from "@/lib/auth/empresa-guard"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

/**
 * GET /api/precios — List price lists with item counts
 * POST /api/precios — Create a new price list
 */

export async function GET(request: NextRequest) {
  try {
    const ctx = await getAuthContext(request)
    if (!ctx.ok) return ctx.response

    const listas = await prisma.listaPrecio.findMany({
      where: whereEmpresa(ctx.auth.empresaId),
      include: {
        _count: { select: { items: true } },
      },
      orderBy: { nombre: "asc" },
    })

    return NextResponse.json({ success: true, data: listas })
  } catch (error) {
    console.error("Error al listar precios:", error)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}

const crearListaSchema = z.object({
  nombre: z.string().min(1).max(100),
  moneda: z.string().default("ARS"),
  esBase: z.boolean().default(false),
  margenPct: z.number().min(-100).max(1000).optional(),
  activa: z.boolean().default(true),
})

export async function POST(request: NextRequest) {
  try {
    const ctx = await getAuthContext(request)
    if (!ctx.ok) return ctx.response

    const body = await request.json()
    const data = crearListaSchema.parse(body)

    const lista = await prisma.listaPrecio.create({
      data: {
        ...data,
        empresaId: ctx.auth.empresaId,
      },
    })

    return NextResponse.json(lista, { status: 201 })
  } catch (error) {
    console.error("Error al crear lista de precios:", error)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}
