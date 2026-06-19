import { NextRequest, NextResponse } from "next/server"
import { requireAutomationAdmin } from "@/lib/automation/api-guard"
import { listExecutions } from "@/lib/automation/automation-service"

export async function GET(request: NextRequest) {
  const guard = await requireAutomationAdmin(request)
  if (!guard.ok) return guard.response

  const { searchParams } = new URL(request.url)
  const take = Math.min(parseInt(searchParams.get("take") ?? "50", 10) || 50, 200)

  const executions = await listExecutions(guard.auth.empresaId, take)
  return NextResponse.json(
    executions.map((e) => ({
      ...e,
      id: e.id.toString(),
    }))
  )
}