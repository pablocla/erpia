import { type NextRequest, NextResponse } from "next/server"
import { getAuthContext } from "@/lib/auth/empresa-guard"
import { crearQrPos, consultarPagoPosPorReferencia } from "@/lib/mercadopago/mp-pos-qr"
import { z } from "zod"

const postSchema = z.object({
  monto: z.number().positive(),
  descripcion: z.string().min(1).max(200).default("Venta POS"),
})

/**
 * POST — genera QR MP para cobro POS.
 * GET ?ref= — consulta si el pago fue aprobado.
 */
export async function POST(request: NextRequest) {
  try {
    const ctx = await getAuthContext(request)
    if (!ctx.ok) return ctx.response

    const body = await request.json()
    const parsed = postSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: "Datos inválidos" }, { status: 400 })
    }

    const qr = await crearQrPos(
      ctx.auth.empresaId,
      parsed.data.monto,
      parsed.data.descripcion,
    )

    return NextResponse.json(qr)
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Error al generar QR"
    return NextResponse.json({ error: msg }, { status: 400 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const ctx = await getAuthContext(request)
    if (!ctx.ok) return ctx.response

    const ref = request.nextUrl.searchParams.get("ref")
    if (!ref) {
      return NextResponse.json({ error: "ref requerido" }, { status: 400 })
    }

    const estado = await consultarPagoPosPorReferencia(ctx.auth.empresaId, ref)
    return NextResponse.json(estado)
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Error al consultar pago"
    return NextResponse.json({ error: msg }, { status: 400 })
  }
}