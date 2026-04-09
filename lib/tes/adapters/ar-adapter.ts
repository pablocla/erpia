/**
 * Argentine Tax Adapter
 *
 * Implements the full Argentine tax suite in a single adapter:
 *
 *  IVA (AFIP)
 *    27%  — gas, electricidad, telecomunicaciones
 *    21%  — alícuota general
 *    10.5%— medicamentos, frutas/verduras, publicaciones, construcción
 *    0%   — exento / no gravado
 *
 *  Percepción IVA (AFIP — RG 2408/2854/3164)
 *    3%   — sobre RI compradores (emisor autorizado como agente)
 *    5%   — sobre no-RI compradores
 *
 *  Retención IVA SICORE (AFIP — RG 2854)
 *    Cód. 219 — 50% del IVA 21% (agentes de retención grandes compradores)
 *    Cód. 217 — 50% del IVA 10.5%
 *
 *  IIBB — Ingresos Brutos Provinciales (devengado de la empresa)
 *    ARBA   (PBA)  — 3.5% comercio mayor / 3% menor / 1.5% industria / 4.5% servicios
 *    ARCIBA (CABA) — 3% comercio / 1.5% industria / 4.9% servicios
 *    DGR SF       — 3.5% comercio / 1.5% industria
 *    DGR Córdoba  — 3% comercio / 1% industria / 5% servicios
 *
 *  Percepción IIBB (agentes ARBA/ARCIBA)
 *    ARBA   — 3%   (padrón general)
 *    ARCIBA — 2.5%
 *
 *  Retención Ganancias SICORE (AFIP — RG 830)
 *    Cód. 305 — 2% compra bienes (umbral mínimo ARS 400,000)
 *    Cód. 767 — 6% servicios    (umbral mínimo ARS 150,000)
 *
 * IMPORTANT: all rates are hardcoded here as seed defaults.
 * The DB models TaxConcepto + TaxTasa override these at runtime when populated.
 * This means an accountant can update rates from the admin panel without a redeploy.
 */

import type {
  CountryTaxAdapter,
  TaxInput,
  TaxBreakdown,
  TaxResultItem,
  TaxLineItem,
  TaxOrganismo,
} from "../types"

// ─── RATE CATALOG ─────────────────────────────────────────────────────────────
// Source: AFIP/ARBA/ARCIBA official tables (2024–2025 reference values)
// Override at runtime via DB: SELECT alicuota FROM tax_tasas WHERE concepto.codigo = ?

