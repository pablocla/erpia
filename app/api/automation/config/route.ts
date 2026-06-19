import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { requireAutomationAdmin } from "@/lib/automation/api-guard"
import {
  getOrCreateConfig,
  maskConfigForClient,
  updateConfig,
  upsertEventMap,
  upsertPlaybook,
  upsertVirtualWorker,
} from "@/lib/automation/automation-service"

export async function GET(request: NextRequest) {
  const guard = await requireAutomationAdmin(request)
  if (!guard.ok) return guard.response

  const config = await getOrCreateConfig(guard.auth.empresaId)
  return NextResponse.json(maskConfigForClient(config))
}

const putSchema = z.object({
  n8nBaseUrl: z.string().nullable().optional(),
  n8nApiKey: z.string().nullable().optional(),
  webhookSecret: z.string().min(16).optional(),
  activo: z.boolean().optional(),
  metadata: z.record(z.unknown()).optional(),
  eventMaps: z
    .array(
      z.object({
        eventKey: z.string(),
        n8nWebhookUrl: z.string().url(),
        activo: z.boolean().optional(),
      })
    )
    .optional(),
  playbooks: z
    .array(
      z.object({
        playbookKey: z.string(),
        nombre: z.string(),
        parametros: z.record(z.unknown()).optional(),
        activo: z.boolean().optional(),
      })
    )
    .optional(),
  virtualWorkers: z
    .array(
      z.object({
        id: z.number().optional(),
        nombre: z.string(),
        rol: z.string(),
        playbooks: z.array(z.string()),
        cron: z.string().nullable().optional(),
        activo: z.boolean().optional(),
      })
    )
    .optional(),
})

export async function PUT(request: NextRequest) {
  const guard = await requireAutomationAdmin(request)
  if (!guard.ok) return guard.response

  const body = await request.json().catch(() => null)
  const parsed = putSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const { eventMaps, playbooks, virtualWorkers, ...configData } = parsed.data
  await updateConfig(guard.auth.empresaId, configData)

  if (eventMaps) {
    for (const map of eventMaps) {
      await upsertEventMap(
        guard.auth.empresaId,
        map.eventKey,
        map.n8nWebhookUrl,
        map.activo ?? true
      )
    }
  }

  if (playbooks) {
    for (const pb of playbooks) {
      await upsertPlaybook(guard.auth.empresaId, pb)
    }
  }

  if (virtualWorkers) {
    for (const worker of virtualWorkers) {
      await upsertVirtualWorker(guard.auth.empresaId, worker)
    }
  }

  const config = await getOrCreateConfig(guard.auth.empresaId)
  return NextResponse.json(maskConfigForClient(config))
}