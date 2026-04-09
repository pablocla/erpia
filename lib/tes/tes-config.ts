/**
 * TES — Tax Entry System
 * Sistema de discriminación inteligente de impuestos por tipo de transacción.
 * Inspirado en el TES de Protheus (TOTVS), ampliado con soporte completo para
 * el sistema impositivo argentino y arquitectura multi-país.
 *
 * Cada TES define:
 * - Qué tipo de operación representa (venta, compra, exportación, etc.)
 * - IVA + IIBB (ARBA/ARCIBA) + Percepciones + Retenciones SICORE
 * - Qué cuentas contables afecta
 * - Si genera movimiento de stock / requiere CAE (AFIP)
 *
 * Para cálculo completo usar:
 *   import { calcularImpuestos } from "@/lib/tes/tax-engine"
 *   const breakdown = calcularImpuestos({ pais: "AR", operacion: "venta", ... })
 *
 * Para agregar soporte a otro país:
 *   import { registerTaxAdapter } from "@/lib/tes/tax-engine"
 *   registerTaxAdapter(new UYTaxAdapter())
 */

// Re-export engine utilities for convenience
export { calcularImpuestos, getRegisteredCountries } from "./tax-engine"
export type { TaxInput, TaxBreakdown, TaxResultItem, TaxLineItem } from "./types"

export interface TESImpuesto {
  codigo: string          // "IVA21", "IVA105", "IVA27", "IIBB_BA", etc.
  nombre: string
  alicuota: number        // porcentaje
  base: "neto" | "total"  // base de cálculo
  afectaDebito: boolean
  afectaCredito: boolean
}

export interface TES {
  codigo: string
  nombre: string
  tipo: "venta" | "compra" | "devolucion_venta" | "devolucion_compra" | "exportacion" | "importacion" | "interno"
  tipoComprobante: "factura" | "nota_credito" | "nota_debito" | "remito" | "recibo"
  operacion: "E" | "S"    // Entrada / Salida (stock)
  afectaStock: boolean
  afectaCaja: boolean
  requiereCAE: boolean
  impuestos: TESImpuesto[]
  cuentaVenta?: string     // cuenta contable de venta/ingreso
  cuentaCompra?: string    // cuenta contable de compra/egreso
  cuentaIVADebito?: string
  cuentaIVACredito?: string
  activo: boolean
  descripcion?: string
}

