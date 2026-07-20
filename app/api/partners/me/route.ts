import { type NextRequest, NextResponse } from "next/server"
import { getAuthContext } from "@/lib/auth/empresa-guard"
import {
  ensurePartnerProfile,
  getPartnerDashboard,
  solicitarRetiroComisiones,
} from "@/lib/partners/affiliate-service"
import {
  activarSkuConCredito,
  canjearContadorGratis,
  pagarSuscripcionConCredito,
} from "@/lib/partners/partner-wallet-service"

/** GET — dashboard del partner logueado (crea perfil seller si no existe). */
export async function GET(request: NextRequest) {
  const auth = await getAuthContext(request)
  if (!auth.ok) return auth.response

  try {
    let data = await getPartnerDashboard(auth.auth.userId)
    if (!data) {
      await ensurePartnerProfile({
        usuarioId: auth.auth.userId,
        tipo: "seller",
        nombreFantasia: auth.auth.email?.split("@")[0],
      })
      data = await getPartnerDashboard(auth.auth.userId)
    }
    if (!data) {
      return NextResponse.json({ error: "No se pudo cargar el portal partner" }, { status: 500 })
    }
    return NextResponse.json(data)
  } catch (err) {
    console.error("[partners/me GET]", err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error partner" },
      { status: 500 },
    )
  }
}

/**
 * POST actions:
 * - solicitar_retiro — marca pendiente → solicitado (cash out manual)
 * - pagar_con_credito — paga suscripción propia con comisiones (sin MP)
 * - activar_sku_credito — { sku }
 * - canjear_contador_gratis — 3 referidos pagos
 * - ensure_profile
 */
export async function POST(request: NextRequest) {
  const auth = await getAuthContext(request)
  if (!auth.ok) return auth.response

  try {
    const body = await request.json().catch(() => ({}))
    const action = body.action as string

    if (action === "solicitar_retiro") {
      const r = await solicitarRetiroComisiones(auth.auth.userId)
      return NextResponse.json(r)
    }

    if (action === "pagar_con_credito") {
      const r = await pagarSuscripcionConCredito({
        usuarioId: auth.auth.userId,
        empresaId: auth.auth.empresaId,
        skus: Array.isArray(body.skus) ? body.skus.map(String) : undefined,
      })
      return NextResponse.json(r)
    }

    if (action === "activar_sku_credito") {
      const sku = typeof body.sku === "string" ? body.sku : ""
      if (!sku) return NextResponse.json({ error: "sku requerido" }, { status: 400 })
      const r = await activarSkuConCredito({
        usuarioId: auth.auth.userId,
        empresaId: auth.auth.empresaId,
        sku,
      })
      return NextResponse.json(r)
    }

    if (action === "canjear_contador_gratis") {
      const r = await canjearContadorGratis({
        usuarioId: auth.auth.userId,
        empresaId: auth.auth.empresaId,
      })
      return NextResponse.json(r)
    }

    if (action === "ensure_profile") {
      const p = await ensurePartnerProfile({
        usuarioId: auth.auth.userId,
        tipo: body.tipo ?? "seller",
        nombreFantasia: body.nombreFantasia,
        referralCode: body.referralCode,
        parentReferralCode: body.parentRef,
      })
      return NextResponse.json({ ok: true, partnerId: p.id, referralCode: p.referralCode })
    }

    return NextResponse.json({ error: "action inválida" }, { status: 400 })
  } catch (err) {
    console.error("[partners/me POST]", err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error partner" },
      { status: 500 },
    )
  }
}
