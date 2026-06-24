import { type NextRequest, NextResponse } from "next/server"
import { getAuthContext } from "@/lib/auth/empresa-guard"
import { cobrosService } from "@/lib/cobros/cobros-service"
import { cobroSchema, cobroLegacySchema } from "@/lib/cobros/cobro-schemas"
import { prisma } from "@/lib/prisma"

export async function POST(request: NextRequest) {
  try {
    const ctx = await getAuthContext(request)
    if (!ctx.ok) return ctx.response

    const body = await request.json()

    let clienteId: number
    let items: { cuentaCobrarId: number; monto: number }[]
    let medioPago: "efectivo" | "transferencia" | "cheque" | "tarjeta"
    let fecha: string | undefined
    let observaciones: string | undefined
    let cheque: typeof body.cheque
    let retenciones: typeof body.retenciones

    const full = cobroSchema.safeParse(body)
    if (full.success) {
      ({ clienteId, items, medioPago, fecha, observaciones, cheque, retenciones } = full.data)
    } else {
      const legacy = cobroLegacySchema.safeParse(body)
      if (!legacy.success) {
        return NextResponse.json({ error: "Datos inválidos", detalles: legacy.error.errors }, { status: 400 })
      }

      const cc = await prisma.cuentaCobrar.findFirst({
        where: { id: legacy.data.cuentaCobrarId, cliente: { empresaId: ctx.auth.empresaId } },
        select: { clienteId: true },
      })
      if (!cc) {
        return NextResponse.json({ error: "Cuenta a cobrar no encontrada" }, { status: 404 })
      }

      clienteId = cc.clienteId
      items = [{ cuentaCobrarId: legacy.data.cuentaCobrarId, monto: legacy.data.monto }]
      medioPago = legacy.data.medioPago
      fecha = legacy.data.fecha
      observaciones = legacy.data.observaciones
      cheque = legacy.data.cheque
      retenciones = legacy.data.retenciones
    }

    const result = await cobrosService.registrarCobro({
      clienteId,
      empresaId: ctx.auth.empresaId,
      items,
      medioPago,
      fecha: fecha ? new Date(fecha) : undefined,
      observaciones,
      cheque,
      retenciones,
    })

    return NextResponse.json(result, { status: 201 })
  } catch (error: any) {
    console.error("Error al registrar cobro:", error)
    const message = error?.message ?? "Error interno"
    const status = message.includes("no encontrada") || message.includes("excede") || message.includes("requerid") ? 400 : 500
    return NextResponse.json({ error: message }, { status })
  }
}