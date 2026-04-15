import { type NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { getAuthContext } from "@/lib/auth/empresa-guard"
import { prisma } from "@/lib/prisma"

// ─── MOVIMIENTOS DE ENVASES ───────────────────────────────────────────────────
// GET  ?tipoEnvaseId=N&clienteId=N&tipo=entrega|retorno|ajuste → listar movimientos
// POST → registrar movimiento (entrega / retorno / ajuste)
//
// Lógica de saldo:
//   saldo_cliente = SUM(entregados) - SUM(retornados)
//   Un saldo > 0 significa que el cliente tiene envases en su poder.

const createSchema = z.object({
  tipoEnvaseId: z.number().int().positive(),
  tipo: z.enum(["entrega", "retorno", "ajuste"]),
  cantidad: z.number().int().min(1),
  clienteId: z.number().int().positive().optional().nullable(),
  facturaId: z.number().int().positive().optional().nullable(),
  fechaMovimiento: z.string().datetime().optional(),
  observaciones: z.string().max(500).optional().nullable(),
})

export async function GET(request: NextRequest) {
  try {
    const db = prisma as any
    const ctx = await getAuthContext(request)
    if (!ctx.ok) return ctx.response

    const { searchParams } = new URL(request.url)
    const tipoEnvaseId = searchParams.get("tipoEnvaseId") ? Number(searchParams.get("tipoEnvaseId")) : undefined
    const clienteId = searchParams.get("clienteId") ? Number(searchParams.get("clienteId")) : undefined
    const tipo = searchParams.get("tipo") as string | null
    const take = Math.min(Number(searchParams.get("take") ?? "100"), 500)

    const where: any = { empresaId: ctx.auth.empresaId }
    if (tipoEnvaseId) where.tipoEnvaseId = tipoEnvaseId
    if (clienteId) where.clienteId = clienteId
    if (tipo && ["entrega", "retorno", "ajuste"].includes(tipo)) where.tipo = tipo

    const movimientos = await db.movimientoEnvase.findMany({
      where,
      take,
      orderBy: { fechaMovimiento: "desc" },
      include: {
        tipoEnvase: { select: { id: true, nombre: true, unidadMedida: true } },
        cliente: { select: { id: true, nombre: true, cuit: true } },
      },
    })

    return NextResponse.json(movimientos)
  } catch (error) {
    console.error("Error al listar movimientos de envase:", error)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const db = prisma as any
    const ctx = await getAuthContext(request)
    if (!ctx.ok) return ctx.response

    const body = await request.json()
    const parsed = createSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: "Datos inválidos", detalles: parsed.error.errors }, { status: 400 })
    }

    const { fechaMovimiento, ...rest } = parsed.data

    // Verificar que el tipoEnvase pertenece a la empresa
    const tipo = await db.tipoEnvase.findFirst({
      where: { id: rest.tipoEnvaseId, empresaId: ctx.auth.empresaId },
    })
    if (!tipo) return NextResponse.json({ error: "Tipo de envase no encontrado" }, { status: 404 })

    // Verificar que el cliente pertenece a la empresa (si se especificó)
    if (rest.clienteId) {
      const cliente = await db.cliente.findFirst({
        where: { id: rest.clienteId, empresaId: ctx.auth.empresaId },
      })
      if (!cliente) return NextResponse.json({ error: "Cliente no encontrado" }, { status: 404 })
    }

    const movimiento = await db.movimientoEnvase.create({
      data: {
        ...rest,
        fechaMovimiento: fechaMovimiento ? new Date(fechaMovimiento) : new Date(),
        empresaId: ctx.auth.empresaId,
      },
      include: {
        tipoEnvase: { select: { id: true, nombre: true, unidadMedida: true } },
        cliente: { select: { id: true, nombre: true, cuit: true } },
      },
    })

    return NextResponse.json(movimiento, { status: 201 })
  } catch (error) {
    console.error("Error al crear movimiento de envase:", error)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}
