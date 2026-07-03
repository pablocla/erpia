import type { TransferenciaInstrucciones } from "../types"

export function buildTransferenciaInstrucciones(input: {
  cbu: string | null
  alias: string | null
  titular: string | null
  monto: number
  numeroPedido: string
  pedidoId: number
}): TransferenciaInstrucciones {
  const referencia = `PED-${input.numeroPedido}`
  const partes: string[] = []
  if (input.alias) partes.push(`Alias: ${input.alias}`)
  if (input.cbu) partes.push(`CBU: ${input.cbu}`)
  if (input.titular) partes.push(`Titular: ${input.titular}`)

  const datos = partes.length > 0 ? partes.join(" · ") : "Contactá al comercio para datos bancarios"

  return {
    cbu: input.cbu,
    alias: input.alias,
    titular: input.titular,
    monto: input.monto,
    referencia,
    mensaje: `Transferí $${input.monto.toFixed(2)} e incluí la referencia ${referencia}. ${datos}`,
  }
}