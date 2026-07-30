/**
 * POST /api/afip/exportacion — emitir Factura E vía WSFEX
 */
import { type NextRequest, NextResponse } from "next/server"
import { getAuthContext } from "@/lib/auth/empresa-guard"
import { emitirFacturaExportacion } from "@/lib/afip/factura-exportacion-service"
import { z } from "zod"

const itemSchema = z.object({
  descripcion: z.string().min(1),
  cantidad: z.number().positive(),
  precioUnitario: z.number().nonnegative(),
  codigo: z.string().optional(),
  umed: z.number().int().optional(),
})

const schema = z.object({
  clienteId: z.number().int().positive(),
  puntoVenta: z.number().int().min(1).max(9999),
  tipoCbte: z.union([z.literal(19), z.literal(20), z.literal(21)]).optional(),
  tipoExpo: z.union([z.literal(1), z.literal(2), z.literal(4)]).optional(),
  incoterm: z.string().optional(),
  monedaId: z.string().optional(),
  monedaCtz: z.number().positive().optional(),
  dstCmp: z.number().int().optional(),
  cuitPaisCliente: z.number().optional(),
  idiomaCbte: z.union([z.literal(1), z.literal(2), z.literal(3)]).optional(),
  formaPago: z.string().optional(),
  obs: z.string().optional(),
  items: z.array(itemSchema).min(1),
  facturaAsociadaId: z.number().int().optional(),
  permisoExistente: z.enum(["S", "N", ""]).optional(),
})

export async function POST(request: NextRequest) {
  try {
    const ctx = await getAuthContext(request)
    if (!ctx.ok) return ctx.response

    const body = await request.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Datos inválidos", detalles: parsed.error.flatten() },
        { status: 400 },
      )
    }

    const result = await emitirFacturaExportacion({
      empresaId: ctx.auth.empresaId,
      ...parsed.data,
    })

    if (!result.ok) {
      return NextResponse.json(
        { success: false, error: result.error, facturaId: result.facturaId },
        { status: 422 },
      )
    }

    return NextResponse.json({
      success: true,
      facturaId: result.facturaId,
      cae: result.cae,
      vencimientoCAE: result.vencimientoCAE,
      numero: result.numero,
      qrBase64: result.qrBase64,
    })
  } catch (error) {
    console.error("exportacion WSFEX:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error WSFEX" },
      { status: 500 },
    )
  }
}
