/**
 * Checkout unificado: crédito partner → free/ancla → Mercado Pago.
 */

import { prisma } from "@/lib/prisma"
import {
  createMercadoPagoSubscription,
  activarSuscripcionPagada,
} from "@/lib/billing/mercadopago-subscription"
import { getOfertaEmpresa, resolvePrecioSku } from "@/lib/comercial/ofertas-comerciales"
import {
  aplicarPisoPrecioSuscripcion,
  esSkuAnclaGratis,
  precioCobrableSku,
} from "@/lib/comercial/precio-minimo"
import { tryPayWithPartnerCredit } from "@/lib/partners/partner-wallet-service"
import { activarProducto } from "@/lib/platform/product-lifecycle"
import { isSkuProvisionable } from "@/lib/marketplace/sku-availability"
import { isProductionRuntime } from "@/lib/config/env"

export async function createPlanSubscriptionCheckout(params: {
  empresaId: number
  userId: number
  email: string
  /** Preferir crédito partner si alcanza */
  preferCredit?: boolean
}) {
  const oferta = await getOfertaEmpresa(params.empresaId)
  const skus = oferta.monetizar.length > 0 ? oferta.monetizar : ["core.claver"]
  let priceArs = oferta.precioPackArs ?? 0
  if (!priceArs) {
    priceArs = skus.reduce((s, sku) => s + resolvePrecioSku(sku), 0)
  }
  priceArs = aplicarPisoPrecioSuscripcion(priceArs || 39_900)

  if (params.preferCredit !== false) {
    const credit = await tryPayWithPartnerCredit({
      usuarioId: params.userId,
      empresaId: params.empresaId,
      skus,
      priceArs,
    })
    if (credit.paid) {
      return {
        success: true,
        paidWithCredit: true,
        free: false,
        message: credit.message,
        skus,
        monto: credit.monto,
        init_point: null as string | null,
      }
    }
  }

  const empresa = await prisma.empresa.findUnique({
    where: { id: params.empresaId },
    select: { nombre: true, email: true },
  })

  const sub = await createMercadoPagoSubscription({
    empresaId: params.empresaId,
    planName: `Claver · ${oferta.nombre}`,
    priceArs,
    payerEmail: params.email || empresa?.email || "billing@claver.com.ar",
    sku: skus.join("+"),
  })

  return {
    success: true,
    paidWithCredit: false,
    free: false,
    mock: sub.mock,
    init_point: sub.init_point ?? null,
    subscriptionId: sub.id,
    skus,
    monto: priceArs,
    message: sub.mock
      ? "Checkout simulado (MP mock). Confirmá con el retorno."
      : "Redirigí al pagador de Mercado Pago",
  }
}

export async function subscribeSkuCheckout(params: {
  empresaId: number
  userId: number
  email: string
  sku: string
  preferCredit?: boolean
}) {
  const sku = params.sku.trim()
  if (!sku) throw new Error("sku requerido")

  if (esSkuAnclaGratis(sku)) {
    await activarProducto(params.empresaId, sku, "subscribe_free")
    await prisma.suscripcionModulo.upsert({
      where: { empresaId_sku: { empresaId: params.empresaId, sku } },
      update: { activo: true, vigenciaHasta: null },
      create: { empresaId: params.empresaId, sku, activo: true, vigenciaHasta: null },
    })
    return {
      success: true,
      free: true,
      paidWithCredit: false,
      message: "Ancla gratis activada",
      init_point: null as string | null,
      sku,
    }
  }

  if (!isSkuProvisionable(sku)) {
    throw new Error(`El módulo ${sku} aún no está disponible para activación automática`)
  }

  const priceArs = precioCobrableSku(sku, resolvePrecioSku(sku) || 12_900)

  if (params.preferCredit !== false) {
    const credit = await tryPayWithPartnerCredit({
      usuarioId: params.userId,
      empresaId: params.empresaId,
      skus: [sku],
      priceArs,
    })
    if (credit.paid) {
      return {
        success: true,
        free: false,
        paidWithCredit: true,
        message: credit.message,
        init_point: null as string | null,
        sku,
        monto: credit.monto,
      }
    }
  }

  const sub = await createMercadoPagoSubscription({
    empresaId: params.empresaId,
    planName: `Claver · ${sku}`,
    priceArs,
    payerEmail: params.email,
    sku,
  })

  return {
    success: true,
    free: false,
    paidWithCredit: false,
    mock: sub.mock,
    init_point: sub.init_point ?? null,
    subscriptionId: sub.id,
    sku,
    monto: priceArs,
    message: sub.mock ? "Checkout simulado" : "Redirigí a Mercado Pago",
  }
}

/** Mock MP return — activa y dispara comisiones */
export async function confirmMockSubscription(params: {
  empresaId: number
  ref?: string | null
}) {
  if (isProductionRuntime()) {
    throw new Error("Confirmación de suscripción mock deshabilitada en producción; esperá el webhook de Mercado Pago.")
  }
  await prisma.empresa.update({
    where: { id: params.empresaId },
    data: {
      mpSubscriptionStatus: "authorized",
      ...(params.ref ? { mpSubscriptionId: params.ref } : {}),
    },
  })
  await activarSuscripcionPagada(params.empresaId)
  return { success: true, authorized: true }
}
