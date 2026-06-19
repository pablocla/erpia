import { NextRequest, NextResponse } from "next/server"
import { requireAutomationAdmin } from "@/lib/automation/api-guard"
import { seedAutomationDefaults, getOrCreateConfig, maskConfigForClient } from "@/lib/automation/automation-service"

export async function POST(request: NextRequest) {
  const guard = await requireAutomationAdmin(request)
  if (!guard.ok) return guard.response

  const body = await request.json().catch(() => ({}))
  const force = Boolean((body as { force?: boolean }).force)

  const result = await seedAutomationDefaults(guard.auth.empresaId, force)
  const config = await getOrCreateConfig(guard.auth.empresaId)

  return NextResponse.json({
    ...result,
    config: maskConfigForClient(config),
  })
}