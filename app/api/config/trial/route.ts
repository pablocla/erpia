import { NextRequest, NextResponse } from "next/server"
import { getAuthContext } from "@/lib/auth/empresa-guard"
import { getComercialAccessState } from "@/lib/comercial/comercial-access-service"

export async function GET(request: NextRequest) {
  const ctx = await getAuthContext(request)
  if (!ctx.ok) return ctx.response

  const access = await getComercialAccessState(ctx.auth.empresaId)

  return NextResponse.json({
    trial: access.trial,
    access: {
      ofertaId: access.ofertaId,
      ofertaNombre: access.ofertaNombre,
      ofertaLema: access.ofertaLema,
      tieneAnclaGratis: access.tieneAnclaGratis,
      anclaSkus: access.anclaSkus,
      monetizados: access.monetizados,
      upsellSkus: access.upsellSkus,
      precioUpgradeArs: access.precioUpgradeArs,
      bloqueoTotal: access.bloqueoTotal,
      mpAutorizado: access.mpAutorizado,
      modoLite: access.modoLite,
    },
  })
}