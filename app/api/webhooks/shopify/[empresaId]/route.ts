import { type NextRequest, NextResponse } from "next/server"
import { recibirPedidoShopify } from "@/lib/shopify/shopify-service"
import { shopifyFetch, type ShopifyOrder } from "@/lib/shopify/shopify-api"
import { createHmac, timingSafeEqual } from "crypto"

function verifyShopifyHmac(raw: string, hmac: string | null): boolean {
  const secret = process.env.SHOPIFY_CLIENT_SECRET
  if (!secret || !hmac) return !secret
  const expected = createHmac("sha256", secret).update(raw, "utf8").digest("base64")
  try {
    return timingSafeEqual(Buffer.from(expected), Buffer.from(hmac))
  } catch {
    return false
  }
}

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
  const hmac = request.headers.get("x-shopify-hmac-sha256")
  if (!verifyShopifyHmac(raw, hmac)) {
    return NextResponse.json({ error: "Firma inválida" }, { status: 401 })
  }

  try {
    const body = JSON.parse(raw) as { id?: number }
    if (!body.id) return NextResponse.json({ ok: true, ignored: true })

    const data = await shopifyFetch<{ order: ShopifyOrder }>(empresaId, `/orders/${body.id}.json`)
    const order = data.order

    const result = await recibirPedidoShopify(empresaId, order)
    return NextResponse.json(result)
  } catch (error) {
    console.error("[Shopify Webhook]", error)
    return NextResponse.json({ ok: true })
  }
}