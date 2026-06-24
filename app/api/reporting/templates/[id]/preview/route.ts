import { type NextRequest, NextResponse } from "next/server"
import { getAuthContext } from "@/lib/auth/empresa-guard"
import { executeReport } from "@/lib/reporting/engine/query-engine"
import {
  getSheetTemplate,
  resolveTemplateDefinition,
} from "@/lib/reporting/templates/registry"
import {
  requireSheetsAccess,
  sheetsEntitlementPayload,
  sheetsEntitlementStatus,
} from "@/lib/reporting/sheets-entitlements"

const PREVIEW_ROW_LIMIT = 150

export async function POST(
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

  const body = await request.json().catch(() => ({}))
  const limit =
    typeof body.limit === "number"
      ? Math.min(Math.max(body.limit, 10), PREVIEW_ROW_LIMIT)
      : PREVIEW_ROW_LIMIT

  try {
    const resolved = resolveTemplateDefinition(template)
    const result = await executeReport(
      { ...resolved.definicion, limit },
      ctx.auth.empresaId,
      ctx.auth.rol,
    )

    return NextResponse.json({
      ok: true,
      preview: true,
      templateId: id,
      limit,
      ...result,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error al generar preview"
    return NextResponse.json({ error: message }, { status: 400 })
  }
}