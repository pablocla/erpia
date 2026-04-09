import { type NextRequest, NextResponse } from "next/server"
import { getAuthContext } from "@/lib/auth/empresa-guard"
import { cobrosService } from "@/lib/cobros/cobros-service"
import { z } from "zod"

const cobroSchema = z.object({
  clienteId: z.number().int().positive(),
  items: z.array(z.object({
    cuentaCobrarId: z.number().int().positive(),
    monto: z.number().positive("El monto debe ser positivo"),
  })).min(1),
  medioPago: z.enum(["efectivo", "transferencia", "cheque", "tarjeta"]),
  fecha: z.string().optional(),
  observaciones: z.string().optional(),
  retenciones: z.object({
    retencionIVA: z.number().min(0).optional(),
    retencionGanancias: z.number().min(0).optional(),
    retencionIIBB: z.number().min(0).optional(),
  }).optional(),
})

// ─── POST — Register payment against account(s) receivable with retenciones ──

export async function POST(request: NextRequest) {
  try {
    const ctx = await getAuthContext(request)
    if (!ctx.ok) return ctx.response

    const body = await request.json()
    const validacion = cobroSchema.safeParse(body)
    if (!validacion.success) {
      return NextResponse.json({ error: "Datos inválidos", detalles: validacion.error.errors }, { status: 400 })
    }

    const { clienteId, items, medioPago, fecha, observaciones, retenciones } = validacion.data

    const result = await cobrosService.registrarCobro({
      clienteId,
      empresaId: ctx.auth.empresaId,
      items,
      medioPago,
      fecha: fecha ? new Date(fecha) : undefined,
      observaciones,
      retenciones,
    })

    return NextResponse.json(result, { status: 201 })
  } catch (error: any) {
    console.error("Error al registrar cobro:", error)
    const message = error?.message ?? "Error interno"
    const status = message.includes("no encontrada") || message.includes("excede") ? 400 : 500
    return NextResponse.json({ error: message }, { status })
  }
}
