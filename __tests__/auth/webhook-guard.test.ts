import { describe, it, expect, afterEach, vi } from "vitest"
import { NextRequest } from "next/server"
import crypto from "crypto"
import { validateTwilioSignature, validarFirmaWebhook } from "@/lib/auth/webhook-guard"

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
