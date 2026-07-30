export type UnidadFraccionada = "m" | "m2" | "kg" | "g" | "l" | "unidad"

export interface CalculoUnidadFraccionadaInput {
  unidadBase: UnidadFraccionada
  precioBase: number
  cantidadSolicitada: number
  mermaPorcentaje?: number
}

export interface CalculoUnidadFraccionadaResult {
  cantidadFinal: number
  mermaCantidad: number
  precioUnitarioFinal: number
  precioTotal: number
  descripcionVenta: string
}

/**
 * Calcula el precio y descuento de stock para insumos vendidos por fraccionamiento o metraje
 * incluyendo porcentaje de merma por corte (ej. perfiles, chapas, madera).
 */
export function calcularVentaFraccionada(
  input: CalculoUnidadFraccionadaInput,
): CalculoUnidadFraccionadaResult {
  const mermaPct = Math.max(0, input.mermaPorcentaje || 0)
  const mermaCantidad = input.cantidadSolicitada * (mermaPct / 100)
  const cantidadFinal = input.cantidadSolicitada + mermaCantidad
  const precioTotal = cantidadFinal * input.precioBase

  let labelUnidad = input.unidadBase
  if (input.unidadBase === "m") labelUnidad = "mts"
  if (input.unidadBase === "m2") labelUnidad = "m²"

  const descripcionVenta = `${input.cantidadSolicitada} ${labelUnidad}${
    mermaPct > 0 ? ` (+${mermaPct}% merma de corte)` : ""
  }`

  return {
    cantidadFinal,
    mermaCantidad,
    precioUnitarioFinal: input.precioBase,
    precioTotal,
    descripcionVenta,
  }
}
