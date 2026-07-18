import { NextRequest, NextResponse } from "next/server"
import { getAuthContext } from "@/lib/auth/empresa-guard"
import { cobrosService } from "@/lib/cobros/cobros-service"
import { z } from "zod"

const cobrarSchema = z.object({
  clienteId: z.number().positive(),
  montoTotal: z.number().positive(),
  medioPago: z.enum(["efectivo", "transferencia", "cheque", "tarjeta"]).default("efectivo"),
  observaciones: z.string().optional(),
})

export async function POST(request: NextRequest) {
  const auth = await getAuthContext(request)
  if (!auth.ok) return auth.response

  try {
    const body = await request.json()
    const parsed = cobrarSchema.safeParse(body)
    
    if (!parsed.success) {
      return NextResponse.json({ error: "Datos inválidos", details: parsed.error.format() }, { status: 400 })
    }

    const { clienteId, montoTotal, medioPago, observaciones } = parsed.data

    const result = await cobrosService.aplicarCobroCliente({
      empresaId: auth.auth.empresaId,
      clienteId,
      montoTotal,
      medioPago,
      observaciones,
    })

    return NextResponse.json({ ok: true, data: result })
  } catch (error) {
    console.error("[POST /api/cuentas-cobrar/cobrar]", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error al registrar cobro" },
      { status: 500 }
    )
  }
}
