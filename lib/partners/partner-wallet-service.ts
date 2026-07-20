/**
 * Billetera partner monetizable:
 * 1) Crédito Claver — comisiones pendientes pagan la suscripción del partner (retiene MRR interno).
 * 2) Cash out — solicitado → liquidado por analista (transferencia manual).
 * 3) Contador gratis de por vida con 3 referidos pagos activos.
 */

import { prisma } from "@/lib/prisma"
import { activarProducto } from "@/lib/platform/product-lifecycle"
import { activarSuscripcionPagada } from "@/lib/billing/mercadopago-subscription"
import { aplicarPisoPrecioSuscripcion } from "@/lib/comercial/precio-minimo"
import { resolvePrecioSku } from "@/lib/comercial/ofertas-comerciales"

export const CONTADOR_GRATIS_SKU = "data.reportes_prog"
export const CONTADOR_GRATIS_MIN_CLIENTES = 3
export const CORE_SKU = "core.claver"

const ESTADOS_DISPONIBLES = ["pendiente"] as const
const ESTADO_CREDITO = "credito_aplicado"
const ESTADO_SOLICITADO = "solicitado"
const ESTADO_LIQUIDADO = "liquidado"

export async function getPartnerSaldo(partnerId: number): Promise<{
  pendiente: number
  solicitado: number
  liquidado: number
  creditoAplicado: number
  disponible: number
}> {
  const rows = await prisma.comisionPartner.groupBy({
    by: ["estado"],
    where: { partnerId },
    _sum: { monto: true },
  })
  const map = Object.fromEntries(
    rows.map((r) => [r.estado, Number(r._sum.monto ?? 0)]),
  ) as Record<string, number>

  const pendiente = map.pendiente ?? 0
  const solicitado = map.solicitado ?? 0
  const liquidado = map.liquidado ?? 0
  const creditoAplicado = map.credito_aplicado ?? 0

  return {
    pendiente: round2(pendiente),
    solicitado: round2(solicitado),
    liquidado: round2(liquidado),
    creditoAplicado: round2(creditoAplicado),
    /** Solo pendiente se puede aplicar a crédito o pedir retiro */
    disponible: round2(pendiente),
  }
}

function round2(n: number) {
  return Math.round(n * 100) / 100
}

/**
 * Consume comisiones FIFO (más viejas primero) hasta cubrir `monto`.
 * Marca estado credito_aplicado. Si no alcanza, lanza error.
 */
