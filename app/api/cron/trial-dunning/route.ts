import { type NextRequest, NextResponse } from "next/server"
import { runTrialDunning } from "@/lib/comercial/trial-dunning-service"
import { requireCronAuth } from "@/lib/auth/cron-guard"
import { recordPlatformEvent } from "@/lib/ops/platform-events"

export const maxDuration = 60
export const dynamic = "force-dynamic"

/**
 * GET/POST /api/cron/trial-dunning
 * Auth production: Authorization: Bearer $CRON_SECRET
 */
async function handle(request: NextRequest) {
  const denied = requireCronAuth(request)
  if (denied) {
    void recordPlatformEvent({
      severity: "sev2",
      source: "cron",
      code: "CRON_UNAUTHORIZED",
      message: "Intento no autorizado a /api/cron/trial-dunning",
    })
    return denied
  }

  try {
    const result = await runTrialDunning({ limit: 150 })
    console.log("[cron/trial-dunning]", result)
    return NextResponse.json({ ok: true, ...result })
  } catch (err) {
    console.error("[cron/trial-dunning]", err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error dunning" },
      { status: 500 },
    )
  }
}

export async function GET(request: NextRequest) {
  return handle(request)
}

export async function POST(request: NextRequest) {
  return handle(request)
}
