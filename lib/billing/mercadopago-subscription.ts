import { prisma } from "@/lib/prisma"
import { getSiteUrl } from "@/lib/marketing/landing-seo"
import { getOfertaEmpresa } from "@/lib/comercial/ofertas-comerciales"
import { aplicarPisoPrecioSuscripcion } from "@/lib/comercial/precio-minimo"
import { getMpAccessToken, isMpMockMode, isProductionRuntime } from "@/lib/config/env"

function mpToken() {
  return getMpAccessToken()
}
function mpMock() {
  return isMpMockMode()
}

export interface CreateSubscriptionParams {
  empresaId: number
  planName: string
  priceArs: number
  payerEmail: string
  sku?: string
}

interface MpPreapprovalResponse {
  id: string
  init_point?: string
  status?: string
}

export async function createMercadoPagoSubscription(params: CreateSubscriptionParams) {
  const externalRef = `claver-empresa-${params.empresaId}-sku-${params.sku ?? "plan"}`
  const priceArs = aplicarPisoPrecioSuscripcion(params.priceArs)
  if (priceArs <= 0) {
    throw new Error("Monto de suscripción inválido (mínimo $10.000 o plan gratis por otro flujo)")
  }

  if (mpMock()) {
    // Production must always use Mercado Pago real; no flag can override this.
    if (isProductionRuntime()) {
      throw new Error("Mercado Pago no está configurado en producción (MP_ACCESS_TOKEN). " +
        "No se puede simular cobro. Configurá el token en Vercel Environment Variables.",
      )
    }
    const mockSubscriptionId = `mp_sub_${Date.now()}`
    await prisma.empresa.update({
      where: { id: params.empresaId },
      data: {
        mpSubscriptionId: mockSubscriptionId,
        mpSubscriptionStatus: "pending",
      },
    })
    return {
      id: mockSubscriptionId,
      init_point: `${getSiteUrl()}/dashboard/apps?mp_mock=1&ref=${mockSubscriptionId}`,
      status: "pending",
      mock: true,
    }
  }

  const siteUrl = getSiteUrl()
  const response = await fetch("https://api.mercadopago.com/preapproval", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${mpToken()}`,
    },
    body: JSON.stringify({
      reason: params.planName,
      external_reference: externalRef,
      payer_email: params.payerEmail,
      auto_recurring: {
        frequency: 1,
        frequency_type: "months",
        transaction_amount: priceArs,
        currency_id: "ARS",
      },
      back_url: siteUrl.includes("localhost") 
        ? `https://claver.com.ar/dashboard/apps?subscription=ok`
        : `${siteUrl}/dashboard/apps?subscription=ok`,
      status: "pending",
    }),
  })

  if (!response.ok) {
    const errText = await response.text()
    throw new Error(`Mercado Pago preapproval error: ${errText}`)
  }

  const data = (await response.json()) as MpPreapprovalResponse

  await prisma.empresa.update({
    where: { id: params.empresaId },
    data: {
      mpSubscriptionId: data.id,
      mpSubscriptionStatus: data.status ?? "pending",
    },
  })

  return {
    id: data.id,
    init_point: data.init_point,
    status: data.status ?? "pending",
    mock: false,
  }
}

/** Consulta MP y actualiza estado — útil en local sin webhook. */
export async function syncMercadoPagoSubscription(empresaId: number) {
  const empresa = await prisma.empresa.findUnique({
    where: { id: empresaId },
    select: { mpSubscriptionId: true, mpSubscriptionStatus: true },
  })

  if (!empresa?.mpSubscriptionId) {
    return { synced: false, reason: "no_subscription_id", status: empresa?.mpSubscriptionStatus ?? null }
  }

  if (mpMock()) {
    if (isProductionRuntime()) {
      throw new Error("Mercado Pago no está configurado en producción; no se puede sincronizar una suscripción mock.")
    }
    return { synced: false, reason: "mock_mode", status: empresa.mpSubscriptionStatus }
  }

  const res = await fetch(`https://api.mercadopago.com/preapproval/${empresa.mpSubscriptionId}`, {
    headers: { Authorization: `Bearer ${mpToken()}` },
  })

  if (!res.ok) {
    const errText = await res.text()
    return { synced: false, reason: "mp_error", error: errText, status: empresa.mpSubscriptionStatus }
  }

  const detail = (await res.json()) as { status?: string }
  const status = detail.status ?? empresa.mpSubscriptionStatus ?? "pending"

  await prisma.empresa.update({
    where: { id: empresaId },
    data: { mpSubscriptionStatus: status },
  })

  if (status === "authorized") {
    await activarSuscripcionPagada(empresaId)
  }

  return { synced: true, status, authorized: status === "authorized" }
}

export async function cancelMercadoPagoSubscription(empresaId: number) {
  const empresa = await prisma.empresa.findUnique({
    where: { id: empresaId },
    select: { mpSubscriptionId: true },
  })

  if (!empresa?.mpSubscriptionId) {
    throw new Error("La empresa no tiene una suscripción activa de MercadoPago")
  }

  if (!mpMock()) {
    await fetch(`https://api.mercadopago.com/preapproval/${empresa.mpSubscriptionId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${mpToken()}`,
      },
      body: JSON.stringify({ status: "cancelled" }),
    })
  }

  await prisma.empresa.update({
    where: { id: empresaId },
    data: { mpSubscriptionStatus: "cancelled" },
  })

  return { success: true }
}

