import { type NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { logError } from "@/lib/monitoring/error-logger"
import { EcommerceCheckoutError, procesarCheckoutEcommerce } from "@/lib/ecommerce/checkout-service"

const lineaSchema = z.object({
  productoId: z.number().int().positive(),
  cantidad: z.number().positive(),
})

const clienteSchema = z.object({
  nombre: z.string().min(2),
  email: z.string().email().optional().nullable(),
  telefono: z.string().optional().nullable(),
  direccion: z.string().optional().nullable(),
  direccionComplemento: z.string().optional().nullable(),
  codigoPostal: z.string().optional().nullable(),
  dni: z.string().optional().nullable(),
  cuit: z.string().optional().nullable(),
})

const checkoutSchema = z.object({
  empresaId: z.number().int().positive(),
  canalVentaId: z.number().int().positive().optional(),
  canalVentaCodigo: z.string().min(1).optional(),
  observaciones: z.string().optional(),
  fechaEntregaEst: z.string().date().optional(),
  autoConfirmar: z.boolean().optional(),
  medioPago: z.enum(["mercadopago", "transferencia", "confirmar_sin_pago"]).optional(),
  cliente: clienteSchema,
  lineas: z.array(lineaSchema).min(1),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = checkoutSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ error: "Datos invalidos", detalles: parsed.error.errors }, { status: 400 })
    }

    const result = await procesarCheckoutEcommerce(parsed.data)
    return NextResponse.json(result, { status: 201 })
  } catch (error) {
    if (error instanceof EcommerceCheckoutError) {
      return NextResponse.json({ error: error.message, ...error.extra }, { status: error.status })
    }
    logError("api/ecommerce/checkout:POST", error, request)
    return NextResponse.json({ error: "Error al crear pedido" }, { status: 500 })
  }
}