// Tabla de TES predefinidos para Argentina
export const TES_PREDEFINIDOS: TES[] = [
  // ─── VENTAS ──────────────────────────────────────────────────────────────
  {
    codigo: "VFA",
    nombre: "Venta Factura A",
    tipo: "venta",
    tipoComprobante: "factura",
    operacion: "S",
    afectaStock: true,
    afectaCaja: true,
    requiereCAE: true,
    cuentaVenta: "4.1.01",
    cuentaIVADebito: "2.1.03",
    impuestos: [
      { codigo: "IVA21", nombre: "IVA 21%", alicuota: 21, base: "neto", afectaDebito: true, afectaCredito: false },
    ],
    activo: true,
    descripcion: "Venta a Responsable Inscripto. Discrimina IVA. Genera Factura A.",
  },
  {
    codigo: "VFB",
    nombre: "Venta Factura B",
    tipo: "venta",
    tipoComprobante: "factura",
    operacion: "S",
    afectaStock: true,
    afectaCaja: true,
    requiereCAE: true,
    cuentaVenta: "4.1.01",
    cuentaIVADebito: "2.1.03",
    impuestos: [
      { codigo: "IVA21", nombre: "IVA 21%", alicuota: 21, base: "neto", afectaDebito: true, afectaCredito: false },
    ],
    activo: true,
    descripcion: "Venta a Consumidor Final / Monotributista. IVA incluido en precio.",
  },
  {
    codigo: "VFC",
    nombre: "Venta Factura C",
    tipo: "venta",
    tipoComprobante: "factura",
    operacion: "S",
    afectaStock: true,
    afectaCaja: true,
    requiereCAE: true,
    cuentaVenta: "4.1.01",
    impuestos: [],
    activo: true,
    descripcion: "Venta emisor Monotributista. Sin discriminación de IVA.",
  },
  {
    codigo: "VFE",
    nombre: "Venta Factura E (Exportación)",
    tipo: "exportacion",
    tipoComprobante: "factura",
    operacion: "S",
    afectaStock: true,
    afectaCaja: true,
    requiereCAE: true,
    cuentaVenta: "4.2.01",
    impuestos: [],
    activo: true,
    descripcion: "Exportación. Alícuota IVA 0%. Requiere permisos de exportación.",
  },
  // ─── NOTAS DE CRÉDITO VENTA ─────────────────────────────────────────────
  {
    codigo: "NCA",
    nombre: "Nota de Crédito A",
    tipo: "devolucion_venta",
    tipoComprobante: "nota_credito",
    operacion: "E",
    afectaStock: true,
    afectaCaja: true,
    requiereCAE: true,
    cuentaVenta: "4.1.01",
    cuentaIVADebito: "2.1.03",
    impuestos: [
      { codigo: "IVA21", nombre: "IVA 21%", alicuota: 21, base: "neto", afectaDebito: true, afectaCredito: false },
    ],
    activo: true,
    descripcion: "Devolución / descuento a Responsable Inscripto.",
  },
  {
    codigo: "NCB",
    nombre: "Nota de Crédito B",
    tipo: "devolucion_venta",
    tipoComprobante: "nota_credito",
    operacion: "E",
    afectaStock: true,
    afectaCaja: true,
    requiereCAE: true,
    cuentaVenta: "4.1.01",
    impuestos: [
      { codigo: "IVA21", nombre: "IVA 21%", alicuota: 21, base: "neto", afectaDebito: true, afectaCredito: false },
    ],
    activo: true,
    descripcion: "Devolución / descuento a Consumidor Final.",
  },
  // ─── COMPRAS ─────────────────────────────────────────────────────────────
  {
    codigo: "CFA",
    nombre: "Compra Factura A",
    tipo: "compra",
    tipoComprobante: "factura",
    operacion: "E",
    afectaStock: true,
    afectaCaja: true,
    requiereCAE: false,
    cuentaCompra: "5.1.01",
    cuentaIVACredito: "2.1.02",
    impuestos: [
      { codigo: "IVA21", nombre: "IVA 21%", alicuota: 21, base: "neto", afectaDebito: false, afectaCredito: true },
    ],
    activo: true,
    descripcion: "Compra a Responsable Inscripto. Genera crédito fiscal IVA.",
  },
  {
    codigo: "CFB",
    nombre: "Compra Factura B",
    tipo: "compra",
    tipoComprobante: "factura",
    operacion: "E",
    afectaStock: true,
    afectaCaja: true,
    requiereCAE: false,
    cuentaCompra: "5.1.01",
    impuestos: [],
    activo: true,
    descripcion: "Compra a Monotributista. Sin crédito fiscal IVA.",
  },
  {
    codigo: "CFC",
    nombre: "Compra Factura C",
    tipo: "compra",
    tipoComprobante: "factura",
    operacion: "E",
    afectaStock: true,
    afectaCaja: true,
    requiereCAE: false,
    cuentaCompra: "5.1.01",
    impuestos: [],
    activo: true,
    descripcion: "Compra a Monotributista emisor C.",
  },
  // ─── NOTAS DE CRÉDITO COMPRA ─────────────────────────────────────────────
  {
    codigo: "NCCA",
    nombre: "Nota de Crédito Compra A",
    tipo: "devolucion_compra",
    tipoComprobante: "nota_credito",
    operacion: "S",
    afectaStock: true,
    afectaCaja: true,
    requiereCAE: false,
    cuentaCompra: "5.1.01",
    cuentaIVACredito: "2.1.02",
    impuestos: [
      { codigo: "IVA21", nombre: "IVA 21%", alicuota: 21, base: "neto", afectaDebito: false, afectaCredito: true },
    ],
    activo: true,
    descripcion: "Devolución a proveedor RI. Revierte crédito fiscal.",
  },
  // ─── INTERNOS ────────────────────────────────────────────────────────────
  {
    codigo: "AJE",
    nombre: "Ajuste de Stock Entrada",
    tipo: "interno",
    tipoComprobante: "remito",
    operacion: "E",
    afectaStock: true,
    afectaCaja: false,
    requiereCAE: false,
    impuestos: [],
    activo: true,
    descripcion: "Ajuste manual de inventario — entrada.",
  },
  {
    codigo: "AJS",
    nombre: "Ajuste de Stock Salida",
    tipo: "interno",
    tipoComprobante: "remito",
    operacion: "S",
    afectaStock: true,
    afectaCaja: false,
    requiereCAE: false,
    impuestos: [],
    activo: true,
    descripcion: "Ajuste manual de inventario — salida / merma.",
  },
]

/**
 * Dada la condición IVA del cliente, retorna el TES de venta correcto.
 */
