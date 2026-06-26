import { type NextRequest, NextResponse } from "next/server"
import { getAuthContext } from "@/lib/auth/empresa-guard"
import { canUseSku } from "@/lib/platform/entitlements"
import { promocionesDelDia } from "@/lib/almacen-rosario/promos-pago-service"

export async function GET(request: NextRequest) {
  const ctx = await getAuthContext(request)
  if (!ctx.ok) return ctx.response

  const acceso = await canUseSku(ctx.auth.empresaId, "pos.promos_pago")
  if (!acceso.ok) {
    return NextResponse.json({ activo: false, promociones: [] })
  }

  const promociones = await promocionesDelDia(ctx.auth.empresaId)
  return NextResponse.json({ activo: true, promociones })
}