/**
 * Mapa de traducción comercial de SKUs internos → etiquetas amigables (es-AR).
 * Usado en App Store / Mis Módulos / toasts de licencias.
 * GAP-05 del documento de auditoría integral.
 */

export const FRIENDLY_SKU_NAMES: Record<string, string> = {
  // Seguridad & datos
  "sec.backup": "Respaldos Automáticos",
  "sec.mfa": "Seguridad 2FA",
  "sec.backup+sec.mfa": "Respaldo y Seguridad",
  "data.reportes_prog": "Reportes Programados",
  "data.export_masivo": "Exportación Masiva",

  // Comunicaciones & cobranzas
  "com.whatsapp": "Avisos WhatsApp",
  "channel.whatsapp": "WhatsApp Business",
  "intang.cobranzas_wa": "Leo Cobranza (Cobranzas WA)",
  "empleado.leo_cobranza": "Leo Cobranza",
  "pos.fiado_barrio": "Fiado Digital + Avisos WhatsApp",
  "bundle.comunica": "Pack Comunicaciones",

  // Agenda / turnos
  "agenda.confirmaciones": "Claver Confirmá — Turnos",
  "scheduling.confirm_wa": "Confirmación de Turnos WhatsApp",

  // Nichos
  "niche.consorcios": "Gestión Consorcios",
  "niche.consordos": "Gestión Consorcios",
  "niche.inmo_garantia": "Garantías Alquileres",
  "niche.feria_puesto": "Feriantes y Puestos",
  "niche.tintoreria": "Tintorerías",
  "niche.veterinaria": "Veterinaria",
  "niche.peluqueria": "Peluquería",

  // Intangibles Premium
  "intang.liquidacion_pagos": "Liquidación Pagos MP",
  "intang.recuperador_fiscal": "Recuperador Fiscal",
  "intang.guardian_pos": "Guardián POS",
  "intang.reactivador_clientes": "Reactivación Clientes",
  "intang.reponedor_jit": "Reposición Inteligente",
  "intang.ocr_compras": "Lector OCR Facturas",
  "intang.ruteador_entregas": "Ruteador Entregas",

  // POS / Retail
  "pos.margen_guard": "Protección de Margen",
  "pos.zero_waste": "Control de Merma",
  "pos.stock_cero_alert": "Alerta Stock Cero",
  "pos.promos_pago": "Promos Medios de Pago",
  "pos.lista_distribuidores": "Precios Distribuidor",
  "pos.arqueo_ciego": "Arqueo Ciego de Caja",
  "pos.vale_dinero": "Vales de Dinero",
  "pos.envases_gaseosas": "Control Envases",
  "pos.balanza_peso": "Balanza de Peso",
  "pos.recargas_servicios": "Recargas y Servicios",
  "pos.promos_cantidad": "Promos por Cantidad",
  "pos.ticket_regalo": "Ticket Regalo",

  // Fiscal / integraciones
  "fiscal.clavpay_link": "Links de Pago ClavPay",
  "channel.mercadopago": "Mercado Pago",
  "channel.mercadolibre": "Mercado Libre",
  "bridge.opo_studio": "Puente OPO / SQL",
  "impl.parametrizacion_remota": "Parametrización Remota",
  "core.ia": "Asistente IA",
  "core.claver": "Claver Core",
  "automation.n8n_hub": "Automatización n8n",
  "sheets.lite": "Clav Sheets Lite",
  "sheets.pro": "Clav Sheets Pro",
}

/** Combos frecuentes que deben mostrarse como una sola etiqueta comercial */
const COMPOSITE_SKU_GROUPS: Array<{ skus: string[]; label: string }> = [
  {
    skus: ["sec.backup", "sec.mfa"],
    label: "Respaldo y Seguridad",
  },
  {
    skus: ["pos.fiado_barrio", "com.whatsapp"],
    label: "Fiado Digital + Avisos WhatsApp",
  },
  {
    skus: ["pos.fiado_barrio", "channel.whatsapp"],
    label: "Fiado Digital + Avisos WhatsApp",
  },
  {
    skus: ["pos.fiado_barrio", "intang.cobranzas_wa"],
    label: "Fiado Digital + Claver Cobrá",
  },
]

/**
 * Traduce un SKU técnico a nombre comercial.
 * Si no hay mapeo, devuelve el SKU original (sin romper UI).
 */
export function friendlySkuLabel(sku: string): string {
  const key = sku.trim()
  if (!key) return sku
  return FRIENDLY_SKU_NAMES[key] ?? FRIENDLY_SKU_NAMES[key.toLowerCase()] ?? key
}

/**
 * Lista de SKUs → etiquetas amigables, colapsando combos conocidos.
 */
export function friendlySkuLabels(skus?: string[] | null): string[] {
  if (!skus?.length) return []

  const remaining = new Set(skus.map((s) => s.trim()).filter(Boolean))
  const labels: string[] = []

  for (const group of COMPOSITE_SKU_GROUPS) {
    if (group.skus.every((s) => remaining.has(s))) {
      labels.push(group.label)
      for (const s of group.skus) remaining.delete(s)
    }
  }

  for (const sku of remaining) {
    labels.push(friendlySkuLabel(sku))
  }

  return labels
}
