import { type NextRequest, NextResponse } from "next/server"
import { runTrialDunning } from "@/lib/comercial/trial-dunning-service"

export const maxDuration = 60
export const dynamic = "force-dynamic"

/**
 * GET/POST /api/cron/trial-dunning
 * Auth: Authorization: Bearer $CRON_SECRET  o  ?secret=
 * Vercel Cron / scheduler externo.
 */
function authorize(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET
  if (!secret) {
    // Sin secret en dev: permitir en non-production
    return process.env.NODE_ENV !== "production"
  }
  const auth = request.headers.get("authorization")
  if (auth === `Bearer ${secret}`) return true
  const q = request.nextUrl.searchParams.get("secret")
  return q === secret
}

async function handle(request: NextRequest) {
  if (!authorize(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
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
