import { NextRequest, NextResponse } from "next/server"
import { getAuthContext } from "@/lib/auth/empresa-guard"
import { runProtheusHealthScan, CustomScanOverrides } from "@/lib/opo/protheus-health-scanner"

export async function GET(request: NextRequest) {
  const auth = await getAuthContext(request)
  if (!auth.ok) return auth.response

  const report = runProtheusHealthScan(auth.auth.empresaId)

  return NextResponse.json({
    ok: true,
    data: report
  })
}

export async function POST(request: NextRequest) {
  const auth = await getAuthContext(request)
  if (!auth.ok) return auth.response

  let body: { overrides?: CustomScanOverrides } = {}
  try {
    body = await request.json()
  } catch {
    // defaults
  }

  const report = runProtheusHealthScan(auth.auth.empresaId, body.overrides)

  return NextResponse.json({
    ok: true,
    data: report
  })
}
