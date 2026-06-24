import { type NextRequest, NextResponse } from "next/server"
import { getAuthContext } from "@/lib/auth/empresa-guard"
import { getCatalog } from "@/lib/reporting/semantic/catalog"
import {
  requireSheetsAccess,
  sheetsEntitlementPayload,
  sheetsEntitlementStatus,
} from "@/lib/reporting/sheets-entitlements"

export async function GET(request: NextRequest) {
  const ctx = await getAuthContext(request)
  if (!ctx.ok) return ctx.response

  const entitlement = await requireSheetsAccess(ctx.auth.empresaId)
  if (!entitlement.ok) {
    return NextResponse.json(
      { error: "Sin acceso a Clav Sheets", ...sheetsEntitlementPayload(entitlement) },
      { status: sheetsEntitlementStatus(entitlement) },
    )
  }

  const { searchParams } = new URL(request.url)
  const connectorId = searchParams.get("connectorId") ?? "claverp"
  const fuente = searchParams.get("fuente") ?? undefined

  const catalog = await getCatalog(connectorId, fuente)
  return NextResponse.json(catalog)
}