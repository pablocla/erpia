/**
 * Mapeo Contable Service — Motor de Parametrización Contable Dinámica
 *
 * Desacopla las cuentas contables del código TypeScript resolviendo reglas de imputación
 * con jerarquía de 3 capas:
 *   1. Configuración personalizada de la Empresa (Tenant Override)
 *   2. Configuración predeterminada del Rubro (Vertical Default)
 *   3. Fallback normativo argentino del Sistema Global
 */

import { prisma } from "@/lib/prisma"
import { getCuentaLabel } from "@/lib/config/parametro-service"

export interface CriterioResolucionContable {
  empresaId: number
  tipoTransaccion: "venta" | "compra" | "cobro" | "pago" | "nc" | "nd" | "cmv" | "ajuste_stock"
  campo: string
  condicionPago?: string | null
  medioPago?: string | null
  rubro?: string | null
  fallbackCodigo: string
  fallbackNombre: string
}

export interface ReglaContableDTO {
  tipoTransaccion: string
  campo: string
  cuentaCodigo: string
  cuentaNombre: string
  activo?: boolean
}

// Defaults normativos argentinos por tipo de transacción y campo
export const FALLBACKS_NORMATIVOS_AR: Record<string, { codigo: string; nombre: string }> = {
  // Ventas
  "venta:caja": { codigo: "1.1", nombre: "Caja Central" },
  "venta:deudores": { codigo: "1.1.2", nombre: "Deudores por Ventas" },
  "venta:ingreso": { codigo: "4.1", nombre: "Ventas Gravadas" },
  "venta:iva_df": { codigo: "2.2", nombre: "IVA Débito Fiscal" },
  "venta:percepciones": { codigo: "2.3", nombre: "Percepciones a Pagar" },

  // Compras
  "compra:mercaderia": { codigo: "1.4", nombre: "Mercaderías de Reventa" },
  "compra:gasto": { codigo: "5.1", nombre: "Gastos Generales" },
  "compra:iva_cf": { codigo: "1.6", nombre: "IVA Crédito Fiscal" },
  "compra:proveedores": { codigo: "2.1", nombre: "Proveedores" },
  "compra:percepciones": { codigo: "1.1.7", nombre: "Percepciones Sufridas IIBB/IVA" },

  // Cobros & Pagos
  "cobro:caja": { codigo: "1.1", nombre: "Caja" },
  "cobro:banco": { codigo: "1.2", nombre: "Banco Cuenta Corriente" },
  "cobro:cheques_cartera": { codigo: "1.1.5", nombre: "Cheques en Cartera" },
  "pago:caja": { codigo: "1.1", nombre: "Caja" },
  "pago:banco": { codigo: "1.2", nombre: "Banco Cuenta Corriente" },
  "pago:cheques_a_pagar": { codigo: "2.8", nombre: "Cheques a Pagar" },

  // CMV & Stock
  "cmv:costo": { codigo: "5.1.1", nombre: "Costo de Mercaderías Vendidas" },
  "cmv:mercaderia": { codigo: "1.4", nombre: "Mercaderías" },
  "ajuste_stock:sobrante": { codigo: "4.2.1", nombre: "Sobrantes de Inventario" },
  "ajuste_stock:faltante": { codigo: "5.2.1", nombre: "Pérdidas por Faltante de Stock" },
}

export class MapeoContableService {
  /**
   * Resuelve la etiqueta contable ("codigo nombre") aplicando la jerarquía de parametrización.
   */
  async resolverCuenta(criterio: CriterioResolucionContable): Promise<string> {
    const { empresaId, tipoTransaccion, campo, condicionPago, medioPago, fallbackCodigo, fallbackNombre } = criterio

    // 1. Si es venta o compra y hay condición de pago específica, evaluar campo dinámico
    let campoEfectivo = campo
    if (tipoTransaccion === "venta" && campo === "cobro") {
      const esCredito = Boolean(
        condicionPago &&
        /cuenta\s*corriente|cta\s*cte|cr[eé]dito|d[ií]as/i.test(condicionPago)
      )
      campoEfectivo = esCredito ? "deudores" : "caja"
    }

    if (tipoTransaccion === "cobro" && medioPago) {
      if (medioPago === "efectivo") campoEfectivo = "caja"
      else if (medioPago === "cheque") campoEfectivo = "cheques_cartera"
      else campoEfectivo = "banco"
    }

    if (tipoTransaccion === "pago" && medioPago) {
      if (medioPago === "efectivo") campoEfectivo = "caja"
      else if (medioPago === "cheque") campoEfectivo = "cheques_a_pagar"
      else campoEfectivo = "banco"
    }

    // 2. Consulta con fallback normativo
    const key = `${tipoTransaccion}:${campoEfectivo}`
    const fallbackNormativo = FALLBACKS_NORMATIVOS_AR[key] ?? { codigo: fallbackCodigo, nombre: fallbackNombre }

    return getCuentaLabel(
      empresaId,
      tipoTransaccion,
      campoEfectivo,
      fallbackNormativo.codigo,
      fallbackNormativo.nombre
    )
  }

  /**
   * Guarda o actualiza una regla de parametrización contable para una empresa.
   */
  async upsertRegla(empresaId: number, regla: ReglaContableDTO): Promise<void> {
    await prisma.configAsientoCuenta.upsert({
      where: {
        empresaId_tipoTransaccion_campo: {
          empresaId,
          tipoTransaccion: regla.tipoTransaccion,
          campo: regla.campo,
        },
      },
      update: {
        cuentaCodigo: regla.cuentaCodigo,
        cuentaNombre: regla.cuentaNombre,
        activo: regla.activo ?? true,
      },
      create: {
        empresaId,
        tipoTransaccion: regla.tipoTransaccion,
        campo: regla.campo,
        cuentaCodigo: regla.cuentaCodigo,
        cuentaNombre: regla.cuentaNombre,
        activo: regla.activo ?? true,
      },
    })
  }

  /**
   * Obtiene el mapa completo de cuentas configuradas para una empresa.
   */
  async getEsquemaEmpresa(empresaId: number): Promise<Record<string, { codigo: string; nombre: string }>> {
    const configuradas = await prisma.configAsientoCuenta.findMany({
      where: { empresaId, activo: true },
    })

    const resultado: Record<string, { codigo: string; nombre: string }> = {}

    // Primero poblar con defaults normativos
    for (const [key, val] of Object.entries(FALLBACKS_NORMATIVOS_AR)) {
      resultado[key] = { ...val }
    }

    // Sobrescribir con lo configurado en la base de datos de esta empresa
    for (const conf of configuradas) {
      const key = `${conf.tipoTransaccion}:${conf.campo}`
      resultado[key] = {
        codigo: conf.cuentaCodigo,
        nombre: conf.cuentaNombre ?? conf.cuentaCodigo,
      }
    }

    return resultado
  }
}

export const mapeoContableService = new MapeoContableService()
