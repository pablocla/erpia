/**
 * Parser de códigos EAN-13 de balanzas comerciales (Systel, Kretz, etc.).
 *
 * Formato estándar Argentina: `20LLLLLVVVVVC` o `21LLLLLVVVVVC` (13 dígitos)
 * - Prefijo 20/21: identificador de balanza
 * - LLLLL (5): código / PLU / SKU del producto
 * - VVVVV (5): valor en centavos (modo precio) o gramos (modo peso)
 * - C (1): dígito verificador EAN-13
 */

export type ScaleValueMode = "price" | "weight"

export interface ParsedScaleEAN13 {
  isScaleBarcode: boolean
  rawBarcode: string
  /** true si el checksum EAN-13 es válido (solo cuando isScaleBarcode) */
  checksumValid?: boolean
  productSku?: string
  /** Importe total en pesos (modo precio) */
  totalPrice?: number
  /** Peso en gramos (modo peso o valor crudo en gramos) */
  weightGrams?: number
  /** Peso en kg (derivado de weightGrams) */
  weightKg?: number
  /** Interpretación preferida del valor */
  isPriceMode?: boolean
  mode?: ScaleValueMode
}

/** Calcula dígito verificador EAN-13 (módulo 10). */
export function ean13Checksum(digits12: string): number {
  if (!/^\d{12}$/.test(digits12)) return -1
  let sum = 0
  for (let i = 0; i < 12; i++) {
    const n = Number(digits12[i])
    sum += i % 2 === 0 ? n : n * 3
  }
  return (10 - (sum % 10)) % 10
}

export function isValidEan13(barcode: string): boolean {
  const clean = barcode.trim()
  if (!/^\d{13}$/.test(clean)) return false
  return ean13Checksum(clean.slice(0, 12)) === Number(clean[12])
}

/**
 * @param barcode cadena leída del scanner
 * @param priceScaleFactor divisor del valor (default 100 → centavos a pesos)
 * @param preferredMode si "weight", interpreta VVVVV como gramos; si "price", como centavos
 */
export function parseEAN13ScaleBarcode(
  barcode: string,
  priceScaleFactor: number = 100,
  preferredMode: ScaleValueMode = "price",
): ParsedScaleEAN13 {
  const cleanBarcode = barcode.trim()

  if (!/^(20|21)\d{11}$/.test(cleanBarcode)) {
    return { isScaleBarcode: false, rawBarcode: cleanBarcode }
  }

  const productSku = cleanBarcode.substring(2, 7)
  const rawValue = Number.parseInt(cleanBarcode.substring(7, 12), 10)
  const checksumValid = isValidEan13(cleanBarcode)

  if (Number.isNaN(rawValue)) {
    return { isScaleBarcode: false, rawBarcode: cleanBarcode }
  }

  const factor = priceScaleFactor > 0 ? priceScaleFactor : 100

  if (preferredMode === "weight") {
    return {
      isScaleBarcode: true,
      rawBarcode: cleanBarcode,
      checksumValid,
      productSku,
      weightGrams: rawValue,
      weightKg: rawValue / 1000,
      totalPrice: undefined,
      isPriceMode: false,
      mode: "weight",
    }
  }

  return {
    isScaleBarcode: true,
    rawBarcode: cleanBarcode,
    checksumValid,
    productSku,
    totalPrice: rawValue / factor,
    weightGrams: rawValue,
    weightKg: rawValue / 1000,
    isPriceMode: true,
    mode: "price",
  }
}

/** Alias compatible con el megaprompt histórico. */
export function parseBalanzaEAN13(
  barcode: string,
  opts?: { priceScaleFactor?: number; mode?: ScaleValueMode },
): {
  isBalanza: boolean
  plu?: string
  monto?: number
  pesoKg?: number
  checksumValid?: boolean
  rawBarcode: string
} {
  const parsed = parseEAN13ScaleBarcode(
    barcode,
    opts?.priceScaleFactor ?? 100,
    opts?.mode ?? "price",
  )
  return {
    isBalanza: parsed.isScaleBarcode,
    plu: parsed.productSku,
    monto: parsed.totalPrice,
    pesoKg: parsed.weightKg,
    checksumValid: parsed.checksumValid,
    rawBarcode: parsed.rawBarcode,
  }
}
