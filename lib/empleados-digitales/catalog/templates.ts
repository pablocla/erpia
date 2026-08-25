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
    precioArs: 19_900,
  },
  {
    code: "sofia_turnos",
    nombre: "Sofía Turnos",
    lema: "Confirma y recuerda turnos de agenda por WhatsApp.",
    descripcion:
      "Empleado digital de agenda: recordatorios T-24h y T-2h, confirmación automática y prevención de no-shows.",
    categoria: "agenda",
    icono: "calendar",
    sku: "empleado.sofia_turnos",
    dependeDe: ["com.whatsapp"],
    tools: [
      "leer_turnos",
      "generar_recordatorio_turno",
      "enviar_wa_borrador",
      "enviar_wa_aprobado",
    ],
    playbookKeys: ["agenda_reminder"],
    llmAgentId: "agenda",
    cronDefault: "0 18 * * *",
    politicaDefault: DEFAULT_LEO_CONFIG,
    dashboardPath: "/dashboard/empleados-digitales/sofia_turnos",
    precioArs: 14_900,
  },
  {
    code: "ramiro_stock",
    nombre: "Ramiro Stock",
    lema: "Monitorea faltantes y prepara borradores de órdenes de compra.",
    descripcion:
      "Empleado digital de inventario: escanea productos bajo mínimo, calcula reposición (JIT) y arma borradores de OC para proveedores.",
    categoria: "deposito",
    icono: "package",
    sku: "empleado.ramiro_stock",
    dependeDe: ["com.whatsapp"],
    tools: [
      "leer_stock_bajo",
      "generar_orden_compra_borrador",
      "notificar_proveedor",
    ],
    playbookKeys: ["stock_bajo_tarea"],
    llmAgentId: "stock",
    cronDefault: "0 8 * * 1-5",
    politicaDefault: DEFAULT_LEO_CONFIG,
    dashboardPath: "/dashboard/empleados-digitales/ramiro_stock",
    precioArs: 14_900,
  },
  {
    code: "ana_reposicion",
    nombre: "Ana Reposición",
    lema: "Alertas de reposición interna y faltantes en góndola.",
    descripcion: "Worker digital de monitoreo continuo de inventario crítico en depósito.",
    categoria: "deposito",
    icono: "boxes",
    sku: "empleado.ana_reposicion",
    dependeDe: [],
    tools: ["leer_stock_bajo"],
    playbookKeys: ["stock_bajo_tarea"],
    llmAgentId: null,
    cronDefault: "0 8 * * 1-5",
    politicaDefault: DEFAULT_LEO_CONFIG,
    dashboardPath: "/dashboard/empleados-digitales/ana_reposicion",
    precioArs: 9_900,
  },
  {
    code: "clara_afip",
    nombre: "Clara Facturación",
    lema: "Reintento automático y alertas de comprobantes sin CAE.",
    descripcion: "Worker digital de contingencia fiscal AFIP y retry síncrono/asíncrono.",
    categoria: "fiscal",
    icono: "file-check",
    sku: "empleado.clara_afip",
    dependeDe: [],
    tools: ["retry_cae_pendientes"],
    playbookKeys: ["cae_fallido_retry"],
    llmAgentId: null,
    cronDefault: "0 8 * * 1-5",
    politicaDefault: DEFAULT_LEO_CONFIG,
    dashboardPath: "/dashboard/empleados-digitales/clara_afip",
    precioArs: 9_900,
  },
  {
    code: "pedro_picking",
    nombre: "Pedro Picking",
    lema: "Genera listas de picking para pedidos B2B y despachos.",
    descripcion: "Worker digital de logística y preparación de pedidos para despacho.",
    categoria: "deposito",
    icono: "truck",
    sku: "empleado.pedro_picking",
    dependeDe: [],
    tools: ["generar_picking_list"],
    playbookKeys: ["pedido_b2b_picking"],
    llmAgentId: null,
    cronDefault: "0 6 * * 1-6",
    politicaDefault: DEFAULT_LEO_CONFIG,
    dashboardPath: "/dashboard/empleados-digitales/pedro_picking",
    precioArs: 9_900,
  },
]

export function getTemplateByCode(code: string): EmpleadoTemplateDef | undefined {
  return EMPLEADO_TEMPLATES.find((t) => t.code === code)
}

export function getTemplateBySku(sku: string): EmpleadoTemplateDef | undefined {
  return EMPLEADO_TEMPLATES.find((t) => t.sku === sku)
}
