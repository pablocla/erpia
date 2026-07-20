import { type NextRequest, NextResponse } from "next/server"
import { getAuthContext } from "@/lib/auth/empresa-guard"
import { createPlanSubscriptionCheckout } from "@/lib/billing/billing-checkout-service"

/**
 * POST /api/billing/create-subscription
 * 1) Intenta pagar con crédito de comisiones partner
 * 2) Si no alcanza → preapproval Mercado Pago (o mock)
 */
export async function POST(request: NextRequest) {
  const ctx = await getAuthContext(request)
  if (!ctx.ok) return ctx.response

  try {
    const body = await request.json().catch(() => ({}))
    const preferCredit = body.preferCredit !== false

    const result = await createPlanSubscriptionCheckout({
      empresaId: ctx.auth.empresaId,
      userId: ctx.auth.userId,
      email: ctx.auth.email,
      preferCredit,
    })

    return NextResponse.json(result)
  } catch (e) {
    console.error("[billing/create-subscription]", e)
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Error al crear suscripción" },
      { status: 500 },
    )
  }
}
