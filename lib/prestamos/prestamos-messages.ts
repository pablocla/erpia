import { fmtArs } from "./prestamos-meta"

/** Mensajes WhatsApp para prestamista de barrio (abre wa.me, sin API). */
export function mensajeRecordatorio(input: {
  cliente: string
  saldo: number
  empresaNombre: string
  fechaVencimiento?: string
}): string {
  const empresa = input.empresaNombre?.trim() || "nosotros"
  let msg = `Hola ${input.cliente}! Te hablo de ${empresa}.`
  msg += ` Te recuerdo que tenés un saldo pendiente de ${fmtArs(input.saldo)}.`
  if (input.fechaVencimiento) {
    msg += ` Vencimiento: ${formatFechaAr(input.fechaVencimiento)}.`
  }
  msg += ` Avisame cuando puedas pagar o si paso a buscar el efectivo. Gracias!`
  return msg
}

export function mensajeReciboCobro(input: {
  cliente: string
  monto: number
  saldoRestante: number
  empresaNombre: string
  medio?: string
}): string {
  const empresa = input.empresaNombre?.trim() || "nosotros"
  const medio =
    input.medio === "transferencia"
      ? "por transferencia"
      : input.medio === "efectivo"
        ? "en efectivo"
        : ""
  let msg = `Hola ${input.cliente}! Te confirmo que ${empresa} registró un cobro ${medio} de ${fmtArs(input.monto)}.`
  if (input.saldoRestante <= 0) {
    msg += ` Quedaste en cero. ¡Gracias!`
  } else {
    msg += ` Te quedan ${fmtArs(input.saldoRestante)}. Gracias!`
  }
  return msg
}

export function waMeUrl(telefono: string | undefined | null, texto: string): string {
  const clean = (telefono || "").replace(/\D/g, "")
  // Argentina: si tiene 10 dígitos y empieza con 11/15, prefijo 54
  let phone = clean
  if (phone.length === 10) phone = `54${phone}`
  if (phone.startsWith("15") && phone.length === 12) phone = `54${phone.slice(2)}`
  const q = encodeURIComponent(texto)
  return phone ? `https://wa.me/${phone}?text=${q}` : `https://wa.me/?text=${q}`
}

function formatFechaAr(iso: string): string {
  const [y, m, d] = iso.slice(0, 10).split("-")
  if (!y || !m || !d) return iso
  return `${d}/${m}/${y}`
}
