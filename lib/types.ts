export interface AFIPConfig {
  cuit: string
  puntoVenta: number
  certificadoCRT: string
  certificadoKEY: string
  entorno: "homologacion" | "produccion"
}

export interface FacturaPayload {
  cuit: string
  puntoVenta: number
  tipoCbte: number
  cliente: {
    nombre: string
    cuit?: string
    dni?: string
    condicionIva: string
  }
  items: {
    descripcion: string
    cantidad: number
    precioUnitario: number
    iva: number
    productoId?: number
    exento?: boolean
  }[]
  total: number
  remitoId?: number
  /** AFIP concepto: 1=Productos, 2=Servicios, 3=Productos y Servicios */
  concepto?: number
  /** Fecha inicio período de servicio (concepto >= 2) */
  fechaServicioDesde?: Date
  /** Fecha fin período de servicio (concepto >= 2) */
  fechaServicioHasta?: Date
  /** Fecha vencimiento de pago (concepto >= 2) */
  fechaVtoPago?: Date
  /** Optional: jurisdicción IIBB principal ("PBA" | "CABA" | "SF" | "CBA" | "MZA") */
  jurisdiccion?: string
  /** Optional: emisor agent flags for full tax calculation */
  emisorAgente?: {
    esAgentePercepcionIVA?: boolean
    esAgentePercepcionIIBB?: boolean
  }
  /** RG 5616/2024: moneda de la operación (ISO: "PES", "DOL", "060") */
  moneda?: string
  /** RG 5616/2024: tipo de cambio vendedor BNA (obligatorio si moneda != PES) */
  tipoCambio?: number
}

export interface AFIPResponse {
  success: boolean
  facturaId?: number
  cae?: string
  fechaCAE?: string
  vencimientoCAE?: string
  qrBase64?: string
  numero?: number
  error?: string
}

export interface AsientoContableData {
  fecha: Date
  numero: number
  descripcion: string
  tipo: "venta" | "compra" | "manual"
  movimientos: {
    cuenta: string
    debe: number
    haber: number
  }[]
}

export interface ReporteIVA {
  periodo: string
  ivaVentas: {
    total: number
    base: number
    iva21: number
    iva105: number
    iva27: number
    totalPercepciones: number
  }
  ivaCompras: {
    total: number
    base: number
    iva21: number
    iva105: number
    iva27: number
    totalRetenciones: number
  }
  saldo: number
}
