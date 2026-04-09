/**
 * Mexico Tax Adapter — SAT (Servicio de Administración Tributaria)
 *
 * IVA: 16% (general), 0% (alimentos, medicinas), exento
 * ISR: Impuesto Sobre la Renta — retención en pagos a proveedores/servicios
 * IEPS: Impuesto Especial sobre Producción y Servicios (tabaco, bebidas, etc.)
 * CFDI: Comprobante Fiscal Digital por Internet (4.0)
 *
 * Status: STUB — rates and basic calculation implemented.
 * TODO: full CFDI 4.0 XML generation, timbrado PAC, cancelación, complementos de pago
 */

import type { CountryTaxAdapter, TaxInput, TaxBreakdown, TaxResultItem } from "../types"

const MX_IVA_GENERAL = 16
const MX_IVA_TASA_0 = 0
const MX_ISR_SERVICIOS = 10  // Retención ISR por servicios profesionales

export class MXTaxAdapter implements CountryTaxAdapter {
  pais = "MX"
  nombre = "México — SAT"

  cuentasContables: Record<string, string> = {
    "iva_trasladado": "2.2 IVA Trasladado",
    "iva_acreditable": "1.6 IVA Acreditable",
    "isr_retenido": "2.4.5 ISR Retenido a depositar",
    "iva_retenido": "2.4.6 IVA Retenido a depositar",
    "ventas": "4.1 Ingresos por Ventas",
    "compras": "1.4 Mercaderías",
    "proveedores": "2.1 Proveedores",
    "clientes": "1.3 Cuentas por Cobrar",
  }

  calcular(input: TaxInput): TaxBreakdown {
    const { subtotalNeto, items, operacion, receptor } = input
    const impuestos: TaxResultItem[] = []

    // ─── IVA ─────────────────────────────────────────────────────────
    if (items && items.length > 0) {
      let totalGravado16 = 0
      let totalTasa0 = 0
      let totalExento = 0

      for (const item of items) {
        if (item.exento) {
          totalExento += item.subtotal
        } else if (item.reducido) {
          // Tasa 0%: alimentos, medicinas básicas
          totalTasa0 += item.subtotal
        } else {
          totalGravado16 += item.subtotal
        }
      }

      if (totalGravado16 > 0) {
        impuestos.push({
          codigo: "MX_IVA_16",
          nombre: "IVA 16%",
          tipo: "iva",
          organismo: "SAT",
          base: totalGravado16,
          alicuota: MX_IVA_GENERAL,
          monto: Math.round(totalGravado16 * MX_IVA_GENERAL) / 100,
          esRetencion: false,
          esPercepcion: false,
          cuentaContable: operacion === "venta" ? "2.2 IVA Trasladado" : "1.6 IVA Acreditable",
        })
      }

      if (totalTasa0 > 0) {
        impuestos.push({
          codigo: "MX_IVA_0",
          nombre: "IVA 0%",
          tipo: "iva",
          organismo: "SAT",
          base: totalTasa0,
          alicuota: MX_IVA_TASA_0,
          monto: 0,
          esRetencion: false,
          esPercepcion: false,
        })
      }
    } else {
      const montoIVA = Math.round(subtotalNeto * MX_IVA_GENERAL) / 100
      impuestos.push({
        codigo: "MX_IVA_16",
        nombre: "IVA 16%",
        tipo: "iva",
        organismo: "SAT",
        base: subtotalNeto,
        alicuota: MX_IVA_GENERAL,
        monto: montoIVA,
        esRetencion: false,
        esPercepcion: false,
        cuentaContable: operacion === "venta" ? "2.2 IVA Trasladado" : "1.6 IVA Acreditable",
      })
    }

    // ─── ISR Retención (compra de servicios profesionales) ───────────
    const retenciones: TaxResultItem[] = []
    if (operacion === "compra" && receptor?.esAgenteRetencionSICORE) {
      const montoISR = Math.round(subtotalNeto * MX_ISR_SERVICIOS) / 100
      const retencionISR: TaxResultItem = {
        codigo: "MX_ISR_RET",
        nombre: "Retención ISR 10%",
        tipo: "retencion_ganancias",
        organismo: "SAT",
        base: subtotalNeto,
        alicuota: MX_ISR_SERVICIOS,
        monto: montoISR,
        esRetencion: true,
        esPercepcion: false,
        cuentaContable: "2.4.5 ISR Retenido a depositar",
      }
      impuestos.push(retencionISR)
      retenciones.push(retencionISR)

      // IVA Retenido (2/3 del IVA trasladado)
      const ivaLineas = impuestos.filter((i) => i.tipo === "iva")
      const totalIVABruto = ivaLineas.reduce((s, i) => s + i.monto, 0)
      const ivaRetenido = Math.round(totalIVABruto * (2 / 3) * 100) / 100
      if (ivaRetenido > 0) {
        const retIVA: TaxResultItem = {
          codigo: "MX_IVA_RET",
          nombre: "Retención IVA 2/3",
          tipo: "retencion_iva",
          organismo: "SAT",
          base: totalIVABruto,
          alicuota: 66.67,
          monto: ivaRetenido,
          esRetencion: true,
          esPercepcion: false,
          cuentaContable: "2.4.6 IVA Retenido a depositar",
        }
        impuestos.push(retIVA)
        retenciones.push(retIVA)
      }
    }

    const iva = impuestos.filter((i) => i.tipo === "iva")
    const totalIVA = iva.reduce((s, i) => s + i.monto, 0)
    const totalRetenciones = retenciones.reduce((s, r) => s + r.monto, 0)

    return {
      subtotalNeto,
      impuestos,
      iva,
      iibb: [],
      retenciones,
      percepciones: [],
      totalIVA,
      totalIIBB: 0,
      totalRetenciones,
      totalPercepciones: 0,
      totalImpuestosFactura: totalIVA,
      totalRetencionPago: totalRetenciones,
      totalFinal: subtotalNeto + totalIVA,
    }
  }
}
