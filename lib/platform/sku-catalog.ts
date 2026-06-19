import { FEATURES } from "@/lib/config/rubro-config-service"

/** SKU comercial → feature técnica NOP */
export const SKU_TO_FEATURE: Record<string, string> = {
  "automation.n8n_hub": FEATURES.AUTOMATION_N8N,
  "channel.mercadopago": "mercadopago",
  "channel.mercadolibre": FEATURES.MERCADO_LIBRE,
  "channel.whatsapp": FEATURES.WHATSAPP_BUSINESS,
  "ops.morning_commander": FEATURES.AGENTES_IA,
}

export const AUTOMATION_SKU = "automation.n8n_hub"