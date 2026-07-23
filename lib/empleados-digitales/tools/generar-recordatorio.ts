/** Plantillas es-AR — 0 tokens · ED-04 CTA Mercado Pago */

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

  const cta = input.linkPago?.trim()
    ? input.tono === "cercano"
      ? `\n\n💳 Pagá acá (Mercado Pago):\n${input.linkPago.trim()}\nAl pagar se acredita en tu cuenta.`
      : `\n\nLink de pago Mercado Pago:\n${input.linkPago.trim()}\nEl pago se registra automáticamente.`
    : ""

  if (input.tono === "cercano") {
    const base =
      `Hola ${input.nombreCliente}! Te escribe ${input.nombreComercio}. ` +
      `Tenés un saldo pendiente de ${monto} (hace ${input.dias} días).`
    if (cta) return `${base}${cta}\nGracias!`
    return `${base} Cuando puedas pasá o escribinos para regularizar. Gracias!`
  }

  const base =
    `Estimado/a ${input.nombreCliente}: le recordamos desde ${input.nombreComercio} ` +
    `un saldo pendiente de ${monto}, con ${input.dias} días de atraso.`
  if (cta) return `${base}${cta}\nAnte cualquier consulta, quedamos a disposición.`
  return `${base} Ante cualquier consulta, quedamos a disposición.`
}
