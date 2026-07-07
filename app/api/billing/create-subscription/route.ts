import { type NextRequest, NextResponse } from "next/server"
import { getAuthContext, whereEmpresa } from "@/lib/auth/empresa-guard"
import { createMercadoPagoSubscription } from "@/lib/billing/mercadopago-subscription"
import { prisma } from "@/lib/prisma"
import { getOfertaEmpresa, precioOfertaMonetizada } from "@/lib/comercial/ofertas-comerciales"
import { getSubSaasApp } from "@/lib/comercial/sub-saas-catalog"

const MODO_LITE_PRECIOS: Record<string, { nombre: string; precioArs: number }> = {
  fiado: { nombre: "Suscripción Claver Fiado", precioArs: 4990 },
  cobranza: { nombre: "Suscripción Claver Cobrá", precioArs: 20000 },
  turnos: { nombre: "Suscripción Claver Turnos", precioArs: 3990 },
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

    if (priceArs <= 0) {
      return NextResponse.json(
        { error: "Tu plan base es gratuito. Elegí un módulo de pago desde el panel." },
        { status: 400 },
      )
    }

    const sub = await createMercadoPagoSubscription({
      empresaId: auth.auth.empresaId,
      planName,
      priceArs,
      payerEmail: empresa.email || auth.auth.email || "demo@claver.app",
      sku,
    })

    return NextResponse.json({ success: true, init_point: sub.init_point, plan: planName, precioArs: priceArs })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error interno del servidor"
    console.error("Error al crear suscripción MP:", error)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}