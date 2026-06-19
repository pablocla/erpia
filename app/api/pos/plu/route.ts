import { type NextRequest, NextResponse } from "next/server"
import { getAuthContext } from "@/lib/auth/empresa-guard"
import { guardarPluPos, listarPluPos } from "@/lib/pos/pos-plu-service"
import { z } from "zod"

const pluItemSchema = z.object({
  productoId: z.number().int().positive(),
  orden: z.number().int().min(0).optional(),
  color: z.string().nullable().optional(),
  etiqueta: z.string().max(24).nullable().optional(),
})

const putSchema = z.object({
  items: z.array(pluItemSchema).max(24),
})

/**
 * GET /api/pos/plu — botones de acceso rápido del POS.
 * PUT /api/pos/plu — guardar configuración PLU (gerente/admin).
 */
export async function GET(request: NextRequest) {
  try {
    const ctx = await getAuthContext(request)
    if (!ctx.ok) return ctx.response

    const items = await listarPluPos(ctx.auth.empresaId)
    return NextResponse.json({ items, total: items.length })
  } catch (error) {
    console.error("Error en GET /api/pos/plu:", error)
    return NextResponse.json({ error: "Error al cargar PLU" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const ctx = await getAuthContext(request)
    if (!ctx.ok) return ctx.response

    if (!["gerente", "dueno", "admin"].includes(ctx.auth.rol)) {
      return NextResponse.json({ error: "Sin permisos" }, { status: 403 })
    }

    const body = await request.json()
    const parsed = putSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Datos inválidos", detalles: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const items = await guardarPluPos(ctx.auth.empresaId, parsed.data.items)
    return NextResponse.json({ ok: true, items, total: items.length })
  } catch (error) {
    console.error("Error en PUT /api/pos/plu:", error)
    return NextResponse.json({ error: "Error al guardar PLU" }, { status: 500 })
  }
}