export async function consumirCreditoPartner(
  partnerId: number,
  monto: number,
  meta: { empresaId: number; sku: string; motivo: string },
): Promise<{ consumido: number; comisionIds: number[] }> {
  const need = round2(monto)
  if (need <= 0) return { consumido: 0, comisionIds: [] }

  const lines = await prisma.comisionPartner.findMany({
    where: { partnerId, estado: { in: [...ESTADOS_DISPONIBLES] } },
    orderBy: { fecha: "asc" },
  })

  let left = need
  const used: Array<{ id: number; take: number; full: boolean }> = []

  for (const line of lines) {
    if (left <= 0) break
    const avail = Number(line.monto)
    if (avail <= 0) continue
    if (avail <= left + 0.001) {
      used.push({ id: line.id, take: avail, full: true })
      left = round2(left - avail)
    } else {
      // Split: marcar parcial — creamos residual pendiente y liquidamos el take
      used.push({ id: line.id, take: left, full: false })
      left = 0
    }
  }

  if (left > 0.01) {
    throw new Error(
      `Crédito insuficiente: necesitás $${need.toLocaleString("es-AR")} y tenés $${(need - left).toLocaleString("es-AR")} disponible`,
    )
  }

  const comisionIds: number[] = []
  for (const u of used) {
    if (u.full) {
      await prisma.comisionPartner.update({
        where: { id: u.id },
        data: {
          estado: ESTADO_CREDITO,
          sku: meta.sku,
          // reutilizamos rolPartner como nota corta de auditoría
          rolPartner: `credito:${meta.motivo}`.slice(0, 40),
        },
      })
      comisionIds.push(u.id)
    } else {
      const original = lines.find((l) => l.id === u.id)!
      const residual = round2(Number(original.monto) - u.take)
      await prisma.comisionPartner.update({
        where: { id: u.id },
        data: {
          monto: u.take,
          estado: ESTADO_CREDITO,
          sku: meta.sku,
          rolPartner: `credito:${meta.motivo}`.slice(0, 40),
        },
      })
      if (residual > 0) {
        await prisma.comisionPartner.create({
          data: {
            partnerId,
            empresaOrigenId: original.empresaOrigenId,
            monto: residual,
            montoBase: original.montoBase,
            porcentaje: original.porcentaje,
            nivel: original.nivel,
            rolPartner: original.rolPartner,
            sku: original.sku,
            idempotencyKey: `${original.idempotencyKey ?? original.id}-split-${Date.now()}`,
            estado: "pendiente",
          },
        })
      }
      comisionIds.push(u.id)
    }
  }

  await prisma.parametroFiscal.upsert({
    where: {
      empresaId_clave_pais: {
        empresaId: meta.empresaId,
        clave: "partner_credito_ultimo",
        pais: "AR",
      },
    },
    update: {
      descripcion: JSON.stringify({
        partnerId,
        monto: need,
        sku: meta.sku,
        motivo: meta.motivo,
        at: new Date().toISOString(),
        comisionIds,
      }),
      valor: need,
    },
    create: {
      empresaId: meta.empresaId,
      clave: "partner_credito_ultimo",
      valor: need,
      descripcion: JSON.stringify({
        partnerId,
        monto: need,
        sku: meta.sku,
        motivo: meta.motivo,
        at: new Date().toISOString(),
        comisionIds,
      }),
      categoria: "comercial",
      pais: "AR",
    },
  }).catch(() => {})

  return { consumido: need, comisionIds }
}

/**
 * Paga la suscripción del partner (su empresa) con crédito de comisiones.
 * Activa SKUs sin pasar por Mercado Pago — maximiza retención y cierra el loop.
 */
export async function pagarSuscripcionConCredito(params: {
  usuarioId: number
  empresaId: number
  skus?: string[]
  montoOverride?: number
}): Promise<{
  ok: true
  skus: string[]
  monto: number
  saldoRestante: number
  message: string
}> {
  const partner = await prisma.partnerProfile.findUnique({
    where: { usuarioId: params.usuarioId },
  })
  if (!partner?.activo) {
    throw new Error("No tenés perfil partner activo")
  }

  const skus = params.skus?.length ? params.skus : [CORE_SKU]
  let monto = params.montoOverride
  if (monto == null) {
    monto = 0
    for (const sku of skus) {
      monto += resolvePrecioSku(sku) || aplicarPisoPrecioSuscripcion(39_900)
    }
    if (monto <= 0) monto = aplicarPisoPrecioSuscripcion(39_900)
  }
  monto = aplicarPisoPrecioSuscripcion(monto)

  const saldo = await getPartnerSaldo(partner.id)
  if (saldo.disponible < monto) {
    throw new Error(
      `Saldo insuficiente ($${saldo.disponible.toLocaleString("es-AR")}). Necesitás $${monto.toLocaleString("es-AR")} o pagá con Mercado Pago el resto.`,
    )
  }

  await consumirCreditoPartner(partner.id, monto, {
    empresaId: params.empresaId,
    sku: skus.join("+"),
    motivo: "suscripcion_propia",
  })

  // Sin comisiones: no hubo cash de un cliente referido
  await activarSuscripcionPagada(params.empresaId, skus, { skipComisiones: true })
  await prisma.empresa.update({
    where: { id: params.empresaId },
    data: {
      mpSubscriptionStatus: "authorized_credito_partner",
    },
  }).catch(() => {})

  const after = await getPartnerSaldo(partner.id)
  return {
    ok: true,
    skus,
    monto,
    saldoRestante: after.disponible,
    message: `Suscripción pagada con $${monto.toLocaleString("es-AR")} de comisiones. Sin cargo en Mercado Pago.`,
  }
}

