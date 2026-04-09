import { type NextRequest, NextResponse } from "next/server"
import { verificarToken } from "@/lib/auth/middleware"
import { comprasService } from "@/lib/compras/compras-service"
import { z } from "zod"

const lineaRecepcionSchema = z.object({
  lineaOcId: z.number().int().positive(),
  productoId: z.number().int().positive().optional(),
  cantidadRecibida: z.number().positive(),
  cantidadRechazada: z.number().min(0).optional(),
  observacion: z.string().optional(),
})

const recepcionSchema = z.object({
  ordenCompraId: z.number().int().positive(),
  depositoId: z.number().int().positive().optional(),
  lineas: z.array(lineaRecepcionSchema).min(1),
  observaciones: z.string().optional(),
})

/**
 * POST /api/compras/recepciones — Register receipt of goods against a PO
 */
export async function POST(request: NextRequest) {
  try {
    const usuario = await verificarToken(request)
    if (!usuario) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

    const body = await request.json()
    const validacion = recepcionSchema.safeParse(body)
    if (!validacion.success) {
      return NextResponse.json({ error: "Datos inválidos", detalles: validacion.error.errors }, { status: 400 })
    }

    const recepcion = await comprasService.registrarRecepcion(validacion.data)
    return NextResponse.json(recepcion, { status: 201 })
  } catch (error) {
    console.error("Error en POST recepción:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error interno" },
      { status: 500 },
    )
  }
}
