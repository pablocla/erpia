import { NextRequest, NextResponse } from "next/server"
import { requireAutomationAdmin } from "@/lib/automation/api-guard"
import {
  PLAYBOOK_TEMPLATES,
  VIRTUAL_WORKER_TEMPLATES,
} from "@/lib/automation/virtual-workers-catalog"

export async function GET(request: NextRequest) {
  const guard = await requireAutomationAdmin(request)
  if (!guard.ok) return guard.response

  return NextResponse.json({
    playbooks: PLAYBOOK_TEMPLATES,
    virtualWorkers: VIRTUAL_WORKER_TEMPLATES,
  })
}