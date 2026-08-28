/**
 * Motor de afiliados multi-nivel — comisiones por pago de suscripción.
 */

import { prisma } from "@/lib/prisma"
import {
  corteRetiroCash,
  normalizeReferralCode,
  tasaNivel1,
  tasaNivel2,
} from "@/lib/partners/affiliate-config"
import { buildReferralStreetUrl } from "@/lib/partners/program-copy"
import {
  countReferidosPagos,
  getPartnerSaldo,
  CONTADOR_GRATIS_MIN_CLIENTES,
} from "@/lib/partners/partner-wallet-service"

export async function findPartnerByReferralCode(code: string) {
  const referralCode = normalizeReferralCode(code)
  if (!referralCode) return null
  return prisma.partnerProfile.findFirst({
    where: { referralCode, activo: true },
  })
}

/** Asigna partner a empresa en el alta (signup ?ref=). Idempotente si ya tiene partner. */
export async function assignReferralToEmpresa(
  empresaId: number,
  refCode: string,
): Promise<{ assigned: boolean; partnerId?: number }> {
  const partner = await findPartnerByReferralCode(refCode)
  if (!partner) return { assigned: false }

  const empresa = await prisma.empresa.findUnique({
    where: { id: empresaId },
    select: { referredByPartnerId: true },
  })
  if (!empresa) return { assigned: false }
  if (empresa.referredByPartnerId) {
    return { assigned: true, partnerId: empresa.referredByPartnerId }
  }

  await prisma.empresa.update({
    where: { id: empresaId },
    data: { referredByPartnerId: partner.id },
  })
  return { assigned: true, partnerId: partner.id }
}

function periodoActual(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
}

export interface RegistrarComisionesInput {
  empresaId: number
  /** Monto pagado por el cliente (ARS) */
  montoPagado: number
  sku?: string
  /** Clave de periodo para no duplicar (default: mes actual) */
  periodoKey?: string
}

/**
 * Tras un pago confirmado: N1 al partner que refirió la empresa, N2 a su parent.
 * Billetera = estado "pendiente" (crédito interno hasta liquidar).
 */
export async function registrarComisionesPorPago(
  input: RegistrarComisionesInput,
): Promise<{ creadas: number; montos: number[] }> {
  const montoPagado = Number(input.montoPagado)
  if (!Number.isFinite(montoPagado) || montoPagado <= 0) {
    return { creadas: 0, montos: [] }
  }

  const empresa = await prisma.empresa.findUnique({
    where: { id: input.empresaId },
    select: {
      id: true,
      referredByPartnerId: true,
      referredByPartner: {
        select: {
          id: true,
          tipo: true,
          activo: true,
          parentPartnerId: true,
          parentPartner: { select: { id: true, tipo: true, activo: true } },
        },
      },
    },
  })

  if (!empresa?.referredByPartnerId || !empresa.referredByPartner?.activo) {
    return { creadas: 0, montos: [] }
  }

  const periodo = input.periodoKey ?? periodoActual()
  const sku = input.sku ?? "core.claver"
  const montos: number[] = []
  let creadas = 0

  const partner = empresa.referredByPartner
  const p1 = tasaNivel1(partner.tipo)
  const m1 = Math.round(montoPagado * p1 * 100) / 100
  const key1 = `e${empresa.id}-p${partner.id}-n1-${periodo}-${sku}`

  try {
    await prisma.comisionPartner.create({
      data: {
        partnerId: partner.id,
        empresaOrigenId: empresa.id,
        monto: m1,
        montoBase: montoPagado,
        porcentaje: p1 * 100,
        nivel: 1,
        rolPartner: partner.tipo,
        sku,
        idempotencyKey: key1,
        estado: "pendiente",
      },
    })
    creadas++
    montos.push(m1)
  } catch (err: unknown) {
    // Unique idempotencyKey → ya liquidado este periodo
    const msg = err instanceof Error ? err.message : String(err)
    if (!msg.includes("Unique") && !msg.includes("unique")) {
      console.warn("[afiliados] comisión N1:", err)
    }
  }

  const parent = partner.parentPartner
  if (parent?.activo) {
    const p2 = tasaNivel2(parent.tipo)
    const m2 = Math.round(montoPagado * p2 * 100) / 100
    const key2 = `e${empresa.id}-p${parent.id}-n2-${periodo}-${sku}`
    try {
      await prisma.comisionPartner.create({
        data: {
          partnerId: parent.id,
          empresaOrigenId: empresa.id,
          monto: m2,
          montoBase: montoPagado,
          porcentaje: p2 * 100,
          nivel: 2,
          rolPartner: parent.tipo,
          sku,
          idempotencyKey: key2,
          estado: "pendiente",
        },
      })
      creadas++
      montos.push(m2)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      if (!msg.includes("Unique") && !msg.includes("unique")) {
        console.warn("[afiliados] comisión N2:", err)
      }
    }
  }

  return { creadas, montos }
}

