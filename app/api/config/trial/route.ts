import { NextRequest, NextResponse } from "next/server"
import { getAuthContext } from "@/lib/auth/empresa-guard"
import { getTrialStatus } from "@/lib/comercial/trial-service"

export async function GET(request: NextRequest) {
  const ctx = await getAuthContext(request)
  if (!ctx.ok) return ctx.response

  const trial = await getTrialStatus(ctx.auth.empresaId)
  if (!trial) {
    return NextResponse.json({ trial: null })
  }

  return NextResponse.json({ trial })
}