export const AR_RATE_CATALOG: Record<string, number> = {
  // ── IVA (alícuotas AFIP) ──────────────────────────────────────────────────
  IVA_27:   27,
  IVA_21:   21,
  IVA_105:  10.5,
  IVA_0:    0,

  // ── Percepción IVA (RG 2408/2854) ────────────────────────────────────────
  PERC_IVA_RI:    3,      // buyer is Responsable Inscripto
  PERC_IVA_NO_RI: 5,      // buyer is Monotributista / CF (RG 3164)

  // ── Retención IVA SICORE (% of the IVA amount, not of the base) ──────────
  RET_IVA_219: 50,         // Cód. 219 — IVA 21%  → 50% of IVA = 10.5% over neto
  RET_IVA_217: 50,         // Cód. 217 — IVA 10.5%→ 50% of IVA = 5.25% over neto

  // ── IIBB Provincia de Buenos Aires (ARBA) ─────────────────────────────────
  IIBB_PBA_COMERCIO:   3.5,   // comercio mayorista general (padrón general)
  IIBB_PBA_RETAIL:     3,     // comercio minorista
  IIBB_PBA_INDUSTRIA:  1.5,
  IIBB_PBA_SERVICIOS:  4.5,
  IIBB_PBA_FINANCIERO: 6,

  // ── Percepción / Retención IIBB ARBA ─────────────────────────────────────
  PERC_IIBB_PBA: 3,
  RET_IIBB_PBA:  3,

  // ── IIBB Ciudad Autónoma de Buenos Aires (ARCIBA / AGIP) ──────────────────
  IIBB_CABA_COMERCIO:  3,
  IIBB_CABA_INDUSTRIA: 1.5,
  IIBB_CABA_SERVICIOS: 4.9,
  IIBB_CABA_INMUEBLES: 3.6,

  // ── Percepción / Retención IIBB ARCIBA ───────────────────────────────────
  PERC_IIBB_CABA: 2.5,
  RET_IIBB_CABA:  2.5,

  // ── Percepción / Retención IIBB otras provincias (padrón general) ──────
  PERC_IIBB_SF:   3,
  RET_IIBB_SF:    3,
  PERC_IIBB_CBA:  2.5,
  RET_IIBB_CBA:   2.5,
  PERC_IIBB_MZA:  3,
  RET_IIBB_MZA:   3,
  PERC_IIBB_TUC:  3,
  RET_IIBB_TUC:   3,
  PERC_IIBB_ER:   3,
  RET_IIBB_ER:    3,

  // ── IIBB Santa Fe (DGR SF) ────────────────────────────────────────────────
  IIBB_SF_COMERCIO:  3.5,
  IIBB_SF_INDUSTRIA: 1.5,
  IIBB_SF_SERVICIOS: 3.5,

  // ── IIBB Córdoba (DGR CBA) ────────────────────────────────────────────────
  IIBB_CBA_COMERCIO:  3,
  IIBB_CBA_INDUSTRIA: 1,
  IIBB_CBA_SERVICIOS: 5,

  // ── IIBB Mendoza ─────────────────────────────────────────────────────────
  IIBB_MZA_COMERCIO:  3,
  IIBB_MZA_INDUSTRIA: 1.5,
  IIBB_MZA_SERVICIOS: 3.5,

  // ── IIBB Tucumán ──────────────────────────────────────────────────────────
  IIBB_TUC_COMERCIO:  3.5,
  IIBB_TUC_INDUSTRIA: 1.5,
  IIBB_TUC_SERVICIOS: 4,

  // ── IIBB Entre Ríos ──────────────────────────────────────────────────────
  IIBB_ER_COMERCIO:   4.5,
  IIBB_ER_INDUSTRIA:  1.5,
  IIBB_ER_SERVICIOS:  4.5,

  // ── IIBB Salta ───────────────────────────────────────────────────────────
  IIBB_STA_COMERCIO:  3.6,
  IIBB_STA_INDUSTRIA: 1.5,
  IIBB_STA_SERVICIOS: 3.6,

  // ── IIBB Misiones ────────────────────────────────────────────────────────
  IIBB_MIS_COMERCIO:  3.3,
  IIBB_MIS_INDUSTRIA: 1.5,
  IIBB_MIS_SERVICIOS: 3.3,

  // ── IIBB Chaco ───────────────────────────────────────────────────────────
  IIBB_CHA_COMERCIO:  3.5,
  IIBB_CHA_INDUSTRIA: 1.5,
  IIBB_CHA_SERVICIOS: 3.5,

  // ── IIBB Corrientes ──────────────────────────────────────────────────────
  IIBB_COR_COMERCIO:  3.5,
  IIBB_COR_INDUSTRIA: 1,
  IIBB_COR_SERVICIOS: 3.5,

  // ── IIBB Santiago del Estero ─────────────────────────────────────────────
  IIBB_SGO_COMERCIO:  3.5,
  IIBB_SGO_INDUSTRIA: 1.5,
  IIBB_SGO_SERVICIOS: 3.5,

  // ── IIBB San Juan ────────────────────────────────────────────────────────
  IIBB_SJ_COMERCIO:   3.5,
  IIBB_SJ_INDUSTRIA:  1.5,
  IIBB_SJ_SERVICIOS:  3.5,

  // ── IIBB Jujuy ───────────────────────────────────────────────────────────
  IIBB_JUJ_COMERCIO:  3.5,
  IIBB_JUJ_INDUSTRIA: 1,
  IIBB_JUJ_SERVICIOS: 3.5,

  // ── IIBB Neuquén ─────────────────────────────────────────────────────────
  IIBB_NQN_COMERCIO:  3.5,
  IIBB_NQN_INDUSTRIA: 1.5,
  IIBB_NQN_SERVICIOS: 3.5,

  // ── IIBB Río Negro ───────────────────────────────────────────────────────
  IIBB_RN_COMERCIO:   3.5,
  IIBB_RN_INDUSTRIA:  1.5,
  IIBB_RN_SERVICIOS:  3.5,

  // ── IIBB Formosa ─────────────────────────────────────────────────────────
  IIBB_FOR_COMERCIO:  3.5,
  IIBB_FOR_INDUSTRIA: 1.5,
  IIBB_FOR_SERVICIOS: 3.5,

  // ── IIBB Catamarca ───────────────────────────────────────────────────────
  IIBB_CAT_COMERCIO:  3.5,
  IIBB_CAT_INDUSTRIA: 1.5,
  IIBB_CAT_SERVICIOS: 3.5,

  // ── IIBB La Rioja ────────────────────────────────────────────────────────
  IIBB_LRJ_COMERCIO:  3.5,
  IIBB_LRJ_INDUSTRIA: 1,
  IIBB_LRJ_SERVICIOS: 3.5,

  // ── IIBB San Luis ────────────────────────────────────────────────────────
  IIBB_SL_COMERCIO:   3.5,
  IIBB_SL_INDUSTRIA:  1.5,
  IIBB_SL_SERVICIOS:  3.5,

  // ── IIBB La Pampa ────────────────────────────────────────────────────────
  IIBB_LPA_COMERCIO:  3.5,
  IIBB_LPA_INDUSTRIA: 1.5,
  IIBB_LPA_SERVICIOS: 3.5,

  // ── IIBB Chubut ──────────────────────────────────────────────────────────
  IIBB_CHU_COMERCIO:  3,
  IIBB_CHU_INDUSTRIA: 1,
  IIBB_CHU_SERVICIOS: 3,

  // ── IIBB Santa Cruz ──────────────────────────────────────────────────────
  IIBB_SC_COMERCIO:   2,
  IIBB_SC_INDUSTRIA:  1,
  IIBB_SC_SERVICIOS:  2,

  // ── IIBB Tierra del Fuego (Zona franca — Ley 19.640) ─────────────────────
  IIBB_TDF_COMERCIO:  0,
  IIBB_TDF_INDUSTRIA: 0,
  IIBB_TDF_SERVICIOS: 0,

  // ── Retenciones Ganancias SICORE (RG 830) ────────────────────────────────
  RET_GANANCIAS_305: 2,     // Cód. 305 — compra de bienes muebles
  RET_GANANCIAS_767: 6,     // Cód. 767 — prestación de servicios
  RET_GANANCIAS_779: 6,     // Cód. 779 — locaciones de obra/servicios
}

