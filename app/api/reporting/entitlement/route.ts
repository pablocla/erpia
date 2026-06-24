import { type NextRequest, NextResponse } from "next/server"
import { getAuthContext } from "@/lib/auth/empresa-guard"
import { upsertSuscripcion } from "@/lib/platform/commercial-service"
import {
  ensureDemoSheetsSubscription,
  getSheetsEntitlement,
  sheetsEntitlementPayload,
} from "@/lib/reporting/sheets-entitlements"
import { SHEETS_LITE_SKU, SHEETS_PRO_SKU } from "@/lib/platform/sku-catalog"

const ADMIN_ROLES = new Set(["admin", "administrador", "gerente", "dueno"])

export async function GET(request: NextRequest) {
  const ctx = await getAuthContext(request)
  if (!ctx.ok) return ctx.response

  const entitlement = await getSheetsEntitlement(ctx.auth.empresaId)
  return NextResponse.json(sheetsEntitlementPayload(entitlement))
}

export async function POST(request: NextRequest) {
  const ctx = await getAuthContext(request)
  if (!ctx.ok) return ctx.response

  if (!ADMIN_ROLES.has(ctx.auth.rol)) {
    return NextResponse.json({ error: "Solo administradores pueden activar add-ons" }, { status: 403 })
  }

  const body = await request.json().catch(() => ({}))
  const action = typeof body.action === "string" ? body.action : "trial"

  if (action === "trial") {
    const tier = body.tier === "lite" ? "lite" : "pro"
    const sub = await ensureDemoSheetsSubscription(ctx.auth.empresaId, tier)
    const entitlement = await getSheetsEntitlement(ctx.auth.empresaId)
    return NextResponse.json({
      ok: true,
      suscripcion: sub,
      ...sheetsEntitlementPayload(entitlement),
    })
  }

  if (action === "activate") {
    const sku = body.sku === SHEETS_LITE_SKU ? SHEETS_LITE_SKU : SHEETS_PRO_SKU
    const sub = await upsertSuscripcion(ctx.auth.empresaId, {
      sku,
      activo: true,
      vigenciaHasta: null,
    })
    const entitlement = await getSheetsEntitlement(ctx.auth.empresaId)
    return NextResponse.json({
      ok: true,
      suscripcion: sub,
      ...sheetsEntitlementPayload(entitlement),
    })
  }

  return NextResponse.json({ error: "Acción no válida" }, { status: 400 })
}