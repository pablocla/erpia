import { type NextRequest, NextResponse } from "next/server"
import { getClaverAnalystContext } from "@/lib/auth/claver-analyst"
import { MARKETPLACE_CATALOG } from "@/lib/marketplace/marketplace-catalog"
import { MARKETPLACE_BUNDLES } from "@/lib/marketplace/bundles"
import { TENANT_PLAN_LIMITS } from "@/lib/ops/tenant-plan-service"

/** Catálogo completo para analistas (provisioning / torre) */
export async function GET(request: NextRequest) {
  const ctx = await getClaverAnalystContext(request)
  if (!ctx.ok) return ctx.response

  const catalog = MARKETPLACE_CATALOG.filter((item) => item.status !== "planned").map((item) => ({
    sku: item.sku,
    nombre: item.nombre,
    categoria: item.categoria,
    precioArs: item.precioArs,
    tipoCobro: item.tipoCobro,
    status: item.status,
    autoCertLevel: item.autoCertLevel,
    dependeDe: item.dependeDe ?? [],
  }))

  return NextResponse.json({
    catalog,
    bundles: MARKETPLACE_BUNDLES,
    planes: TENANT_PLAN_LIMITS,
  })
}