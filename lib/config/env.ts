/**
 * Lectura de env compatible con Vercel Environment Variables.
 * En Vercel no hace falta .env: Project Settings → Environment Variables
 * se inyectan como process.env en build y runtime.
 *
 * Alias: si en el panel pusiste nombres viejos del runbook, igual funcionan.
 */

function first(...keys: string[]): string {
  for (const k of keys) {
    const v = process.env[k]?.trim()
    if (v) return v
  }
  return ""
}

export function isProductionRuntime(): boolean {
  return process.env.NODE_ENV === "production"
}

/** Mock override flags are never valid in a production runtime. */
export function hasProductionMockFlags(): boolean {
  return isProductionRuntime() && [
    process.env.FORCE_MOCK_MP_PROD,
    process.env.FORCE_MOCK_STRIPE_PROD,
    process.env.ALLOW_DEMO,
  ].some((value) => value === "true" || value === "1")
}

/** true si corre en Vercel (build o runtime) */
export function isVercel(): boolean {
  return process.env.VERCEL === "1" || Boolean(process.env.VERCEL_ENV)
}

export function getJwtSecret(): string {
  return first("JWT_SECRET", "NEXTAUTH_SECRET")
}

export function getDatabaseUrl(): string {
  return first("DATABASE_URL")
}

/** Prisma migrate / introspect (conexión directa, no pooler) */
export function getDirectDatabaseUrl(): string {
  return first("DIRECT_URL", "DIRECT_DATABASE_URL")
}

/**
 * Mercado Pago — nombres canónicos en código: MP_*
 * Alias aceptados: MERCADOPAGO_*
 */
export function getMpAccessToken(): string {
  return first("MP_ACCESS_TOKEN", "MERCADOPAGO_ACCESS_TOKEN")
}

export function getMpPublicKey(): string {
  return first("MP_PUBLIC_KEY", "MERCADOPAGO_PUBLIC_KEY", "NEXT_PUBLIC_MP_PUBLIC_KEY")
}

export function getMpWebhookSecret(): string {
  return first("MP_WEBHOOK_SECRET", "MERCADOPAGO_WEBHOOK_SECRET", "WEBHOOK_SECRET")
}

export function isMpMockMode(): boolean {
  const t = getMpAccessToken()
  return !t || t.startsWith("TEST-mock") || t === "mock"
}

/**
 * Stripe (US / multinational) — names canónicos STRIPE_*
 * Dashboard: https://dashboard.stripe.com/apikeys
 * Webhook: {APP_URL}/api/webhooks/stripe
 */
export function getStripeSecretKey(): string {
  return first("STRIPE_SECRET_KEY", "STRIPE_API_KEY")
}

export function getStripePublishableKey(): string {
  return first(
    "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY",
    "STRIPE_PUBLISHABLE_KEY",
    "NEXT_PUBLIC_STRIPE_PUBLIC_KEY",
  )
}

export function getStripeWebhookSecret(): string {
  return first("STRIPE_WEBHOOK_SECRET")
}

/** Optional fixed Price IDs for SaaS subscriptions (USD) */
export function getStripePriceId(sku?: string): string {
  if (sku) {
    const bySku = first(`STRIPE_PRICE_${sku.replace(/[^a-zA-Z0-9]/g, "_").toUpperCase()}`)
    if (bySku) return bySku
  }
  return first("STRIPE_PRICE_DEFAULT", "STRIPE_DEFAULT_PRICE_ID")
}

/**
 * Force provider: "stripe" | "mercadopago" | "auto" (default)
 * auto = Stripe when secret key present + market/empresa US; else MP
 */
export function getPaymentsProviderMode(): "stripe" | "mercadopago" | "auto" {
  const v = first("PAYMENTS_PROVIDER", "PAYMENT_PROVIDER").toLowerCase()
  if (v === "stripe" || v === "mercadopago" || v === "auto") return v
  return "auto"
}

export function isStripeMockMode(): boolean {
  const t = getStripeSecretKey()
  return !t || t.startsWith("sk_test_mock") || t === "mock"
}

export function isStripeConfigured(): boolean {
  const t = getStripeSecretKey()
  return Boolean(t) && !isStripeMockMode()
}

export function getGeminiApiKey(): string {
  return first("GOOGLE_GENERATIVE_AI_API_KEY", "GEMINI_API_KEY")
}

export function getCronSecret(): string {
  return first("CRON_SECRET")
}

/** Checklist de go-live sin secretos (para /api/go-live/status) */
export function getEnvPresenceChecklist() {
  const mpToken = getMpAccessToken()
  const mpMock = isMpMockMode()
  return {
    runtime: {
      vercel: isVercel(),
      vercelEnv: process.env.VERCEL_ENV ?? null,
      nodeEnv: process.env.NODE_ENV,
      productionMockFlags: hasProductionMockFlags(),
    },
    required: {
      DATABASE_URL: Boolean(getDatabaseUrl()),
      DIRECT_URL: Boolean(getDirectDatabaseUrl()),
      JWT_SECRET: Boolean(getJwtSecret() && getJwtSecret().length >= 16),
      NEXT_PUBLIC_APP_URL: Boolean(
        process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_BASE_URL || process.env.VERCEL_URL,
      ),
    },
    billing: {
      MP_ACCESS_TOKEN: Boolean(mpToken) && !mpMock,
      mpMock,
      MP_WEBHOOK_SECRET: Boolean(getMpWebhookSecret()),
      STRIPE_SECRET_KEY: isStripeConfigured(),
      stripeMock: isStripeMockMode(),
      STRIPE_WEBHOOK_SECRET: Boolean(getStripeWebhookSecret()),
      NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: Boolean(getStripePublishableKey()),
      PAYMENTS_PROVIDER: getPaymentsProviderMode(),
    },
    optional: {
      RESEND_API_KEY: Boolean(process.env.RESEND_API_KEY),
      TWILIO: Boolean(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN),
      GEMINI: Boolean(getGeminiApiKey()),
      CLAVER_ANALYST_EMAILS: Boolean(process.env.CLAVER_ANALYST_EMAILS),
      CRON_SECRET: Boolean(getCronSecret()),
    },
  }
}
