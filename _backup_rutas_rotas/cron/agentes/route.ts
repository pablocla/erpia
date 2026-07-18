/**
 * GET/POST /api/cron/agentes — Automatic agent scheduler
 *
 * Called by external cron (Railway/Vercel/GitHub Actions) every hour.
 * Checks each agent's cron expression, runs the ones that are due.
 *
 * Security: uses CRON_SECRET header to prevent unauthorized execution.
 *
 * Setup:
 *   - Railway: add cron job calling POST /api/cron/agentes every hour
 *   - Vercel: add to vercel.json crons config
 *   - curl: curl -X POST https://your-app/api/cron/agentes -H "Authorization: Bearer $CRON_SECRET"
 */

import { NextRequest, NextResponse } from "next/server"
import { verifyCronAuth } from "@/lib/scheduling/cron-auth"
import { runScheduledAgents } from "@/lib/scheduling/jobs/agentes"

export async function POST(request: NextRequest) {
  const authError = verifyCronAuth(request)
  if (authError) return authError

  const summary = await runScheduledAgents()
  console.log(
    `[Cron] ${summary.ejecutados} agentes ejecutados, ${summary.omitidos} omitidos, ${summary.errores} errores`
  )
  return NextResponse.json(summary)
}

// GET also works (for health checks / manual browser trigger in dev)
export async function GET(request: NextRequest) {
  return POST(request)
}
