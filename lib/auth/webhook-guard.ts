import { NextRequest } from "next/server"
import crypto from "crypto"
import { getMpWebhookSecret } from "@/lib/config/env"

function isProd(): boolean {
  return process.env.NODE_ENV === "production"
}

function allowInsecureWebhooks(): boolean {
  return !isProd() && process.env.ALLOW_INSECURE_WEBHOOKS === "1"
}

function timingSafeEqualStr(a: string, b: string): boolean {
  try {
    const ba = Buffer.from(a)
    const bb = Buffer.from(b)
    if (ba.length !== bb.length) return false
    return crypto.timingSafeEqual(ba, bb)
  } catch {
    return false
  }
}

/**
 * Validación Twilio X-Twilio-Signature (HMAC-SHA1).
 * https://www.twilio.com/docs/usage/webhooks/webhooks-security
 *
 * data = fullURL + sorted(key+value for each POST param)
 * sig  = base64(hmac_sha1(authToken, data))
 */
export function validateTwilioSignature(
  authToken: string,
  signature: string,
  url: string,
  params: Record<string, string>,
): boolean {
  const sortedKeys = Object.keys(params).sort()
  let data = url
  for (const key of sortedKeys) {
    data += key + params[key]
  }
  const expected = crypto.createHmac("sha1", authToken).update(Buffer.from(data, "utf8")).digest("base64")
  return timingSafeEqualStr(expected, signature)
}

function parseFormBody(rawBody: string): Record<string, string> {
  const params: Record<string, string> = {}
  if (!rawBody) return params
  const search = new URLSearchParams(rawBody)
  search.forEach((value, key) => {
    params[key] = value
  })
  return params
}

function resolveWebhookUrl(request: NextRequest): string {
  // Prefer public app URL + path (Twilio firma la URL configurada en consola)
  const publicBase =
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ||
    process.env.NEXT_PUBLIC_BASE_URL?.replace(/\/$/, "")
  if (publicBase) {
    return `${publicBase}${request.nextUrl.pathname}`
  }
  return request.url.split("?")[0]
}

/**
 * Valida la firma criptográfica de un webhook entrante.
 * Soporta Meta/n8n HMAC, Twilio, TiendaNube, Shopify, MercadoPago.
 * Production: fail-closed si falta secret del proveedor detectado.
 */
export function validarFirmaWebhook(request: NextRequest, rawBody: string): boolean {
  // 1. Meta / Facebook / WhatsApp Cloud API / n8n
  const signature256 =
    request.headers.get("X-Hub-Signature-256") || request.headers.get("X-Webhook-Signature")
  if (signature256) {
    const secret = process.env.WEBHOOK_SECRET
    if (!secret) {
      console.warn("[Webhook Guard] WEBHOOK_SECRET no configurado para firma Meta/n8n.")
      return allowInsecureWebhooks()
    }
    const hash = crypto.createHmac("sha256", secret).update(rawBody).digest("hex")
    const expected = signature256.startsWith("sha256=") ? signature256.slice(7) : signature256
    return timingSafeEqualStr(hash, expected)
  }

  // 2. Twilio — validación HMAC-SHA1 real
  const twilioSignature = request.headers.get("X-Twilio-Signature")
  if (twilioSignature) {
    const authToken = process.env.TWILIO_AUTH_TOKEN?.trim()
    if (!authToken) {
      console.warn("[Webhook Guard] TWILIO_AUTH_TOKEN no configurado.")
      if (isProd()) return false
      return allowInsecureWebhooks()
    }
    const params = parseFormBody(rawBody)
    const url = resolveWebhookUrl(request)
    const ok = validateTwilioSignature(authToken, twilioSignature, url, params)
    if (!ok) {
      console.warn("[Webhook Guard] Twilio signature inválida")
    }
    return ok
  }

  // 3. TiendaNube
  const tnSignature = request.headers.get("x-linkedstore-hmac-sha256")
  if (tnSignature) {
    const tnSecret = process.env.TN_WEBHOOK_SECRET
    if (!tnSecret) return allowInsecureWebhooks()
    const expected = crypto.createHmac("sha256", tnSecret).update(rawBody).digest("hex")
    return timingSafeEqualStr(expected, tnSignature)
  }

  // 4. Shopify
  const shopifySignature = request.headers.get("x-shopify-hmac-sha256")
  if (shopifySignature) {
    const shopifySecret = process.env.SHOPIFY_CLIENT_SECRET
    if (!shopifySecret) return allowInsecureWebhooks()
    const expected = crypto
      .createHmac("sha256", shopifySecret)
      .update(rawBody, "utf8")
      .digest("base64")
    return timingSafeEqualStr(expected, shopifySignature)
  }

  // 5. MercadoPago
  const mpSignature = request.headers.get("x-signature")
  const mpRequestId = request.headers.get("x-request-id")
  if (mpSignature && mpRequestId) {
    const mpSecret = getMpWebhookSecret()
    if (!mpSecret) return allowInsecureWebhooks()
    const tsMatch = mpSignature.match(/ts=(\d+)/)
    const v1Match = mpSignature.match(/v1=([a-f0-9]+)/)
    if (!tsMatch || !v1Match) return false
    try {
      const payload = JSON.parse(rawBody)
      const dataId = payload.data?.id
      if (!dataId) return false
      const manifest = `id:${dataId};request-id:${mpRequestId};ts:${tsMatch[1]};`
      const hmac = crypto.createHmac("sha256", mpSecret).update(manifest).digest("hex")
      return timingSafeEqualStr(hmac, v1Match[1])
    } catch {
      return false
    }
  }

  // Sin headers de firma reconocidos
  return false
}