export function getTESVentaPorCondicion(condicionIva: string): TES {
  switch (condicionIva) {
    case "Responsable Inscripto":
      return TES_PREDEFINIDOS.find((t) => t.codigo === "VFA")!
    case "Exportacion":
      return TES_PREDEFINIDOS.find((t) => t.codigo === "VFE")!
    default:
      // Consumidor Final, Monotributista, Exento, etc.
      return TES_PREDEFINIDOS.find((t) => t.codigo === "VFB")!
  }
}

/**
 * Dado el tipo de factura del proveedor, retorna el TES de compra correcto.
 */
export function getTESCompraPorTipo(tipoFactura: "A" | "B" | "C"): TES {
  const map: Record<string, string> = { A: "CFA", B: "CFB", C: "CFC" }
  return TES_PREDEFINIDOS.find((t) => t.codigo === map[tipoFactura])!
}

/**
 * Calcula los impuestos discriminados para un subtotal neto dado un TES.
 * @deprecated Usar calcularImpuestos() del tax-engine para cálculo completo
 *   (incluye IIBB, SICORE, Percepciones).
 */
export function calcularImpuestosTES(
  tes: TES,
  subtotoNeto: number
): { codigo: string; nombre: string; base: number; alicuota: number; monto: number }[] {
  return tes.impuestos.map((imp) => {
    const base = imp.base === "neto" ? subtotoNeto : subtotoNeto
    const monto = (base * imp.alicuota) / 100
    return { codigo: imp.codigo, nombre: imp.nombre, base, alicuota: imp.alicuota, monto }
  })
}

/**
 * Determina el tipo de comprobante AFIP (tipoCbte) según el TES.
 */
export function getTipoCbteAFIP(tes: TES): number {
  const map: Record<string, number> = {
    VFA: 1,   // Factura A
    VFB: 6,   // Factura B
    VFC: 11,  // Factura C
    VFE: 19,  // Factura E
    NCA: 3,   // NC A
    NCB: 8,   // NC B
    NCC: 13,  // NC C
  }
  return map[tes.codigo] ?? 6
}

// ─── EXTENDED TES PRESETS (IIBB + SICORE + PERCEPCIONES) ─────────────────────
// These supplement TES_PREDEFINIDOS for operations involving provincial taxes and
// federal withholdings. They are merged into ALL_TES_PREDEFINIDOS below.

