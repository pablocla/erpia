/**
 * MercadoPago Service
 *
 * Integración con MercadoPago: configuración, creación de preferencias de pago,
 * procesamiento de webhooks, conciliación automática con CxC.
 */

import { prisma } from "@/lib/prisma"

// ─── Configuración ──────────────────────────────────────────────────────────

export async function obtenerConfigMP(empresaId: number) {
  return prisma.mercadoPagoConfig.findUnique({
    where: { empresaId },
  })
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
  return prisma.mercadoPagoConfig.upsert({
    where: { empresaId },
    create: { empresaId, ...data },
    update: data,
  })
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
}

export async function crearPreferenciaPago(input: PreferenciaInput) {
  const config = await obtenerConfigMP(input.empresaId)
  if (!config?.activo) throw new Error("MercadoPago no está configurado o está inactivo")

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
      external_reference: input.externalReference ?? `fac-${input.facturaId ?? "manual"}`,
      payer: input.emailPagador ? { email: input.emailPagador } : undefined,
      back_urls: {
        success: `${process.env.NEXT_PUBLIC_BASE_URL}/portal/pago-exitoso`,
        failure: `${process.env.NEXT_PUBLIC_BASE_URL}/portal/pago-fallido`,
        pending: `${process.env.NEXT_PUBLIC_BASE_URL}/portal/pago-pendiente`,
      },
      auto_return: "approved",
      notification_url: `${process.env.NEXT_PUBLIC_BASE_URL}/api/mercadopago/webhook`,
    }),
  })

  if (!response.ok) {
    const err = await response.text()
    throw new Error(`Error MercadoPago: ${err}`)
  }

  return response.json()
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

  return transaccion
}

// ─── Conciliación automática ────────────────────────────────────────────────

async function conciliarPagoMP(empresaId: number, transaccionId: number, externalRef: string) {
  // Formato: "fac-123" o "cxc-456"
  const match = externalRef.match(/^(fac|cxc)-(\d+)$/)
  if (!match) return

  const [, tipo, idStr] = match
  const id = parseInt(idStr, 10)

  if (tipo === "fac") {
    await prisma.mercadoPagoTransaccion.update({
      where: { id: transaccionId },
      data: { facturaId: id, conciliado: true },
    })
  } else if (tipo === "cxc") {
    await prisma.mercadoPagoTransaccion.update({
      where: { id: transaccionId },
      data: { cuentaCobrarId: id, conciliado: true },
    })
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
