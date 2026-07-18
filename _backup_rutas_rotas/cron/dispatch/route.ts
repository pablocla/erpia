import { type NextRequest, NextResponse } from "next/server"
import { verifyCronAuth } from "@/lib/scheduling/cron-auth"
import { dispatchScheduledJobs, listCronJobs } from "@/lib/scheduling/dispatcher"

export const maxDuration = 120

/**
 * GET/POST /api/cron/dispatch
 *
 * Punto de entrada único del scheduler gratuito (GitHub Actions cada 5 min).
 * Con SCHEDULER_TIER=premium habilita jobs adicionales (IA diaria, cobranzas).
 *
 * Variables:
 *   CRON_SECRET              — Bearer token obligatorio en producción
 *   SCHEDULER_PROVIDER       — github-actions | vercel | supabase | railway
 *   SCHEDULER_TIER           — free (default) | premium
 *   SCHEDULER_WINDOW_MINUTES — tolerancia cron (default 5)
 */
export async function POST(request: Request) {
  const authError = verifyCronAuth(request)
  if (authError) return authError

  try {
    const summary = await dispatchScheduledJobs()
    console.log(
      `[Cron Dispatch] ${summary.executed} ok, ${summary.skipped} skipped, ${summary.errors} errors`
    )
    return NextResponse.json(summary)
  } catch (error) {
    console.error("[Cron Dispatch] Error fatal:", error)
    return NextResponse.json({ error: "Error en cron dispatch" }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  const authError = verifyCronAuth(request)
  if (authError) return authError

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