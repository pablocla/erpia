/**
 * MercadoPago Service
 *
 * Integración con MercadoPago: configuración, creación de preferencias de pago,
 * procesamiento de webhooks, conciliación automática con CxC.
 */

import crypto from "crypto"
import { prisma } from "@/lib/prisma"
import { getPublicAppUrl } from "@/lib/config/public-app-url"

// ─── Criptografía en reposo para credenciales de pago ───────────────────────

function getMpEncryptionKey(): Buffer {
  const raw =
    process.env.MP_ENCRYPTION_SECRET?.trim() ||
    process.env.ENCRYPTION_SECRET?.trim() ||
    process.env.AFIP_CERT_SECRET?.trim() ||
    process.env.JWT_SECRET?.trim() ||
    (process.env.NODE_ENV !== "production" ? "pos-argentina-dev-mp-encryption-secret-32b" : null)

  if (!raw) {
    throw new Error(
      "MP_ENCRYPTION_SECRET o JWT_SECRET no configurado para cifrar credenciales de pago en producción.",
    )
  }
  return crypto.createHash("sha256").update(raw).digest()
}

export function encryptMpSecret(value: string): string {
  if (!value) return value
  if (value.startsWith("enc:v1:")) return value // already encrypted
  const key = getMpEncryptionKey()
  const iv = crypto.randomBytes(12)
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv)
  const enc = Buffer.concat([cipher.update(Buffer.from(value, "utf8")), cipher.final()])
  const tag = cipher.getAuthTag()
  return `enc:v1:${iv.toString("base64")}:${tag.toString("base64")}:${enc.toString("base64")}`
}

export function decryptMpSecret(stored?: string | null): string {
  if (!stored) return ""
  if (!stored.startsWith("enc:v1:")) return stored // retrocompatibilidad con tokens planos
  const parts = stored.split(":")
  if (parts.length < 5) return stored
  try {
    const key = getMpEncryptionKey()
    const iv = Buffer.from(parts[2], "base64")
    const tag = Buffer.from(parts[3], "base64")
    const data = Buffer.from(parts[4], "base64")
    const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv)
    decipher.setAuthTag(tag)
    const dec = Buffer.concat([decipher.update(data), decipher.final()])
    return dec.toString("utf8")
  } catch (err) {
    console.error("[MercadoPago Crypto] Error al descifrar token:", err)
    return stored
  }
}

// ─── Configuración ──────────────────────────────────────────────────────────

export async function obtenerConfigMP(empresaId: number) {
  const config = await prisma.mercadoPagoConfig.findUnique({
    where: { empresaId },
  })
  if (!config) return null
  return {
    ...config,
    accessToken: decryptMpSecret(config.accessToken),
    webhookSecret: config.webhookSecret ? decryptMpSecret(config.webhookSecret) : null,
  }
}

export async function guardarConfigMP(
  empresaId: number,
  data: {
    accessToken: string
    publicKey: string
    mpUserId?: string
    nombreCuenta?: string
    webhookSecret?: string
    qrHabilitado?: boolean
    checkoutHabilitado?: boolean
  },
) {
  const dataToStore = {
    ...data,
    accessToken: encryptMpSecret(data.accessToken),
    webhookSecret: data.webhookSecret ? encryptMpSecret(data.webhookSecret) : data.webhookSecret,
  }
  const saved = await prisma.mercadoPagoConfig.upsert({
    where: { empresaId },
    create: { empresaId, ...dataToStore },
    update: dataToStore,
  })
  return {
    ...saved,
    accessToken: decryptMpSecret(saved.accessToken),
    webhookSecret: saved.webhookSecret ? decryptMpSecret(saved.webhookSecret) : null,
  }
}

// ─── Crear preferencia de pago (Checkout Pro) ───────────────────────────────

export interface PreferenciaInput {
  empresaId: number
  titulo: string
  monto: number
  facturaId?: number
  cuentaCobrarId?: number
  emailPagador?: string
  externalReference?: string
  backUrls?: {
    success?: string
    failure?: string
    pending?: string
  }
  marketplaceFee?: number
  takeRatePercentage?: number
}

