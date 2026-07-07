export type MedioPagoTipo = "efectivo" | "transferencia" | "cheque" | "tarjeta"

export interface MedioPagoLinea {
  tipo: MedioPagoTipo
  monto: number
  referencia?: string
}

export function normalizarMediosPago(input: {
  medioPago?: MedioPagoTipo
  montoNeto: number
  medios?: MedioPagoLinea[]
}): MedioPagoLinea[] {
  if (input.medios && input.medios.length > 0) {
    const total = round2(input.medios.reduce((s, m) => s + m.monto, 0))
    if (Math.abs(total - input.montoNeto) > 0.02) {
      throw new Error(
        `La suma de medios (${total}) debe coincidir con el neto a cobrar/pagar (${input.montoNeto})`,
      )
    }
    return input.medios
  }

  if (!input.medioPago) {
    throw new Error("Indicá medio de pago o lista de medios")
  }

  return [{ tipo: input.medioPago, monto: input.montoNeto }]
}

function round2(n: number): number {
  return Math.round(n * 100) / 100
}