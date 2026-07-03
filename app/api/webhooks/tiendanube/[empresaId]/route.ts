import { type NextRequest, NextResponse } from "next/server"
import { recibirPedidoTN } from "@/lib/tiendanube/tiendanube-service"
import { tnFetch, type TNOrder } from "@/lib/tiendanube/tiendanube-api"
import { validarFirmaWebhook } from "@/lib/auth/webhook-guard"
/**
 * POST /api/webhooks/tiendanube/{empresaId}
 * Eventos: order/created, order/paid, etc.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ empresaId: string }> },
) {
  const { empresaId: empresaIdStr } = await params
  const empresaId = Number(empresaIdStr)
  if (!empresaId || Number.isNaN(empresaId)) {
    return NextResponse.json({ error: "empresaId inválido" }, { status: 400 })
  }

  const raw = await request.text()
  if (!validarFirmaWebhook(request, raw)) {
    return NextResponse.json({ error: "Firma inválida" }, { status: 401 })
  }

  try {
    const body = JSON.parse(raw) as { event?: string; id?: number; store_id?: number }
    const event = body.event ?? ""
    const orderId = body.id

    if ((event === "order/created" || event === "order/paid") && orderId) {
      const order = await tnFetch<TNOrder>(empresaId, `/orders/${orderId}`)
      const result = await recibirPedidoTN(empresaId, order)
      return NextResponse.json(result)
    }

    return NextResponse.json({ ok: true, ignored: event })
  } catch (error) {
    console.error("[TN Webhook]", error)
    return NextResponse.json({ ok: true })
  }
}