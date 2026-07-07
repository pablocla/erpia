import { NextResponse } from "next/server"
import { verifyCronAuth } from "@/lib/scheduling/cron-auth"
import { runOpsAlertas } from "@/lib/scheduling/jobs/ops-alertas"

export async function GET(request: Request) {
  const authError = verifyCronAuth(request)
  if (authError) return authError

  const result = await runOpsAlertas()
  return NextResponse.json({ ok: true, ...result })
}