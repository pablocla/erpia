import { type NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { getAuthContext } from "@/lib/auth/empresa-guard"
import { reportDefinitionSchema } from "@/lib/reporting/semantic/types"
import {
  createReportDefinition,
  listReportDefinitions,
} from "@/lib/reporting/definitions-service"
import {
  requireSheetsAccess,
  requireSheetsSave,
  sheetsEntitlementPayload,
  sheetsEntitlementStatus,
} from "@/lib/reporting/sheets-entitlements"

const createSchema = z.object({
  codigo: z.string().min(2),
  nombre: z.string().min(2),
  descripcion: z.string().optional(),
  connectorId: z.string().optional(),
  tipoVista: z.enum(["plano", "pivot", "grafico"]),
  definicion: reportDefinitionSchema,
  publico: z.boolean().optional(),
})

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

  const data = await listReportDefinitions(ctx.auth.empresaId)
  return NextResponse.json({ data })
}

export async function POST(request: NextRequest) {
  const ctx = await getAuthContext(request)
  if (!ctx.ok) return ctx.response

  const body = await request.json()
  const parsed = createSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos", detalles: parsed.error.errors }, { status: 400 })
  }

  const existing = await listReportDefinitions(ctx.auth.empresaId)
  const saveCheck = await requireSheetsSave(ctx.auth.empresaId, existing.length)
  if (!saveCheck.ok) {
    return NextResponse.json(
      { error: "Límite de reportes guardados", ...sheetsEntitlementPayload(saveCheck) },
      { status: sheetsEntitlementStatus(saveCheck) },
    )
  }

  try {
    const row = await createReportDefinition({
      empresaId: ctx.auth.empresaId,
      codigo: parsed.data.codigo,
      nombre: parsed.data.nombre,
      descripcion: parsed.data.descripcion,
      connectorId: parsed.data.connectorId,
      tipoVista: parsed.data.tipoVista,
      definicion: parsed.data.definicion,
      creadoPor: ctx.auth.userId,
      publico: parsed.data.publico,
    })
    return NextResponse.json(row, { status: 201 })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error al guardar"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}