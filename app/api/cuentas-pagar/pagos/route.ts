import { type NextRequest, NextResponse } from "next/server"
import { getAuthContext } from "@/lib/auth/empresa-guard"
import { pagosService } from "@/lib/pagos/pagos-service"
import { pagoSchema, pagoLegacySchema } from "@/lib/pagos/pago-schemas"
import { prisma } from "@/lib/prisma"

export async function POST(request: NextRequest) {
  try {
    const ctx = await getAuthContext(request)
    if (!ctx.ok) return ctx.response

    const body = await request.json()

    let proveedorId: number
    let items: { cuentaPagarId: number; monto: number }[]
    let medioPago: "transferencia" | "cheque" | "efectivo" | "tarjeta"
    let fecha: string | undefined
    let observaciones: string | undefined
    let cheque: typeof body.cheque
    let retenciones: typeof body.retenciones

    const full = pagoSchema.safeParse(body)
    if (full.success) {
      ({ proveedorId, items, medioPago, fecha, observaciones, cheque, retenciones } = full.data)
    } else {
      const legacy = pagoLegacySchema.safeParse(body)
      if (!legacy.success) {
        return NextResponse.json({ error: "Datos inválidos", detalles: legacy.error.errors }, { status: 400 })
      }

      const cp = await prisma.cuentaPagar.findFirst({
        where: { id: legacy.data.cuentaPagarId, proveedor: { empresaId: ctx.auth.empresaId } },
        select: { proveedorId: true },
      })
      if (!cp) {
        return NextResponse.json({ error: "Cuenta a pagar no encontrada" }, { status: 404 })
      }

      proveedorId = cp.proveedorId
      items = [{ cuentaPagarId: legacy.data.cuentaPagarId, monto: legacy.data.monto }]
      medioPago = legacy.data.medioPago
      fecha = legacy.data.fecha
      observaciones = legacy.data.observaciones
      cheque = legacy.data.cheque
      retenciones = legacy.data.retenciones
    }

    const result = await pagosService.registrarPago({
      proveedorId,
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
    console.error("Error al registrar pago:", error)
    const message = error?.message ?? "Error interno"
    const status = message.includes("no encontrada") || message.includes("excede") || message.includes("requerid") ? 400 : 500
    return NextResponse.json({ error: message }, { status })
  }
}