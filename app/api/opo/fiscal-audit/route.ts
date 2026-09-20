import { NextRequest, NextResponse } from "next/server"
import { getAuthContext } from "@/lib/auth/empresa-guard"
import { runFiscalHistoricalAudit, PROTHEUS_FISCAL_AUDIT_QUERIES } from "@/lib/opo/protheus-fiscal-queries"

export async function GET(request: NextRequest) {
  const auth = await getAuthContext(request)
  if (!auth.ok) return auth.response

  const searchParams = request.nextUrl.searchParams
  const desdeFecha = searchParams.get("from") || "20250101"
  const mode = (searchParams.get("mode") as "sql_direct" | "rest_api" | "simulated_demo") || "simulated_demo"

  const result = runFiscalHistoricalAudit(auth.auth.empresaId, mode, desdeFecha)

  return NextResponse.json({
    ok: true,
    data: result
  })
}

export async function POST(request: NextRequest) {
  const auth = await getAuthContext(request)
  if (!auth.ok) return auth.response

  let body: { from?: string; mode?: "sql_direct" | "rest_api" | "simulated_demo" } = {}
  try {
    body = await request.json()
  } catch {
    // defaults
  }

  const result = runFiscalHistoricalAudit(
    auth.auth.empresaId,
    body.mode || "simulated_demo",
    body.from || "20250101"
  )

  return NextResponse.json({
    ok: true,
    data: result
  })
}
