export type NivelImplementacion = "completo" | "parcial" | "credenciales" | "proximamente"

export interface IntegrationMeta {
  nivel: NivelImplementacion
  webhookPath?: (empresaId: number) => string
  quickLinks?: Array<{ label: string; href: string }>
  oauthRequiereDominio?: boolean
  tips?: string[]
}

function appUrl(): string {
  return process.env.NEXT_PUBLIC_BASE_URL
    ?? process.env.NEXT_PUBLIC_APP_URL
    ?? "http://localhost:3000"
}

export const INTEGRATION_META: Record<string, IntegrationMeta> = {
  mercado_libre: {
    nivel: "completo",
    webhookPath: (id) => `${appUrl()}/api/webhooks/mercadolibre/${id}`,
    tips: [
      "El código del producto en el ERP debe coincidir con seller_custom_field en ML.",
      "Los pedidos entran como borrador en Ventas → Pedidos.",
    ],
  },
  tienda_nube: {
    nivel: "completo",
    webhookPath: (id) => `${appUrl()}/api/webhooks/tiendanube/${id}`,
    tips: [
      "El SKU de Tienda Nube debe coincidir con el código del producto en el ERP.",
      "Configurá TN_WEBHOOK_SECRET para validar notificaciones.",
    ],
  },
  shopify: {
    nivel: "completo",
    oauthRequiereDominio: true,
    webhookPath: (id) => `${appUrl()}/api/webhooks/shopify/${id}`,
    tips: [
      "Ingresá el dominio myshopify.com antes de conectar con OAuth.",
      "El SKU de Shopify debe coincidir con el código del producto en el ERP.",
    ],
  },
  woocommerce: {
    nivel: "completo",
    tips: [
      "Generá Consumer Key/Secret en WooCommerce → Ajustes → Avanzado → REST API.",
      "La URL debe ser la raíz del sitio (sin /wp-json).",
    ],
  },
  mercado_pago: {
    nivel: "parcial",
    quickLinks: [{ label: "Panel Mercado Pago", href: "/dashboard/mercadopago" }],
    tips: ["Checkout Pro, QR y conciliación automática con CxC."],
  },
  mercado_shops: {
    nivel: "proximamente",
    tips: ["Usá la integración de Mercado Libre — comparte la misma cuenta."],
  },
  whatsapp: {
    nivel: "parcial",
    quickLinks: [{ label: "Centro de Alertas", href: "/dashboard/centro-alertas" }],
    tips: ["Modo cloud (Meta) o Twilio vía variables de entorno del servidor."],
  },
  telegram: {
    nivel: "parcial",
    quickLinks: [{ label: "Config IA", href: "/dashboard/ia" }],
    tips: ["El bot se configura con TELEGRAM_BOT_TOKEN en el servidor."],
  },
  afip: {
    nivel: "completo",
    quickLinks: [
      { label: "Configuración Fiscal", href: "/dashboard/configuracion" },
      { label: "Estado AFIP", href: "/dashboard/facturas" },
    ],
  },
  n8n: { nivel: "parcial", tips: ["Guardá la URL del webhook n8n y probá conexión."] },
  zapier: { nivel: "parcial", tips: ["Usá un Catch Hook de Zapier como URL."] },
  make: { nivel: "parcial", tips: ["Creá un módulo Webhook custom en Make."] },
  stripe: { nivel: "proximamente" },
  vtex: { nivel: "proximamente" },
  amazon: { nivel: "proximamente" },
  hubspot: { nivel: "proximamente" },
  andreani: {
    nivel: "completo",
    tips: [
      "Cotización, etiqueta y tracking desde Logística o al despachar un pedido.",
      "Sin contrato Andreani funciona en modo sandbox para pruebas.",
      "Requiere usuario, password y N° de contrato.",
    ],
  },
  oca: {
    nivel: "completo",
    tips: [
      "OCA ePak: cotizar, generar guía y sincronizar tracking.",
      "Credenciales desde tu ejecutivo OCA comercial.",
    ],
  },
  correo_argentino: {
    nivel: "completo",
    tips: [
      "API PAQ.AR / Mi Correo para envíos nacionales.",
      "Registrate en Mi Correo y obtené API Key + User ID.",
    ],
  },
}

export function getIntegrationMeta(id: string): IntegrationMeta {
  return INTEGRATION_META[id] ?? { nivel: "proximamente" }
}

export const NIVEL_LABELS: Record<NivelImplementacion, { label: string; className: string }> = {
  completo: { label: "Sync real", className: "bg-emerald-500/15 text-emerald-700" },
  parcial: { label: "Credenciales OK", className: "bg-sky-500/15 text-sky-700" },
  credenciales: { label: "Solo credenciales", className: "bg-amber-500/15 text-amber-700" },
  proximamente: { label: "Próximamente", className: "bg-muted text-muted-foreground" },
}