export async function handleMercadoPagoWebhook(payload: {
  type?: string
  data?: { id?: string }
  action?: string
}) {
  // Pagos one-shot de deudores (fiado/cxc) — además de /api/mercadopago/webhook
  if ((payload.type === "payment" || payload.action?.includes("payment")) && payload.data?.id) {
    const paymentId = String(payload.data.id)
    try {
      const { confirmarPagoEspecialistaDesdeMp } = await import(
        "@/lib/servicios-especialista/especialista-service"
      )
      const especialista = await confirmarPagoEspecialistaDesdeMp(paymentId)
      if (especialista) {
        return { received: true, kind: "especialista" as const }
      }
    } catch (err) {
      console.warn("[MP webhook] especialista:", err)
    }
    const configs = await prisma.mercadoPagoConfig.findMany({ where: { activo: true } })
    for (const config of configs) {
      try {
        const { procesarWebhookMP } = await import("@/lib/mercadopago/mercadopago-service")
        await procesarWebhookMP(config.empresaId, paymentId)
        break
      } catch {
        continue
      }
    }
    return { received: true, kind: "payment" as const }
  }

  if (payload.type === "subscription_preapproval" && payload.data?.id) {
    const subId = payload.data.id
    const empresa = await prisma.empresa.findFirst({
      where: { mpSubscriptionId: subId },
    })

    if (empresa) {
      let status = "updated"
      if (!mpMock()) {
        const res = await fetch(`https://api.mercadopago.com/preapproval/${subId}`, {
          headers: { Authorization: `Bearer ${mpToken()}` },
        })
        if (res.ok) {
          const detail = (await res.json()) as { status?: string }
          status = detail.status ?? status
        }
      } else if (payload.action === "created") {
        status = "authorized"
      }

      await prisma.empresa.update({
        where: { id: empresa.id },
        data: { mpSubscriptionStatus: status },
      })

      if (status === "authorized") {
        await activarSuscripcionPagada(empresa.id)
      } else if (status === "cancelled" || status === "paused") {
        await desactivarSuscripcionPagada(empresa.id)
      }
    }
  }

  return { received: true }
}

function skusDesdeExternalRef(ref: string | null | undefined): string[] {
  if (!ref) return []
  const marker = "-sku-"
  const idx = ref.indexOf(marker)
  if (idx < 0) return []
  const raw = ref.slice(idx + marker.length)
  return raw.split("+").map((s) => s.trim()).filter(Boolean)
}

/** Extiende vigencia de módulos pagos tras confirmación MP (o crédito partner). */
export async function activarSuscripcionPagada(
  empresaId: number,
  skusExplicitos?: string[],
  opts?: {
    /** Crédito interno / canjes: no genera comisiones (no hubo cash de cliente) */
    skipComisiones?: boolean
    montoOverride?: number
  },
) {
  const oferta = await getOfertaEmpresa(empresaId)
  const skus =
    skusExplicitos?.length
      ? skusExplicitos
      : oferta.monetizar.length > 0
        ? oferta.monetizar
        : ["core.claver"]

  for (const sku of skus) {
    await prisma.suscripcionModulo.upsert({
      where: { empresaId_sku: { empresaId, sku } },
      update: { activo: true, vigenciaHasta: null },
      create: { empresaId, sku, activo: true, vigenciaHasta: null },
    })
  }

  await prisma.parametroFiscal.upsert({
    where: {
      empresaId_clave_pais: { empresaId, clave: "mp_ultimo_pago", pais: "AR" },
    },
    update: { descripcion: new Date().toISOString() },
    create: {
      empresaId,
      clave: "mp_ultimo_pago",
      valor: 1,
      descripcion: new Date().toISOString(),
      categoria: "comercial",
      pais: "AR",
    },
  })

  // Growth loop solo con pago real (MP/mock cash)
  if (!opts?.skipComisiones) {
    try {
      const { onSuscripcionPagada } = await import("@/lib/billing/facturacion-suscripcion")
      await onSuscripcionPagada({
        empresaId,
        skus,
        montoOverride: opts?.montoOverride,
      })
    } catch (err) {
      console.warn("[billing] comisiones afiliado no aplicadas:", err)
    }
  }
}

/** Revoca vigencia de módulos pagos tras cancelación o pausa en MP */
export async function desactivarSuscripcionPagada(empresaId: number) {
  const oferta = await getOfertaEmpresa(empresaId)
  const skus = oferta.monetizar.length > 0 ? oferta.monetizar : ["core.claver"]

  for (const sku of skus) {
    await prisma.suscripcionModulo.updateMany({
      where: { empresaId, sku },
      data: { vigenciaHasta: new Date() },
    })
  }
}

export { skusDesdeExternalRef }