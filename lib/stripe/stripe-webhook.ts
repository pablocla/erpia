/**
 * Stripe webhook handler — checkout.session.completed → apply debtor payment.
 * Signature: Stripe-Signature header + STRIPE_WEBHOOK_SECRET
 */

import { createHmac, timingSafeEqual } from "crypto"
import { getStripeWebhookSecret, isStripeMockMode } from "@/lib/config/env"
import { aplicarPagoDeudorDesdeStripe } from "@/lib/stripe/aplicar-pago-stripe"
import { recordPlatformEvent } from "@/lib/ops/platform-events"

export interface StripeEvent {
  id: string
  type: string
  data: { object: Record<string, unknown> }
}

/**
 * Verify Stripe-Signature (t=timestamp,v1=signature).
 * @see https://stripe.com/docs/webhooks/signatures
 */
export function verifyStripeSignature(
  rawBody: string,
  signatureHeader: string | null,
  secret = getStripeWebhookSecret(),
  toleranceSec = 300,
): boolean {
  if (!secret) {
    // Local / mock: allow only outside production
    if (process.env.NODE_ENV !== "production" || process.env.ALLOW_INSECURE_WEBHOOKS === "1") {
      return true
    }
    return false
  }
  if (!signatureHeader) return false

  const parts = Object.fromEntries(
    signatureHeader.split(",").map((p) => {
      const [k, ...rest] = p.split("=")
      return [k.trim(), rest.join("=")]
    }),
  ) as Record<string, string>

  const t = parts.t
  const v1 = parts.v1
  if (!t || !v1) return false

  const ts = parseInt(t, 10)
  if (Number.isNaN(ts)) return false
  const now = Math.floor(Date.now() / 1000)
  if (Math.abs(now - ts) > toleranceSec) return false

  const payload = `${t}.${rawBody}`
  const expected = createHmac("sha256", secret).update(payload, "utf8").digest("hex")

  try {
    const a = Buffer.from(expected, "utf8")
    const b = Buffer.from(v1, "utf8")
    if (a.length !== b.length) return false
    return timingSafeEqual(a, b)
  } catch {
    return false
  }
}

export async function handleStripeWebhookEvent(event: StripeEvent): Promise<{ handled: boolean }> {
  if (event.type === "checkout.session.completed") {
    return handleCheckoutCompleted(event.data.object)
  }
  if (event.type === "payment_intent.succeeded") {
    // Optional: payment links may fire this without session metadata — ignore if no ref
    return { handled: false }
  }
  return { handled: false }
}

async function handleCheckoutCompleted(session: Record<string, unknown>): Promise<{ handled: boolean }> {
  const sessionId = String(session.id ?? "")
  const metadata = (session.metadata ?? {}) as Record<string, string>
  const empresaId = parseInt(metadata.empresaId ?? "0", 10)
  const externalRef =
    metadata.external_reference ||
    (typeof session.client_reference_id === "string" ? session.client_reference_id : "") ||
    ""

  const amountTotal = Number(session.amount_total ?? 0) // cents
  const currency = String(session.currency ?? "usd")
  const monto =
    currency === "jpy" || currency === "krw" ? amountTotal : Math.round(amountTotal) / 100

  if (!empresaId || !externalRef || !sessionId) {
    void recordPlatformEvent({
      severity: "sev3",
      source: "webhook",
      code: "STRIPE_SESSION_INCOMPLETE",
      message: "checkout.session.completed sin metadata empresa/ref",
      meta: { sessionId, externalRef, empresaId },
    })
    return { handled: false }
  }

  // SaaS subscription checkout
  if (externalRef.startsWith("claver-empresa-") || session.mode === "subscription") {
    // Mark subscription status if we store stripe customer later
    void recordPlatformEvent({
      severity: "sev4",
      source: "webhook",
      code: "STRIPE_SUBSCRIPTION_CHECKOUT",
      message: `Stripe subscription checkout ok session=${sessionId}`,
      empresaId,
      meta: { externalRef, sessionId },
      skipDedupe: true,
    }).catch(() => {})
    return { handled: true }
  }

  const result = await aplicarPagoDeudorDesdeStripe({
    empresaId,
    externalRef,
    monto,
    stripeSessionId: sessionId,
    customerEmail:
      typeof session.customer_email === "string"
        ? session.customer_email
        : ((session.customer_details as { email?: string } | undefined)?.email ?? null),
  })

  if (!result.ok) {
    void recordPlatformEvent({
      severity: "sev2",
      source: "webhook",
      code: "STRIPE_APPLY_FAIL",
      message: result.error,
      empresaId,
      meta: { sessionId, externalRef },
    })
  }

  return { handled: true }
}

export function stripeWebhookReady(): boolean {
  return Boolean(getStripeWebhookSecret()) || isStripeMockMode() || process.env.NODE_ENV !== "production"
}