/**
 * Activa un SKU concreto usando crédito (ej. pack contador, cobranzas).
 */
export async function activarSkuConCredito(params: {
  usuarioId: number
  empresaId: number
  sku: string
}): Promise<{ ok: true; monto: number; message: string }> {
  const partner = await prisma.partnerProfile.findUnique({
    where: { usuarioId: params.usuarioId },
  })
  if (!partner?.activo) throw new Error("No tenés perfil partner activo")

  const precio = resolvePrecioSku(params.sku)
  const monto = precio > 0 ? aplicarPisoPrecioSuscripcion(precio) : 0
  if (monto <= 0) {
    await activarProducto(params.empresaId, params.sku, "partner_credito_free")
    return { ok: true, monto: 0, message: "Módulo gratis activado" }
  }

  await consumirCreditoPartner(partner.id, monto, {
    empresaId: params.empresaId,
    sku: params.sku,
    motivo: "sku_credito",
  })
  await activarProducto(params.empresaId, params.sku, "partner_credito")
  await prisma.suscripcionModulo.upsert({
    where: { empresaId_sku: { empresaId: params.empresaId, sku: params.sku } },
    update: { activo: true, vigenciaHasta: null },
    create: { empresaId: params.empresaId, sku: params.sku, activo: true, vigenciaHasta: null },
  })

  return {
    ok: true,
    monto,
    message: `${params.sku} activado con $${monto.toLocaleString("es-AR")} de comisiones`,
  }
}

/** Referidos con suscripción paga (MP authorized o crédito). */
export async function countReferidosPagos(partnerId: number): Promise<number> {
  return prisma.empresa.count({
    where: {
      referredByPartnerId: partnerId,
      OR: [
        { mpSubscriptionStatus: "authorized" },
        { mpSubscriptionStatus: "authorized_credito_partner" },
        {
          suscripciones: {
            some: { sku: CORE_SKU, activo: true, vigenciaHasta: null },
          },
        },
      ],
    },
  })
}

/**
 * Contadores: 3 clientes pagos referidos → Pack Contador gratis de por vida.
 * Monetiza: motiva a cerrar 3 pagos antes del canje.
 */
export async function canjearContadorGratis(params: {
  usuarioId: number
  empresaId: number
}): Promise<{ ok: true; clientesPagos: number; message: string }> {
  const partner = await prisma.partnerProfile.findUnique({
    where: { usuarioId: params.usuarioId },
  })
  if (!partner?.activo) throw new Error("No tenés perfil partner activo")

  const clientesPagos = await countReferidosPagos(partner.id)
  if (clientesPagos < CONTADOR_GRATIS_MIN_CLIENTES) {
    throw new Error(
      `Necesitás ${CONTADOR_GRATIS_MIN_CLIENTES} referidos con suscripción paga (tenés ${clientesPagos})`,
    )
  }

  await activarProducto(params.empresaId, CONTADOR_GRATIS_SKU, "partner_contador_gratis")
  await activarProducto(params.empresaId, CORE_SKU, "partner_contador_gratis").catch(() => {})
  await prisma.suscripcionModulo.upsert({
    where: {
      empresaId_sku: { empresaId: params.empresaId, sku: CONTADOR_GRATIS_SKU },
    },
    update: { activo: true, vigenciaHasta: null },
    create: {
      empresaId: params.empresaId,
      sku: CONTADOR_GRATIS_SKU,
      activo: true,
      vigenciaHasta: null,
    },
  })

  await prisma.parametroFiscal.upsert({
    where: {
      empresaId_clave_pais: {
        empresaId: params.empresaId,
        clave: "partner_contador_gratis",
        pais: "AR",
      },
    },
    update: {
      valor: clientesPagos,
      descripcion: `Canjeado ${new Date().toISOString()} partner=${partner.id}`,
    },
    create: {
      empresaId: params.empresaId,
      clave: "partner_contador_gratis",
      valor: clientesPagos,
      descripcion: `Canjeado ${new Date().toISOString()} partner=${partner.id}`,
      categoria: "comercial",
      pais: "AR",
    },
  })

  return {
    ok: true,
    clientesPagos,
    message: `Pack Contador gratis de por vida activado (${clientesPagos} referidos pagos)`,
  }
}

