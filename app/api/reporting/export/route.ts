import { type NextRequest, NextResponse } from "next/server"
import { getAuthContext } from "@/lib/auth/empresa-guard"
import { executeReport } from "@/lib/reporting/engine/query-engine"
import { buildExcelFromResult } from "@/lib/reporting/export/excel-builder"
import {
  requireSheetsExport,
  sheetsEntitlementPayload,
  sheetsEntitlementStatus,
  trackSheetsUsage,
} from "@/lib/reporting/sheets-entitlements"

export async function POST(request: NextRequest) {
  const ctx = await getAuthContext(request)
  if (!ctx.ok) return ctx.response

  const entitlement = await requireSheetsExport(ctx.auth.empresaId)
  if (!entitlement.ok) {
    return NextResponse.json(
      { error: "Sin acceso a export Excel", ...sheetsEntitlementPayload(entitlement) },
      { status: sheetsEntitlementStatus(entitlement) },
    )
  }

  try {
    const body = await request.json()
    const { definicion, titulo = "Reporte" } = body
    const result = await executeReport(definicion, ctx.auth.empresaId, ctx.auth.rol)
    const buffer = await buildExcelFromResult(result, titulo)
    const filename = `${titulo.replace(/\s+/g, "_")}_${new Date().toISOString().split("T")[0]}.xlsx`
    await trackSheetsUsage(ctx.auth.empresaId, "export")

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error al exportar"
    return NextResponse.json({ error: message }, { status: 400 })
  }
}