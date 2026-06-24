import { FEATURES } from "@/lib/config/rubro-config-service"

/** SKU comercial → feature técnica NOP */
export const SKU_TO_FEATURE: Record<string, string> = {
  "core.clavis": "core",
  "core.clavis_industria": "core_industria",
  "bundle.tienda_conectada": "integrations_tienda",
  "bundle.marketplace_ml": FEATURES.MERCADO_LIBRE,
  "bundle.multicanal_ar": "integrations_multicanal",
  "bundle.envios_ar": "integrations_logistica",
  "bundle.comunica": FEATURES.WHATSAPP_BUSINESS,
  "bundle.industria": "industria_mrp",
  "bundle.operacion_completa": "integrations_operacion_completa",
  "automation.n8n_hub": FEATURES.AUTOMATION_N8N,
  "channel.mercadopago": "mercadopago",
  "channel.mercadolibre": FEATURES.MERCADO_LIBRE,
  "channel.whatsapp": FEATURES.WHATSAPP_BUSINESS,
  "ops.morning_commander": FEATURES.AGENTES_IA,
  "sheets.lite": FEATURES.CLAV_SHEETS,
  "sheets.pro": FEATURES.CLAV_SHEETS,
}

export const AUTOMATION_SKU = "automation.n8n_hub"
export const SHEETS_LITE_SKU = "sheets.lite"
export const SHEETS_PRO_SKU = "sheets.pro"