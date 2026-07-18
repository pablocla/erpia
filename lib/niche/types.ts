export type NicheEngine = "movimientos" | "cuotas" | "consorcio" | "agenda" | "libreta"

export interface NicheAppDefinition {
  appId: string
  sku: string
  nombre: string
  emoji: string
  lema: string
  dolorResuelve: string
  wowMoment: string
  engine: NicheEngine
  goldenPath: string
  precioArs: number
  categorias: string[]
  /** Etiqueta del botón de acción principal */
  accionPrincipal: string
  /** Plantilla WhatsApp masivo ({{nombre}}, {{monto}}, {{concepto}}) */
  plantillaWhatsApp?: string
  redirectPath?: string
  badge?: string
}

export interface NicheResumen {
  total: number
  pendientes: number
  pagados: number
  montoPendiente: number
  montoTotal: number
}