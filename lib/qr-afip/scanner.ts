export interface FacturaAfipQR {
  ver: number
  fecha: string
  cuit: number
  ptoVta: number
  tipoCmp: number
  nroCmp: number
  importe: number
  moneda: string
  ctz: number
  tipoDocRec: number
  nroDocRec: number
  tipoCodAut: "E" | "A"
  codAut: number
}

/**
 * Parsea el texto devuelto por un escáner QR que lee el código estándar de AFIP.
 * El código suele ser una URL: https://www.afip.gob.ar/fe/qr/?p=BASE64
 */
export function parseAfipQR(qrText: string): FacturaAfipQR | null {
  try {
    let payload = qrText
    // Si es una URL completa, extraer el parámetro 'p'
    if (qrText.includes("afip.gob.ar/fe/qr")) {
      const url = new URL(qrText)
      const p = url.searchParams.get("p")
      if (p) payload = p
    }

    // El payload está en Base64
    const decoded = atob(payload)
    const data = JSON.parse(decoded) as FacturaAfipQR
    
    // Validación mínima para asegurarnos que es un ticket AFIP
    if (data.cuit && data.nroCmp && data.importe !== undefined) {
      return data
    }
    
    return null
  } catch (error) {
    console.error("Error parseando QR de AFIP:", error)
    return null
  }
}
