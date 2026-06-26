import { type NextRequest, NextResponse } from "next/server"
import { getAuthContext } from "@/lib/auth/empresa-guard"
import { canUseSku } from "@/lib/platform/entitlements"
import { MODULOS_ALMACEN_ROSARIO } from "@/lib/almacen-rosario/modulos-catalog"

/** GET — todos los módulos visibles; activo=false si SKU no contratado */
export async function GET(request: NextRequest) {
  const ctx = await getAuthContext(request)
  if (!ctx.ok) return ctx.response

  const empresaId = ctx.auth.empresaId
  const activaciones = await Promise.all(
    MODULOS_ALMACEN_ROSARIO.map(async (m) => ({
      sku: m.sku,
      activo: (await canUseSku(empresaId, m.sku)).ok,
    })),
  )
  const activoMap = Object.fromEntries(activaciones.map((a) => [a.sku, a.activo]))

  const modulos = MODULOS_ALMACEN_ROSARIO.map((m) => ({
    ...m,
    activo: activoMap[m.sku] ?? false,
    bloqueado: !activoMap[m.sku],
    activarEn: "/dashboard/apps",
    guiaEn: `/dashboard/almacen/guia#${m.docAnchor}`,
  }))

  return NextResponse.json({
    packId: "pool-almacen-rosario",
    total: modulos.length,
    activos: modulos.filter((m) => m.activo).length,
    modulos,
  })
}