import { emitToN8n } from "./n8n-bridge"
import { buildIdempotencyKey } from "./sign-payload"
import type { NopAutomationEventKey } from "./events-catalog"

/** Emite evento NOP → n8n (fire-and-forget seguro). */
export async function emitAutomationEvent(
  empresaId: number,
  eventKey: NopAutomationEventKey | string,
  data: unknown,
  idempotencySuffix?: string
) {
  return emitToN8n(
    empresaId,
    eventKey,
    data,
    buildIdempotencyKey(empresaId, eventKey, idempotencySuffix)
  )
}