export async function crearPreferenciaPago(input: PreferenciaInput) {
  const config = await obtenerConfigMP(input.empresaId)
  if (!config?.activo) throw new Error("MercadoPago no está configurado o está inactivo")

  const baseUrl = getPublicAppUrl()

  // Calcular comisión / Take-rate de Claver (default 2.5% sobre la seña o pago)
  const defaultTakeRate = Number(process.env.CLAVER_TAKE_RATE_PERCENT ?? "2.5") / 100
  const marketplaceFee =
    input.marketplaceFee !== undefined
      ? input.marketplaceFee
      : input.takeRatePercentage !== undefined
        ? Math.round(input.monto * (input.takeRatePercentage / 100) * 100) / 100
        : process.env.MP_MARKETPLACE_ACCESS_TOKEN || process.env.ENABLE_MARKETPLACE_TAKE_RATE === "true"
          ? Math.round(input.monto * defaultTakeRate * 100) / 100
          : undefined

  // Llamar a la API de MercadoPago para crear preferencia
  const response = await fetch("https://api.mercadopago.com/checkout/preferences", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.accessToken}`,
    },
    body: JSON.stringify({
      items: [
        {
          title: input.titulo,
          quantity: 1,
          unit_price: input.monto,
          currency_id: "ARS",
        },
      ],
      ...(marketplaceFee && marketplaceFee > 0 ? { marketplace_fee: marketplaceFee } : {}),
      external_reference: input.externalReference ?? `fac-${input.facturaId ?? "manual"}`,
      payer: input.emailPagador ? { email: input.emailPagador } : undefined,
      back_urls: input.backUrls ?? {
        success: `${baseUrl}/portal/pago-exitoso`,
        failure: `${baseUrl}/portal/pago-fallido`,
        pending: `${baseUrl}/portal/pago-pendiente`,
      },
      auto_return: "approved",
      notification_url: `${baseUrl}/api/mercadopago/webhook`,
    }),
  })

  if (!response.ok) {
    const err = await response.text()
    throw new Error(`Error MercadoPago: ${err}`)
  }

  const data = await response.json()
  return {
    ...data,
    initPoint: data.init_point ?? data.sandbox_init_point,
    init_point: data.init_point,
    sandbox_init_point: data.sandbox_init_point,
    marketplaceFee,
  }
}

// ─── Procesar webhook de notificación ───────────────────────────────────────

export async function procesarWebhookMP(
  empresaId: number,
  paymentId: string,
) {
  const config = await obtenerConfigMP(empresaId)
  if (!config) throw new Error("Config MP no encontrada")

  // Obtener datos del pago de MercadoPago
  const response = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
    headers: { Authorization: `Bearer ${config.accessToken}` },
  })

  if (!response.ok) throw new Error("No se pudo obtener el pago de MP")

  const payment = await response.json()

  // Registrar transacción
  const transaccion = await prisma.mercadoPagoTransaccion.upsert({
    where: { mpPaymentId: paymentId },
    create: {
      mpPaymentId: paymentId,
      estado: payment.status,
      monto: payment.transaction_amount,
      montoNeto: payment.transaction_details?.net_received_amount,
      comisionMp: payment.fee_details?.[0]?.amount,
      medioPago: payment.payment_type_id,
      descripcion: payment.description,
      emailPagador: payment.payer?.email,
      docPagador: payment.payer?.identification?.number,
      fechaPago: payment.date_approved ? new Date(payment.date_approved) : null,
      rawData: JSON.stringify(payment),
      configId: config.id,
      empresaId,
    },
    update: {
      estado: payment.status,
      montoNeto: payment.transaction_details?.net_received_amount,
      fechaPago: payment.date_approved ? new Date(payment.date_approved) : null,
      rawData: JSON.stringify(payment),
    },
  })

  // Auto-conciliar si el pago tiene referencia a factura
  if (payment.status === "approved" && payment.external_reference) {
    await conciliarPagoMP(empresaId, transaccion.id, payment.external_reference)
  }

  if (payment.status === "approved") {
    const { emitToN8n } = await import("@/lib/automation/n8n-bridge")
    const { buildIdempotencyKey } = await import("@/lib/automation/sign-payload")
    void emitToN8n(
      empresaId,
      "PAGO_MP_RECIBIDO",
      {
        paymentId,
        monto: payment.transaction_amount,
        estado: payment.status,
        externalReference: payment.external_reference,
        transaccionId: transaccion.id,
      },
      buildIdempotencyKey(empresaId, "PAGO_MP_RECIBIDO", paymentId)
    )
  }

  return transaccion
}

// ─── Conciliación automática ────────────────────────────────────────────────

async function conciliarPagoMP(empresaId: number, transaccionId: number, externalRef: string) {
  const pedidoMatch = externalRef.match(/^pedido-(\d+)$/)
  if (pedidoMatch) {
    const pedidoId = parseInt(pedidoMatch[1], 10)
    const pedido = await prisma.pedidoVenta.findFirst({
      where: { id: pedidoId, empresaId },
      select: { id: true, estado: true },
    })
    if (!pedido) return

    await prisma.mercadoPagoTransaccion.update({
      where: { id: transaccionId },
      data: { pedidoVentaId: pedidoId, conciliado: true },
    })

    if (pedido.estado === "pendiente_pago") {
      const { ventasService } = await import("@/lib/ventas/ventas-service")
      await ventasService.confirmarPedido(pedidoId, empresaId)
    }
    return
  }

  // Fiado / CxC / fac → emitir recibo y bajar deuda (P0-D)
  const { isDeudorPagoRef } = await import("@/lib/mercadopago/deudor-pago-ref")
  if (isDeudorPagoRef(externalRef)) {
    const tx = await prisma.mercadoPagoTransaccion.findUnique({
      where: { id: transaccionId },
      select: { monto: true, mpPaymentId: true },
    })
    if (!tx) return

    const { aplicarPagoDeudorDesdeMp } = await import("@/lib/mercadopago/aplicar-pago-deudor")
    const result = await aplicarPagoDeudorDesdeMp({
      empresaId,
      transaccionId,
      externalRef,
      monto: Number(tx.monto),
      mpPaymentId: tx.mpPaymentId,
    })
    if (!result.ok) {
      console.warn("[MP] aplicarPagoDeudor:", result.error, externalRef)
    }
    return
  }
}

// ─── Listar transacciones ───────────────────────────────────────────────────

export async function listarTransaccionesMP(
  empresaId: number,
  filtros?: { estado?: string; desde?: Date; hasta?: Date; conciliado?: boolean },
) {
  return prisma.mercadoPagoTransaccion.findMany({
    where: {
      empresaId,
      ...(filtros?.estado ? { estado: filtros.estado } : {}),
      ...(filtros?.conciliado !== undefined ? { conciliado: filtros.conciliado } : {}),
      ...(filtros?.desde || filtros?.hasta
        ? {
            createdAt: {
              ...(filtros.desde ? { gte: filtros.desde } : {}),
              ...(filtros.hasta ? { lte: filtros.hasta } : {}),
            },
          }
        : {}),
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  })
}

export async function resumenMP(empresaId: number) {
  const hoy = new Date()
  const hace30d = new Date()
  hace30d.setDate(hace30d.getDate() - 30)

  const [total, aprobados, pendientes, comisiones] = await Promise.all([
    prisma.mercadoPagoTransaccion.count({ where: { empresaId, createdAt: { gte: hace30d } } }),
    prisma.mercadoPagoTransaccion.aggregate({
      where: { empresaId, estado: "approved", createdAt: { gte: hace30d } },
      _sum: { monto: true },
      _count: true,
    }),
    prisma.mercadoPagoTransaccion.count({
      where: { empresaId, estado: "pending", createdAt: { gte: hace30d } },
    }),
    prisma.mercadoPagoTransaccion.aggregate({
      where: { empresaId, estado: "approved", createdAt: { gte: hace30d } },
      _sum: { comisionMp: true },
    }),
  ])

  return {
    totalTransacciones: total,
    cobradoAprobado: Number(aprobados._sum.monto ?? 0),
    cantidadAprobados: aprobados._count,
    pendientes,
    comisionesMP: Number(comisiones._sum.comisionMp ?? 0),
  }
}