// Minimum amounts below which SICORE Ganancias withholding does NOT apply
export const SICORE_GANANCIAS_MINIMOS: Record<string, number> = {
  "305": 400_000,   // ARS
  "767": 150_000,   // ARS
  "779": 150_000,   // ARS
}

// ─── ADAPTER ─────────────────────────────────────────────────────────────────

export class ARTaxAdapter implements CountryTaxAdapter {
  pais = "AR"
  nombre = "Argentina"

  cuentasContables: Record<string, string> = {
    "2.1.02": "IVA Crédito Fiscal",
    "2.1.03": "IVA Débito Fiscal",
    "2.1.04": "Percepciones IVA RG 2408 a Pagar",
    "2.1.05": "Percepciones IIBB ARBA a Pagar",
    "2.1.06": "Percepciones IIBB ARCIBA a Pagar",
    "1.1.06": "Retenciones IVA SICORE a Cobrar",
    "1.1.07": "Retenciones Ganancias SICORE a Cobrar",
    "5.1.04": "IIBB Propia (devengado)",
    "4.1.01": "Ventas",
    "4.2.01": "Ventas Exterior (Exportación)",
    "5.1.01": "Compras",
  }

  calcular(input: TaxInput): TaxBreakdown {
    const items: TaxResultItem[] = []
    const base = input.subtotalNeto
    const { operacion, emisor, receptor } = input

    const esVenta = operacion === "venta" || operacion === "devolucion_venta"
    const esCompra = operacion === "compra" || operacion === "devolucion_compra"
    const esExportacion = operacion === "exportacion"
    const esDevolucion = operacion.startsWith("devolucion_")

    // ── 1. IVA ───────────────────────────────────────────────────────────────
    // Only RI emit IVA. Exportaciones: IVA 0% (no discrimina).
    // Monotributista / Exento: no IVA credit or debit generated.
    if (emisor.condicionIva === "Responsable Inscripto" && !esExportacion) {
      const ivaItems = input.items?.length
        ? this.ivaDeLineas(input.items, esVenta)
        : [this.ivaItem(base, 21, esVenta)]
      items.push(...ivaItems)
    }

    // ── 2. Percepción IVA (emisor autorizado RG 2408) ─────────────────────
    // Added to invoice. Buyer uses it as a payment-on-account (pago a cuenta) of IVA.
    if (
      esVenta && !esDevolucion &&
      emisor.esAgentePercepcionIVA &&
      emisor.condicionIva === "Responsable Inscripto"
    ) {
      const alicuota =
        receptor.condicionIva === "Responsable Inscripto"
          ? AR_RATE_CATALOG.PERC_IVA_RI
          : AR_RATE_CATALOG.PERC_IVA_NO_RI
      items.push({
        codigo: "PERC_IVA_RI",
        nombre: `Percepción IVA RG 2408 (${alicuota}%)`,
        tipo: "percepcion_iva",
        organismo: "AFIP",
        base,
        alicuota,
        monto: r2(base * alicuota / 100),
        esRetencion: false,
        esPercepcion: true,
        cuentaContable: "2.1.04",
      })
    }

    // ── 3. Retención IVA SICORE — códigos 217 / 219 ───────────────────────
    // Large buyers (designated SICORE agents) deduct this from the payment.
    // It does NOT appear on the invoice — only on the payment receipt (constancia).
    if (
      esCompra && !esDevolucion &&
      receptor.esAgenteRetencionSICORE &&
      emisor.condicionIva === "Responsable Inscripto"
    ) {
      const iva21 = items.find(i => i.codigo === "IVA21")
      const iva105 = items.find(i => i.codigo === "IVA105")
      if (iva21) {
        items.push({
          codigo: "RET_IVA_SICORE_219",
          nombre: "Retención IVA SICORE Cód. 219 (21%)",
          tipo: "retencion_iva",
          organismo: "AFIP",
          base: iva21.monto,
          alicuota: AR_RATE_CATALOG.RET_IVA_219,
          monto: r2(iva21.monto * AR_RATE_CATALOG.RET_IVA_219 / 100),
          esRetencion: true,
          esPercepcion: false,
          cuentaContable: "1.1.06",
          codigoSicore: "219",
        })
      }
      if (iva105) {
        items.push({
          codigo: "RET_IVA_SICORE_217",
          nombre: "Retención IVA SICORE Cód. 217 (10.5%)",
          tipo: "retencion_iva",
          organismo: "AFIP",
          base: iva105.monto,
          alicuota: AR_RATE_CATALOG.RET_IVA_217,
          monto: r2(iva105.monto * AR_RATE_CATALOG.RET_IVA_217 / 100),
          esRetencion: true,
          esPercepcion: false,
          cuentaContable: "1.1.06",
          codigoSicore: "217",
        })
      }
    }

    // ── 4. Percepción IIBB (emisor is an authorized provincial agent) ────────
    // Added to invoice. Buyer uses it as a payment-on-account of IIBB.
    if (esVenta && !esDevolucion && emisor.esAgentePercepcionIIBB) {
      const jur = input.jurisdiccionPrincipal ?? "PBA"
      const perc = this.percepcionIIBB(base, jur)
      if (perc) items.push(perc)
    }

    // ── 5. IIBB propia (accrue for accounting — NOT on invoice, monthly DJ) ──
    // This represents the company's own IIBB liability generated by each sale.
    // It goes to account 5.1.04 (expense) / 2.1.xx (payable) in the accounting entry.
    if (
      esVenta && !esDevolucion &&
      input.jurisdiccionPrincipal &&
      emisor.condicionIva === "Responsable Inscripto"
    ) {
      const provision = this.iibbPropia(base, input.jurisdiccionPrincipal)
      if (provision) items.push(provision)
    }

    // ── 6. Retención Ganancias SICORE — cód. 305 / 767 ────────────────────
    // Deducted from payment by SICORE agents. NOT on invoice.
    if (
      esCompra && !esDevolucion &&
      receptor.esAgenteRetencionSICORE
    ) {
      const ret = this.retencionGanancias(base)
      if (ret) items.push(ret)
    }

    return this.aggregate(base, items)
  }

