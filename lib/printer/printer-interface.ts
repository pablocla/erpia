export interface PrinterConfig {
  id: number
  nombre: string
  tipo: "fiscal" | "ticket" | "a4"
  marca: "hasar" | "epson"
  modelo: string
  conexion: "usb" | "red"
  ip?: string
  puerto?: number
  activa: boolean
}

export interface TicketData {
  empresa: {
    nombre: string
    razonSocial: string
    cuit: string
    direccion: string
    puntoVenta: number
  }
  factura: {
    tipo: string
    numero: number
    fecha: Date
    cae: string
    vencimientoCAE: Date
  }
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
    total: number
  }[]
  totales: {
    subtotal: number
    iva: number
    total: number
  }
  qrBase64?: string
}

export interface PrinterResponse {
  success: boolean
  mensaje?: string
  error?: string
}