/**
 * Webhook MercadoLibre (notificaciones por tenant en URL).
 *
 * ML no envía un HMAC estándar universal; usamos secreto compartido:
 * - Header `x-webhook-secret` o `Authorization: Bearer <secret>`
 * - Query `?token=<secret>` (solo non-prod o si se permite explícito)
 * - Opcional: `x-signature` / `x-hub-signature-256` = sha256=HMAC(body)
 *
 * Secrets (en orden): ML_WEBHOOK_SECRET → WEBHOOK_SECRET
 * Producción: fail-closed si no hay secret configurado.
 */
export function validarWebhookMercadoLibre(
  request: NextRequest,
  rawBody: string,
): boolean {
  const secret =
    process.env.ML_WEBHOOK_SECRET?.trim() || process.env.WEBHOOK_SECRET?.trim() || ""

  if (!secret) {
    if (isProd()) {
      console.warn("[Webhook Guard] ML_WEBHOOK_SECRET/WEBHOOK_SECRET no configurado — rechazo ML")
      return false
    }
    return allowInsecureWebhooks()
  }

  const auth = request.headers.get("authorization")
  if (auth === `Bearer ${secret}`) return true

  const headerSecret =
    request.headers.get("x-webhook-secret") ||
    request.headers.get("x-ml-webhook-secret") ||
    request.headers.get("x-callback-token")
  if (headerSecret && timingSafeEqualStr(headerSecret, secret)) return true

  // HMAC del body (si el orquestador / proxy lo firma)
  const sigHeader =
    request.headers.get("x-hub-signature-256") ||
    request.headers.get("x-signature") ||
    request.headers.get("x-webhook-signature")
  if (sigHeader) {
    const hash = crypto.createHmac("sha256", secret).update(rawBody).digest("hex")
    const expected = sigHeader.startsWith("sha256=") ? sigHeader.slice(7) : sigHeader
    if (timingSafeEqualStr(hash, expected)) return true
    // Si hay signature header pero no matchea, no caer a query en prod
    if (isProd()) return false
  }

  // Query token: útil en URL de notificación ML; en prod solo si ML_WEBHOOK_ALLOW_QUERY=1
  const queryToken =
    request.nextUrl.searchParams.get("token") ||
    request.nextUrl.searchParams.get("secret")
  if (queryToken) {
    const allowQuery = !isProd() || process.env.ML_WEBHOOK_ALLOW_QUERY === "1"
    if (allowQuery && timingSafeEqualStr(queryToken, secret)) return true
  }

  return false
}
