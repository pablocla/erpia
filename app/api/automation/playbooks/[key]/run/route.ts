import { NextRequest, NextResponse } from "next/server"
import { requireAutomationAdmin } from "@/lib/automation/api-guard"
import { runPlaybook } from "@/lib/automation/playbook-runner"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ key: string }> }
) {
  const guard = await requireAutomationAdmin(request)
  if (!guard.ok) return guard.response

  const { key } = await params
  const body = await request.json().catch(() => ({}))
  const parametros = (body.parametros ?? body) as Record<string, unknown>

  const result = await runPlaybook(guard.auth.empresaId, key, parametros)
  const status = result.ok ? 200 : 400
  return NextResponse.json(result, { status })
}