import { NextRequest, NextResponse } from "next/server"
import { getAuthContext } from "@/lib/auth/empresa-guard"
import { analyzeProtheusProcessFlow, RawMovementSample } from "@/lib/opo/protheus-flow-miner"

export async function GET(request: NextRequest) {
  const auth = await getAuthContext(request)
  if (!auth.ok) return auth.response

  const searchParams = request.nextUrl.searchParams
  const periodDays = parseInt(searchParams.get("days") || "90", 10)

  // Ejecuta la inferencia de process mining
  const result = analyzeProtheusProcessFlow(auth.auth.empresaId, periodDays)

  return NextResponse.json({
    ok: true,
    data: result
  })
}

export async function POST(request: NextRequest) {
  const auth = await getAuthContext(request)
  if (!auth.ok) return auth.response

  let body: { periodDays?: number; sample?: RawMovementSample } = {}
  try {
    body = await request.json()
  } catch {
    // defaults
  }

  const result = analyzeProtheusProcessFlow(
    auth.auth.empresaId,
    body.periodDays ?? 90,
    body.sample
  )

  return NextResponse.json({
    ok: true,
    data: result
  })
}
