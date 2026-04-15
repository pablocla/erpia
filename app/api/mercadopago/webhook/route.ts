import { NextRequest, NextResponse } from "next/server"
import { procesarWebhookMP } from "@/lib/mercadopago/mercadopago-service"
import { prisma } from "@/lib/prisma"

/**
 * Webhook de MercadoPago — NO requiere auth JWT (viene de MP servers).
 * Verifica por empresaId derivado del config vinculado al payment.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // MP envía notificaciones tipo "payment" con data.id
    if (body.type !== "payment" || !body.data?.id) {
      return NextResponse.json({ ok: true }) // Ack silencioso
    }

    const paymentId = String(body.data.id)

    // Buscar config asociada (por ahora procesamos para todas las empresas con MP activo)
    const configs = await prisma.mercadoPagoConfig.findMany({
      where: { activo: true },
    })

    for (const config of configs) {
      try {
        await procesarWebhookMP(config.empresaId, paymentId)
        break // Si procesó OK, salir
      } catch {
        // Intentar con siguiente config
        continue
      }
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error("Error webhook MP:", err)
    return NextResponse.json({ ok: true }) // Siempre 200 para MP
  }
}
