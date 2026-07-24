/**
 * Helpers de valor real: copiar mensaje y abrir WhatsApp (wa.me) con teléfono AR.
 */

/** Normaliza teléfono a dígitos; asume AR (+54) si no trae código país. */
export function normalizePhoneAr(raw: string | null | undefined): string | null {
  if (!raw) return null
  let digits = raw.replace(/\D/g, "")
  if (digits.length < 8) return null
  // 15XXXXXXXX / 11XXXXXXXX locales → 549…
  if (digits.startsWith("54")) {
    // ok
  } else if (digits.startsWith("0")) {
    digits = `54${digits.slice(1)}`
  } else if (digits.length === 10 && digits.startsWith("15")) {
    digits = `549${digits.slice(2)}`
  } else if (digits.length === 10) {
    digits = `54${digits}`
  } else if (digits.length === 8 || digits.length === 9) {
    digits = `549${digits}`
  }
  // WhatsApp AR suele usar 549…
  if (digits.startsWith("54") && !digits.startsWith("549") && digits.length >= 12) {
    // 5411… → 54911…
    digits = `549${digits.slice(2)}`
  }
  return digits
}

export function buildWaMeUrl(phone: string | null | undefined, text: string): string | null {
  const n = normalizePhoneAr(phone)
  if (!n) return null
  return `https://wa.me/${n}?text=${encodeURIComponent(text)}`
}

export function formatCurrencyArs(v: number): string {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(v)
}

export function messageCobroCliente(opts: {
  nombre?: string | null
  saldo: number
  referencia: string
}): string {
  const name = opts.nombre?.trim() || "hola"
  return (
    `Hola ${name}, te escribo por el saldo pendiente de ${formatCurrencyArs(opts.saldo)} ` +
    `(${opts.referencia}). Cuando puedas abonarlo avisame y lo cancelamos. ¡Gracias!`
  )
}

export function messageCuotaVencida(opts: {
  nombre?: string | null
  plan?: string | null
  fechaFin?: string | null
}): string {
  const name = opts.nombre?.trim() || "hola"
  const plan = opts.plan ? ` del plan ${opts.plan}` : ""
  const venc = opts.fechaFin
    ? ` (vencía el ${new Date(opts.fechaFin).toLocaleDateString("es-AR")})`
    : ""
  return (
    `Hola ${name}, te escribo por la cuota${plan}${venc}. ` +
    `Cuando puedas regularizar avisame y te dejamos al día. ¡Gracias!`
  )
}

export function messageConfirmarTurno(opts: {
  nombre?: string | null
  fecha: string
  hora: string
  motivo?: string | null
}): string {
  const name = opts.nombre?.trim() || "hola"
  const fecha = new Date(opts.fecha).toLocaleDateString("es-AR", {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
  })
  const motivo = opts.motivo ? ` (${opts.motivo})` : ""
  return (
    `Hola ${name}, te confirmo tu turno el ${fecha} a las ${opts.hora}${motivo}. ` +
    `¿Me confirmás que venís? Respondé SI o NO. ¡Gracias!`
  )
}
