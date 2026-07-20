import { type NextRequest, NextResponse } from "next/server"
import { getAuthContext } from "@/lib/auth/empresa-guard"
import { subscribeSkuCheckout } from "@/lib/billing/billing-checkout-service"

/**
 * POST /api/billing/subscribe
 * Body: { sku, preferCredit? }
 */
export async function POST(request: NextRequest) {
  const ctx = await getAuthContext(request)
  if (!ctx.ok) return ctx.response

  try {
    const body = await request.json().catch(() => ({}))
    const sku = typeof body.sku === "string" ? body.sku : typeof body.slug === "string" ? body.slug : ""
    if (!sku) {
      return NextResponse.json({ error: "sku requerido" }, { status: 400 })
    }

    const result = await subscribeSkuCheckout({
      empresaId: ctx.auth.empresaId,
      userId: ctx.auth.userId,
      email: ctx.auth.email,
      sku,
      preferCredit: body.preferCredit !== false,
    })

    return NextResponse.json(result)
  } catch (e) {
    console.error("[billing/subscribe]", e)
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Error al suscribir" },
      { status: 500 },
    )
  }
}
