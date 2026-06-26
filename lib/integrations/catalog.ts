import type { CatalogEntry } from "./types"

const SYNC_ECOM = [
  { id: "productos", label: "Productos", defaultDireccion: "salida" as const, defaultFrecuencia: "1h" as const },
  { id: "stock", label: "Stock", defaultDireccion: "bidireccional" as const, defaultFrecuencia: "5min" as const },
  { id: "pedidos", label: "Pedidos", defaultDireccion: "entrada" as const, defaultFrecuencia: "tiempo_real" as const },
  { id: "clientes", label: "Clientes", defaultDireccion: "entrada" as const, defaultFrecuencia: "1h" as const },
]

export const INTEGRATION_CATALOG: CatalogEntry[] = [
  // E-commerce
  {
    id: "shopify", nombre: "Shopify", categoria: "ecommerce", categoriaLabel: "E-commerce",
    authTipo: "oauth2", prioridad: 100, disponible: true, novedad: true, badge: "Sync real",
    emoji: "🛍️", color: "emerald",
    descripcion: "Sincronizá productos, stock y pedidos con tu tienda Shopify.",
    descripcionComercial: "Tu tienda online y el depósito hablan el mismo idioma. Pedidos que bajan solos, stock que se actualiza en ambos lados.",
    campos: [
      { key: "shopDomain", label: "Dominio myshopify.com", tipo: "url", requerido: true, placeholder: "mi-tienda.myshopify.com", ayuda: "Requerido antes de OAuth" },
      { key: "accessToken", label: "Access Token (manual)", tipo: "password", ayuda: "Opcional si usás OAuth" },
    ],
    entidadesSync: SYNC_ECOM,
  },
  {
    id: "tienda_nube", nombre: "Tienda Nube", categoria: "ecommerce", categoriaLabel: "E-commerce",
    authTipo: "oauth2", prioridad: 99, disponible: true, novedad: true, badge: "Sync real",
    emoji: "☁️", color: "violet",
    descripcion: "Conexión nativa con Tienda Nube para PyMEs argentinas.",
    descripcionComercial: "El canal #1 de e-commerce en Argentina, integrado sin Zapier ni planillas.",
    entidadesSync: SYNC_ECOM,
  },
  {
    id: "woocommerce", nombre: "WooCommerce", categoria: "ecommerce", categoriaLabel: "E-commerce",
    authTipo: "api_key", prioridad: 85, disponible: true, novedad: true, badge: "Sync real",
    emoji: "🔌", color: "purple",
    descripcion: "WordPress + WooCommerce vía REST API.",
    descripcionComercial: "Ideal si ya tenés tu web en WordPress y querés unificar stock con el ERP.",
    campos: [
      { key: "siteUrl", label: "URL del sitio", tipo: "url", requerido: true },
      { key: "consumerKey", label: "Consumer Key", tipo: "text", requerido: true },
      { key: "consumerSecret", label: "Consumer Secret", tipo: "password", requerido: true },
    ],
    entidadesSync: SYNC_ECOM,
  },
  {
    id: "odoo", nombre: "Odoo", categoria: "erp", categoriaLabel: "ERP / Migración",
    authTipo: "api_key", prioridad: 88, disponible: true, novedad: true, badge: "Bridge",
    emoji: "🟣", color: "purple",
    descripcion: "Puente con Odoo — importación y sincronización vía XML-RPC/JSON-RPC.",
    descripcionComercial: "Migrá productos, contactos y saldos desde Odoo sin reimplementar todo.",
    campos: [
      { key: "url", label: "URL Odoo", tipo: "url", requerido: true, placeholder: "https://miempresa.odoo.com" },
      { key: "database", label: "Base de datos", tipo: "text", requerido: true },
      { key: "username", label: "Usuario API", tipo: "text", requerido: true },
      { key: "apiKey", label: "API Key / password", tipo: "password", requerido: true },
    ],
    entidadesSync: [
      { id: "productos", label: "Productos", defaultDireccion: "entrada", defaultFrecuencia: "1h" },
      { id: "contactos", label: "Contactos", defaultDireccion: "entrada", defaultFrecuencia: "1h" },
      { id: "stock", label: "Stock", defaultDireccion: "bidireccional", defaultFrecuencia: "15min" },
      { id: "pedidos", label: "Pedidos de venta", defaultDireccion: "entrada", defaultFrecuencia: "1h" },
    ],
  },
  {
    id: "protheus", nombre: "TOTVS Protheus", categoria: "erp", categoriaLabel: "ERP / Migración",
    authTipo: "oauth2", prioridad: 90, disponible: true, novedad: true, badge: "OPO Bridge",
    emoji: "🔗", color: "slate",
    descripcion: "Puente OPO sobre Protheus — REST API o vistas SQL con ontología canónica.",
    descripcionComercial: "Clavis como capa moderna sobre SA1/SF2/SB1 sin reemplazar Protheus de golpe.",
    campos: [
      { key: "baseUrl", label: "URL API Protheus", tipo: "url", requerido: true, placeholder: "https://protheus.empresa.com/api" },
      { key: "conector", label: "Conector", tipo: "text", requerido: true, placeholder: "rest | sql" },
      { key: "sqlViewPrefix", label: "Prefijo vistas SQL", tipo: "text", placeholder: "vw_opo_" },
    ],
    entidadesSync: [
      { id: "clientes", label: "Clientes (SA1)", defaultDireccion: "entrada", defaultFrecuencia: "1h" },
      { id: "productos", label: "Productos (SB1)", defaultDireccion: "bidireccional", defaultFrecuencia: "15min" },
      { id: "facturas", label: "Facturas (SF2)", defaultDireccion: "entrada", defaultFrecuencia: "1h" },
      { id: "pedidos", label: "Pedidos (SC5)", defaultDireccion: "entrada", defaultFrecuencia: "1h" },
    ],
  },
  {
    id: "vtex", nombre: "VTEX", categoria: "ecommerce", categoriaLabel: "E-commerce",
    authTipo: "api_key", prioridad: 80, disponible: true, badge: "Enterprise",
    emoji: "🏪", color: "rose",
    descripcion: "VTEX IO — catálogo y pedidos enterprise.",
    descripcionComercial: "Para retailers que escalan en VTEX y necesitan stock fiscal unificado.",
    campos: [
      { key: "accountName", label: "Account name", tipo: "text", requerido: true },
      { key: "appKey", label: "App Key", tipo: "text", requerido: true },
      { key: "appToken", label: "App Token", tipo: "password", requerido: true },
    ],
    entidadesSync: SYNC_ECOM,
  },
  // Marketplaces
  {
    id: "mercado_libre", nombre: "Mercado Libre", categoria: "marketplace", categoriaLabel: "Marketplaces",
    authTipo: "oauth2", prioridad: 98, disponible: true, novedad: true, badge: "Sync real",
    emoji: "🛒", color: "yellow",
    descripcion: "Publicaciones, ventas y stock sincronizados con ML.",
    descripcionComercial: "Vendés en Mercado Libre y facturás desde el mismo stock que tu local. Sin doble carga.",
    entidadesSync: [
      { id: "publicaciones", label: "Publicaciones", defaultDireccion: "bidireccional", defaultFrecuencia: "1h" },
      { id: "ventas", label: "Ventas / órdenes", defaultDireccion: "entrada", defaultFrecuencia: "tiempo_real" },
      { id: "stock", label: "Stock", defaultDireccion: "salida", defaultFrecuencia: "5min" },
    ],
  },
  {
    id: "mercado_shops", nombre: "Mercado Shops", categoria: "marketplace", categoriaLabel: "Marketplaces",
    authTipo: "oauth2", prioridad: 70, disponible: true, novedad: true, badge: "Nuevo",
    emoji: "🏠", color: "amber",
    descripcion: "Tienda Mercado Shops vinculada a tu cuenta ML.",
    descripcionComercial: "Tu vitrina ML y tu ERP comparten el mismo inventario.",
    entidadesSync: SYNC_ECOM,
  },
  {
    id: "amazon", nombre: "Amazon Seller", categoria: "marketplace", categoriaLabel: "Marketplaces",
    authTipo: "oauth2", prioridad: 65, disponible: true, badge: "Beta",
    emoji: "📦", color: "orange",
    descripcion: "Amazon SP-API — listings y pedidos FBA/FBM.",
    descripcionComercial: "Expandí a Amazon con pedidos que entran directo al módulo de ventas.",
    entidadesSync: SYNC_ECOM,
  },
  // Pagos
  {
    id: "mercado_pago", nombre: "Mercado Pago", categoria: "pagos", categoriaLabel: "Pagos",
    authTipo: "api_key", prioridad: 100, disponible: true, badge: "Listo",
    emoji: "💳", color: "sky",
    descripcion: "QR, Checkout Pro y conciliación automática con CxC.",
    descripcionComercial: "Cobrá como tu cliente quiere pagar y conciliá sin Excel. QR en mostrador y link de pago.",
    campos: [
      { key: "accessToken", label: "Access Token", tipo: "password", requerido: true },
      { key: "publicKey", label: "Public Key", tipo: "text", requerido: true },
      { key: "nombreCuenta", label: "Nombre cuenta (opcional)", tipo: "text" },
    ],
  },
  {
    id: "stripe", nombre: "Stripe", categoria: "pagos", categoriaLabel: "Pagos",
    authTipo: "oauth2", prioridad: 90, disponible: true, novedad: true, badge: "Nuevo",
    emoji: "💜", color: "indigo",
    descripcion: "Pagos internacionales y suscripciones con Stripe Connect.",
    descripcionComercial: "Para ventas globales, SaaS y cobros con tarjeta fuera de Argentina.",
    campos: [
      { key: "secretKey", label: "Secret Key", tipo: "password", requerido: true },
      { key: "publishableKey", label: "Publishable Key", tipo: "text", requerido: true },
    ],
  },
  // Comunicación
  {
    id: "whatsapp", nombre: "WhatsApp Business", categoria: "comunicacion", categoriaLabel: "Comunicación",
    authTipo: "api_key", prioridad: 95, disponible: true, badge: "Listo",
    emoji: "💬", color: "green",
    descripcion: "Cloud API de Meta + modo Twilio. Cobranza, alertas y despacho.",
    descripcionComercial: "Mandá recordatorios de pago y avisos de envío donde tus clientes realmente leen.",
    campos: [
      { key: "modo", label: "Modo (cloud|twilio)", tipo: "text", placeholder: "cloud" },
      { key: "phoneNumberId", label: "Phone Number ID (Meta)", tipo: "text" },
      { key: "accessToken", label: "Access Token", tipo: "password", requerido: true },
      { key: "businessAccountId", label: "Business Account ID", tipo: "text" },
    ],
  },
  {
    id: "telegram", nombre: "Telegram", categoria: "comunicacion", categoriaLabel: "Comunicación",
    authTipo: "api_key", prioridad: 75, disponible: true, badge: "Listo",
    emoji: "✈️", color: "sky",
    descripcion: "Bot de alertas y comandos /stock, /alertas para el equipo.",
    descripcionComercial: "Tu equipo recibe alertas críticas en el bolsillo sin abrir el ERP.",
    campos: [],
  },
  // Productividad
  {
    id: "google_workspace", nombre: "Google Workspace", categoria: "productividad", categoriaLabel: "Productividad",
    authTipo: "oauth2", prioridad: 80, disponible: true, novedad: true, badge: "Nuevo",
    emoji: "📧", color: "blue",
    descripcion: "Gmail, Calendar, Drive y Sheets.",
    descripcionComercial: "Turnos de agenda, reportes en Sheets y mails automáticos desde el ERP.",
    entidadesSync: [
      { id: "calendar", label: "Calendario", defaultDireccion: "bidireccional", defaultFrecuencia: "tiempo_real" },
      { id: "sheets", label: "Google Sheets", defaultDireccion: "salida", defaultFrecuencia: "diario" },
    ],
  },
  {
    id: "microsoft_365", nombre: "Microsoft 365", categoria: "productividad", categoriaLabel: "Productividad",
    authTipo: "oauth2", prioridad: 78, disponible: true, novedad: true, badge: "Nuevo",
    emoji: "📎", color: "blue",
    descripcion: "Outlook, Calendar y OneDrive.",
    descripcionComercial: "Para empresas en ecosistema Microsoft que quieren un solo calendario de verdad.",
    entidadesSync: [
      { id: "calendar", label: "Outlook Calendar", defaultDireccion: "bidireccional", defaultFrecuencia: "tiempo_real" },
    ],
  },
  // Hospitalidad
  {
    id: "booking", nombre: "Booking.com", categoria: "hospitalidad", categoriaLabel: "Hospitalidad",
    authTipo: "api_key", prioridad: 72, disponible: true, novedad: true, badge: "Nuevo",
    emoji: "🏨", color: "blue",
    descripcion: "Reservas y disponibilidad para hotelería.",
    descripcionComercial: "Las reservas de Booking bajan al módulo de hospitalidad sin overbooking.",
    entidadesSync: [
      { id: "reservas", label: "Reservas", defaultDireccion: "entrada", defaultFrecuencia: "15min" },
    ],
  },
  {
    id: "airbnb", nombre: "Airbnb", categoria: "hospitalidad", categoriaLabel: "Hospitalidad",
    authTipo: "api_key", prioridad: 70, disponible: true, novedad: true, badge: "Nuevo",
    emoji: "🏡", color: "rose",
    descripcion: "iCal y API host para alquileres temporarios.",
    descripcionComercial: "Gestioná departamentos turísticos con el mismo calendario que tu contador ve.",
    entidadesSync: [
      { id: "reservas", label: "Reservas", defaultDireccion: "entrada", defaultFrecuencia: "15min" },
    ],
  },
  // CRM
  {
    id: "hubspot", nombre: "HubSpot", categoria: "crm", categoriaLabel: "CRM & Marketing",
    authTipo: "oauth2", prioridad: 82, disponible: true, novedad: true, badge: "Nuevo",
    emoji: "🧡", color: "orange",
    descripcion: "Contactos, deals y pipeline comercial.",
    descripcionComercial: "El CRM del ERP y HubSpot sincronizados — un solo pipeline de ventas.",
    entidadesSync: [
      { id: "contactos", label: "Contactos", defaultDireccion: "bidireccional", defaultFrecuencia: "1h" },
      { id: "deals", label: "Oportunidades", defaultDireccion: "bidireccional", defaultFrecuencia: "1h" },
    ],
  },
  {
    id: "rd_station", nombre: "RD Station", categoria: "crm", categoriaLabel: "CRM & Marketing",
    authTipo: "api_key", prioridad: 80, disponible: true, novedad: true, badge: "Nuevo",
    emoji: "📣", color: "teal",
    descripcion: "Leads y automatización de marketing LATAM.",
    descripcionComercial: "Los leads de tus campañas entran al CRM de Claverp automáticamente.",
    campos: [{ key: "apiKey", label: "API Key", tipo: "password", requerido: true }],
    entidadesSync: [{ id: "leads", label: "Leads", defaultDireccion: "entrada", defaultFrecuencia: "15min" }],
  },
  {
    id: "salesforce", nombre: "Salesforce", categoria: "crm", categoriaLabel: "CRM & Marketing",
    authTipo: "oauth2", prioridad: 75, disponible: true, badge: "Enterprise",
    emoji: "☁️", color: "sky",
    descripcion: "Sales Cloud — leads y oportunidades enterprise.",
    descripcionComercial: "Para equipos comerciales grandes que ya viven en Salesforce.",
    entidadesSync: [
      { id: "leads", label: "Leads", defaultDireccion: "entrada", defaultFrecuencia: "1h" },
      { id: "opportunities", label: "Oportunidades", defaultDireccion: "bidireccional", defaultFrecuencia: "1h" },
    ],
  },
  // Fiscal
  {
    id: "afip", nombre: "AFIP / Facturación Electrónica", categoria: "fiscal", categoriaLabel: "Fiscal",
    authTipo: "certificado", prioridad: 100, disponible: true, badge: "Incluido",
    emoji: "🇦🇷", color: "blue",
    descripcion: "CAE, CAEA, Libro IVA y presentaciones AFIP/ARCA.",
    descripcionComercial: "Facturación electrónica argentina nativa. Sin add-ons ni sistemas paralelos.",
    campos: [],
  },
  // Automatización
  {
    id: "n8n", nombre: "n8n / Automation Hub", categoria: "automatizacion", categoriaLabel: "Automatización",
    authTipo: "webhook", prioridad: 88, disponible: true, badge: "Listo",
    emoji: "⚡", color: "orange",
    descripcion: "Webhooks firmados y eventos del ERP hacia n8n.",
    descripcionComercial: "Automatizá lo que quieras: Slack, mails, tareas. Sin programar.",
    campos: [
      { key: "webhookUrl", label: "URL webhook n8n", tipo: "url" },
      { key: "webhookSecret", label: "Secret HMAC", tipo: "password" },
    ],
  },
  {
    id: "zapier", nombre: "Zapier", categoria: "automatizacion", categoriaLabel: "Automatización",
    authTipo: "webhook", prioridad: 85, disponible: true, novedad: true, badge: "Nuevo",
    emoji: "🔗", color: "amber",
    descripcion: "Conectá Claverp con 6.000+ apps vía Zapier.",
    descripcionComercial: "Si ya usás Zapier, tu ERP ahora es un trigger más.",
    campos: [{ key: "zapierWebhookUrl", label: "Zapier Catch Hook URL", tipo: "url", requerido: true }],
  },
  {
    id: "make", nombre: "Make (Integromat)", categoria: "automatizacion", categoriaLabel: "Automatización",
    authTipo: "webhook", prioridad: 83, disponible: true, novedad: true, badge: "Nuevo",
    emoji: "🔄", color: "violet",
    descripcion: "Escenarios visuales con Make.com.",
    descripcionComercial: "Flujos visuales potentes para equipos que outgrew Zapier.",
    campos: [{ key: "makeWebhookUrl", label: "Make Webhook URL", tipo: "url", requerido: true }],
  },
  // BI
  {
    id: "power_bi", nombre: "Power BI", categoria: "bi", categoriaLabel: "BI & Reportes",
    authTipo: "api_key", prioridad: 78, disponible: true, novedad: true, badge: "Nuevo",
    emoji: "📊", color: "yellow",
    descripcion: "Dataset y export programado para dashboards.",
    descripcionComercial: "Tus KPIs en Power BI siempre actualizados desde el ERP.",
    campos: [{ key: "apiKeyLectura", label: "API Key de lectura Claverp", tipo: "password" }],
  },
  // Logística
  {
    id: "andreani", nombre: "Andreani", categoria: "logistica", categoriaLabel: "Logística",
    authTipo: "api_key", prioridad: 90, disponible: true, novedad: true, badge: "Sync real",
    emoji: "🚚", color: "red",
    descripcion: "Envíos, etiquetas y tracking Andreani.",
    descripcionComercial: "Generá etiquetas y seguí envíos sin salir del módulo logística.",
    campos: [
      { key: "usuario", label: "Usuario API", tipo: "text", requerido: true },
      { key: "password", label: "Contraseña", tipo: "password", requerido: true },
      { key: "contrato", label: "N° contrato", tipo: "text" },
    ],
    entidadesSync: [
      { id: "cotizaciones", label: "Cotizaciones", defaultDireccion: "salida", defaultFrecuencia: "manual" },
      { id: "envios", label: "Envíos / etiquetas", defaultDireccion: "salida", defaultFrecuencia: "manual" },
      { id: "tracking", label: "Tracking", defaultDireccion: "entrada", defaultFrecuencia: "1h" },
    ],
  },
  {
    id: "oca", nombre: "OCA", categoria: "logistica", categoriaLabel: "Logística",
    authTipo: "api_key", prioridad: 88, disponible: true, novedad: true, badge: "Sync real",
    emoji: "📮", color: "blue",
    descripcion: "OCA ePak — envíos y seguimiento.",
    descripcionComercial: "OCA integrado al flujo de despacho de tu depósito.",
    campos: [
      { key: "usuario", label: "Usuario", tipo: "text", requerido: true },
      { key: "password", label: "Contraseña", tipo: "password", requerido: true },
    ],
    entidadesSync: [
      { id: "cotizaciones", label: "Cotizaciones", defaultDireccion: "salida", defaultFrecuencia: "manual" },
      { id: "envios", label: "Envíos / etiquetas", defaultDireccion: "salida", defaultFrecuencia: "manual" },
      { id: "tracking", label: "Tracking", defaultDireccion: "entrada", defaultFrecuencia: "1h" },
    ],
  },
  {
    id: "correo_argentino", nombre: "Correo Argentino", categoria: "logistica", categoriaLabel: "Logística",
    authTipo: "api_key", prioridad: 85, disponible: true, badge: "Sync real",
    emoji: "📬", color: "yellow",
    descripcion: "PAQ.AR y envíos Correo Argentino.",
    descripcionComercial: "Envíos nacionales con tracking dentro del ERP.",
    campos: [
      { key: "apiKey", label: "API Key PAQ.AR", tipo: "password", requerido: true },
      { key: "userId", label: "User ID Mi Correo", tipo: "text", ayuda: "ID de cuenta Mi Correo" },
    ],
    entidadesSync: [
      { id: "cotizaciones", label: "Cotizaciones", defaultDireccion: "salida", defaultFrecuencia: "manual" },
      { id: "envios", label: "Envíos / etiquetas", defaultDireccion: "salida", defaultFrecuencia: "manual" },
      { id: "tracking", label: "Tracking", defaultDireccion: "entrada", defaultFrecuencia: "1h" },
    ],
  },
  {
    id: "dhl", nombre: "DHL", categoria: "logistica", categoriaLabel: "Logística",
    authTipo: "api_key", prioridad: 75, disponible: true, badge: "Internacional",
    emoji: "🌍", color: "yellow",
    descripcion: "DHL Express — envíos internacionales.",
    descripcionComercial: "Exportá con tracking DHL desde el mismo remito del ERP.",
    campos: [
      { key: "accountNumber", label: "Account Number", tipo: "text", requerido: true },
      { key: "apiKey", label: "API Key", tipo: "password", requerido: true },
    ],
  },
  // Open source
  {
    id: "odoo", nombre: "Odoo", categoria: "opensource", categoriaLabel: "Open Source",
    authTipo: "api_key", prioridad: 60, disponible: true, badge: "Avanzado",
    emoji: "🔧", color: "purple",
    descripcion: "Sync contable/stock con Odoo vía XML-RPC.",
    descripcionComercial: "Migración gradual o coexistencia con Odoo en grupos empresarios.",
    campos: [
      { key: "url", label: "URL Odoo", tipo: "url", requerido: true },
      { key: "database", label: "Base de datos", tipo: "text", requerido: true },
      { key: "apiKey", label: "API Key", tipo: "password", requerido: true },
    ],
  },
  {
    id: "prestashop", nombre: "PrestaShop", categoria: "ecommerce", categoriaLabel: "E-commerce",
    authTipo: "api_key", prioridad: 72, disponible: true, badge: "Open Source",
    emoji: "🛒", color: "pink",
    descripcion: "PrestaShop — catálogo y pedidos vía webservice.",
    descripcionComercial: "Para tiendas PrestaShop que quieren stock unificado con el depósito.",
    campos: [
      { key: "url", label: "URL tienda", tipo: "url", requerido: true },
      { key: "apiKey", label: "API Key", tipo: "password", requerido: true },
    ],
    entidadesSync: SYNC_ECOM,
  },
  {
    id: "erpnext", nombre: "ERPNext", categoria: "opensource", categoriaLabel: "Open Source",
    authTipo: "api_key", prioridad: 58, disponible: true, badge: "Avanzado",
    emoji: "🐍", color: "green",
    descripcion: "ERPNext REST API — items y sales orders.",
    descripcionComercial: "Para equipos técnicos que quieren coexistir con ERPNext.",
    campos: [
      { key: "url", label: "URL ERPNext", tipo: "url", requerido: true },
      { key: "apiKey", label: "API Key", tipo: "password", requerido: true },
      { key: "apiSecret", label: "API Secret", tipo: "password", requerido: true },
    ],
  },
]

export const CATEGORIA_LABELS: Record<string, string> = {
  ecommerce: "E-commerce",
  marketplace: "Marketplaces",
  pagos: "Pagos",
  comunicacion: "Comunicación",
  productividad: "Productividad",
  hospitalidad: "Hospitalidad",
  crm: "CRM & Marketing",
  fiscal: "Fiscal",
  automatizacion: "Automatización",
  bi: "BI & Reportes",
  logistica: "Logística",
  erp: "ERP / Migración",
  opensource: "Open Source",
}

export function getCatalogEntry(id: string): CatalogEntry | undefined {
  return INTEGRATION_CATALOG.find((e) => e.id === id)
}

export function getNovedades(): CatalogEntry[] {
  return INTEGRATION_CATALOG.filter((e) => e.novedad).sort((a, b) => b.prioridad - a.prioridad)
}

export function getCatalogByCategoria(): Record<string, CatalogEntry[]> {
  const map: Record<string, CatalogEntry[]> = {}
  for (const e of INTEGRATION_CATALOG) {
    if (!map[e.categoria]) map[e.categoria] = []
    map[e.categoria].push(e)
  }
  for (const k of Object.keys(map)) {
    map[k].sort((a, b) => b.prioridad - a.prioridad)
  }
  return map
}