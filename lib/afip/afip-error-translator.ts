/**
 * Traducción de errores/observaciones AFIP a mensajes claros para el usuario.
 * Incluye códigos frecuentes de WSFE / WSAA.
 */

const CODIGOS_OFICIALES: Record<string, string> = {
  "600": "Validación: error general de datos del comprobante.",
  "602": "No existe el tipo de comprobante informado.",
  "10016": "El campo DocNro es inválido o no corresponde al DocTipo.",
  "10048": "El importe total no coincide con la suma de los conceptos.",
  "10047": "La suma de bases e IVA no cierra con ImpNeto/ImpIVA.",
  "10070": "Fecha de comprobante fuera del rango permitido.",
  "10242": "CondicionIVAReceptor inválida o no informada.",
  "10013": "CUIT del receptor inválido.",
  "10015": "El punto de venta no está habilitado para este tipo de emisión.",
  "1502": "Token o Sign inválido/expirado. Reautenticá con WSAA.",
  "500": "Error interno del servidor AFIP. Reintentá más tarde.",
  "501": "Error de base de datos AFIP. Reintentá más tarde.",
}

function extractCodes(errorMessage: string): string[] {
  const codes: string[] = []
  const re = /(?:ErrCode|Code|Codigo|código)\s*[:=]?\s*(\d+)/gi
  let m: RegExpExecArray | null
  while ((m = re.exec(errorMessage)) !== null) {
    codes.push(m[1])
  }
  // JSON style {"Code":123}
  const re2 = /"Code"\s*:\s*(\d+)/g
  while ((m = re2.exec(errorMessage)) !== null) {
    codes.push(m[1])
  }
  return [...new Set(codes)]
}

export function translateAfipError(error: unknown): string {
  if (!error) return "Error desconocido al comunicarse con AFIP."

  const errorMessage =
    typeof error === "string"
      ? error
      : error instanceof Error
        ? error.message
        : JSON.stringify(error)

  const codes = extractCodes(errorMessage)
  const translatedCodes = codes
    .map((c) => (CODIGOS_OFICIALES[c] ? `[${c}] ${CODIGOS_OFICIALES[c]}` : null))
    .filter(Boolean) as string[]

  if (translatedCodes.length > 0) {
    return `AFIP: ${translatedCodes.join(" · ")}`
  }

  const lowerMsg = errorMessage.toLowerCase()

  if (
    lowerMsg.includes("computador no autorizado") ||
    lowerMsg.includes("autorizacion")
  ) {
    return "AFIP rechazó la conexión. Verificá que los certificados estén al día y el CUIT sea el correcto."
  }

  if (lowerMsg.includes("cuit") && lowerMsg.includes("no registrado")) {
    return "El CUIT del cliente no está registrado en AFIP o es inválido."
  }

  if (lowerMsg.includes("fecha") && lowerMsg.includes("posterior")) {
    return "La fecha del comprobante no puede ser posterior a la fecha actual (o hay un error de sincronización de reloj)."
  }

  if (
    lowerMsg.includes("comprobante") &&
    (lowerMsg.includes("ya existe") || lowerMsg.includes("registrado"))
  ) {
    return "El número de comprobante ya se encuentra registrado en AFIP para este punto de venta."
  }

  if (
    lowerMsg.includes("token") ||
    lowerMsg.includes("sign") ||
    lowerMsg.includes("expirado")
  ) {
    return "La sesión con AFIP expiró o el certificado es inválido. Volvé a intentarlo."
  }

  if (lowerMsg.includes("servicio") && lowerMsg.includes("no disponible")) {
    return "Los servidores de AFIP no están disponibles en este momento. Intentá de nuevo más tarde."
  }

  if (lowerMsg.includes("wsfex")) {
    return `Error WSFEX (exportación): ${errorMessage.substring(0, 180)}`
  }

  const match = errorMessage.match(/ErrCode:\s*(\d+),\s*ErrMsg:\s*(.*?)(?:\n|$)/)
  if (match) {
    const known = CODIGOS_OFICIALES[match[1]]
    return known
      ? `Error AFIP [${match[1]}]: ${known} — ${match[2]}`
      : `Error AFIP: ${match[2]} (Código ${match[1]})`
  }

  return `Error de AFIP: ${errorMessage.substring(0, 200)}`
}

/** Observaciones que no impiden CAE (Resultado A con Obs) */
export function formatAfipObservaciones(obs: unknown): string {
  if (!obs) return ""
  try {
    const o = typeof obs === "string" ? JSON.parse(obs) : obs
    const arr = Array.isArray(o)
      ? o
      : (o as { Obs?: unknown }).Obs
        ? Array.isArray((o as { Obs: unknown }).Obs)
          ? (o as { Obs: unknown[] }).Obs
          : [(o as { Obs: unknown }).Obs]
        : [o]
    return arr
      .map((item) => {
        const it = item as { Code?: number; Msg?: string }
        const code = it.Code != null ? String(it.Code) : ""
        const known = code ? CODIGOS_OFICIALES[code] : undefined
        return known
          ? `[${code}] ${known}${it.Msg ? ` (${it.Msg})` : ""}`
          : it.Msg || JSON.stringify(item)
      })
      .join("; ")
  } catch {
    return String(obs)
  }
}
