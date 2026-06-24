import { type NextRequest, NextResponse } from "next/server"
import { getAuthContext } from "@/lib/auth/empresa-guard"
import {
  getSheetTemplate,
  resolveTemplateDefinition,
} from "@/lib/reporting/templates/registry"
import {
  requireSheetsAccess,
  sheetsEntitlementPayload,
  sheetsEntitlementStatus,
} from "@/lib/reporting/sheets-entitlements"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const ctx = await getAuthContext(request)
  if (!ctx.ok) return ctx.response

  const entitlement = await requireSheetsAccess(ctx.auth.empresaId)
  if (!entitlement.ok) {
    return NextResponse.json(
      { error: "Sin acceso a Clav Sheets", ...sheetsEntitlementPayload(entitlement) },
      { status: sheetsEntitlementStatus(entitlement) },
    )
  }

  const { id } = await params
  const template = getSheetTemplate(id)
  if (!template) {
    return NextResponse.json({ error: "Plantilla no encontrada" }, { status: 404 })
  }

  const resolved = resolveTemplateDefinition(template)
  return NextResponse.json(resolved)
}