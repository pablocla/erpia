import { NextRequest } from "next/server"
import crypto from "crypto"

/**
 * Valida la firma criptográfica de un webhook entrante.
 * Soporta firmas genéricas HMAC SHA256 (ej. Meta, n8n) y verifica la existencia
 * de firmas específicas de proveedor (ej. Twilio).
 */
export function validarFirmaWebhook(request: NextRequest, rawBody: string): boolean {
  // En desarrollo/homologación puede saltarse si no hay secreto, 
  // pero en PRD DEBE fallar si no hay secreto configurado.
  const secret = process.env.WEBHOOK_SECRET
  if (!secret) {
    console.warn("[Webhook Guard] WEBHOOK_SECRET no está configurado. Rechazando petición por seguridad en PRD.")
    return process.env.NODE_ENV !== "production"
  }

  // 1. Meta / Facebook / WhatsApp Cloud API / n8n
  const signature256 = request.headers.get("X-Hub-Signature-256") || request.headers.get("X-Webhook-Signature")
  if (signature256) {
    const hash = crypto.createHmac("sha256", secret).update(rawBody).digest("hex")
    const expected = signature256.startsWith("sha256=") ? signature256.slice(7) : signature256
    
    try {
      return crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(expected))
    } catch {
      return false
    }
  }

  // 2. Twilio (placeholder, requiere librería de Twilio para validar URL + form params)
  const twilioSignature = request.headers.get("X-Twilio-Signature")
  if (twilioSignature) {
    // En una implementación final usar: twilio.validateRequest(secret, twilioSignature, url, body)
    // Se delega a true provisionalmente si existe el header, pero debe implementarse la validación exacta.
    console.warn("[Webhook Guard] Twilio signature detectada, validación estricta pendiente.")
    return true
  }

  // 3. TiendaNube
  const tnSignature = request.headers.get("x-linkedstore-hmac-sha256")
  if (tnSignature) {
    const tnSecret = process.env.TN_WEBHOOK_SECRET
    if (!tnSecret) return process.env.NODE_ENV !== "production"
    const expected = crypto.createHmac("sha256", tnSecret).update(rawBody).digest("hex")
    try {
      return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(tnSignature))
    } catch {
      return false
    }
  }

  // 4. Shopify
  const shopifySignature = request.headers.get("x-shopify-hmac-sha256")
  if (shopifySignature) {
    const shopifySecret = process.env.SHOPIFY_CLIENT_SECRET
    if (!shopifySecret) return process.env.NODE_ENV !== "production"
    const expected = crypto.createHmac("sha256", shopifySecret).update(rawBody, "utf8").digest("base64")
    try {
      return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(shopifySignature))
    } catch {
      return false
    }
  }

  // 5. MercadoPago
  const mpSignature = request.headers.get("x-signature")
  const mpRequestId = request.headers.get("x-request-id")
  if (mpSignature && mpRequestId) {
    const mpSecret = process.env.MP_WEBHOOK_SECRET
    if (!mpSecret) return process.env.NODE_ENV !== "production"
    const tsMatch = mpSignature.match(/ts=(\d+)/)
    const v1Match = mpSignature.match(/v1=([a-f0-9]+)/)
    if (!tsMatch || !v1Match) return false
    try {
      const payload = JSON.parse(rawBody)
      const dataId = payload.data?.id
      if (!dataId) return false
      const manifest = `id:${dataId};request-id:${mpRequestId};ts:${tsMatch[1]};`
      const hmac = crypto.createHmac("sha256", mpSecret).update(manifest).digest("hex")
      return crypto.timingSafeEqual(Buffer.from(hmac), Buffer.from(v1Match[1]))
    } catch {
      return false
    }
  }

  return false
}
