import { type NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { getAuthContext } from "@/lib/auth/empresa-guard"
import { createDashboard, listDashboards } from "@/lib/reporting/dashboards-service"
import {
  requireSheetsAccess,
  sheetsEntitlementPayload,
  sheetsEntitlementStatus,
} from "@/lib/reporting/sheets-entitlements"

const widgetSchema = z.object({
  smartViewId: z.number().int().optional(),
  titulo: z.string().min(1),
  tipoGrafico: z.string().optional(),
  refreshSec: z.number().int().optional(),
})

const layoutItemSchema = z.object({
  i: z.string(),
  x: z.number().int(),
  y: z.number().int(),
  w: z.number().int(),
  h: z.number().int(),
  smartViewId: z.number().int().optional(),
})

const createSchema = z.object({
  nombre: z.string().min(2),
  descripcion: z.string().optional(),
  layout: z.array(layoutItemSchema).optional(),
  widgets: z.array(widgetSchema).optional(),
  esDefault: z.boolean().optional(),
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

  const data = await listDashboards(ctx.auth.empresaId, ctx.auth.userId)
  return NextResponse.json({ data })
}

export async function POST(request: NextRequest) {
  const ctx = await getAuthContext(request)
  if (!ctx.ok) return ctx.response

  const entitlement = await requireSheetsAccess(ctx.auth.empresaId)
  if (!entitlement.ok) {
    return NextResponse.json(
      { error: "Sin acceso a Clav Sheets", ...sheetsEntitlementPayload(entitlement) },
      { status: sheetsEntitlementStatus(entitlement) },
    )
  }

  const body = await request.json()
  const parsed = createSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos", detalles: parsed.error.errors }, { status: 400 })
  }

  try {
    const row = await createDashboard({
      empresaId: ctx.auth.empresaId,
      usuarioId: ctx.auth.userId,
      nombre: parsed.data.nombre,
      descripcion: parsed.data.descripcion,
      layout: parsed.data.layout,
      widgets: parsed.data.widgets,
      esDefault: parsed.data.esDefault,
    })
    return NextResponse.json(row, { status: 201 })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error al guardar dashboard"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}