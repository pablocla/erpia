/**
 * Chile Tax Adapter — SII (Servicio de Impuestos Internos)
 *
 * IVA: 19% (standard), exento for certain items
 * DTE types: Factura Electrónica (33), Factura Exenta (34), Boleta (39), NC (61), ND (56)
 * Withholdings: Ret. Honorarios (10%), Ret. IVA construcción (19%)
 *
 * Status: STUB — rates and basic calculation implemented.
 * TODO: full SII DTE integration, LibroDTE, RCV, boleta flow
 */

import type { CountryTaxAdapter, TaxInput, TaxBreakdown, TaxResultItem } from "../types"

const CL_IVA_RATE = 19

export class CLTaxAdapter implements CountryTaxAdapter {
  pais = "CL"
  nombre = "Chile — SII"

  cuentasContables: Record<string, string> = {
    "iva_debito": "2.2 IVA Débito Fiscal",
    "iva_credito": "1.6 IVA Crédito Fiscal",
    "ventas": "4.1 Ventas",
    "compras": "1.4 Mercaderías",
    "proveedores": "2.1 Proveedores",
    "clientes": "1.3 Deudores por Ventas",
    "retencion_honorarios": "2.4.4 Ret. Honorarios a depositar",
  }

  calcular(input: TaxInput): TaxBreakdown {
    const { subtotalNeto, items } = input
    const impuestos: TaxResultItem[] = []

    // ─── IVA 19% ─────────────────────────────────────────────────────
    if (items && items.length > 0) {
      let totalExento = 0
      let totalGravado = 0

      for (const item of items) {
        if (item.exento) {
          totalExento += item.subtotal
        } else {
          totalGravado += item.subtotal
        }
      }

      if (totalGravado > 0) {
        impuestos.push({
          codigo: "CL_IVA_19",
          nombre: "IVA 19%",
          tipo: "iva",
          organismo: "SII",
          base: totalGravado,
          alicuota: CL_IVA_RATE,
          monto: Math.round(totalGravado * CL_IVA_RATE) / 100,
          esRetencion: false,
          esPercepcion: false,
          cuentaContable: input.operacion === "venta" ? "2.2 IVA Débito Fiscal" : "1.6 IVA Crédito Fiscal",
        })
      }
    } else {
      const montoIVA = Math.round(subtotalNeto * CL_IVA_RATE) / 100
      impuestos.push({
        codigo: "CL_IVA_19",
        nombre: "IVA 19%",
        tipo: "iva",
        organismo: "SII",
        base: subtotalNeto,
        alicuota: CL_IVA_RATE,
        monto: montoIVA,
        esRetencion: false,
        esPercepcion: false,
        cuentaContable: input.operacion === "venta" ? "2.2 IVA Débito Fiscal" : "1.6 IVA Crédito Fiscal",
      })
    }

    const iva = impuestos.filter((i) => i.tipo === "iva")
    const totalIVA = iva.reduce((s, i) => s + i.monto, 0)

    return {
      subtotalNeto,
      impuestos,
      iva,
      iibb: [],
      retenciones: [],
      percepciones: [],
      totalIVA,
      totalIIBB: 0,
      totalRetenciones: 0,
      totalPercepciones: 0,
      totalImpuestosFactura: totalIVA,
      totalRetencionPago: 0,
      totalFinal: subtotalNeto + totalIVA,
    }
  }
}
