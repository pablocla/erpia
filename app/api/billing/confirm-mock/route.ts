import { type NextRequest, NextResponse } from "next/server"
import { getAuthContext } from "@/lib/auth/empresa-guard"
import { confirmMockSubscription } from "@/lib/billing/billing-checkout-service"
import { allowsInstantMarketplaceCheckout } from "@/lib/billing/marketplace-checkout-policy"

/** POST /api/billing/confirm-mock — solo dev/mock o FORCE_MOCK_MP_PROD */
export async function POST(request: NextRequest) {
  const ctx = await getAuthContext(request)
  if (!ctx.ok) return ctx.response

  if (!allowsInstantMarketplaceCheckout()) {
    return NextResponse.json(
      { error: "Confirmación mock deshabilitada en este entorno" },
      { status: 403 },
    )
  }

  try {
    const body = await request.json().catch(() => ({}))
    const result = await confirmMockSubscription({
      empresaId: ctx.auth.empresaId,
      ref: typeof body.ref === "string" ? body.ref : null,
    })
    return NextResponse.json(result)
  } catch (e) {
    console.error("[billing/confirm-mock]", e)
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Error mock" },
      { status: 500 },
    )
  }
}
