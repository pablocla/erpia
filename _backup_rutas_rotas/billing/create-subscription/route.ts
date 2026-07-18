import { type NextRequest, NextResponse } from "next/server"
import { getAuthContext, whereEmpresa } from "@/lib/auth/empresa-guard"
import { createMercadoPagoSubscription } from "@/lib/billing/mercadopago-subscription"
import { prisma } from "@/lib/prisma"
import { getOfertaEmpresa, precioOfertaMonetizada } from "@/lib/comercial/ofertas-comerciales"
import { getSubSaasApp } from "@/lib/comercial/sub-saas-catalog"
import {
  aplicarPisoPrecioSuscripcion,
  assertPrecioSuscripcionValido,
  PRECIO_MINIMO_SUSCRIPCION_ARS,
} from "@/lib/comercial/precio-minimo"

/** Precios de plan por modo lite — piso comercial $10.000 (excepto ancla gratis vía oferta) */
const MODO_LITE_PRECIOS: Record<string, { nombre: string; precioArs: number }> = {
  fiado: { nombre: "Suscripción Claver + POS", precioArs: PRECIO_MINIMO_SUSCRIPCION_ARS },
  cobranza: { nombre: "Suscripción Claver Cobrá", precioArs: 20000 },
  turnos: { nombre: "Suscripción Claver Turnos", precioArs: PRECIO_MINIMO_SUSCRIPCION_ARS },
  pos: { nombre: "Suscripción Claver POS", precioArs: 12900 },
  completo: { nombre: "Suscripción Claver ERP", precioArs: 15000 },
}

export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthContext(request)
    if (!auth.ok) return auth.response

    const empresa = await prisma.empresa.findUnique({
      where: whereEmpresa(auth.auth.empresaId),
      select: { email: true, modoLite: true, nombre: true },
    })

    if (!empresa) {
      return NextResponse.json({ error: "Empresa no encontrada" }, { status: 404 })
    }

    const oferta = await getOfertaEmpresa(auth.auth.empresaId)
    const modoLite = empresa.modoLite ?? "completo"

    let planName = MODO_LITE_PRECIOS[modoLite]?.nombre ?? MODO_LITE_PRECIOS.completo.nombre
    let priceArs = MODO_LITE_PRECIOS[modoLite]?.precioArs ?? MODO_LITE_PRECIOS.completo.precioArs
    let sku = oferta.monetizar[0] ?? modoLite

    if (oferta.monetizar.length > 0) {
      planName = oferta.nombre
      priceArs = precioOfertaMonetizada(oferta)
      sku = oferta.monetizar.join("+")
    } else {
      const app = getSubSaasApp(modoLite)
      if (app && app.precioArs > 0) {
        planName = `Suscripción ${app.marca}`
        priceArs = app.precioArs
        sku = app.sku
      }
    }

    priceArs = aplicarPisoPrecioSuscripcion(priceArs)
    const valid = assertPrecioSuscripcionValido(priceArs)
    if (!valid.ok) {
      return NextResponse.json({ error: valid.error }, { status: 400 })
    }
    priceArs = valid.precio

    const sub = await createMercadoPagoSubscription({
      empresaId: auth.auth.empresaId,
      planName,
      priceArs,
      payerEmail: empresa.email || auth.auth.email || "demo@claver.app",
      sku,
    })

    return NextResponse.json({
      success: true,
      init_point: sub.init_point,
      plan: planName,
      precioArs: priceArs,
      precioMinimoArs: PRECIO_MINIMO_SUSCRIPCION_ARS,
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error interno del servidor"
    console.error("Error al crear suscripción MP:", error)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}