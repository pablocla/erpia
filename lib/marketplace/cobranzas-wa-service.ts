/**
 * Secretaria Virtual de Cobranzas por WhatsApp — SKU intang.cobranzas_wa
 * Reutiliza cuentaCobrar, reglaAlerta cxc_vencida y mensajePendienteWhatsApp.
 */

import { prisma } from "@/lib/prisma"
import { crearReglaAlerta } from "@/lib/alertas/alertas-service"
import { saveIANotificacionConfig } from "@/lib/ai/ia-notificacion-config"
import { persistSistemaLog } from "@/lib/ops/sistema-log"

const REGLA_NOMBRE = "Secretaria Cobranzas WA (AutoPool)"

export interface CobranzasWaConfig {
  diasVencimiento: number
  maxClientesPorDia: number
  autoAprobar: boolean
}

export const DEFAULT_COBRANZAS_WA_CONFIG: CobranzasWaConfig = {
  diasVencimiento: 7,
  maxClientesPorDia: 20,
  autoAprobar: false,
}

export async function activarSecretariaCobranzas(
  empresaId: number,
  config: Partial<CobranzasWaConfig> = {},
): Promise<{ reglaId: number; config: CobranzasWaConfig }> {
  const merged = { ...DEFAULT_COBRANZAS_WA_CONFIG, ...config }

  let regla = await prisma.reglaAlerta.findFirst({
    where: { empresaId, tipoRegla: "cxc_vencida", nombre: REGLA_NOMBRE },
  })

  if (!regla) {
    regla = await crearReglaAlerta({
      empresaId,
      nombre: REGLA_NOMBRE,
      tipoRegla: "cxc_vencida",
      condicion: { operador: "mayor_igual", valor: merged.diasVencimiento },
      frecuenciaHoras: 24,
    })
  }

  await saveIANotificacionConfig(empresaId, {
    evaluarReglasEnCron: true,
    whatsappCobranzaMaxPorRegla: merged.maxClientesPorDia,
    whatsappCobranzaAutoAprobar: merged.autoAprobar,
    umbrales: { 
      diasCxcVencida: merged.diasVencimiento,
      stockCriticoProductos: 0,
      diasCxpVencida: 0,
      ventaSemanalMinima: 0,
      diferenciaCajaMaxima: 0
    },
    agentesNotificacion: { cobranzas: true },
  })

  await persistSistemaLog({
    empresaId,
    severidad: "info",
    modulo: "marketplace",
    mensaje: "Secretaria Cobranzas WA activada",
    metadata: { reglaId: regla.id, ...merged },
  })

  return { reglaId: regla.id, config: merged }
}

/** Resumen de deuda recuperable para panel ROI */
export async function resumenCobranzasPendientes(empresaId: number, diasMinimos = 7) {
  const fechaLimite = new Date()
  fechaLimite.setDate(fechaLimite.getDate() - diasMinimos)

  const cuentas = await prisma.cuentaCobrar.findMany({
    where: {
      estado: { in: ["pendiente", "vencida", "parcial"] },
      fechaVencimiento: { lt: fechaLimite },
      cliente: { empresaId },
    },
    include: {
      cliente: { select: { id: true, nombre: true, telefono: true } },
    },
  })

  const conTelefono = cuentas.filter((c) => {
    const tel = c.cliente.telefono?.replace(/\D/g, "") ?? ""
    return tel.length >= 8
  })

  const saldoTotal = cuentas.reduce((acc, c) => acc + Number(c.saldo), 0)
  const clientesUnicos = new Set(cuentas.map((c) => c.cliente.id)).size
  const contactables = new Set(conTelefono.map((c) => c.cliente.id)).size

  return {
    saldoTotal,
    clientesUnicos,
    contactablesWhatsApp: contactables,
    cuentasVencidas: cuentas.length,
  }
}