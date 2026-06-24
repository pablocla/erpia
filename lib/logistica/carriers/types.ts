export type CarrierId = "andreani" | "oca" | "correo_argentino"

export interface CotizacionInput {
  empresaId: number
  cpOrigen: string
  cpDestino: string
  pesoKg: number
  bultos?: number
  valorDeclarado?: number
}

export interface CotizacionResult {
  carrierId: CarrierId
  carrierNombre: string
  servicio: string
  precio: number
  plazoEntregaDias?: number
  moneda: string
}

export interface CrearEnvioInput {
  empresaId: number
  pedidoVentaId?: number
  remitoId?: number
  destinatario: {
    nombre: string
    email?: string
    telefono?: string
    direccion: string
    localidad?: string
    provincia?: string
    cp: string
  }
  pesoKg: number
  bultos?: number
  valorDeclarado?: number
  observaciones?: string
}

export interface CrearEnvioResult {
  ok: boolean
  carrierId: CarrierId
  tracking?: string
  etiquetaUrl?: string
  costo?: number
  envioId?: number
  error?: string
}

export interface TrackingResult {
  carrierId: CarrierId
  tracking: string
  estado: string
  descripcion?: string
  actualizadoAt?: string
}

export interface CarrierAdapter {
  id: CarrierId
  nombre: string
  cotizar(input: CotizacionInput, credenciales: Record<string, string>): Promise<CotizacionResult | null>
  crearEnvio(input: CrearEnvioInput, credenciales: Record<string, string>): Promise<CrearEnvioResult>
  consultarTracking(tracking: string, credenciales: Record<string, string>): Promise<TrackingResult | null>
  testConnection(credenciales: Record<string, string>): Promise<{ ok: boolean; mensaje: string }>
}