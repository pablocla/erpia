import { type NextRequest, NextResponse } from "next/server"
import { getAuthContext } from "@/lib/auth/empresa-guard"
import { syncMercadoPagoSubscription } from "@/lib/billing/mercadopago-subscription"

/** POST /api/billing/sync-subscription — relee estado en MP (local sin webhook). */
export async function POST(request: NextRequest) {
  const ctx = await getAuthContext(request)
  if (!ctx.ok) return ctx.response

  try {
    const result = await syncMercadoPagoSubscription(ctx.auth.empresaId)
    return NextResponse.json(result)
  } catch (e) {
    console.error("[billing/sync-subscription]", e)
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Error sync" },
      { status: 500 },
    )
  }
}
