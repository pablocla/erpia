import { prisma } from "@/lib/prisma"
import { getSiteUrl } from "@/lib/marketing/landing-seo"
import { getOfertaEmpresa } from "@/lib/comercial/ofertas-comerciales"

const MP_ACCESS_TOKEN = process.env.MP_ACCESS_TOKEN ?? ""
const MP_MOCK = !MP_ACCESS_TOKEN || MP_ACCESS_TOKEN.startsWith("TEST-mock")

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

  if (MP_MOCK) {
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
      Authorization: `Bearer ${MP_ACCESS_TOKEN}`,
    },
    body: JSON.stringify({
      reason: params.planName,
      external_reference: externalRef,
      payer_email: params.payerEmail,
      auto_recurring: {
        frequency: 1,
        frequency_type: "months",
        transaction_amount: params.priceArs,
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

  if (MP_MOCK) {
    return { synced: false, reason: "mock_mode", status: empresa.mpSubscriptionStatus }
  }

  const res = await fetch(`https://api.mercadopago.com/preapproval/${empresa.mpSubscriptionId}`, {
    headers: { Authorization: `Bearer ${MP_ACCESS_TOKEN}` },
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

  if (!MP_MOCK) {
    await fetch(`https://api.mercadopago.com/preapproval/${empresa.mpSubscriptionId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${MP_ACCESS_TOKEN}`,
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

export async function handleMercadoPagoWebhook(payload: { type?: string; data?: { id?: string }; action?: string }) {
  if (payload.type === "subscription_preapproval" && payload.data?.id) {
    const subId = payload.data.id
    const empresa = await prisma.empresa.findFirst({
      where: { mpSubscriptionId: subId },
    })

    if (empresa) {
      let status = "updated"
      if (!MP_MOCK) {
        const res = await fetch(`https://api.mercadopago.com/preapproval/${subId}`, {
          headers: { Authorization: `Bearer ${MP_ACCESS_TOKEN}` },
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

/** Extiende vigencia de módulos pagos tras confirmación MP */
export async function activarSuscripcionPagada(empresaId: number, skusExplicitos?: string[]) {
  const empresa = await prisma.empresa.findUnique({
    where: { id: empresaId },
    select: { mpSubscriptionId: true },
  })

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