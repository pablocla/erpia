import { emitToN8n } from "./n8n-bridge"

export async function executeN8nWorkflowStep(
  empresaId: number,
  step: {
    stepKey: string
    parametros?: unknown
  },
  contexto: Record<string, unknown>
): Promise<{ success: boolean; output?: unknown; error?: string }> {
  const params = (step.parametros ?? {}) as Record<string, unknown>
  const eventKey = String(params.eventKey ?? step.stepKey)
  const webhookUrl = params.webhookUrl as string | undefined

  if (webhookUrl) {
    const { getOrCreateConfig } = await import("./automation-service")
    const config = await getOrCreateConfig(empresaId)
    const { prisma } = await import("@/lib/prisma")
    await prisma.automationEventMap.upsert({
      where: {
        configId_eventKey: { configId: config.id, eventKey },
      },
      create: {
        configId: config.id,
        eventKey,
        n8nWebhookUrl: webhookUrl,
        activo: true,
      },
      update: { n8nWebhookUrl: webhookUrl, activo: true },
    })
  }

  const result = await emitToN8n(empresaId, eventKey, {
    workflowStep: step.stepKey,
    contexto,
  })

  if (!result.sent) {
    return {
      success: true,
      output: { skipped: true, reason: result.reason },
    }
  }

  return { success: true, output: { dispatched: true, eventKey } }
}