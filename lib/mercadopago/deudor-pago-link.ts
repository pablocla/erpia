/**
 * Link de pago genérico para deudores (fiado / expensa / alquiler / CxC).
 * Multinational: Stripe (US) o MercadoPago (AR) vía payment-link-router.
 */

import { prisma } from "@/lib/prisma"
import { crearPreferenciaPago, obtenerConfigMP } from "@/lib/mercadopago/mercadopago-service"
import {
  buildFiadoPagoExternalRef,
} from "@/lib/mercadopago/deudor-pago-ref"
import { isStripeReady } from "@/lib/stripe/stripe-service"
import { resolvePaymentProvider } from "@/lib/stripe/stripe-config"

export async function puedeGenerarLinkPago(empresaId: number): Promise<boolean> {
  // Stripe global keys + US tenant → can generate without MP config
  if (isStripeReady()) {
    const empresa = await prisma.empresa.findUnique({
      where: { id: empresaId },
      select: { paisFiscal: true },
    })
    if (resolvePaymentProvider({ paisFiscal: empresa?.paisFiscal }) === "stripe") {
      return true
    }
  }

  const [mpConfig, clavpay] = await Promise.all([
    obtenerConfigMP(empresaId),
    prisma.suscripcionModulo.findFirst({
      where: { empresaId, sku: "fiscal.clavpay_link", activo: true },
    }),
  ])
  if (mpConfig?.activo && mpConfig.checkoutHabilitado) return true
  return Boolean(clavpay)
}

/** MercadoPago-only (sin router) — usado por payment-link-router para evitar ciclos. */
export async function resolverLinkPagoDeudorMercadoPago(input: {
  empresaId: number
  clienteId: number
  clienteNombre: string
  monto: number
  titulo: string
  facturaId?: number | null
  cuentaCobrarId?: number | null
  emailPagador?: string | null
}): Promise<string | null> {
  const ok = await puedeGenerarLinkPagoMpOnly(input.empresaId)
  if (!ok) return null

  const monto = Math.round(Number(input.monto) * 100) / 100
  if (monto <= 0) return null

  try {
    let externalReference: string
    if (input.cuentaCobrarId) {
      externalReference = `cxc-${input.cuentaCobrarId}`
    } else if (input.facturaId && input.facturaId > 0) {
      externalReference = `fac-${input.facturaId}`
    } else {
      externalReference = buildFiadoPagoExternalRef({
        empresaId: input.empresaId,
        clienteId: input.clienteId,
        facturaId: input.facturaId ?? 0,
        cuentaCobrarId: input.cuentaCobrarId ?? undefined,
      })
    }

    const pref = await crearPreferenciaPago({
      empresaId: input.empresaId,
      titulo: input.titulo.slice(0, 120),
      monto,
      facturaId: input.facturaId && input.facturaId > 0 ? input.facturaId : undefined,
      cuentaCobrarId: input.cuentaCobrarId ?? undefined,
      emailPagador: input.emailPagador ?? undefined,
      externalReference,
    })
    return (pref.init_point as string) ?? (pref.sandbox_init_point as string) ?? null
  } catch (err) {
    console.warn("[MP] Link deudor no disponible:", err)
    return null
  }
}

/**
 * Crea preferencia MP o Checkout Stripe y devuelve URL de pago.
 * Usa external_ref cxc-* o fiado-* para conciliación en webhook.
 */
export async function resolverLinkPagoDeudor(input: {
  empresaId: number
  clienteId: number
  clienteNombre: string
  monto: number
  titulo: string
  facturaId?: number | null
  cuentaCobrarId?: number | null
  emailPagador?: string | null
}): Promise<string | null> {
  // Prefer multinational router (Stripe first for US)
  try {
    const { resolverLinkPagoDeudorUniversal } = await import(
      "@/lib/payments/payment-link-router"
    )
    const r = await resolverLinkPagoDeudorUniversal(input)
    if (r.url) return r.url
  } catch (err) {
    console.warn("[payments] router failed, MP only:", err)
  }

  return resolverLinkPagoDeudorMercadoPago(input)
}

export async function puedeGenerarLinkPagoMpOnly(empresaId: number): Promise<boolean> {
  const [mpConfig, clavpay] = await Promise.all([
    obtenerConfigMP(empresaId),
    prisma.suscripcionModulo.findFirst({
      where: { empresaId, sku: "fiscal.clavpay_link", activo: true },
    }),
  ])
  if (mpConfig?.activo && mpConfig.checkoutHabilitado) return true
  return Boolean(clavpay)
}
