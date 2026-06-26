/**
 * QR dinámico MercadoPago para cobro en POS (sin datáfono físico).
 */
import QRCode from "qrcode"
import { prisma } from "@/lib/prisma"
import { obtenerConfigMP } from "@/lib/mercadopago/mercadopago-service"

export interface PosQrIntent {
  externalReference: string
  initPoint: string
  qrDataUrl: string
  monto: number
  preferenceId: string
}

export async function crearQrPos(
  empresaId: number,
  monto: number,
  descripcion: string,
): Promise<PosQrIntent> {
  const config = await obtenerConfigMP(empresaId)
  if (!config?.activo || !config.qrHabilitado) {
    throw new Error("MercadoPago QR no está habilitado. Configuralo en Integraciones → MercadoPago")
  }
  if (!config.accessToken) {
    throw new Error("Access token de MercadoPago no configurado")
  }

  const externalReference = `pos-${empresaId}-${Date.now()}`
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000"

  const response = await fetch("https://api.mercadopago.com/checkout/preferences", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.accessToken}`,
    },
    body: JSON.stringify({
      items: [
        {
          title: descripcion.slice(0, 120),
          quantity: 1,
          unit_price: monto,
          currency_id: "ARS",
        },
      ],
      external_reference: externalReference,
      notification_url: `${baseUrl}/api/mercadopago/webhook`,
      back_urls: {
        success: `${baseUrl}/dashboard/pos`,
        failure: `${baseUrl}/dashboard/pos`,
        pending: `${baseUrl}/dashboard/pos`,
      },
      auto_return: "approved",
      payment_methods: {
        excluded_payment_types: [{ id: "ticket" }],
      },
    }),
  })

  if (!response.ok) {
    const err = await response.text()
    throw new Error(`MercadoPago: ${err}`)
  }

  const pref = await response.json()
  const initPoint: string = pref.init_point ?? pref.sandbox_init_point
  if (!initPoint) throw new Error("MercadoPago no devolvió link de pago")

  const qrDataUrl = await QRCode.toDataURL(initPoint, {
    width: 280,
    margin: 1,
    errorCorrectionLevel: "M",
  })

  return {
    externalReference,
    initPoint,
    qrDataUrl,
    monto,
    preferenceId: pref.id,
  }
}

export async function consultarPagoPosPorReferencia(
  empresaId: number,
  externalReference: string,
): Promise<{ aprobado: boolean; paymentId?: string; monto?: number }> {
  const config = await obtenerConfigMP(empresaId)
  if (!config?.accessToken) {
    return { aprobado: false }
  }

  const searchUrl = new URL("https://api.mercadopago.com/v1/payments/search")
  searchUrl.searchParams.set("external_reference", externalReference)
  searchUrl.searchParams.set("sort", "date_created")
  searchUrl.searchParams.set("criteria", "desc")

  const res = await fetch(searchUrl.toString(), {
    headers: { Authorization: `Bearer ${config.accessToken}` },
  })

  if (!res.ok) return { aprobado: false }

  const data = await res.json()
  const payment = data.results?.find((p: { status: string }) => p.status === "approved")
  if (!payment) return { aprobado: false }

  await prisma.mercadoPagoTransaccion.upsert({
    where: { mpPaymentId: String(payment.id) },
    create: {
      mpPaymentId: String(payment.id),
      estado: payment.status,
      monto: payment.transaction_amount,
      medioPago: payment.payment_type_id,
      descripcion: payment.description,
      configId: config.id,
      empresaId,
      conciliado: true,
    },
    update: {
      estado: payment.status,
      conciliado: true,
    },
  })

  return {
    aprobado: true,
    paymentId: String(payment.id),
    monto: payment.transaction_amount,
  }
}