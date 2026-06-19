import { createHmac, randomUUID, timingSafeEqual } from "crypto"

export interface SignedEnvelope<T = unknown> {
  eventId: string
  event: string
  empresaId: number
  timestamp: string
  idempotencyKey: string
  data: T
  signature: string
}

export function buildIdempotencyKey(
  empresaId: number,
  eventKey: string,
  suffix?: string
): string {
  const day = new Date().toISOString().slice(0, 10)
  return `emp-${empresaId}-${eventKey}-${suffix ?? day}`
}

export function signPayload(
  secret: string,
  body: Omit<SignedEnvelope, "signature">
): string {
  const canonical = JSON.stringify({
    eventId: body.eventId,
    event: body.event,
    empresaId: body.empresaId,
    timestamp: body.timestamp,
    idempotencyKey: body.idempotencyKey,
    data: body.data,
  })
  return createHmac("sha256", secret).update(canonical).digest("hex")
}

export function buildSignedEnvelope<T>(
  empresaId: number,
  eventKey: string,
  data: T,
  secret: string,
  idempotencyKey?: string
): SignedEnvelope<T> {
  const body = {
    eventId: randomUUID(),
    event: eventKey,
    empresaId,
    timestamp: new Date().toISOString(),
    idempotencyKey: idempotencyKey ?? buildIdempotencyKey(empresaId, eventKey),
    data,
  }
  return {
    ...body,
    signature: signPayload(secret, body),
  }
}

export function verifySignature(
  secret: string,
  envelope: SignedEnvelope
): boolean {
  const expected = signPayload(secret, {
    eventId: envelope.eventId,
    event: envelope.event,
    empresaId: envelope.empresaId,
    timestamp: envelope.timestamp,
    idempotencyKey: envelope.idempotencyKey,
    data: envelope.data,
  })
  try {
    return timingSafeEqual(
      Buffer.from(expected, "hex"),
      Buffer.from(envelope.signature, "hex")
    )
  } catch {
    return false
  }
}