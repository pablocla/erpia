import { type NextRequest, NextResponse } from "next/server"
import { getAuthContext } from "@/lib/auth/empresa-guard"
import { anularVentaPos, listarVentasPosHoy } from "@/lib/pos/anular-venta-pos"
import { z } from "zod"

const schema = z.object({
  facturaId: z.number().int().positive().optional(),
  ultima: z.boolean().optional(),
  motivo: z.string().min(1).max(200).optional(),
})

/**
 * POST /api/pos/anular-venta — anula venta POS del día (NC + reverso caja).
 */
export async function POST(request: NextRequest) {
  try {
    const ctx = await getAuthContext(request)
    if (!ctx.ok) return ctx.response

    const body = await request.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Datos inválidos", detalles: parsed.error.flatten() },
        { status: 400 }
      )
    }

    let facturaId = parsed.data.facturaId

    if (parsed.data.ultima || !facturaId) {
      const ventas = await listarVentasPosHoy(ctx.auth.empresaId)
      const ultimaAnulable = ventas.find((v) => v.anulable)
      if (!ultimaAnulable) {
        return NextResponse.json(
          { error: "No hay ventas anulables del día" },
          { status: 400 }
        )
      }
      facturaId = ultimaAnulable.facturaId
    }

    const result = await anularVentaPos(
      ctx.auth.empresaId,
      facturaId!,
      parsed.data.motivo ?? "Anulación venta POS"
    )

    return NextResponse.json({ ok: true, ...result })
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Error al anular venta"
    console.error("Error en POST /api/pos/anular-venta:", error)
    return NextResponse.json({ error: msg }, { status: 400 })
  }
}