/**
 * Multinational payment link router: Stripe (US) or MercadoPago (AR/LATAM).
 */

import { prisma } from "@/lib/prisma"
import {
  puedeGenerarLinkPagoMpOnly,
  resolverLinkPagoDeudorMercadoPago,
} from "@/lib/mercadopago/deudor-pago-link"
import { createStripeCheckoutSession, isStripeReady } from "@/lib/stripe/stripe-service"
import { resolvePaymentProvider } from "@/lib/stripe/stripe-config"
import { marketFromCountry } from "@/lib/comercial/markets"
import {
  buildFiadoPagoExternalRef,
} from "@/lib/mercadopago/deudor-pago-ref"
import type { MarketId } from "@/lib/comercial/markets"

export async function resolveEmpresaPaymentContext(empresaId: number): Promise<{
  provider: "stripe" | "mercadopago"
  paisFiscal: string
  marketId: MarketId
}> {
  const empresa = await prisma.empresa.findUnique({
    where: { id: empresaId },
    select: { paisFiscal: true },
  })
  const paisFiscal = empresa?.paisFiscal ?? "AR"
  const marketId = marketFromCountry(paisFiscal)
  const provider = resolvePaymentProvider({ paisFiscal, marketId })
  return { provider, paisFiscal, marketId }
}

export async function puedeGenerarLinkPagoUniversal(empresaId: number): Promise<boolean> {
  const ctx = await resolveEmpresaPaymentContext(empresaId)
  if (ctx.provider === "stripe") {
    if (isStripeReady()) return true
    // fallback MP if Stripe not configured
    return puedeGenerarLinkPagoMpOnly(empresaId)
  }
  return puedeGenerarLinkPagoMpOnly(empresaId)
}

/**
 * Create debtor payment URL (Stripe Checkout or MP preference).
 */
export async function resolverLinkPagoDeudorUniversal(input: {
  empresaId: number
  clienteId: number
  clienteNombre: string
  monto: number
  titulo: string
  facturaId?: number | null
  cuentaCobrarId?: number | null
  emailPagador?: string | null
}): Promise<{ url: string | null; provider: "stripe" | "mercadopago" | "none" }> {
  const ctx = await resolveEmpresaPaymentContext(input.empresaId)

  if (ctx.provider === "stripe" && isStripeReady()) {
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

      const session = await createStripeCheckoutSession({
        empresaId: input.empresaId,
        amount: input.monto,
        title: input.titulo.slice(0, 120),
        customerEmail: input.emailPagador,
        externalReference,
        marketId: ctx.marketId,
        currency: ctx.marketId === "us" ? "usd" : undefined,
      })
      return { url: session.url, provider: "stripe" }
    } catch (err) {
      console.warn("[payments] Stripe link failed, fallback MP:", err)
    }
  }

  const mp = await resolverLinkPagoDeudorMercadoPago(input)
  return { url: mp, provider: mp ? "mercadopago" : "none" }
}
