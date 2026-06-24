import { type NextRequest, NextResponse } from "next/server"
import { getAuthContext } from "@/lib/auth/empresa-guard"
import { executeReport } from "@/lib/reporting/engine/query-engine"
import {
  requireSheetsExecute,
  sheetsEntitlementPayload,
  sheetsEntitlementStatus,
  trackSheetsUsage,
} from "@/lib/reporting/sheets-entitlements"

export async function POST(request: NextRequest) {
  const ctx = await getAuthContext(request)
  if (!ctx.ok) return ctx.response

  const entitlement = await requireSheetsExecute(ctx.auth.empresaId)
  if (!entitlement.ok) {
    return NextResponse.json(
      { error: "Sin acceso a Clav Sheets", ...sheetsEntitlementPayload(entitlement) },
      { status: sheetsEntitlementStatus(entitlement) },
    )
  }

  try {
    const body = await request.json()
    const result = await executeReport(body, ctx.auth.empresaId, ctx.auth.rol)
    await trackSheetsUsage(ctx.auth.empresaId, "execute")
    return NextResponse.json({ ok: true, ...result })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error al ejecutar reporte"
    return NextResponse.json({ error: message }, { status: 400 })
  }
}