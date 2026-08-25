/**
 * Códigos de Condición IVA del receptor (tabla AFIP WSFE).
 * Campo CondicionIVAReceptor en FECAEDetRequest (RG / manuales recientes).
 */

export const CONDICION_IVA_RECEPTOR_AFIP = {
  RI: 1,
  EXENTO: 4,
  CF: 5,
  MONOTRIBUTO: 6,
  NO_CATEGORIZADO: 7,
  PROVEEDOR_EXTERIOR: 8,
  CLIENTE_EXTERIOR: 9,
  IVA_LIBERADO: 10,
  MONOTRIBUTO_SOCIAL: 13,
  IVA_NO_ALCANZADO: 15,
  MONOTRIBUTO_PROMOVIDO: 16,
} as const

/**
 * Mapea texto libre / labels del ERP a código AFIP de condición IVA receptor.
 */
export function mapCondicionIvaReceptor(condicion?: string | null): number {
  if (!condicion) return CONDICION_IVA_RECEPTOR_AFIP.CF

  const n = condicion
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/_/g, " ")
    .trim()

  if (
    n.includes("responsable inscripto") ||
    n === "ri" ||
    n.includes("iva ri") ||
    n === "1"
  ) {
    return CONDICION_IVA_RECEPTOR_AFIP.RI
  }
  if (n.includes("exento") || n === "4") {
    return CONDICION_IVA_RECEPTOR_AFIP.EXENTO
  }
  if (
    n.includes("monotributo social") ||
    n.includes("monotributista social") ||
    n === "13"
  ) {
    return CONDICION_IVA_RECEPTOR_AFIP.MONOTRIBUTO_SOCIAL
  }
  if (
    n.includes("monotribut") ||
    n.includes("rs") ||
    n === "6" ||
    n.includes("regimen simplificado")
  ) {
    return CONDICION_IVA_RECEPTOR_AFIP.MONOTRIBUTO
  }
  if (n.includes("no categori") || n === "7") {
    return CONDICION_IVA_RECEPTOR_AFIP.NO_CATEGORIZADO
  }
  if (n.includes("proveedor del exterior") || n === "8") {
    return CONDICION_IVA_RECEPTOR_AFIP.PROVEEDOR_EXTERIOR
  }
  if (
    n.includes("cliente del exterior") ||
    n.includes("exportacion") ||
    n.includes("exterior") ||
    n === "9"
  ) {
    return CONDICION_IVA_RECEPTOR_AFIP.CLIENTE_EXTERIOR
  }
  if (n.includes("liberado") || n.includes("19.640") || n === "10") {
    return CONDICION_IVA_RECEPTOR_AFIP.IVA_LIBERADO
  }
  if (n.includes("no alcanzado") || n === "15") {
    return CONDICION_IVA_RECEPTOR_AFIP.IVA_NO_ALCANZADO
  }
  if (n.includes("promovido") || n === "16") {
    return CONDICION_IVA_RECEPTOR_AFIP.MONOTRIBUTO_PROMOVIDO
  }
  if (
    n.includes("consumidor final") ||
    n === "cf" ||
    n === "5" ||
    n.includes("final")
  ) {
    return CONDICION_IVA_RECEPTOR_AFIP.CF
  }

  return CONDICION_IVA_RECEPTOR_AFIP.CF
}

/** Coherencia básica tipo factura vs condición receptor */
export function validarTipoCbteVsCondicion(
  tipoCbte: number,
  condicionCodigo: number,
): string | null {
  // Factura A (1,2,3,51…) y FCE A → RI
  const esA = [1, 2, 3, 51, 52, 53, 201, 202, 203].includes(tipoCbte)
  if (esA && condicionCodigo !== CONDICION_IVA_RECEPTOR_AFIP.RI) {
    return `Factura A requiere receptor Responsable Inscripto (código 1), recibido ${condicionCodigo}`
  }

  // Factura C / FCE C → monotributo o exento típico
  const esC = [11, 12, 13, 211, 212, 213].includes(tipoCbte)
  if (
    esC &&
    condicionCodigo === CONDICION_IVA_RECEPTOR_AFIP.RI
  ) {
    return "Factura C no corresponde a receptor Responsable Inscripto"
  }

  // Exportación E
  const esE = [19, 20, 21].includes(tipoCbte)
  if (esE && condicionCodigo !== CONDICION_IVA_RECEPTOR_AFIP.CLIENTE_EXTERIOR) {
    // no bloqueante duro: muchos usan CF exterior; solo warning vía null
    return null
  }

  return null
}
