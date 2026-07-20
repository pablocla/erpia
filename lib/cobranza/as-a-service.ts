/**
 * Cobranza-as-a-Service — fee % sobre montos recuperados (no sobre reclutar).
 * Activa secretaria WA + registra cargos al registrar cobros.
 */

import { prisma } from "@/lib/prisma"
import { activarSecretariaCobranzas } from "@/lib/marketplace/cobranzas-wa-service"
import { activarProducto } from "@/lib/platform/product-lifecycle"

export const COBRANZA_AAS_SKU = "svc.cobranza_as_a_service"
export const DEFAULT_FEE_PCT = 5

export async function getCobranzaAsAServiceConfig(empresaId: number) {
  return prisma.cobranzaAsAServiceConfig.findUnique({ where: { empresaId } })
}

export async function activarCobranzaAsAService(
  empresaId: number,
  opts?: { feePct?: number; feeMinArs?: number; autoAprobarWa?: boolean; diasVencimiento?: number },
) {
  const feePct = opts?.feePct ?? DEFAULT_FEE_PCT
  const config = await prisma.cobranzaAsAServiceConfig.upsert({
    where: { empresaId },
    update: {
      activo: true,
      feePct,
      feeMinArs: opts?.feeMinArs ?? 0,
      autoAprobarWa: opts?.autoAprobarWa ?? false,
      diasVencimiento: opts?.diasVencimiento ?? 7,
    },
    create: {
      empresaId,
      activo: true,
      feePct,
      feeMinArs: opts?.feeMinArs ?? 0,
      autoAprobarWa: opts?.autoAprobarWa ?? false,
      diasVencimiento: opts?.diasVencimiento ?? 7,
    },
  })

  // Activa secretaria WA + SKU
  await activarSecretariaCobranzas(empresaId, {
    diasVencimiento: config.diasVencimiento,
    autoAprobar: config.autoAprobarWa,
    maxClientesPorDia: 30,
  })

  try {
    await activarProducto(empresaId, "intang.cobranzas_wa", "cobranza_aas")
  } catch {
    /* sku puede no estar en catálogo seed */
  }

  try {
    await prisma.productoComercial.upsert({
      where: { sku: COBRANZA_AAS_SKU },
      update: { activo: true, nombre: "Cobranza as a Service" },
      create: {
        sku: COBRANZA_AAS_SKU,
        nombre: "Cobranza as a Service",
        descripcion: `Fee ${feePct}% sobre montos recuperados vía cobranza asistida`,
        precioArs: 0,
        activo: true,
      },
    })
    await activarProducto(empresaId, COBRANZA_AAS_SKU, "cobranza_aas")
  } catch {
    /* ignore */
  }

  return config
}

export async function desactivarCobranzaAsAService(empresaId: number) {
  return prisma.cobranzaAsAServiceConfig.updateMany({
    where: { empresaId },
    data: { activo: false },
  })
}

function periodoActual(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
}

/**
 * Llamar cuando se registra un cobro (recibo / pago CC).
 * Crea cargo de fee si el servicio está activo.
 */
export async function registrarFeePorCobroRecuperado(params: {
  empresaId: number
  montoRecuperado: number
  reciboId?: number
  cuentaCobrarId?: number
}): Promise<{ fee: number; cargoId?: number } | null> {
  const monto = Number(params.montoRecuperado)
  if (!Number.isFinite(monto) || monto <= 0) return null

  const config = await prisma.cobranzaAsAServiceConfig.findUnique({
    where: { empresaId: params.empresaId },
  })
  if (!config?.activo) return null

  const pct = Number(config.feePct) / 100
  let fee = Math.round(monto * pct * 100) / 100
  const min = Number(config.feeMinArs)
  if (min > 0 && fee < min) fee = min

  const periodo = periodoActual()
  const idem =
    params.reciboId != null
      ? `recibo-${params.reciboId}`
      : params.cuentaCobrarId != null
        ? `cc-${params.cuentaCobrarId}-${periodo}-${monto}`
        : `manual-${params.empresaId}-${Date.now()}`

  try {
    const cargo = await prisma.cobranzaAsAServiceCargo.create({
      data: {
        empresaId: params.empresaId,
        montoRecuperado: monto,
        feeCobrado: fee,
        reciboId: params.reciboId,
        cuentaCobrarId: params.cuentaCobrarId,
        periodo,
        estado: "pendiente",
        idempotencyKey: idem,
      },
    })
    return { fee, cargoId: cargo.id }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    if (msg.includes("Unique") || msg.includes("unique")) {
      return { fee: 0 }
    }
    throw err
  }
}

export async function resumenCobranzaAsAService(empresaId: number) {
  const config = await getCobranzaAsAServiceConfig(empresaId)
  const periodo = periodoActual()
  const cargos = await prisma.cobranzaAsAServiceCargo.findMany({
    where: { empresaId, periodo },
    orderBy: { createdAt: "desc" },
    take: 50,
  })
  const feeMes = cargos
    .filter((c) => c.estado !== "anulado")
    .reduce((s, c) => s + Number(c.feeCobrado), 0)
  const recuperadoMes = cargos
    .filter((c) => c.estado !== "anulado")
    .reduce((s, c) => s + Number(c.montoRecuperado), 0)

  return {
    config: config
      ? {
          activo: config.activo,
          feePct: Number(config.feePct),
          feeMinArs: Number(config.feeMinArs),
          autoAprobarWa: config.autoAprobarWa,
          diasVencimiento: config.diasVencimiento,
        }
      : null,
    periodo,
    feeMes,
    recuperadoMes,
    cargos: cargos.map((c) => ({
      id: c.id,
      montoRecuperado: Number(c.montoRecuperado),
      feeCobrado: Number(c.feeCobrado),
      estado: c.estado,
      createdAt: c.createdAt,
    })),
  }
}
