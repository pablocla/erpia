/**
 * Tax Engine — Multi-Country Types
 *
 * Architecture: country-agnostic interfaces + per-country adapters (Strategy pattern).
 * Inspired by SAP's Condition Technique, Avalara AvaTax, and Oracle Tax Engine.
 *
 * Advantages over Protheus TES:
 *  1. Adapters are hot-swappable: register a new country without touching core logic.
 *  2. Rates are DB-backed (TaxConcepto / TaxTasa models) → accountants update them,
 *     not developers.
 *  3. Full lifecycle: IVA + IIBB (all provinces) + SICORE (retenciones) + Percepciones.
 *  4. Correct split: "on invoice" taxes vs "deducted at payment" taxes.
 *
 * Registered adapters: AR (Argentina).
 * Extend to: UY, BR (ICMS/PIS/COFINS/ISS/IPI), ES, MX (IVA+ISR), CL, PE.
 */

// ─── TAX TYPE TAXONOMY ────────────────────────────────────────────────────────

export type TaxTipo =
  | "iva"                   // IVA / VAT / GST — federal consumption tax
  | "iibb"                  // Ingresos Brutos (AR) — provincial turnover tax
  | "retencion_iva"         // SICORE IVA — withheld by payer at source
  | "retencion_ganancias"   // SICORE income-tax withholding (RG 830)
  | "percepcion_iva"        // IVA perception collected upfront on invoice
  | "percepcion_iibb"       // IIBB perception (ARBA/ARCIBA authorized agent)
  | "excise"                // Impuestos internos / excise tax
  | "customs"               // Import/export duties
  | "stamp"                 // Impuesto de sellos (stamp tax, AR provincial)

export type TaxOrganismo =
  | "AFIP"      // Argentina federal
  | "ARBA"      // Buenos Aires Province
  | "ARCIBA"    // CABA (also known as AGIP)
  | "AGIP"      // CABA (alternative name)
  | "DGR_SF"    // Santa Fe province
  | "DGR_CBA"   // Córdoba province
  | "IRS"       // USA
  | "HMRC"      // UK
  | "SII"       // Chile
  | "SAT"       // Mexico
  | "SUNAT"     // Peru
  | "RFB"       // Brazil

// ─── INPUT MODEL ─────────────────────────────────────────────────────────────

/**
 * A single line of a sale/purchase for per-line IVA discrimination.
 * When items are provided, the engine uses them for IVA breakdown.
 * When absent, the engine defaults to 21% on the total subtotalNeto.
 */
export interface TaxLineItem {
  descripcion: string
  cantidad: number
  precioUnitario: number
  subtotal: number
  codigoProducto?: string
  /** IIBB activity: "comercio" | "industria" | "servicios" — changes IIBB rate */
  categoriaProducto?: string
  /** IVA exento / no gravado: true = this line generates no IVA */
  exento?: boolean
  /** IVA 10.5% reduced rate (AR): medicamentos, frutas/verduras, publicaciones) */
  reducido?: boolean
  /** IVA 27% (AR): gas, electricidad, telecomunicaciones */
  superReducido?: boolean
}

export interface TaxParty {
  /** "Responsable Inscripto" | "Monotributista" | "Exento" | "Consumidor Final" */
  condicionIva: string
  /** RG 2408/2854/3164: seller is authorized to collect IVA perception on invoice */
  esAgentePercepcionIVA?: boolean
  /** ARBA/ARCIBA: seller is authorized to collect IIBB perception on invoice */
  esAgentePercepcionIIBB?: boolean
  /** SICORE: buyer (empresa grande / agente de retención AFIP) retains IVA and Ganancias */
  esAgenteRetencionSICORE?: boolean
  /** Provinces where this party is RI for IIBB (Convenio Multilateral) */
  jurisdicciones?: string[]
}

export interface TaxInput {
  /** ISO 3166-1 alpha-2: "AR" | "UY" | "BR" | "ES" | "MX" | "CL" */
  pais: string
  operacion:
    | "venta"
    | "compra"
    | "devolucion_venta"
    | "devolucion_compra"
    | "exportacion"
    | "importacion"
  emisor: TaxParty
  receptor: TaxParty
  subtotalNeto: number
  items?: TaxLineItem[]
  /** Primary province for IIBB: "PBA" | "CABA" | "SF" | "CBA" | "MZA" | "TUC" */
  jurisdiccionPrincipal?: string
  fechaOperacion?: Date
  /** Override auto-detected TES */
  tesCodigo?: string
  /** Alícuota IIBB del padrón del contribuyente (override de tasa genérica) */
  alicuotaPadronIIBB?: number
}

// ─── OUTPUT MODEL ─────────────────────────────────────────────────────────────

export interface TaxResultItem {
  codigo: string
  nombre: string
  tipo: TaxTipo
  organismo: TaxOrganismo
  jurisdiccion?: string
  base: number
  /** Rate as integer percentage: 21 for 21%, 10.5 for 10.5% */
  alicuota: number
  monto: number
  /** True = deducted from payment to supplier. Does NOT appear on invoice total. */
  esRetencion: boolean
  /** True = added to invoice total (charged to buyer). */
  esPercepcion: boolean
  cuentaContable?: string
  /** SICORE withholding code: "217" | "219" | "305" | "767" */
  codigoSicore?: string
}

export interface TaxBreakdown {
  subtotalNeto: number
  /** All calculated taxes (IVA + IIBB + retenciones + percepciones) */
  impuestos: TaxResultItem[]
  /** Subset: IVA only */
  iva: TaxResultItem[]
  /** Subset: IIBB (provincial) only */
  iibb: TaxResultItem[]
  /** Subset: withheld taxes — deducted at payment, not on invoice */
  retenciones: TaxResultItem[]
  /** Subset: perceptions — added to invoice total */
  percepciones: TaxResultItem[]
  totalIVA: number
  totalIIBB: number
  totalRetenciones: number
  totalPercepciones: number
  /** IVA + percepciones: the amount that goes on the invoice */
  totalImpuestosFactura: number
  /** Total withheld from payment to supplier */
  totalRetencionPago: number
  /** subtotalNeto + IVA + percepciones */
  totalFinal: number
}

// ─── ADAPTER CONTRACT ─────────────────────────────────────────────────────────

/**
 * Each country implements this interface.
 * Register it with `registerTaxAdapter(adapter)` in the tax engine.
 */
export interface CountryTaxAdapter {
  pais: string
  nombre: string
  calcular(input: TaxInput): TaxBreakdown
  /** Accounting chart of accounts used by this adapter */
  cuentasContables: Record<string, string>
}
