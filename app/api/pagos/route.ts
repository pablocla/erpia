import { type NextRequest, NextResponse } from "next/server"
import { getAuthContext } from "@/lib/auth/empresa-guard"
import { pagosService } from "@/lib/pagos/pagos-service"
import { z } from "zod"

/**
 * GET /api/pagos — List payment orders (delegates to /api/ordenes-pago style)
 * POST /api/pagos — Register a new payment (orden de pago + retenciones + asiento)
 */

export async function GET(request: NextRequest) {
  try {
    const ctx = await getAuthContext(request)
    if (!ctx.ok) return ctx.response

    const { searchParams } = new URL(request.url)
    const proveedorId = searchParams.get("proveedorId")
    const desde = searchParams.get("desde")
    const hasta = searchParams.get("hasta")
    const skip = parseInt(searchParams.get("skip") ?? "0", 10)
    const take = Math.min(parseInt(searchParams.get("take") ?? "50", 10), 200)

    const data = await pagosService.listarOrdenesPago({
      empresaId: ctx.auth.empresaId,
      proveedorId: proveedorId ? parseInt(proveedorId, 10) : undefined,
      desde: desde ? new Date(desde) : undefined,
      hasta: hasta ? new Date(hasta) : undefined,
      skip,
      take,
    })

    return NextResponse.json(data)
  } catch (error) {
    console.error("Error al listar pagos:", error)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}

const pagoItemSchema = z.object({
  cuentaPagarId: z.number().int().positive(),
  monto: z.number().positive(),
})

const pagoSchema = z.object({
  proveedorId: z.number().int().positive(),
  items: z.array(pagoItemSchema).min(1),
  medioPago: z.enum(["transferencia", "cheque", "efectivo", "tarjeta"]),
  fecha: z.string().optional(),
  observaciones: z.string().optional(),
  retenciones: z.object({
    retencionIVA: z.number().min(0).optional(),
    retencionGanancias: z.number().min(0).optional(),
    retencionIIBB: z.number().min(0).optional(),
  }).optional(),
})

export async function POST(request: NextRequest) {
  try {
    const ctx = await getAuthContext(request)
    if (!ctx.ok) return ctx.response

    const body = await request.json()
    const data = pagoSchema.parse(body)

    const result = await pagosService.registrarPago({
      ...data,
      empresaId: ctx.auth.empresaId,
      fecha: data.fecha ? new Date(data.fecha) : undefined,
    })

    return NextResponse.json(result, { status: 201 })
  } catch (error: any) {
    if (error.message?.includes("excede saldo") || error.message?.includes("no encontrada") || error.message?.includes("superan")) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    console.error("Error al registrar pago:", error)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}