  // ─── PRIVATE HELPERS ────────────────────────────────────────────────────────

  private ivaDeLineas(lineas: TaxLineItem[], esVenta: boolean): TaxResultItem[] {
    const grupos: Record<number, number> = {}
    for (const l of lineas) {
      if (l.exento) continue
      const alicuota = l.superReducido ? 27 : l.reducido ? 10.5 : 21
      grupos[alicuota] = (grupos[alicuota] ?? 0) + l.subtotal
    }
    return Object.entries(grupos).map(([alicuota, baseLinea]) =>
      this.ivaItem(baseLinea, Number(alicuota), esVenta)
    )
  }

  private ivaItem(base: number, alicuota: number, esVenta: boolean): TaxResultItem {
    const codeMap: Record<number, string> = { 27: "IVA27", 21: "IVA21", 10.5: "IVA105", 0: "IVA0" }
    return {
      codigo: codeMap[alicuota] ?? "IVA21",
      nombre: `IVA ${alicuota}%`,
      tipo: "iva",
      organismo: "AFIP",
      base,
      alicuota,
      monto: r2(base * alicuota / 100),
      esRetencion: false,
      esPercepcion: false,
      cuentaContable: esVenta ? "2.1.03" : "2.1.02",
    }
  }

  private percepcionIIBB(base: number, jur: string): TaxResultItem | null {
    const key = `PERC_IIBB_${jur}`
    const alicuota = AR_RATE_CATALOG[key] ?? 0
    if (alicuota === 0) return null
    const organismo: TaxOrganismo = jur === "CABA" ? "ARCIBA" : "ARBA"
    const cuentaMap: Record<string, string> = { CABA: "2.1.06", PBA: "2.1.05" }
    return {
      codigo: `PERC_IIBB_${jur}`,
      nombre: `Percepción IIBB ${organismo}`,
      tipo: "percepcion_iibb",
      organismo,
      jurisdiccion: jur,
      base,
      alicuota,
      monto: r2(base * alicuota / 100),
      esRetencion: false,
      esPercepcion: true,
      cuentaContable: cuentaMap[jur] ?? "2.1.05",
    }
  }

