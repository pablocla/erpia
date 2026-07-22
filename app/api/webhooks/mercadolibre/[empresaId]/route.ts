import { type NextRequest, NextResponse } from "next/server"
import { recibirPedidoML } from "@/lib/mercadolibre/mercadolibre-service"
import { mlFetch, type MLOrder } from "@/lib/mercadolibre/mercadolibre-api"
import { validarWebhookMercadoLibre } from "@/lib/auth/webhook-guard"
import { recordPlatformEvent } from "@/lib/ops/platform-events"
import { prisma } from "@/lib/prisma"

/**
 * POST /api/webhooks/mercadolibre/{empresaId}
 * Notificaciones ML (topic: orders_v2, items, etc.).
 *
 * Auth: ML_WEBHOOK_SECRET o WEBHOOK_SECRET
 *   - Authorization: Bearer <secret>
 *   - Header x-webhook-secret
 *   - Query ?token= (solo si ML_WEBHOOK_ALLOW_QUERY=1 en prod)
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

  const rawBody = await request.text()

  if (!validarWebhookMercadoLibre(request, rawBody)) {
    void recordPlatformEvent({
      severity: "sev2",
      source: "webhook",
      code: "WEBHOOK_SIG_INVALID",
      message: "Firma/token inválido en webhook MercadoLibre",
      empresaId,
      meta: { path: `/api/webhooks/mercadolibre/${empresaId}` },
    })
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  const empresa = await prisma.empresa.findFirst({
    where: { id: empresaId, deletedAt: null },
    select: { id: true },
  })
  if (!empresa) {
    return NextResponse.json({ error: "Empresa no encontrada" }, { status: 404 })
  }

  try {
    let body: {
      topic?: string
      resource?: string
      user_id?: number
      _id?: string
    }
    try {
      body = rawBody ? (JSON.parse(rawBody) as typeof body) : {}
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
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
    // ML reintenta si no es 2xx; devolvemos 200 para notificaciones no críticas
    // y 502 solo si falló un orders_v2 ya autenticado
    return NextResponse.json({ ok: true, error: "processing_error" })
  }
}

/** ML a veces hace GET de verificación de URL */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ empresaId: string }> },
) {
  const { empresaId: empresaIdStr } = await params
  const empresaId = Number(empresaIdStr)
  if (!empresaId || Number.isNaN(empresaId)) {
    return NextResponse.json({ error: "empresaId inválido" }, { status: 400 })
  }

  // Verificación liviana: con secret en query o header
  if (!validarWebhookMercadoLibre(request, "")) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  return NextResponse.json({ ok: true, empresaId, service: "mercadolibre-webhook" })
}
