/**
 * POST /api/caja/transferencia
 * Mueve plata entre dos cajas abiertas de la misma empresa (egreso + ingreso atómicos).
 */
import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { getAuthContext } from "@/lib/auth/empresa-guard"
import {
  MEDIOS_TRANSFERENCIA,
  TransferenciaError,
  transferirEntreCajas,
} from "@/lib/caja/transferencia-service"

const transferenciaSchema = z
  .object({
    origenCajaId: z.number().int().positive(),
    destinoCajaId: z.number().int().positive(),
    monto: z.number().positive("El monto debe ser mayor a 0"),
    medioPago: z.enum(MEDIOS_TRANSFERENCIA).default("efectivo"),
    concepto: z.string().max(200).optional(),
  })
  .refine((d) => d.origenCajaId !== d.destinoCajaId, {
    message: "La caja origen y destino deben ser distintas",
    path: ["destinoCajaId"],
  })

export async function POST(request: NextRequest) {
  try {
    const ctx = await getAuthContext(request)
    if (!ctx.ok) return ctx.response

    const body = await request.json()
    const parsed = transferenciaSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Datos inválidos", detalles: parsed.error.flatten() },
        { status: 400 },
      )
    }

    const result = await transferirEntreCajas({ empresaId: ctx.auth.empresaId, ...parsed.data })
    return NextResponse.json({ ok: true, ...result }, { status: 201 })
  } catch (error) {
    if (error instanceof TransferenciaError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    console.error("Error en transferencia entre cajas:", error)
    return NextResponse.json({ error: "Error al transferir entre cajas" }, { status: 500 })
  }
}