/** Listado para Cloud: partners con saldo a liquidar */
export async function listPartnersLiquidacion() {
  const partners = await prisma.partnerProfile.findMany({
    where: { activo: true },
    include: {
      usuario: { select: { email: true, nombre: true } },
      comisiones: {
        where: { estado: { in: [ESTADO_SOLICITADO, "pendiente"] } },
        select: { id: true, monto: true, estado: true, fecha: true },
      },
      _count: { select: { empresasReferidas: true } },
    },
    orderBy: { updatedAt: "desc" },
    take: 200,
  })

  return partners
    .map((p) => {
      const solicitado = p.comisiones
        .filter((c) => c.estado === ESTADO_SOLICITADO)
        .reduce((s, c) => s + Number(c.monto), 0)
      const pendiente = p.comisiones
        .filter((c) => c.estado === "pendiente")
        .reduce((s, c) => s + Number(c.monto), 0)
      return {
        partnerId: p.id,
        email: p.usuario.email,
        nombre: p.nombreFantasia ?? p.usuario.nombre,
        tipo: p.tipo,
        referralCode: p.referralCode,
        referidos: p._count.empresasReferidas,
        pendiente: round2(pendiente),
        solicitado: round2(solicitado),
        comisionIdsSolicitados: p.comisiones
          .filter((c) => c.estado === ESTADO_SOLICITADO)
          .map((c) => c.id),
      }
    })
    .filter((p) => p.pendiente > 0 || p.solicitado > 0)
    .sort((a, b) => b.solicitado - a.solicitado || b.pendiente - a.pendiente)
}

export async function liquidarComisiones(params: {
  partnerId?: number
  comisionIds?: number[]
  nota?: string
}): Promise<{ liquidadas: number; monto: number }> {
  const where =
    params.comisionIds?.length
      ? { id: { in: params.comisionIds }, estado: ESTADO_SOLICITADO }
      : params.partnerId
        ? { partnerId: params.partnerId, estado: ESTADO_SOLICITADO }
        : null

  if (!where) throw new Error("partnerId o comisionIds requerido")

  const lines = await prisma.comisionPartner.findMany({ where })
  const monto = lines.reduce((s, c) => s + Number(c.monto), 0)

  const res = await prisma.comisionPartner.updateMany({
    where,
    data: {
      estado: ESTADO_LIQUIDADO,
      ...(params.nota
        ? { rolPartner: `liq:${params.nota}`.slice(0, 40) }
        : {}),
    },
  })

  return { liquidadas: res.count, monto: round2(monto) }
}

/**
 * Si el partner tiene crédito suficiente, paga sin MP.
 * Si no, devuelve null para que el caller cree preapproval MP.
 */
export async function tryPayWithPartnerCredit(params: {
  usuarioId: number
  empresaId: number
  skus: string[]
  priceArs: number
}): Promise<{ paid: true; message: string; monto: number } | { paid: false; disponible: number }> {
  const partner = await prisma.partnerProfile.findUnique({
    where: { usuarioId: params.usuarioId },
  })
  if (!partner?.activo) return { paid: false, disponible: 0 }

  const saldo = await getPartnerSaldo(partner.id)
  const price = aplicarPisoPrecioSuscripcion(params.priceArs)
  if (saldo.disponible < price) {
    return { paid: false, disponible: saldo.disponible }
  }

  const r = await pagarSuscripcionConCredito({
    usuarioId: params.usuarioId,
    empresaId: params.empresaId,
    skus: params.skus,
    montoOverride: price,
  })
  return { paid: true, message: r.message, monto: r.monto }
}
