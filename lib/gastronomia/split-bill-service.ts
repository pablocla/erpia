/**
 * Servicio de Gastronomía: División de Cuentas (Split Bill), Propinas y Comandas
 * Permite dividir el ticket de una mesa entre N comensales y enviar el desglose por WhatsApp.
 */

export interface SplitBillResult {
  totalMesa: number
  cantidadComensales: number
  montoPorPersona: number
  propinaSugerida10: number
  montoConPropinaPorPersona: number
  textoWhatsApp: string
}

export function calcularDivisionCuenta(params: {
  numeroMesa: number
  totalMesa: number
  comensales: number
  aliasOMercadoPago?: string
}): SplitBillResult {
  const { numeroMesa, totalMesa, comensales, aliasOMercadoPago } = params
  const cant = Math.max(1, comensales)
  const montoPorPersona = Math.round(totalMesa / cant)
  const propinaSugerida10 = Math.round(totalMesa * 0.10)
  const montoConPropinaPorPersona = Math.round((totalMesa + propinaSugerida10) / cant)

  let textoWhatsApp = `🍽️ *Mesa ${numeroMesa} — División de Cuenta*\n\n`
  textoWhatsApp += `💰 *Total Consumo:* $${totalMesa.toLocaleString("es-AR")}\n`
  textoWhatsApp += `👥 *Comensales:* ${cant} personas\n`
  textoWhatsApp += `👉 *Cada uno paga:* $${montoPorPersona.toLocaleString("es-AR")}\n`
  textoWhatsApp += `_Con propina sugerida (10%): $${montoConPropinaPorPersona.toLocaleString("es-AR")} c/u_\n`

  if (aliasOMercadoPago) {
    textoWhatsApp += `\n💳 *Transferir o pagar a:* ${aliasOMercadoPago}`
  }

  textoWhatsApp += `\n\n_Generado por Claver Gastronomía_`

  return {
    totalMesa,
    cantidadComensales: cant,
    montoPorPersona,
    propinaSugerida10,
    montoConPropinaPorPersona,
    textoWhatsApp,
  }
}