  /**
   * Calculates IIBB for the company's own accrual.
   * Activity defaults to "comercio" when unknown — override via items[].categoriaProducto.
   */
  private iibbPropia(base: number, jur: string): TaxResultItem | null {
    const key = `IIBB_${jur}_COMERCIO`
    const alicuota = AR_RATE_CATALOG[key] ?? AR_RATE_CATALOG.IIBB_PBA_COMERCIO ?? 3.5
    const organismoMap: Record<string, TaxOrganismo> = {
      CABA: "ARCIBA",
      SF: "DGR_SF",
      CBA: "DGR_CBA",
    }
    const organismo: TaxOrganismo = organismoMap[jur] ?? "ARBA"
    return {
      codigo: `IIBB_${jur}`,
      nombre: `IIBB ${organismo} (devengado)`,
      tipo: "iibb",
      organismo,
      jurisdiccion: jur,
      base,
      alicuota,
      monto: r2(base * alicuota / 100),
      esRetencion: false,
      esPercepcion: false,
      cuentaContable: "5.1.04",
    }
  }

  /**
   * SICORE Ganancias Cód. 305 (bienes) or 767 (servicios).
   * Only applies when base exceeds the minimum threshold.
   */
  private retencionGanancias(base: number): TaxResultItem | null {
    if (base < SICORE_GANANCIAS_MINIMOS["305"]) return null
    const alicuota = AR_RATE_CATALOG.RET_GANANCIAS_305
    return {
      codigo: "RET_GANANCIAS_305",
      nombre: "Retención Ganancias SICORE Cód. 305",
      tipo: "retencion_ganancias",
      organismo: "AFIP",
      base,
      alicuota,
      monto: r2(base * alicuota / 100),
      esRetencion: true,
      esPercepcion: false,
      cuentaContable: "1.1.07",
      codigoSicore: "305",
    }
  }

  private aggregate(base: number, items: TaxResultItem[]): TaxBreakdown {
    const iva = items.filter(i => i.tipo === "iva")
    const iibb = items.filter(i => i.tipo === "iibb")
    const retenciones = items.filter(i => i.esRetencion)
    const percepciones = items.filter(i => i.esPercepcion)
    const sum = (arr: TaxResultItem[]) => r2(arr.reduce((s, i) => s + i.monto, 0))
    const totalIVA = sum(iva)
    const totalIIBB = sum(iibb)
    const totalRetenciones = sum(retenciones)
    const totalPercepciones = sum(percepciones)
    const totalImpuestosFactura = r2(totalIVA + totalPercepciones)
    return {
      subtotalNeto: base,
      impuestos: items,
      iva,
      iibb,
      retenciones,
      percepciones,
      totalIVA,
      totalIIBB,
      totalRetenciones,
      totalPercepciones,
      totalImpuestosFactura,
      totalRetencionPago: totalRetenciones,
      totalFinal: r2(base + totalImpuestosFactura),
    }
  }
}

/** Round to 2 decimal places */
function r2(n: number): number {
  return Math.round(n * 100) / 100
}
