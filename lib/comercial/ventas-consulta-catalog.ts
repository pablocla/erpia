export const VENTAS_CONSULTA_TIPOS = ["contacto", "demo", "reunion"] as const

export type VentasConsultaTipo = (typeof VENTAS_CONSULTA_TIPOS)[number]

export const VENTAS_CONSULTA_TIPO_LABELS: Record<VentasConsultaTipo, string> = {
  contacto: "Consulta comercial",
  demo: "Pedido de demo",
  reunion: "Agendar reunión",
}

export const VENTAS_CONSULTA_ORIGENES = [
  "web",
  "web_contacto",
  "web_modulos",
  "web_ecommerce",
  "web_claverp",
  "web_matrix",
  "whatsapp",
  "calle",
] as const

export type VentasConsultaOrigen = (typeof VENTAS_CONSULTA_ORIGENES)[number]