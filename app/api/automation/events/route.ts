import { NextRequest, NextResponse } from "next/server"
import { requireAutomationAdmin } from "@/lib/automation/api-guard"
import { NOP_AUTOMATION_EVENTS } from "@/lib/automation/events-catalog"
import { getOrCreateConfig } from "@/lib/automation/automation-service"

export async function GET(request: NextRequest) {
  const guard = await requireAutomationAdmin(request)
  if (!guard.ok) return guard.response

  const config = await getOrCreateConfig(guard.auth.empresaId)
  const mapped = new Set(config.eventMaps.map((m) => m.eventKey))

  return NextResponse.json({
    events: NOP_AUTOMATION_EVENTS.map((e) => ({
      ...e,
      activo: config.eventMaps.find((m) => m.eventKey === e.key)?.activo ?? false,
      configurado: mapped.has(e.key),
      n8nWebhookUrl:
        config.eventMaps.find((m) => m.eventKey === e.key)?.n8nWebhookUrl ?? null,
    })),
  })
}