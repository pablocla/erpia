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
