/**
 * B7 — Validación de variables de entorno en startup.
 * Importar este módulo al inicio de la app (layout.tsx o instrumentation.ts).
 * En producción, lanza un Error claro si falta cualquier variable crítica.
 */

interface EnvConfig {
  DATABASE_URL: string
  NEXTAUTH_SECRET: string
  JWT_SECRET: string
  AFIP_CUIT_EMPRESA: string
  AFIP_ENTORNO: "homologacion" | "produccion"
  AFIP_PUNTO_VENTA: number
  NEXT_PUBLIC_APP_URL: string
  // Opcionales con default
  RESEND_API_KEY?: string
  TWILIO_ACCOUNT_SID?: string
  TWILIO_AUTH_TOKEN?: string
  TWILIO_WHATSAPP_FROM?: string
  MP_ACCESS_TOKEN?: string
  MP_WEBHOOK_SECRET?: string
  // Solo requeridas en producción
  AFIP_CERT_PROD?: string
  AFIP_KEY_PROD?: string
}

const REQUIRED_ALWAYS = ["DATABASE_URL", "JWT_SECRET", "AFIP_CUIT_EMPRESA"] as const
const REQUIRED_PROD = ["NEXTAUTH_SECRET", "AFIP_CERT_PROD", "AFIP_KEY_PROD", "RESEND_API_KEY"] as const

function validateEnv(): EnvConfig {
  const missing: string[] = []
  const isProd = process.env.NODE_ENV === "production"

  for (const key of REQUIRED_ALWAYS) {
    if (!process.env[key]) missing.push(key)
  }

  if (isProd) {
    for (const key of REQUIRED_PROD) {
      if (!process.env[key]) missing.push(key)
    }
  }

  if (missing.length > 0) {
    throw new Error(
      `[validate-env] Variables de entorno faltantes:\n` +
        missing.map((k) => `  ❌ ${k}`).join("\n") +
        `\n\nCopiá .env.example a .env.local y completá los valores.`
    )
  }

  return {
    DATABASE_URL: process.env.DATABASE_URL!,
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET ?? process.env.JWT_SECRET!,
    JWT_SECRET: process.env.JWT_SECRET!,
    AFIP_CUIT_EMPRESA: process.env.AFIP_CUIT_EMPRESA ?? process.env.AFIP_CUIT ?? "",
    AFIP_ENTORNO: (process.env.AFIP_ENTORNO ?? "homologacion") as "homologacion" | "produccion",
    AFIP_PUNTO_VENTA: Number(process.env.AFIP_PUNTO_VENTA ?? "1"),
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
    RESEND_API_KEY: process.env.RESEND_API_KEY,
    TWILIO_ACCOUNT_SID: process.env.TWILIO_ACCOUNT_SID,
    TWILIO_AUTH_TOKEN: process.env.TWILIO_AUTH_TOKEN,
    TWILIO_WHATSAPP_FROM: process.env.TWILIO_WHATSAPP_FROM,
    MP_ACCESS_TOKEN: process.env.MP_ACCESS_TOKEN,
    MP_WEBHOOK_SECRET: process.env.MP_WEBHOOK_SECRET,
    AFIP_CERT_PROD: process.env.AFIP_CERT_PROD,
    AFIP_KEY_PROD: process.env.AFIP_KEY_PROD,
  }
}

// Singleton: valida una vez al importar y exporta el objeto tipado.
export const env = validateEnv()
