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