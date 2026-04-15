import { type NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { getAuthContext } from "@/lib/auth/empresa-guard"
import { prisma } from "@/lib/prisma"

// ─── TIPOS DE ENVASE ──────────────────────────────────────────────────────────
// GET  → listar tipos de envase de la empresa (con stock actual calculado)
// POST → crear tipo de envase
// PATCH → actualizar tipo de envase
// DELETE ?id=N → desactivar tipo de envase (soft)
//
// REQUIERE MIGRACIÓN: prisma migrate dev --name add-envases-retornables

const tipoSchema = z.object({
  nombre: z.string().min(1).max(100),
  descripcion: z.string().max(500).optional().nullable(),
  capacidad: z.number().positive().optional().nullable(),
  unidadMedida: z.enum(["unidades", "litros", "kg"]).default("unidades"),
  valorDeposito: z.number().min(0).default(0),
})

const tipoUpdateSchema = tipoSchema.partial().extend({
  id: z.number().int().positive(),
  activo: z.boolean().optional(),
})

export async function GET(request: NextRequest) {
  try {
    const db = prisma as any
    const ctx = await getAuthContext(request)
    if (!ctx.ok) return ctx.response

    const tipos = await db.tipoEnvase.findMany({
      where: { empresaId: ctx.auth.empresaId, activo: true },
      orderBy: { nombre: "asc" },
    })

    // Calcular stock actual (entregados - retornados) por tipo
    const movimientos = await db.movimientoEnvase.groupBy({
      by: ["tipoEnvaseId", "tipo"],
      where: { empresaId: ctx.auth.empresaId },
      _sum: { cantidad: true },
    })

    const stockPorTipo: Record<number, number> = {}
    for (const m of movimientos) {
      if (!stockPorTipo[m.tipoEnvaseId]) stockPorTipo[m.tipoEnvaseId] = 0
      if (m.tipo === "entrega") stockPorTipo[m.tipoEnvaseId] -= m._sum.cantidad ?? 0
      else if (m.tipo === "retorno") stockPorTipo[m.tipoEnvaseId] += m._sum.cantidad ?? 0
      // ajuste: positivo suma, negativo resta — aplicar directamente en movimientos page
    }

    const result = tipos.map((t: any) => ({
      ...t,
      valorDeposito: Number(t.valorDeposito),
      // stock en depósito = stock inicial (0) - entregados + retornados
      // (negativo = más envases afuera que en depósito — deberían retornar)
      stockEnClientes: -(stockPorTipo[t.id] ?? 0),
    }))

    return NextResponse.json(result)
  } catch (error) {
    console.error("Error al listar tipos de envase:", error)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const db = prisma as any
    const ctx = await getAuthContext(request)
    if (!ctx.ok) return ctx.response

    const body = await request.json()
    const parsed = tipoSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: "Datos inválidos", detalles: parsed.error.errors }, { status: 400 })
    }

    const tipo = await db.tipoEnvase.create({
      data: {
        ...parsed.data,
        empresaId: ctx.auth.empresaId,
      },
    })

    return NextResponse.json({ ...tipo, valorDeposito: Number(tipo.valorDeposito) }, { status: 201 })
  } catch (error) {
    console.error("Error al crear tipo de envase:", error)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const db = prisma as any
    const ctx = await getAuthContext(request)
    if (!ctx.ok) return ctx.response

    const body = await request.json()
    const parsed = tipoUpdateSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: "Datos inválidos", detalles: parsed.error.errors }, { status: 400 })
    }

    const { id, ...data } = parsed.data

    // Verificar que pertenece a la empresa
    const existing = await db.tipoEnvase.findFirst({ where: { id, empresaId: ctx.auth.empresaId } })
    if (!existing) return NextResponse.json({ error: "Tipo de envase no encontrado" }, { status: 404 })

    const updated = await db.tipoEnvase.update({ where: { id }, data })
    return NextResponse.json({ ...updated, valorDeposito: Number(updated.valorDeposito) })
  } catch (error: any) {
    if (error?.code === "P2025") return NextResponse.json({ error: "Tipo de envase no encontrado" }, { status: 404 })
    console.error("Error al actualizar tipo de envase:", error)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const db = prisma as any
    const ctx = await getAuthContext(request)
    if (!ctx.ok) return ctx.response

    const { searchParams } = new URL(request.url)
    const id = Number(searchParams.get("id"))
    if (!id || Number.isNaN(id)) return NextResponse.json({ error: "id es obligatorio" }, { status: 400 })

    const existing = await db.tipoEnvase.findFirst({ where: { id, empresaId: ctx.auth.empresaId } })
    if (!existing) return NextResponse.json({ error: "Tipo de envase no encontrado" }, { status: 404 })

    // Soft delete: desactivar en lugar de borrar
    await db.tipoEnvase.update({ where: { id }, data: { activo: false } })
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("Error al desactivar tipo de envase:", error)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}
