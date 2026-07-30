import { type NextRequest, NextResponse } from "next/server"
import {
  handleStripeWebhookEvent,
  verifyStripeSignature,
  type StripeEvent,
} from "@/lib/stripe/stripe-webhook"
import { recordPlatformEvent } from "@/lib/ops/platform-events"

/**
 * Stripe webhooks (US / multinational).
 * Dashboard → Developers → Webhooks → endpoint:
 *   {NEXT_PUBLIC_APP_URL}/api/webhooks/stripe
 * Events: checkout.session.completed
 */
export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text()
    const sig = request.headers.get("stripe-signature")

    if (!verifyStripeSignature(rawBody, sig)) {
      void recordPlatformEvent({
        severity: "sev2",
        source: "webhook",
        code: "WEBHOOK_SIG_INVALID",
        message: "Firma inválida en /api/webhooks/stripe",
        meta: { path: "/api/webhooks/stripe" },
      })
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 })
    }

    let event: StripeEvent
    try {
      event = JSON.parse(rawBody) as StripeEvent
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
    }

    const result = await handleStripeWebhookEvent(event)
    return NextResponse.json({ received: true, handled: result.handled })
  } catch (error) {
    console.error("[stripe webhook]", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    service: "stripe-webhook",
    path: "/api/webhooks/stripe",
  })
}
