import { AlertTriangle, Clock, Sparkles, TrendingUp } from "lucide-react"

export interface ChatMessage {
  id?: number
  role: "user" | "assistant"
  content: string
  createdAt?: string
}

export const AI_QUICK_ACTIONS = [
  { label: "¿Cómo estoy hoy?", icon: Sparkles },
  { label: "¿Qué repongo?", icon: AlertTriangle },
  { label: "¿Quién me debe?", icon: Clock },
  { label: "Dame el reporte", icon: TrendingUp },
] as const

export const AI_CAN_DO = [
  "Resumir ventas, compras, caja y stock de tu empresa",
  "Detectar productos críticos y sugerir reposición",
  "Analizar clientes con deuda y priorizar cobranzas",
  "Generar alertas y borradores de mensajes WhatsApp",
  "Responder en español argentino con datos del ERP",
] as const

export const AI_CANNOT_DO = [
  "Emitir facturas AFIP ni modificar comprobantes fiscales",
  "Ejecutar pagos, transferencias o movimientos de caja",
  "Ver datos de otras empresas o información fuera del ERP",
  "Reemplazar asesoramiento contable, legal o impositivo",
] as const

export const AI_EXAMPLE_PROMPTS = [
  "¿Cuánto vendí este mes vs el anterior?",
  "¿Qué productos están por debajo del mínimo?",
  "¿Qué clientes tienen facturas vencidas?",
  "Resumime el estado de caja hoy",
] as const

export const AI_FOLLOW_UPS = [
  "¿Podés detallar eso?",
  "¿Qué acción recomendás?",
  "Mostrame los números clave",
] as const