/**
 * GET/POST /api/cron/dispatch
 *
 * Punto de entrada del scheduler (incluye sync-afip vía cron-registry).
 * Auth producción: Authorization: Bearer $CRON_SECRET
 *
 * Variables:
 *   CRON_SECRET, SCHEDULER_PROVIDER, SCHEDULER_TIER, SCHEDULER_WINDOW_MINUTES
 */

import { type NextRequest, NextResponse } from "next/server"
import { requireCronAuth } from "@/lib/auth/cron-guard"
import { dispatchScheduledJobs, listCronJobs } from "@/lib/scheduling/dispatcher"
import { recordPlatformEvent } from "@/lib/ops/platform-events"

export const maxDuration = 120
export const dynamic = "force-dynamic"

export async function POST(request: NextRequest) {
  const denied = requireCronAuth(request)
  if (denied) {
    void recordPlatformEvent({
      severity: "sev2",
      source: "cron",
      code: "CRON_UNAUTHORIZED",
      message: "Intento no autorizado a /api/cron/dispatch",
    })
    return denied
  }

  try {
    const summary = await dispatchScheduledJobs()
    console.log(
      `[Cron Dispatch] ${summary.executed} ok, ${summary.skipped} skipped, ${summary.errors} errors`,
    )
    return NextResponse.json(summary)
  } catch (error) {
    console.error("[Cron Dispatch] Error fatal:", error)
    return NextResponse.json({ error: "Error en cron dispatch" }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  const denied = requireCronAuth(request)
  if (denied) {
    void recordPlatformEvent({
      severity: "sev2",
      source: "cron",
      code: "CRON_UNAUTHORIZED",
      message: "Intento no autorizado a /api/cron/dispatch",
    })
    return denied
  }

  const catalog = request.nextUrl.searchParams.get("catalog")
  if (catalog === "1") {
    return NextResponse.json({
      jobs: listCronJobs(),
      provider: process.env.SCHEDULER_PROVIDER ?? "github-actions",
      tier: process.env.SCHEDULER_TIER ?? "free",
    })
  }

  return POST(request)
}
