import { prisma } from "@/lib/prisma"
import { buildSignedEnvelope } from "./sign-payload"
import { enqueueOutboundWebhook } from "./outbound-queue"
import { getOrCreateConfig, logExecution } from "./automation-service"
import { requireAutomationEntitlement, trackAutomationUsage } from "@/lib/platform/entitlements"
import { enqueuePollEvent } from "./poll-buffer"
import type { NopAutomationEventKey } from "./events-catalog"

export type ModoConexion = "webhook" | "poll" | "both"

export function getModoConexion(metadata: unknown): ModoConexion {
  if (!metadata || typeof metadata !== "object") return "webhook"
  const modo = (metadata as Record<string, unknown>).modoConexion
  if (modo === "poll" || modo === "both") return modo
  return "webhook"
}

export async function emitToN8n(
  empresaId: number,
  eventKey: NopAutomationEventKey | string,
  data: unknown,
  idempotencyKey?: string
): Promise<{ sent: boolean; reason?: string; mode?: ModoConexion }> {
  const access = await requireAutomationEntitlement(empresaId)
  if (!access.ok) {
    return { sent: false, reason: access.reason }
  }

  const config = await prisma.automationConfig.findUnique({
    where: { empresaId },
    include: { eventMaps: true },
  })

  if (!config?.activo) {
    await logExecution({
      empresaId,
      direction: "outbound",
      eventKey,
      status: "skipped",
      requestPayload: data,
      idempotencyKey,
    })
    return { sent: false, reason: "automation_inactive" }
  }

  const modo = getModoConexion(config.metadata)
  const envelope = buildSignedEnvelope(
    empresaId,
    eventKey,
    data,
    config.webhookSecret,
    idempotencyKey
  )

  const map = config.eventMaps.find(
    (m) => m.eventKey === eventKey && m.activo
  )

  if (modo === "poll") {
    await enqueuePollEvent(empresaId, eventKey, envelope)
    await logExecution({
      empresaId,
      direction: "outbound",
      eventKey,
      status: "ok",
      requestPayload: envelope,
      responsePayload: { mode: "poll", queued: true },
      idempotencyKey,
    })
    await trackAutomationUsage(empresaId, eventKey)
    return { sent: true, mode: "poll" }
  }

  if (!map?.n8nWebhookUrl && modo !== "both") {
    await logExecution({
      empresaId,
      direction: "outbound",
      eventKey,
      status: "skipped",
      requestPayload: data,
      idempotencyKey,
    })
    return { sent: false, reason: "no_event_map" }
  }

  if (modo === "both") {
    await enqueuePollEvent(empresaId, eventKey, envelope)
  }

  if (map?.n8nWebhookUrl) {
    await enqueueOutboundWebhook({
      empresaId,
      eventKey,
      webhookUrl: map.n8nWebhookUrl,
      envelope,
    })
  }

  await trackAutomationUsage(empresaId, eventKey)
  return { sent: true, mode: modo }
}