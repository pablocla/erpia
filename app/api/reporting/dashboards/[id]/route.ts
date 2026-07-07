import { type NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { getAuthContext } from "@/lib/auth/empresa-guard"
import {
  deleteDashboard,
  getDashboard,
  updateDashboard,
} from "@/lib/reporting/dashboards-service"
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

const updateSchema = z.object({
  nombre: z.string().min(2).optional(),
  descripcion: z.string().optional(),
  layout: z.array(layoutItemSchema).optional(),
  widgets: z.array(widgetSchema).optional(),
  esDefault: z.boolean().optional(),
})

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
  const row = await getDashboard(Number(id), ctx.auth.empresaId)
  if (!row) return NextResponse.json({ error: "No encontrado" }, { status: 404 })
  return NextResponse.json(row)
}

export async function PATCH(
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

  const body = await request.json()
  const parsed = updateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos", detalles: parsed.error.errors }, { status: 400 })
  }

  const { id } = await params
  const row = await updateDashboard(Number(id), ctx.auth.empresaId, parsed.data)
  if (!row) return NextResponse.json({ error: "No encontrado" }, { status: 404 })
  return NextResponse.json(row)
}

export async function DELETE(
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
  const deleted = await deleteDashboard(Number(id), ctx.auth.empresaId)
  if (!deleted) return NextResponse.json({ error: "No encontrado" }, { status: 404 })
  return NextResponse.json({ ok: true })
}