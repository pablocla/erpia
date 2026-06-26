import { type NextRequest, NextResponse } from "next/server"
import { getAuthContext } from "@/lib/auth/empresa-guard"
import {
  devolucionParcialPos,
  obtenerFacturaDevolucion,
} from "@/lib/pos/devolucion-venta-pos"
import { z } from "zod"

const postSchema = z.object({
  facturaId: z.number().int().positive(),
  lineas: z
    .array(
      z.object({
        lineaFacturaId: z.number().int().positive(),
        cantidad: z.number().positive(),
      }),
    )
    .min(1),
  motivo: z.string().min(1).max(200).optional(),
})

/**
 * GET /api/pos/devolucion?facturaId= — detalle para devolución parcial.
 * POST /api/pos/devolucion — ejecuta NC parcial + reverso caja.
 */
export async function GET(request: NextRequest) {
  try {
    const ctx = await getAuthContext(request)
    if (!ctx.ok) return ctx.response

    const facturaId = Number(request.nextUrl.searchParams.get("facturaId"))
    if (!facturaId) {
      return NextResponse.json({ error: "facturaId requerido" }, { status: 400 })
    }

    const detalle = await obtenerFacturaDevolucion(ctx.auth.empresaId, facturaId)
    return NextResponse.json(detalle)
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Error al cargar devolución"
    return NextResponse.json({ error: msg }, { status: 400 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const ctx = await getAuthContext(request)
    if (!ctx.ok) return ctx.response

    const body = await request.json()
    const parsed = postSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Datos inválidos", detalles: parsed.error.flatten() },
        { status: 400 },
      )
    }

    const result = await devolucionParcialPos(
      ctx.auth.empresaId,
      parsed.data.facturaId,
      parsed.data.lineas,
      parsed.data.motivo ?? "Devolución parcial POS",
    )

    return NextResponse.json({ ok: true, ...result })
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Error en devolución"
    console.error("POST /api/pos/devolucion:", error)
    return NextResponse.json({ error: msg }, { status: 400 })
  }
}