export const TES_EXTENDIDOS: TES[] = [
  // ── VENTAS CON PERCEPCIÓN IIBB ARBA (Prov. Buenos Aires) ─────────────────
  {
    codigo: "VFA_PERC_IIBB_PBA",
    nombre: "Venta Factura A + Percepción IIBB ARBA",
    tipo: "venta",
    tipoComprobante: "factura",
    operacion: "S",
    afectaStock: true,
    afectaCaja: true,
    requiereCAE: true,
    cuentaVenta: "4.1.01",
    cuentaIVADebito: "2.1.03",
    impuestos: [
      { codigo: "IVA21",        nombre: "IVA 21%",                      alicuota: 21,  base: "neto",  afectaDebito: true,  afectaCredito: false },
      { codigo: "PERC_IIBB_PBA", nombre: "Percepción IIBB ARBA (3%)",   alicuota: 3,   base: "neto",  afectaDebito: true,  afectaCredito: false },
    ],
    activo: true,
    descripcion: "Venta a RI. IVA 21% + Percepción IIBB ARBA 3%. Emisor es agente ARBA.",
  },
  // ── VENTAS CON PERCEPCIÓN IIBB ARCIBA (CABA) ─────────────────────────────
  {
    codigo: "VFA_PERC_IIBB_CABA",
    nombre: "Venta Factura A + Percepción IIBB ARCIBA",
    tipo: "venta",
    tipoComprobante: "factura",
    operacion: "S",
    afectaStock: true,
    afectaCaja: true,
    requiereCAE: true,
    cuentaVenta: "4.1.01",
    cuentaIVADebito: "2.1.03",
    impuestos: [
      { codigo: "IVA21",          nombre: "IVA 21%",                        alicuota: 21,  base: "neto", afectaDebito: true, afectaCredito: false },
      { codigo: "PERC_IIBB_CABA", nombre: "Percepción IIBB ARCIBA (2.5%)", alicuota: 2.5, base: "neto", afectaDebito: true, afectaCredito: false },
    ],
    activo: true,
    descripcion: "Venta a RI. IVA 21% + Percepción IIBB ARCIBA 2.5%. Emisor es agente ARCIBA.",
  },
  // ── VENTAS CON PERCEPCIÓN IVA RG 2408 ────────────────────────────────────
  {
    codigo: "VFA_PERC_IVA",
    nombre: "Venta Factura A + Percepción IVA RG 2408",
    tipo: "venta",
    tipoComprobante: "factura",
    operacion: "S",
    afectaStock: true,
    afectaCaja: true,
    requiereCAE: true,
    cuentaVenta: "4.1.01",
    cuentaIVADebito: "2.1.03",
    impuestos: [
      { codigo: "IVA21",      nombre: "IVA 21%",                   alicuota: 21, base: "neto", afectaDebito: true, afectaCredito: false },
      { codigo: "PERC_IVA_RI", nombre: "Percepción IVA RG 2408 (3%)", alicuota: 3, base: "neto", afectaDebito: true, afectaCredito: false },
    ],
    activo: true,
    descripcion: "Venta a RI. IVA 21% + Percepción IVA 3% (pago a cuenta del comprador). Emisor autorizado RG 2408.",
  },
  // ── COMPRA CON RETENCIÓN IVA SICORE (cód. 219) ───────────────────────────
  {
    codigo: "CFA_RET_SICORE_IVA",
    nombre: "Compra Factura A + Retención IVA SICORE Cód. 219",
    tipo: "compra",
    tipoComprobante: "factura",
    operacion: "E",
    afectaStock: true,
    afectaCaja: true,
    requiereCAE: false,
    cuentaCompra: "5.1.01",
    cuentaIVACredito: "2.1.02",
    impuestos: [
      { codigo: "IVA21",          nombre: "IVA 21%",                          alicuota: 21,   base: "neto",  afectaDebito: false, afectaCredito: true  },
      { codigo: "RET_IVA_219",    nombre: "Retención IVA SICORE Cód. 219",    alicuota: 10.5, base: "neto",  afectaDebito: false, afectaCredito: false },
    ],
    activo: true,
    descripcion: "Compra a RI. Crédito fiscal IVA + Retención IVA SICORE (50% del IVA 21%). Empresa es agente de retención AFIP.",
  },
  // ── COMPRA CON RETENCIÓN GANANCIAS SICORE (cód. 305) ─────────────────────
  {
    codigo: "CFA_RET_GANANCIAS",
    nombre: "Compra Factura A + Retención Ganancias SICORE Cód. 305",
    tipo: "compra",
    tipoComprobante: "factura",
    operacion: "E",
    afectaStock: true,
    afectaCaja: true,
    requiereCAE: false,
    cuentaCompra: "5.1.01",
    cuentaIVACredito: "2.1.02",
    impuestos: [
      { codigo: "IVA21",         nombre: "IVA 21%",                           alicuota: 21, base: "neto", afectaDebito: false, afectaCredito: true  },
      { codigo: "RET_GANANCIAS_305", nombre: "Retención Ganancias SICORE Cód. 305 (2%)", alicuota: 2, base: "neto", afectaDebito: false, afectaCredito: false },
    ],
    activo: true,
    descripcion: "Compra bienes a RI ≥ $400,000. Crédito IVA + Retención Ganancias 2% (SICORE RG 830, cód. 305).",
  },
  // ── COMPRA CON RETENCIÓN IVA + GANANCIAS SICORE ───────────────────────────
  {
    codigo: "CFA_RET_SICORE_FULL",
    nombre: "Compra Factura A + Retención SICORE IVA + Ganancias",
    tipo: "compra",
    tipoComprobante: "factura",
    operacion: "E",
    afectaStock: true,
    afectaCaja: true,
    requiereCAE: false,
    cuentaCompra: "5.1.01",
    cuentaIVACredito: "2.1.02",
    impuestos: [
      { codigo: "IVA21",             nombre: "IVA 21%",                             alicuota: 21,   base: "neto", afectaDebito: false, afectaCredito: true  },
      { codigo: "RET_IVA_219",       nombre: "Retención IVA SICORE Cód. 219",       alicuota: 10.5, base: "neto", afectaDebito: false, afectaCredito: false },
      { codigo: "RET_GANANCIAS_305", nombre: "Retención Ganancias SICORE Cód. 305", alicuota: 2,    base: "neto", afectaDebito: false, afectaCredito: false },
    ],
    activo: true,
    descripcion: "Compra ≥ $400,000 a RI. Crédito IVA + Retención IVA 50% (cód. 219) + Retención Ganancias 2% (cód. 305).",
  },
]

/**
 * All TES (base + extended IIBB/SICORE/Percepciones).
 * Use this in the API and UI instead of TES_PREDEFINIDOS where the full list is needed.
 */
export const ALL_TES_PREDEFINIDOS: TES[] = [...TES_PREDEFINIDOS, ...TES_EXTENDIDOS]

