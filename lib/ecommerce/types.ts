export type MedioPagoEcommerce = "mercadopago" | "transferencia" | "confirmar_sin_pago"

export interface MediosPagoConfig {
  mercadopago: boolean
  transferencia: boolean
  confirmarSinPago: boolean
}

export const MEDIOS_PAGO_DEFAULT: MediosPagoConfig = {
  mercadopago: true,
  transferencia: true,
  confirmarSinPago: true,
}

export interface TiendaPublicConfig {
  empresaId: number
  slug: string
  nombreTienda: string
  logoUrl: string | null
  colorPrimario: string | null
  mediosPago: MediosPagoConfig
  textoEnvio: string | null
  textoFooter: string | null
}

export interface TransferenciaInstrucciones {
  cbu: string | null
  alias: string | null
  titular: string | null
  monto: number
  referencia: string
  mensaje: string
}

export interface CheckoutLineaInput {
  productoId: number
  cantidad: number
}

export interface CheckoutClienteInput {
  nombre: string
  email?: string | null
  telefono?: string | null
  direccion?: string | null
  direccionComplemento?: string | null
  codigoPostal?: string | null
  dni?: string | null
  cuit?: string | null
}

export interface CheckoutInput {
  empresaId: number
  canalVentaId?: number
  canalVentaCodigo?: string
  observaciones?: string
  fechaEntregaEst?: string
  /** @deprecated Usar medioPago: "confirmar_sin_pago" */
  autoConfirmar?: boolean
  medioPago?: MedioPagoEcommerce
  cliente: CheckoutClienteInput
  lineas: CheckoutLineaInput[]
}

export interface CheckoutResult {
  pedido: {
    id: number
    numero: string
    estado: string
    total: number
  }
  pago?: {
    tipo: MedioPagoEcommerce
    initPoint?: string
    transferencia?: TransferenciaInstrucciones
  }
}