export async function getPartnerDashboard(usuarioId: number) {
  const partner = await prisma.partnerProfile.findUnique({
    where: { usuarioId },
    include: {
      parentPartner: { select: { id: true, nombreFantasia: true, referralCode: true } },
      childPartners: {
        where: { activo: true },
        select: { id: true, nombreFantasia: true, referralCode: true, tipo: true, nivel: true },
      },
      empresasReferidas: {
        select: {
          id: true,
          nombre: true,
          email: true,
          createdAt: true,
          mpSubscriptionStatus: true,
          trialExpiresAt: true,
        },
        orderBy: { createdAt: "desc" },
        take: 50,
      },
      comisiones: {
        orderBy: { fecha: "desc" },
        take: 100,
      },
    },
  })
  if (!partner) return null

  const saldo = await getPartnerSaldo(partner.id)
  const referidosPagosCount = await countReferidosPagos(partner.id)

  const code = partner.referralCode ?? `P${partner.id}`
  // Preferir código persistido; si faltaba, lo guardamos
  if (!partner.referralCode) {
    try {
      await prisma.partnerProfile.update({
        where: { id: partner.id },
        data: { referralCode: code },
      })
    } catch {
      /* unique race — ignore */
    }
  }
  const referralUrl = buildReferralStreetUrl(code)
  const referidosTotal = partner.empresasReferidas.length
  const referidosPagos = referidosPagosCount
  const referidosAncla = Math.max(0, referidosTotal - referidosPagos)

  return {
    partner: {
      id: partner.id,
      tipo: partner.tipo,
      nombreFantasia: partner.nombreFantasia,
      nivel: partner.nivel,
      referralCode: code,
      activo: partner.activo,
    },
    referralUrl,
    parent: partner.parentPartner,
    subAfiliados: partner.childPartners,
    empresas: partner.empresasReferidas,
    kpis: {
      referidosTotal,
      referidosPagos,
      referidosAncla,
    },
    comisiones: partner.comisiones.map((c) => ({
      id: c.id,
      monto: Number(c.monto),
      nivel: c.nivel,
      estado: c.estado,
      fecha: c.fecha,
      empresaOrigenId: c.empresaOrigenId,
      sku: c.sku,
    })),
    billetera: {
      pendiente: saldo.pendiente,
      solicitado: saldo.solicitado,
      liquidado: saldo.liquidado,
      creditoAplicado: saldo.creditoAplicado,
      disponible: saldo.disponible,
      /** crédito → paga Claver; cash → liquidación analista */
      modoPago: "credito_o_cash" as const,
    },
    contadorGratis: {
      minClientes: CONTADOR_GRATIS_MIN_CLIENTES,
      clientesPagos: referidosPagosCount,
      elegible: referidosPagosCount >= CONTADOR_GRATIS_MIN_CLIENTES,
    },
  }
}

export async function solicitarRetiroComisiones(usuarioId: number): Promise<{ ok: boolean; actualizadas: number }> {
  const partner = await prisma.partnerProfile.findUnique({ where: { usuarioId } })
  if (!partner) return { ok: false, actualizadas: 0 }

  const corte = corteRetiroCash()
  const res = await prisma.comisionPartner.updateMany({
    where: {
      partnerId: partner.id,
      estado: "pendiente",
      fecha: { lte: corte },
    },
    data: { estado: "solicitado" },
  })
  return { ok: true, actualizadas: res.count }
}

/** Crea o actualiza perfil partner del usuario (self-serve básico). */
export async function ensurePartnerProfile(params: {
  usuarioId: number
  tipo?: string
  nombreFantasia?: string
  referralCode?: string
  parentReferralCode?: string
}) {
  const existing = await prisma.partnerProfile.findUnique({
    where: { usuarioId: params.usuarioId },
  })
  if (existing) return existing

  let parentPartnerId: number | undefined
  if (params.parentReferralCode) {
    const parent = await findPartnerByReferralCode(params.parentReferralCode)
    if (parent) parentPartnerId = parent.id
  }

  let referralCode = params.referralCode
    ? normalizeReferralCode(params.referralCode)
    : `P${params.usuarioId}`

  // Evitar colisión
  const taken = await prisma.partnerProfile.findFirst({ where: { referralCode } })
  if (taken) referralCode = `P${params.usuarioId}_${Date.now().toString(36).slice(-4)}`

  return prisma.partnerProfile.create({
    data: {
      usuarioId: params.usuarioId,
      tipo: params.tipo ?? "seller",
      nombreFantasia: params.nombreFantasia,
      referralCode,
      parentPartnerId,
      activo: true,
    },
  })
}
