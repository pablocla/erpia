export function translateAfipError(error: any): string {
  if (!error) return "Error desconocido al comunicarse con AFIP."

  const errorMessage = typeof error === "string" ? error : (error.message || JSON.stringify(error))
  const lowerMsg = errorMessage.toLowerCase()

  if (lowerMsg.includes("computador no autorizado") || lowerMsg.includes("autorizacion")) {
    return "AFIP rechazó la conexión. Verificá que los certificados estén al día y el CUIT sea el correcto."
  }
  
  if (lowerMsg.includes("cuit") && lowerMsg.includes("no registrado")) {
    return "El CUIT del cliente no está registrado en AFIP o es inválido."
  }

  if (lowerMsg.includes("fecha") && lowerMsg.includes("posterior")) {
    return "La fecha del comprobante no puede ser posterior a la fecha actual (o hay un error de sincronización de reloj)."
  }

  if (lowerMsg.includes("comprobante") && (lowerMsg.includes("ya existe") || lowerMsg.includes("registrado"))) {
    return "El número de comprobante ya se encuentra registrado en AFIP para este punto de venta."
  }
  
  if (lowerMsg.includes("token") || lowerMsg.includes("sign") || lowerMsg.includes("expirado")) {
    return "La sesión con AFIP expiró o el certificado es inválido. Volvé a intentarlo."
  }

  if (lowerMsg.includes("servicio") && lowerMsg.includes("no disponible")) {
    return "Los servidores de AFIP no están disponibles en este momento. Intentá de nuevo más tarde."
  }

  // Fallback genérico sacando la mugre técnica si es posible
  const match = errorMessage.match(/ErrCode: (\d+), ErrMsg: (.*?)(?:\n|$)/)
  if (match) {
    return `Error AFIP: ${match[2]} (Código ${match[1]})`
  }

  return `Error de AFIP: ${errorMessage.substring(0, 150)}...`
}
