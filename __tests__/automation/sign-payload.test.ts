import { describe, it, expect } from "vitest"
import {
  buildSignedEnvelope,
  buildIdempotencyKey,
  signPayload,
  verifySignature,
} from "@/lib/automation/sign-payload"

describe("sign-payload", () => {
  const secret = "test-secret-key-32chars-minimum!!"

  it("genera idempotency key estable por día", () => {
    const key = buildIdempotencyKey(1, "VENTA_EMITIDA", "fac-99")
    expect(key).toBe("emp-1-VENTA_EMITIDA-fac-99")
  })

  it("firma y verifica envelope HMAC", () => {
    const envelope = buildSignedEnvelope(5, "WEBHOOK_TEST", { foo: "bar" }, secret)
    expect(envelope.signature).toHaveLength(64)
    expect(verifySignature(secret, envelope)).toBe(true)
  })

  it("rechaza firma con secret incorrecto", () => {
    const envelope = buildSignedEnvelope(5, "STOCK_BAJO", {}, secret)
    expect(verifySignature("wrong-secret", envelope)).toBe(false)
  })

  it("signPayload es determinístico", () => {
    const body = {
      eventId: "abc",
      event: "VENTA_EMITIDA",
      empresaId: 1,
      timestamp: "2026-06-19T12:00:00.000Z",
      idempotencyKey: "k1",
      data: { total: 100 },
    }
    expect(signPayload(secret, body)).toBe(signPayload(secret, body))
  })
})