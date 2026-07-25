/**
 * Venta por peso — verdulería / fiambrería en POS.
 */

export function calcularPrecioPorPeso(input: {
  precioPorKg: number
  pesoKg: number
  redondeo?: "centavo" | "peso"
}) {
  if (input.precioPorKg <= 0) throw new Error("Precio por kg inválido")
  if (input.pesoKg <= 0) throw new Error("Peso inválido")

  const bruto = input.precioPorKg * input.pesoKg
  const total =
    input.redondeo === "peso"
      ? Math.round(bruto)
      : Math.round(bruto * 100) / 100

  return {
    precioPorKg: input.precioPorKg,
    pesoKg: input.pesoKg,
    total,
    descripcion: `${input.pesoKg.toLocaleString("es-AR", { minimumFractionDigits: 3 })} kg`,
  }
}

export function etiquetaBalanza(nombre: string, pesoKg: number, total: number) {
  return `${nombre} — ${pesoKg.toFixed(3)} kg — $${total.toLocaleString("es-AR")}`
}

/**
 * Parser EAN-13 de balanzas para puestos de frutas, verduras y carnicerías.
 * Estándar AR: 20 + PLU(4d) + Monto/Peso(5d) + Checksum(1d)
 */
export function parseEanBalanza(barcode: string, precioPorKgBase?: number) {
  const clean = barcode.trim()
  if (clean.length !== 13 || (!clean.startsWith("20") && !clean.startsWith("28"))) {
    return { esBalanza: false }
  }

  const plu = clean.substring(2, 6)
  const valorRaw = parseInt(clean.substring(6, 11), 10)
  const valorDecimal = valorRaw / 100 // Convertir centavos a pesos ARS

  let pesoEstimadoKg: number | undefined = undefined
  if (precioPorKgBase && precioPorKgBase > 0) {
    pesoEstimadoKg = Math.round((valorDecimal / precioPorKgBase) * 1000) / 1000
  }

  return {
    esBalanza: true,
    plu,
    montoPesos: valorDecimal,
    pesoEstimadoKg,
  }
}