/** Plantillas es-AR — 0 tokens */

export function plantillaCobranza(input: {
  nombreComercio: string
  nombreCliente: string
  monto: number
  dias: number
  linkPago?: string
  tono: "formal" | "cercano"
}): string {
  const monto = new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(input.monto)

  if (input.tono === "cercano") {
    return (
      `Hola ${input.nombreCliente}! Te escribe ${input.nombreComercio}. ` +
      `Tenés un saldo pendiente de ${monto} (hace ${input.dias} días). ` +
      (input.linkPago
        ? `Podés abonar acá: ${input.linkPago} `
        : `Cuando puedas pasá o escribinos para regularizar. `) +
      `Gracias!`
    )
  }

  return (
    `Estimado/a ${input.nombreCliente}: le recordamos desde ${input.nombreComercio} ` +
    `un saldo pendiente de ${monto}, con ${input.dias} días de atraso. ` +
    (input.linkPago ? `Link de pago: ${input.linkPago}. ` : "") +
    `Ante cualquier consulta, quedamos a disposición.`
  )
}
