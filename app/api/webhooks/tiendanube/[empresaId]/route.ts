import { type NextRequest, NextResponse } from "next/server"
import { recibirPedidoTN } from "@/lib/tiendanube/tiendanube-service"
import { tnFetch, type TNOrder } from "@/lib/tiendanube/tiendanube-api"
import { createHmac, timingSafeEqual } from "crypto"

function verifyTNSignature(raw: string, signature: string | null): boolean {
  const secret = process.env.TN_WEBHOOK_SECRET
  if (!secret || !signature) return !secret
  const expected = createHmac("sha256", secret).update(raw).digest("hex")
  try {
    return timingSafeEqual(Buffer.from(expected), Buffer.from(signature))
  } catch {
    return false
  }
}

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
  const signature = request.headers.get("x-linkedstore-hmac-sha256")
  if (!verifyTNSignature(raw, signature)) {
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