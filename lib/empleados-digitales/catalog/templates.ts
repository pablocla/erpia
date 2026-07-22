import {
  DEFAULT_LEO_CONFIG,
  LEO_COBRANZA_CODE,
  LEO_COBRANZA_SKU,
  type EmpleadoLeoCobranzaConfig,
} from "../types"

export type EmpleadoTemplateDef = {
  code: string
  nombre: string
  lema: string
  descripcion: string
  categoria: string
  icono: string
  sku: string
  dependeDe: string[]
  tools: string[]
  playbookKeys: string[]
  llmAgentId: string | null
  cronDefault: string
  politicaDefault: EmpleadoLeoCobranzaConfig
  dashboardPath: string
  precioArs: number
}

/** Catálogo en código (seed a DB on activate si falta template row) */
export const EMPLEADO_TEMPLATES: EmpleadoTemplateDef[] = [
  {
    code: LEO_COBRANZA_CODE,
    nombre: "Leo Cobranza",
    lema: "Te prepara los WhatsApp de cobranza; vos solo aprobás.",
    descripcion:
      "Empleado digital híbrido: escanea deudas vencidas, prioriza por aging/monto, genera recordatorios (80% plantilla / 20% LLM) y deja borradores de WhatsApp para aprobación humana.",
    categoria: "cobranza",
    icono: "banknote",
    sku: LEO_COBRANZA_SKU,
    dependeDe: ["com.whatsapp"],
    tools: [
      "leer_deudas",
      "generar_recordatorio",
      "enviar_wa_borrador",
      "enviar_wa_aprobado",
      "actualizar_estado",
      "personalizar_mensaje_llm",
    ],
    playbookKeys: ["leo_scan_deudas", "leo_draft_wa", "leo_resumen_dueno"],
    llmAgentId: "cobranzas",
    cronDefault: "0 10 * * 1-5",
    politicaDefault: DEFAULT_LEO_CONFIG,
    dashboardPath: "/dashboard/empleados-digitales/leo_cobranza",
    precioArs: 15_000,
  },
]

export function getTemplateByCode(code: string): EmpleadoTemplateDef | undefined {
  return EMPLEADO_TEMPLATES.find((t) => t.code === code)
}

export function getTemplateBySku(sku: string): EmpleadoTemplateDef | undefined {
  return EMPLEADO_TEMPLATES.find((t) => t.sku === sku)
}
