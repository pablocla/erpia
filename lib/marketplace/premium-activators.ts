/**
 * Activadores Premium ERP 7 — patrón cobranzas-wa-service.
 * Crea reglas de alerta + config IA al activar cada SKU intangible premium.
 */

import { prisma } from "@/lib/prisma"
import { crearReglaAlerta } from "@/lib/alertas/alertas-service"
import { getIANotificacionConfig, saveIANotificacionConfig } from "@/lib/ai/ia-notificacion-config"
import { setFeature } from "@/lib/config/rubro-config-service"
import { persistSistemaLog } from "@/lib/ops/sistema-log"

const SUFFIX = "(Premium 7)"

export const REGLA_GUARDIAN_POS = `Guardián POS ${SUFFIX}`
export const REGLA_LIQUIDACION_PAGOS = `Liquidación Pagos ${SUFFIX}`
export const REGLA_REPONEDOR_JIT = `Reponedor JIT ${SUFFIX}`
export const REGLA_RECUPERADOR_FISCAL = `Recuperador Fiscal ${SUFFIX}`
export const REGLA_OCR_COMPRAS = `OCR Compras ${SUFFIX}`
export const REGLA_REACTIVADOR = `Reactivador B2B ${SUFFIX}`

const PREMIUM_AGENTES = {
  guardian: "guardian-pos",
  liquidacion: "liquidacion-pagos",
  reponedor: "reponedor-jit",
  fiscal: "recuperador-fiscal",
  ocr: "ocr-compras",
  reactivador: "reactivador-b2b",
} as const

async function ensureRegla(
  empresaId: number,
  nombre: string,
  tipoRegla: string,
  condicion: { operador: "mayor_igual" | "mayor"; valor: number | string },
) {
  let regla = await prisma.reglaAlerta.findFirst({
    where: { empresaId, nombre },
  })
  if (!regla) {
    regla = await crearReglaAlerta({
      empresaId,
      nombre,
      tipoRegla,
      condicion,
      frecuenciaHoras: 24,
      accion: "notificacion",
    })
  } else if (!regla.activo) {
    regla = await prisma.reglaAlerta.update({
      where: { id: regla.id },
      data: { activo: true },
    })
  }
  return regla
}

async function enablePremiumAgents(empresaId: number, agentIds: string[]) {
  const current = await getIANotificacionConfig(empresaId)
  const agentesNotificacion = { ...current.agentesNotificacion }
  for (const id of agentIds) {
    agentesNotificacion[id] = true
  }
  await saveIANotificacionConfig(empresaId, {
    evaluarReglasEnCron: true,
    agentesNotificacion,
    whatsappReglasAutoAprobar: true,
  })
}

async function logActivacion(
  empresaId: number,
  sku: string,
  mensaje: string,
  metadata: Record<string, unknown>,
) {
  await persistSistemaLog({
    empresaId,
    severidad: "info",
    modulo: "marketplace",
    mensaje,
    metadata: { sku, ...metadata },
  })
}

export async function activarGuardianPos(empresaId: number) {
  const regla = await ensureRegla(empresaId, REGLA_GUARDIAN_POS, "diferencia_caja", {
    operador: "mayor_igual",
    valor: 1,
  })
  await enablePremiumAgents(empresaId, [PREMIUM_AGENTES.guardian, "anomalias"])
  await logActivacion(empresaId, "intang.guardian_pos", "Guardián POS activado", {
    reglaId: regla.id,
  })
  return { reglaId: regla.id }
}

export async function activarLiquidacionPagos(empresaId: number) {
  const regla = await ensureRegla(empresaId, REGLA_LIQUIDACION_PAGOS, "diferencia_caja", {
    operador: "mayor",
    valor: 500,
  })
  await enablePremiumAgents(empresaId, [PREMIUM_AGENTES.liquidacion, "anomalias"])
  await logActivacion(empresaId, "intang.liquidacion_pagos", "Conciliador liquidación activado", {
    reglaId: regla.id,
  })
  return { reglaId: regla.id }
}

export async function activarReponedorJit(empresaId: number) {
  const regla = await ensureRegla(empresaId, REGLA_REPONEDOR_JIT, "stock_bajo", {
    operador: "mayor_igual",
    valor: 1,
  })
  await enablePremiumAgents(empresaId, [PREMIUM_AGENTES.reponedor, "compras-predictivo", "alertas-stock"])
  await logActivacion(empresaId, "intang.reponedor_jit", "Reponedor JIT activado", {
    reglaId: regla.id,
  })
  return { reglaId: regla.id }
}

export async function activarRecuperadorFiscal(empresaId: number) {
  const regla = await ensureRegla(empresaId, REGLA_RECUPERADOR_FISCAL, "cxp_vencida", {
    operador: "mayor_igual",
    valor: 1,
  })
  await enablePremiumAgents(empresaId, [PREMIUM_AGENTES.fiscal])
  await logActivacion(empresaId, "intang.recuperador_fiscal", "Recuperador fiscal activado", {
    reglaId: regla.id,
  })
  return { reglaId: regla.id }
}

export async function activarOcrCompras(empresaId: number) {
  const inboxAlias = `compras+emp${empresaId}@claver.com`
  await ensureRegla(empresaId, REGLA_OCR_COMPRAS, "stock_bajo", {
    operador: "mayor_igual",
    valor: 0,
  })
  await setFeature(empresaId, "intang.ocr_compras", {
    parametros: { inboxAlias, docsIncluidosMes: 100, precioDocExtraArs: 99 },
  })
  await enablePremiumAgents(empresaId, [PREMIUM_AGENTES.ocr])
  await logActivacion(empresaId, "intang.ocr_compras", "OCR Compras activado", { inboxAlias })
  return { inboxAlias }
}

export async function activarReactivadorClientes(empresaId: number) {
  const regla = await ensureRegla(empresaId, REGLA_REACTIVADOR, "cxc_vencida", {
    operador: "mayor_igual",
    valor: 30,
  })
  await enablePremiumAgents(empresaId, [PREMIUM_AGENTES.reactivador, "ventas-leads"])
  await logActivacion(empresaId, "intang.reactivador_clientes", "Reactivador B2B activado", {
    reglaId: regla.id,
  })
  return { reglaId: regla.id }
}

export async function desactivarPremiumSku(empresaId: number, nombresRegla: string[]) {
  await prisma.reglaAlerta.updateMany({
    where: { empresaId, nombre: { in: nombresRegla } },
    data: { activo: false },
  })
}