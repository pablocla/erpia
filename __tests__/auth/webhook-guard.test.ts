import { describe, it, expect, afterEach, vi } from "vitest"
import { NextRequest } from "next/server"
import crypto from "crypto"
import {
  validateTwilioSignature,
  validarFirmaWebhook,
  validarWebhookMercadoLibre,
} from "@/lib/auth/webhook-guard"

describe("validateTwilioSignature", () => {
  it("valida HMAC-SHA1 de URL + params ordenados", () => {
    const authToken = "test-auth-token"
    const url = "https://example.com/api/webhooks/whatsapp"
    const params = { Body: "SI", From: "whatsapp:+54911", To: "whatsapp:+1415" }
    const sorted = Object.keys(params).sort()
    let data = url
    for (const k of sorted) data += k + params[k as keyof typeof params]
    const sig = crypto.createHmac("sha1", authToken).update(Buffer.from(data, "utf8")).digest("base64")
    expect(validateTwilioSignature(authToken, sig, url, params)).toBe(true)
    expect(validateTwilioSignature(authToken, "bad", url, params)).toBe(false)
  })
})

describe("validarFirmaWebhook Twilio", () => {
  afterEach(() => {
    vi.unstubAllEnvs()
    delete process.env.TWILIO_AUTH_TOKEN
    delete process.env.NEXT_PUBLIC_APP_URL
    delete process.env.ALLOW_INSECURE_WEBHOOKS
  })

  it("production sin token: rechaza", () => {
    vi.stubEnv("NODE_ENV", "production")
    delete process.env.TWILIO_AUTH_TOKEN
    const body = "Body=hola&From=%2B1&To=%2B2"
    const r = new NextRequest("https://app.claver.com.ar/api/webhooks/whatsapp", {
      method: "POST",
      headers: { "X-Twilio-Signature": "abc", "content-type": "application/x-www-form-urlencoded" },
      body,
    })
    expect(validarFirmaWebhook(r, body)).toBe(false)
  })

  it("acepta firma válida con NEXT_PUBLIC_APP_URL", () => {
    vi.stubEnv("NODE_ENV", "production")
    process.env.TWILIO_AUTH_TOKEN = "tok123"
    process.env.NEXT_PUBLIC_APP_URL = "https://app.claver.com.ar"
    const params = { Body: "ok", From: "a", To: "b" }
    const raw = new URLSearchParams(params).toString()
    const url = "https://app.claver.com.ar/api/webhooks/whatsapp"
    const sorted = Object.keys(params).sort()
    let data = url
    for (const k of sorted) data += k + params[k as keyof typeof params]
    const sig = crypto.createHmac("sha1", "tok123").update(Buffer.from(data, "utf8")).digest("base64")

    const r = new NextRequest("https://app.claver.com.ar/api/webhooks/whatsapp", {
      method: "POST",
      headers: {
        "X-Twilio-Signature": sig,
        "content-type": "application/x-www-form-urlencoded",
      },
      body: raw,
    })
    expect(validarFirmaWebhook(r, raw)).toBe(true)
  })

  it("sin headers de firma: false", () => {
    const r = new NextRequest("https://app.claver.com.ar/api/webhooks/x", {
      method: "POST",
      body: "{}",
    })
    expect(validarFirmaWebhook(r, "{}")).toBe(false)
  })
})

describe("validarWebhookMercadoLibre", () => {
  afterEach(() => {
    vi.unstubAllEnvs()
    delete process.env.ML_WEBHOOK_SECRET
    delete process.env.WEBHOOK_SECRET
    delete process.env.ALLOW_INSECURE_WEBHOOKS
    delete process.env.ML_WEBHOOK_ALLOW_QUERY
  })

  it("production sin secret: rechaza", () => {
    vi.stubEnv("NODE_ENV", "production")
    delete process.env.ML_WEBHOOK_SECRET
    delete process.env.WEBHOOK_SECRET
    const r = new NextRequest("https://app.claver.com.ar/api/webhooks/mercadolibre/1", {
      method: "POST",
      body: "{}",
    })
    expect(validarWebhookMercadoLibre(r, "{}")).toBe(false)
  })

  it("acepta Bearer con ML_WEBHOOK_SECRET", () => {
    vi.stubEnv("NODE_ENV", "production")
    process.env.ML_WEBHOOK_SECRET = "ml-secret-xyz"
    const r = new NextRequest("https://app.claver.com.ar/api/webhooks/mercadolibre/1", {
      method: "POST",
      headers: { Authorization: "Bearer ml-secret-xyz" },
      body: '{"topic":"orders_v2"}',
    })
    expect(validarWebhookMercadoLibre(r, '{"topic":"orders_v2"}')).toBe(true)
  })

  it("acepta x-webhook-secret", () => {
    vi.stubEnv("NODE_ENV", "production")
    process.env.WEBHOOK_SECRET = "shared-wh"
    const r = new NextRequest("https://app.claver.com.ar/api/webhooks/mercadolibre/9", {
      method: "POST",
      headers: { "x-webhook-secret": "shared-wh" },
      body: "{}",
    })
    expect(validarWebhookMercadoLibre(r, "{}")).toBe(true)
  })

  it("rechaza secret incorrecto", () => {
    vi.stubEnv("NODE_ENV", "production")
    process.env.ML_WEBHOOK_SECRET = "good"
    const r = new NextRequest("https://app.claver.com.ar/api/webhooks/mercadolibre/1", {
      method: "POST",
      headers: { Authorization: "Bearer bad" },
      body: "{}",
    })
    expect(validarWebhookMercadoLibre(r, "{}")).toBe(false)
  })

  it("acepta HMAC sha256 del body", () => {
    vi.stubEnv("NODE_ENV", "production")
    process.env.ML_WEBHOOK_SECRET = "hmac-key"
    const body = '{"topic":"items"}'
    const hash = crypto.createHmac("sha256", "hmac-key").update(body).digest("hex")
    const r = new NextRequest("https://app.claver.com.ar/api/webhooks/mercadolibre/1", {
      method: "POST",
      headers: { "x-hub-signature-256": `sha256=${hash}` },
      body,
    })
    expect(validarWebhookMercadoLibre(r, body)).toBe(true)
  })

  it("query token en prod solo con ML_WEBHOOK_ALLOW_QUERY=1", () => {
    vi.stubEnv("NODE_ENV", "production")
    process.env.ML_WEBHOOK_SECRET = "q-secret"
    const rDeny = new NextRequest(
      "https://app.claver.com.ar/api/webhooks/mercadolibre/1?token=q-secret",
      { method: "POST", body: "{}" },
    )
    expect(validarWebhookMercadoLibre(rDeny, "{}")).toBe(false)

    process.env.ML_WEBHOOK_ALLOW_QUERY = "1"
    const rOk = new NextRequest(
      "https://app.claver.com.ar/api/webhooks/mercadolibre/1?token=q-secret",
      { method: "POST", body: "{}" },
    )
    expect(validarWebhookMercadoLibre(rOk, "{}")).toBe(true)
  })
})
