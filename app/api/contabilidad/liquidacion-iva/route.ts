import { type NextRequest, NextResponse } from "next/server"
import { verificarToken } from "@/lib/auth/middleware"
import { AsientoService } from "@/lib/contabilidad/asiento-service"
import { z } from "zod"

const liquidacionSchema = z.object({
  mes: z.number().int().min(1).max(12),
  anio: z.number().int().min(2020).max(2099),
})

// ─── POST — Generate IVA monthly liquidation entry ──────────────────────────

export async function POST(request: NextRequest) {
  try {
    const usuario = await verificarToken(request)
    if (!usuario) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

    const body = await request.json()
    const validacion = liquidacionSchema.safeParse(body)
    if (!validacion.success) {
      return NextResponse.json({ error: "Datos inválidos", detalles: validacion.error.errors }, { status: 400 })
    }

    const asientoService = new AsientoService()
    const result = await asientoService.generarAsientoLiquidacionIVA(validacion.data)

    return NextResponse.json(result, { status: 201 })
  } catch (error) {
    console.error("Error en liquidación IVA:", error)
    return NextResponse.json({ error: "Error al generar liquidación IVA" }, { status: 500 })
  }
}
