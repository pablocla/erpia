import { logExecution } from "./automation-service"
import type { SignedEnvelope } from "./sign-payload"

export interface OutboundWebhookJob {
  empresaId: number
  eventKey: string
  webhookUrl: string
  envelope: SignedEnvelope
}

export async function executeOutboundWebhook(job: OutboundWebhookJob): Promise<void> {
  const start = Date.now()
  const { empresaId, eventKey, webhookUrl, envelope } = job

  try {
    const res = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(envelope),
      signal: AbortSignal.timeout(15_000),
    })
    const text = await res.text().catch(() => "")
    await logExecution({
      empresaId,
      direction: "outbound",
      eventKey,
      status: res.ok ? "ok" : "error",
      requestPayload: envelope,
      responsePayload: { status: res.status, body: text.slice(0, 2000) },
      durationMs: Date.now() - start,
      idempotencyKey: envelope.idempotencyKey,
    })
    if (!res.ok) {
      throw new Error(`n8n webhook HTTP ${res.status}`)
    }
  } catch (err) {
    const isTimeout =
      err instanceof Error &&
      (err.name === "TimeoutError" || err.message.includes("timeout"))
    await logExecution({
      empresaId,
      direction: "outbound",
      eventKey,
      status: isTimeout ? "timeout" : "error",
      requestPayload: envelope,
      responsePayload: {
        error: err instanceof Error ? err.message : String(err),
      },
      durationMs: Date.now() - start,
      idempotencyKey: envelope.idempotencyKey,
    })
    throw err
  }
}