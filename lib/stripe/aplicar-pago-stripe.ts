/**
 * Apply debtor payment from Stripe Checkout (reuse fiado / CxC core).
 * Idempotent by stripe session id stored in observaciones prefix.
 */

import { prisma } from "@/lib/prisma"
import { parseDeudorPagoRef } from "@/lib/mercadopago/deudor-pago-ref"
import { cobrarFiadoLibreta } from "@/lib/fiado/fiado-service"
import { cobrosService } from "@/lib/cobros/cobros-service"

export type AplicarPagoStripeResult =
  | { ok: true; skipped?: boolean; reciboId?: number; reciboNumero?: string; reason?: string }
  | { ok: false; error: string }

const STRIPE_TAG = (sessionId: string) => `stripe:${sessionId}`

export async function aplicarPagoDeudorDesdeStripe(input: {
  empresaId: number
  externalRef: string
  monto: number
  stripeSessionId: string
  customerEmail?: string | null
}): Promise<AplicarPagoStripeResult> {
  const monto = Math.round(Number(input.monto) * 100) / 100
  if (monto <= 0) return { ok: false, error: "Monto inválido" }
  if (!input.stripeSessionId) return { ok: false, error: "session id requerido" }

  const tag = STRIPE_TAG(input.stripeSessionId)

  // Idempotency: same session already applied (Recibo no tiene empresaId directo)
  const ya = await prisma.recibo.findFirst({
    where: {
      observaciones: { contains: tag },
      cliente: { empresaId: input.empresaId },
    },
    select: { id: true, numero: true },
  })
  if (ya) {
    return {
      ok: true,
      skipped: true,
      reason: "already_applied",
      reciboId: ya.id,
      reciboNumero: ya.numero ?? undefined,
    }
  }

  const ref = parseDeudorPagoRef(input.externalRef)
  const obs = `Pago Stripe ${tag} ref=${input.externalRef}`

  try {
    if (ref.kind === "fiado") {
      const result = await cobrarFiadoLibreta({
        empresaId: input.empresaId,
        clienteId: ref.clienteId,
        monto,
        medioPago: "tarjeta",
        observaciones: obs,
      })
      if (!result.ok) {
        if (ref.cuentaCobrarId) {
          return aplicarSobreCc(input.empresaId, ref.cuentaCobrarId, monto, obs)
        }
        return { ok: false, error: result.error }
      }
      return {
        ok: true,
        reciboId: result.reciboId,
        reciboNumero: result.reciboNumero,
      }
    }

    if (ref.kind === "cxc") {
      return aplicarSobreCc(input.empresaId, ref.cuentaCobrarId, monto, obs)
    }

    if (ref.kind === "fac") {
      const ccs = await prisma.cuentaCobrar.findMany({
        where: {
          facturaId: ref.facturaId,
          cliente: { empresaId: input.empresaId },
          saldo: { gt: 0 },
          estado: { in: ["pendiente", "parcial", "vencida"] },
        },
        orderBy: { fechaVencimiento: "asc" },
      })
      if (ccs.length === 0) {
        return { ok: true, skipped: true, reason: "no_open_cc" }
      }
      let restante = monto
      const items: { cuentaCobrarId: number; monto: number }[] = []
      for (const cc of ccs) {
        if (restante <= 0) break
        const aplica = Math.min(Number(cc.saldo), restante)
        items.push({ cuentaCobrarId: cc.id, monto: Math.round(aplica * 100) / 100 })
        restante = Math.round((restante - aplica) * 100) / 100
      }
      const cobro = await cobrosService.registrarCobro({
        empresaId: input.empresaId,
        clienteId: ccs[0].clienteId,
        items,
        medioPago: "tarjeta",
        observaciones: obs,
      })
      return {
        ok: true,
        reciboId: cobro.reciboId,
        reciboNumero: cobro.reciboNumero,
      }
    }

    // SaaS subscription ref: claver-empresa-{id}-sku-...
    if (input.externalRef.startsWith("claver-empresa-")) {
      return { ok: true, skipped: true, reason: "saas_ref_handled_elsewhere" }
    }

    return { ok: true, skipped: true, reason: "unknown_ref" }
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Error aplicando pago Stripe",
    }
  }
}

async function aplicarSobreCc(
  empresaId: number,
  cuentaCobrarId: number,
  monto: number,
  obs: string,
): Promise<AplicarPagoStripeResult> {
  const cc = await prisma.cuentaCobrar.findFirst({
    where: { id: cuentaCobrarId, cliente: { empresaId } },
    select: { id: true, clienteId: true, saldo: true },
  })
  if (!cc) return { ok: false, error: "CxC no encontrada" }

  const aplica = Math.min(Number(cc.saldo), monto)
  if (aplica <= 0) return { ok: true, skipped: true, reason: "cc_zero_balance" }

  const cobro = await cobrosService.registrarCobro({
    empresaId,
    clienteId: cc.clienteId,
    items: [{ cuentaCobrarId: cc.id, monto: aplica }],
    medioPago: "tarjeta",
    observaciones: obs,
  })

  return {
    ok: true,
    reciboId: cobro.reciboId,
    reciboNumero: cobro.reciboNumero,
  }
}
