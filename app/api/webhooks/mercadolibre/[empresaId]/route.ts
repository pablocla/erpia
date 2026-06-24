import { type NextRequest, NextResponse } from "next/server"
import { recibirPedidoML } from "@/lib/mercadolibre/mercadolibre-service"
import { mlFetch, type MLOrder } from "@/lib/mercadolibre/mercadolibre-api"

/**
 * POST /api/webhooks/mercadolibre/{empresaId}
 * Recibe notificaciones de ML (topic: orders_v2, items, etc.)
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

  try {
    const body = await request.json() as {
      topic?: string
      resource?: string
      user_id?: number
      _id?: string
    }

    if (body.topic === "orders_v2" && body.resource) {
      const orderId = body.resource.replace("/orders/", "")
      const order = await mlFetch<MLOrder>(empresaId, `/orders/${orderId}`)
      const result = await recibirPedidoML(empresaId, {
        orderId,
        buyerNickname: order.buyer.nickname,
        buyerId: order.buyer.id,
        total: order.total_amount,
        items: order.order_items.map((oi) => ({
          sku: oi.item.seller_custom_field ?? "",
          qty: oi.quantity,
          title: oi.item.title,
          unitPrice: oi.unit_price,
        })),
      })
      return NextResponse.json(result)
    }

    return NextResponse.json({ ok: true, ignored: body.topic ?? "unknown" })
  } catch (error) {
    console.error("[ML Webhook]", error)
    return NextResponse.json({ ok: true })
  }
}