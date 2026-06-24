/**
 * Paquete comercial unificado — Multi-canal Argentina
 * No es un microservicio: es la definición del bundle sobre la Integration Platform.
 */

export const PAQUETE_MULTICANAL_AR = {
  id: "paquete.multicanal_ar",
  sku: "bundle.multicanal_ar",
  nombre: "Paquete Multi-canal Argentina",
  tagline: "Todos los canales, un solo stock, un solo despacho",
  precioDesdeArs: 49_900,
  modulos: {
    canales: {
      label: "Canales de venta",
      items: [
        { id: "mercado_libre", nombre: "Mercado Libre", nivel: "completo", sync: ["publicaciones", "pedidos", "stock"] },
        { id: "tienda_nube", nombre: "Tienda Nube", nivel: "completo", sync: ["productos", "pedidos", "stock"] },
        { id: "shopify", nombre: "Shopify", nivel: "completo", sync: ["productos", "pedidos", "stock"] },
        { id: "woocommerce", nombre: "WooCommerce", nivel: "completo", sync: ["productos", "pedidos", "stock"] },
        { id: "mercado_shops", nombre: "Mercado Shops", nivel: "proximamente", sync: [] },
        { id: "vtex", nombre: "VTEX", nivel: "proximamente", sync: [] },
      ],
    },
    pagos: {
      label: "Pagos",
      items: [
        { id: "mercado_pago", nombre: "Mercado Pago", nivel: "parcial" },
        { id: "stripe", nombre: "Stripe", nivel: "proximamente" },
      ],
    },
    logistica: {
      label: "Logística nacional",
      items: [
        { id: "andreani", nombre: "Andreani", nivel: "completo", acciones: ["cotizar", "etiqueta", "tracking"] },
        { id: "oca", nombre: "OCA ePak", nivel: "completo", acciones: ["cotizar", "etiqueta", "tracking"] },
        { id: "correo_argentino", nombre: "Correo Argentino PAQ.AR", nivel: "completo", acciones: ["cotizar", "etiqueta", "tracking"] },
      ],
    },
    comunicacion: {
      label: "Comunicación",
      items: [
        { id: "whatsapp", nombre: "WhatsApp Business", nivel: "parcial" },
        { id: "telegram", nombre: "Telegram", nivel: "parcial" },
      ],
    },
    fiscal: {
      label: "Fiscal",
      items: [{ id: "afip", nombre: "AFIP / Factura electrónica", nivel: "completo" }],
    },
    automatizacion: {
      label: "Automatización",
      items: [
        { id: "n8n", nombre: "n8n", nivel: "parcial" },
        { id: "zapier", nombre: "Zapier", nivel: "parcial" },
      ],
    },
  },
  flujoUnificado: [
    "Pedido entra desde ML / TN / Shopify / Woo → PedidoVenta borrador",
    "Stock se descuenta del mismo depósito del POS",
    "Cotización multi-carrier (Andreani + OCA + Correo)",
    "Etiqueta + tracking → Envío vinculado al pedido",
    "Factura AFIP desde el mismo flujo de ventas",
    "Cliente recibe aviso por WhatsApp / Telegram",
  ],
  pendiente: [
    "Mercado Envíos (envíos gestionados por ML)",
    "Checkout con cotización en tiempo real en tienda propia",
    "Cron automático de sync cada 5–15 min (hoy es manual + webhooks)",
    "VTEX, Amazon, PrestaShop",
  ],
} as const

export function getPaqueteMulticanalResumen() {
  const mod = PAQUETE_MULTICANAL_AR.modulos
  const completos = [
    ...mod.canales.items,
    ...mod.logistica.items,
    ...mod.pagos.items,
    ...mod.comunicacion.items,
    ...mod.fiscal.items,
  ].filter((i) => i.nivel === "completo").length

  const total = [
    ...mod.canales.items,
    ...mod.logistica.items,
    ...mod.pagos.items,
    ...mod.comunicacion.items,
    ...mod.fiscal.items,
    ...mod.automatizacion.items,
  ].length

  return {
    ...PAQUETE_MULTICANAL_AR,
    stats: { integracionesCompletas: completos, integracionesTotal: total },
  }
}