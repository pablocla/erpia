import { type NextRequest, NextResponse } from "next/server"
import { getAuthContext } from "@/lib/auth/empresa-guard"
import { listSheetTemplates } from "@/lib/reporting/templates/registry"
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

  return NextResponse.json({ data: listSheetTemplates() })
}