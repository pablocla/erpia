import { resolverLinkPagoDeudor } from "@/lib/mercadopago/deudor-pago-link"

/** Genera link MercadoPago si MP está activo y/o SKU fiscal.clavpay_link */
export async function resolverLinkPagoFiado(input: {
  empresaId: number
  clienteId: number
  clienteNombre: string
  monto: number
  facturaId: number
  cuentaCobrarId?: number
  emailPagador?: string | null
}): Promise<string | null> {
  return resolverLinkPagoDeudor({
    empresaId: input.empresaId,
    clienteId: input.clienteId,
    clienteNombre: input.clienteNombre,
    monto: input.monto,
    titulo: `Fiado ${input.clienteNombre}`,
    facturaId: input.facturaId,
    cuentaCobrarId: input.cuentaCobrarId,
    emailPagador: input.emailPagador,
  })
}