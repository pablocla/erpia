import { getCuentaLabel } from "@/lib/config/parametro-service"

export type MedioPagoCobro = "efectivo" | "transferencia" | "cheque" | "tarjeta"
export type MedioPagoPago = "transferencia" | "cheque" | "efectivo" | "tarjeta"

/**
 * Resuelve la cuenta contable del DEBE en un cobro según medio de pago.
 */
export async function resolveCuentaCobro(empresaId: number, medioPago: MedioPagoCobro): Promise<string> {
  const [ctaCaja, ctaBanco, ctaCheques] = await Promise.all([
    getCuentaLabel(empresaId, "cobro", "caja", "1.1", "Caja"),
    getCuentaLabel(empresaId, "cobro", "banco", "1.2", "Banco Cuenta Corriente"),
    getCuentaLabel(empresaId, "cobro", "cheques_cartera", "1.1.5", "Cheques en Cartera"),
  ])

  if (medioPago === "efectivo") return ctaCaja
  if (medioPago === "cheque") return ctaCheques
  return ctaBanco
}

/**
 * Resuelve la cuenta contable del HABER en un pago según medio de pago.
 */
export async function resolveCuentaPago(empresaId: number, medioPago: MedioPagoPago): Promise<string> {
  const [ctaCaja, ctaBanco, ctaChequesPagar] = await Promise.all([
    getCuentaLabel(empresaId, "pago", "caja", "1.1", "Caja"),
    getCuentaLabel(empresaId, "pago", "banco", "1.2", "Banco Cuenta Corriente"),
    getCuentaLabel(empresaId, "pago", "cheques_a_pagar", "2.8", "Cheques a Pagar"),
  ])

  if (medioPago === "efectivo") return ctaCaja
  if (medioPago === "cheque") return ctaChequesPagar
  return ctaBanco
}