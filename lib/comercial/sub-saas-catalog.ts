/**
 * Catálogo de Sub-SaaS empaquetados — celular + web PC sobre procesos existentes.
 * Fuente de verdad para landings /claver/apps/[slug], activación y documentación.
 * Portfolio freemium 11: lib/comercial/micro-saas-portfolio.ts
 */

import type { ModoLite } from "@/lib/comercial/pack-calle-catalog"
import { microSaasSubSaasToAppend } from "@/lib/comercial/micro-saas-portfolio"

function activarSkuHref(sku: string): string {
  return `/login?activar=${encodeURIComponent(sku)}`
}

export const fmtPrecioArs = (n: number) =>
  new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(n)

export type SubSaasEstado = "disponible" | "beta" | "proximamente"
export type SubSaasPlataforma = "celular" | "pc" | "ambos"

export interface SubSaasApp {
  slug: string
  marca: string
  nombre: string
  lema: string
  descripcion: string
  sku: string
  skusAdicionales?: string[]
  precioArs: number
  trialDias: number
  modoLite: ModoLite
  /** Panel del dueño (responsive = celular + PC) */
  dashboardPath: string
  /** Ruta pública para el cliente final. Placeholders: {empresaId}, {slug} */
  publicPath?: string
  publicPathLabel?: string
  procesosReciclados: string[]
  serviciosBackend: string[]
  listoPct: number
  estado: SubSaasEstado
  plataforma: SubSaasPlataforma
  redesScore: number
  impactoScore: number
  rubros: string[]
  reelHook: string
  pains: string[]
  outcomes: string[]
  pasosActivacion: string[]
  upsellSkus?: string[]
}

export const SUB_SAAS_APPS: SubSaasApp[] = [
  {
    slug: "pos",
    marca: "Claver POS",
    nombre: "Punto de Venta Responsive",
    lema: "Facturá rápido en mostrador, bar o kiosco.",
    descripcion: "Sistema de punto de venta optimizado para pantallas táctiles y teclado. Funciona con o sin conexión, ticket fiscal, y lectura de código de barras.",
    sku: "pos.caja",
    precioArs: 25000,
    trialDias: 14,
    modoLite: "pos",
    dashboardPath: "/dashboard/pos",
    publicPath: undefined,
    publicPathLabel: undefined,
    procesosReciclados: ["ventas", "caja", "stock"],
    serviciosBackend: [],
    listoPct: 100,
    estado: "disponible",
    plataforma: "ambos",
    redesScore: 9,
    impactoScore: 10,
    rubros: ["kiosco", "bar", "almacen"],
    reelHook: "¿Tu caja es lenta?",
    pains: ["Cobro lento"],
    outcomes: ["Filas más rápidas"],
    pasosActivacion: [
      "Activar POS en trial",
      "Cargar productos del mostrador",
      "Cobrar primer ticket",
    ],
  },
  {
    slug: "cobra",
    marca: "Claver Cobrá",
    nombre: "Cobranzas por WhatsApp",
    lema: "El mensaje cobra. Vos seguís vendiendo.",
    descripcion:
      "Recordatorios automáticos por WhatsApp, panel de deuda recuperable y link de pago. Menos llamadas, más recupero.",
    sku: "intang.cobranzas_wa",
    precioArs: 20000,
    trialDias: 14,
    modoLite: "cobranza",
    dashboardPath: "/dashboard/cuentas-cobrar",
    publicPath: undefined,
    publicPathLabel: "Mensaje WhatsApp al deudor",
    procesosReciclados: [
      "cobranzas-wa-service",
      "cuentaCobrar",
      "reglaAlerta cxc_vencida",
      "WhatsappService / Twilio",
      "ia-notificacion-config",
    ],
    serviciosBackend: [
      "lib/marketplace/cobranzas-wa-service.ts",
      "lib/whatsapp/whatsapp-service.ts",
      "app/api/webhooks/whatsapp/route.ts",
    ],
    listoPct: 85,
    estado: "disponible",
    plataforma: "ambos",
    redesScore: 8,
    impactoScore: 10,
    rubros: ["almacén", "servicios", "freelance", "distribuidora"],
    reelHook: "Cobrá sin quedar mal vos — el sistema les avisa.",
    pains: ["Cuentas vencidas sin seguimiento", "Perder tiempo llamando morosos", "No saber cuánto podés recuperar"],
    outcomes: ["Recordatorios diarios automáticos", "Panel de deuda recuperable", "Menos llamadas incómodas"],
    pasosActivacion: [
      "Activar SKU intang.cobranzas_wa",
      "Cargar o importar clientes con saldo",
      "Configurar días de vencimiento y tope diario",
      "Aprobar o auto-enviar mensajes WA",
    ],
    upsellSkus: ["pos.fiado_barrio", "fiscal.clavpay_link", "core.claver"],
  },
  {
    slug: "fiado",
    marca: "Claver Fiado",
    nombre: "Libreta Fiado Digital",
    lema: "Gratis para siempre. Fiá con límite desde el celular.",
    descripcion:
      "Libreta de fiado gratis. Límite por cliente, anotar y cobrar sin POS, avisos. Después podés sumar Cobrá por WhatsApp o POS en la misma cuenta.",
    sku: "pos.fiado_barrio",
    precioArs: 0,
    trialDias: 14,
    modoLite: "fiado",
    dashboardPath: "/dashboard/fiado",
    publicPathLabel: "Notificación de deuda al cliente",
    procesosReciclados: ["fiado-service", "fiado-whatsapp", "fiado-pago-link", "validarFiadoPos", "cliente.saldoCuentaCorriente"],
    serviciosBackend: [
      "lib/fiado/fiado-service.ts",
      "lib/fiado/fiado-whatsapp.ts",
      "app/dashboard/fiado/page.tsx",
    ],
    listoPct: 90,
    estado: "disponible",
    plataforma: "celular",
    redesScore: 9,
    impactoScore: 10,
    rubros: ["almacén", "kiosco", "carnicería", "fiambrería"],
    reelHook: "Dejá el cuaderno. Fiado con límite en el celu.",
    pains: ["Fiado en papel que se pierde", "Clientes que pasan el límite", "No saber quién debe en total"],
    outcomes: ["Límite por cliente", "Aviso automático al fiar", "Libreta en tiempo real"],
    pasosActivacion: [
      "Activar pos.fiado_barrio",
      "Alta de clientes del barrio",
      "Configurar límites de crédito",
      "Anotar fiado desde POS o libreta",
    ],
    upsellSkus: ["intang.cobranzas_wa", "core.claver"],
  },
  {
    slug: "turnos",
    marca: "Claver Confirmá",
    nombre: "Turnos que confirman solos",
    lema: "Menos no-shows. Más sillas ocupadas.",
    descripcion:
      "Agenda online + recordatorio WhatsApp la víspera. Link 24/7, menos no-shows. Producto freemium: Confirmá.",
    sku: "micro.confirma_turnos",
    skusAdicionales: ["niche.peluqueria_barrio", "com.whatsapp"],
    precioArs: 14900,
    trialDias: 14,
    modoLite: "niche",
    dashboardPath: "/dashboard/agenda",
    publicPath: "/agenda-online/{empresaId}",
    publicPathLabel: "Reserva online del cliente",
    procesosReciclados: ["agenda-service", "agenda-publica API", "turno", "profesional", "com.whatsapp"],
    serviciosBackend: [
      "lib/agenda/agenda-service.ts",
      "app/api/agenda-publica/[empresaId]/route.ts",
      "app/agenda-online/[empresaId]/page.tsx",
    ],
    listoPct: 75,
    estado: "disponible",
    plataforma: "ambos",
    redesScore: 9,
    impactoScore: 8,
    rubros: ["peluquería", "barbería", "estética", "consultorio", "psicología"],
    reelHook: "10 audios para un turno vs dos toques en tu link.",
    pains: ["Coordinación por WhatsApp caótica", "Clientas que no vienen", "Agenda en papel"],
    outcomes: ["Link de reserva 24/7", "Menos no-shows", "Agenda centralizada"],
    pasosActivacion: [
      "Activar micro.confirma_turnos",
      "Cargar profesionales y servicios",
      "Compartir link /agenda-online/{empresaId}",
      "Activar recordatorios WhatsApp",
    ],
    upsellSkus: ["fiscal.clavpay_link", "intang.cobranzas_wa", "core.claver"],
  },
  {
    slug: "propiedad",
    marca: "Claver Propiedad",
    nombre: "Consorcios e Inmobiliaria",
    lema: "Expensas, contratos y portales sin Excel.",
    descripcion:
      "Liquidá expensas en minutos, cobrá morosos por WhatsApp, controlá contratos de alquiler y conectá Zonaprop, Argenprop o Mercado Libre Inmuebles.",
    sku: "pool-propiedad",
    skusAdicionales: ["niche.consorcios", "niche.inmo_garantia", "intang.cobranzas_wa", "com.whatsapp"],
    precioArs: 29900,
    trialDias: 14,
    modoLite: "niche",
    dashboardPath: "/dashboard/nicho/consorcios",
    publicPath: undefined,
    publicPathLabel: "Portal inquilino (roadmap)",
    procesosReciclados: [
      "consorcios-service",
      "consorcios-morosos",
      "niche.inmo_garantia",
      "cobranzas-wa",
      "portales-argentinos",
      "cuentaCobrar",
    ],
    serviciosBackend: [
      "lib/consorcios/consorcios-service.ts",
      "lib/consorcios/consorcios-morosos-service.ts",
      "app/api/consorcios/",
      "app/api/inmobiliaria/portales/",
      "components/niche/niche-consorcios-panel.tsx",
    ],
    listoPct: 78,
    estado: "disponible",
    plataforma: "ambos",
    redesScore: 7,
    impactoScore: 9,
    rubros: ["consorcios", "inmobiliaria", "administración", "alquileres"],
    reelHook: "Liquidá el mes y avisá a todos en un toque.",
    pains: [
      "Expensas en planilla Excel",
      "Morosos sin avisar sistemáticamente",
      "Contratos de alquiler en carpeta",
      "Publicar en 4 portales a mano",
    ],
    outcomes: [
      "Liquidación mensual en 5 minutos",
      "WhatsApp a morosos con un toque",
      "Alertas de vencimiento de contrato",
      "API keys de portales en un panel",
    ],
    pasosActivacion: [
      "Activar pack pool-propiedad (trial 14 días)",
      "Alta edificio + unidades con %",
      "Liquidar expensas del mes",
      "Conectar portales en Integraciones",
    ],
    upsellSkus: ["core.ia", "core.claver"],
  },
  {
    slug: "monotributo",
    marca: "Claver Monotributo",
    nombre: "Autónomo y monotributista",
    lema: "Cotizá, facturá C y cobrá sin perseguir.",
    descripcion:
      "Presupuestos desde el celular, factura electrónica C AFIP y cobranzas por WhatsApp. Para diseñadores, consultores, oficios y freelances.",
    sku: "pool-monotributo",
    skusAdicionales: ["core.claver", "intang.cobranzas_wa", "com.whatsapp"],
    precioArs: 14900,
    trialDias: 14,
    modoLite: "servicios",
    dashboardPath: "/dashboard/ventas/presupuestos",
    publicPathLabel: "PDF presupuesto (roadmap link)",
    procesosReciclados: [
      "presupuesto-service",
      "afip-factura-c",
      "cobranzas-wa",
      "cuentaCobrar",
      "facturacion-recurrente",
    ],
    serviciosBackend: [
      "lib/ventas/presupuesto-service.ts",
      "lib/afip/factura-service.ts",
      "lib/marketplace/cobranzas-wa-service.ts",
    ],
    listoPct: 72,
    estado: "disponible",
    plataforma: "ambos",
    redesScore: 7,
    impactoScore: 9,
    rubros: ["monotributista", "freelance", "consultor", "diseñador", "desarrollador"],
    reelHook: "Dejá Word. Facturá C y que el WA cobre solo.",
    pains: [
      "Presupuestos en Word o WhatsApp",
      "Facturar tarde o mal",
      "Perseguir el cobro incómodo",
      "No saber cuánto facturaste en el mes",
    ],
    outcomes: [
      "Presupuesto numerado en 30 segundos",
      "Factura C AFIP integrada",
      "Recordatorio amable por WhatsApp",
      "Panel de lo pendiente de cobro",
    ],
    pasosActivacion: [
      "Activar pack pool-monotributo",
      "Alta clientes con teléfono",
      "Primer presupuesto → factura C",
      "Activar avisos de cobranza WA",
    ],
    upsellSkus: ["core.ia", "fiscal.clavpay_link"],
  },
  {
    slug: "servicios",
    marca: "Claver Servicios Pro",
    nombre: "Empresa de servicios",
    lema: "Presupuesto, turnos y cobranza en un panel.",
    descripcion:
      "Para equipos de 3–20 personas: agenda con link público, cotizaciones, morosos por WhatsApp y clientes centralizados.",
    sku: "pool-servicios-pro",
    skusAdicionales: ["core.claver", "niche.consultorio_solo", "intang.cobranzas_wa", "com.whatsapp"],
    precioArs: 29900,
    trialDias: 14,
    modoLite: "servicios",
    dashboardPath: "/dashboard/agenda",
    publicPath: "/agenda-online/{empresaId}",
    publicPathLabel: "Reserva / consulta online",
    procesosReciclados: [
      "agenda-service",
      "presupuesto-service",
      "cobranzas-wa",
      "crm",
      "pendientes-service",
    ],
    serviciosBackend: [
      "lib/agenda/agenda-service.ts",
      "lib/ventas/presupuesto-service.ts",
      "app/agenda-online/[empresaId]/page.tsx",
    ],
    listoPct: 68,
    estado: "disponible",
    plataforma: "ambos",
    redesScore: 7,
    impactoScore: 9,
    rubros: ["plomería", "electricidad", "limpieza", "IT", "mantenimiento", "estudio chico"],
    reelHook: "Tu equipo en la calle y la oficina en un solo sistema.",
    pains: [
      "Turnos y presupuestos en canales distintos",
      "Morosos de servicios sin seguimiento",
      "No saber el pipeline de cotizaciones",
      "Coordinación por WhatsApp todo el día",
    ],
    outcomes: [
      "Agenda + presupuestos unificados",
      "Link de reserva 24/7",
      "Cobranza automática de hitos",
      "Alertas de presupuesto sin respuesta",
    ],
    pasosActivacion: [
      "Activar pool-servicios-pro",
      "Cargar servicios y profesionales",
      "Compartir link de agenda",
      "Crear presupuestos por visita",
    ],
    upsellSkus: ["core.ia", "intang.reactivador_clientes"],
  },
  {
    slug: "obra",
    marca: "Claver Obra",
    nombre: "Contratistas y refacciones",
    lema: "Jornales, adelantos y liquidación sin pelea.",
    descripcion:
      "Control de obra con jornales, adelantos a obreros, liquidación semanal y cobro de hitos al cliente por WhatsApp.",
    sku: "pool-obra",
    skusAdicionales: ["niche.obra_changas", "intang.cobranzas_wa", "com.whatsapp"],
    precioArs: 19900,
    trialDias: 14,
    modoLite: "niche",
    dashboardPath: "/dashboard/nicho/obras",
    publicPathLabel: "Liquidación obrero por WA",
    procesosReciclados: [
      "niche.obra_changas",
      "movimientos-service",
      "cobranzas-wa",
      "gen.obras",
    ],
    serviciosBackend: [
      "lib/niche/movimientos-service.ts",
      "components/niche/niche-app-shell.tsx",
      "lib/consorcios/consorcios-morosos-service.ts",
    ],
    listoPct: 65,
    estado: "disponible",
    plataforma: "ambos",
    redesScore: 6,
    impactoScore: 8,
    rubros: ["contratista", "albañil", "electricista obra", "refacciones", "construcción"],
    reelHook: "El viernes liquidás en 5 minutos, no en 2 horas de cuaderno.",
    pains: [
      "Jornales y adelantos en cuaderno",
      "Conflictos al pagar el viernes",
      "Cliente de obra que paga tarde",
      "No saber margen real de la obra",
    ],
    outcomes: [
      "Saldo neto por obrero automático",
      "Liquidación semanal clara",
      "WhatsApp de cobro de hitos",
      "Historial por obra",
    ],
    pasosActivacion: [
      "Activar pool-obra",
      "Alta obreros como clientes",
      "Registrar jornales y adelantos",
      "Liquidar y avisar morosos del dueño",
    ],
    upsellSkus: ["core.claver", "intang.ocr_compras"],
  },
  {
    slug: "tienda",
    marca: "Claver Tienda",
    nombre: "Tu tienda en un link",
    lema: "Catálogo, checkout y stock — no solo un link en bio.",
    descripcion:
      "Mini tienda online con slug propio. Mismo stock que el ERP. Para vender desde Instagram sin Tienda Nube aparte.",
    sku: "ECOM-B2C-01",
    precioArs: 34900,
    trialDias: 14,
    modoLite: "pos",
    dashboardPath: "/dashboard/ecommerce",
    publicPath: "/tienda/{slug}",
    publicPathLabel: "Tienda pública",
    procesosReciclados: ["store-config-service", "tienda-storefront", "producto", "webhooks MP"],
    serviciosBackend: [
      "lib/ecommerce/store-config-service.ts",
      "app/tienda/[slug]/page.tsx",
      "app/api/ecommerce/tienda/[slug]/route.ts",
    ],
    listoPct: 70,
    estado: "disponible",
    plataforma: "ambos",
    redesScore: 8,
    impactoScore: 8,
    rubros: ["ropa", "accesorios", "comida artesanal", "retail Instagram"],
    reelHook: "Tu link de Instagram que sí cobra.",
    pains: ["Linktree no vende", "Stock desactualizado en redes", "Pedidos por DM perdidos"],
    outcomes: ["Catálogo con precios reales", "Checkout integrado", "Un solo stock"],
    pasosActivacion: [
      "Activar ECOM-B2C-01",
      "Elegir slug de tienda",
      "Subir productos con foto y precio",
      "Pegar link en bio de Instagram",
    ],
    upsellSkus: ["com.whatsapp", "channel.mercadopago", "core.claver"],
  },
  {
    slug: "presupuestos",
    marca: "Claver Presupuestos",
    nombre: "Presupuesto + link",
    lema: "Armá un presupuesto profesional desde el celu en 30 segundos.",
    descripcion:
      "Cotizaciones con PDF, envío al cliente y conversión a pedido. Para freelancers, oficios y ventas B2B chicas.",
    sku: "core.claver",
    precioArs: 0,
    trialDias: 14,
    modoLite: "pos",
    dashboardPath: "/dashboard/ventas/presupuestos",
    publicPathLabel: "PDF / link al cliente (próximamente)",
    procesosReciclados: ["presupuesto-service", "Presupuesto prisma", "VentasService"],
    serviciosBackend: [
      "lib/ventas/presupuesto-service.ts",
      "app/api/ventas/presupuestos/route.ts",
      "app/dashboard/ventas/presupuestos/page.tsx",
    ],
    listoPct: 60,
    estado: "beta",
    plataforma: "ambos",
    redesScore: 6,
    impactoScore: 8,
    rubros: ["plomero", "pintor", "diseñador", "instalador", "consultor"],
    reelHook: "Presupuesto en la calle, no en Word cuando volvés.",
    pains: ["Presupuestos en Word/Excel", "Cliente que no responde", "Sin seguimiento"],
    outcomes: ["Presupuesto numerado", "Historial por cliente", "Conversión a pedido"],
    pasosActivacion: [
      "Trial con core.claver o pack POS",
      "Alta de clientes y productos/servicios",
      "Crear presupuesto desde ventas",
      "Enviar PDF (link público en roadmap)",
    ],
    upsellSkus: ["fiscal.clavpay_link", "intang.cobranzas_wa"],
  },
  {
    slug: "menu-qr",
    marca: "Claver Menú",
    nombre: "Menú QR",
    lema: "Cambiaste el precio y no tachás más la carta.",
    descripcion:
      "Carta digital con QR para bares y cafés. Actualizás precios en el panel y el comensal ve la carta al instante.",
    sku: "core.claver",
    precioArs: 0,
    trialDias: 14,
    modoLite: "pos",
    dashboardPath: "/dashboard/hospitalidad/platos",
    publicPath: "/menu/{empresaId}",
    publicPathLabel: "Carta QR pública",
    procesosReciclados: ["hospitalidad/platos", "producto.esPlato", "menu-publico API"],
    serviciosBackend: [
      "app/api/hospitalidad/platos/route.ts",
      "app/api/menu-publico/[empresaId]/route.ts",
      "app/menu/[empresaId]/page.tsx",
    ],
    listoPct: 55,
    estado: "beta",
    plataforma: "ambos",
    redesScore: 8,
    impactoScore: 7,
    rubros: ["bar", "café", "restaurante", "food truck"],
    reelHook: "Cambiás el precio acá y el QR ya muestra el nuevo.",
    pains: ["Carta impresa desactualizada", "Inflación y precios tachados", "Sin carta en delivery"],
    outcomes: ["QR imprimible", "Carta mobile-first", "Precios al día"],
    pasosActivacion: [
      "Activar módulo hospitalidad / core",
      "Cargar platos con precio",
      "Imprimir QR a /menu/{empresaId}",
      "Opcional: mesas y comandas después",
    ],
    upsellSkus: ["HOS-MESAS-01", "com.whatsapp"],
  },
  {
    slug: "contenido-ia",
    marca: "Claver Contenido",
    nombre: "Posts IA para tu rubro",
    lema: "30 ideas de contenido para tu marca en un clic.",
    descripcion:
      "Grilla de posts y copies para Instagram/WhatsApp según tu rubro. Motor generativo recurrente.",
    sku: "gen.content.redes_rubro",
    precioArs: 30000,
    trialDias: 14,
    modoLite: "completo",
    dashboardPath: "/dashboard/apps",
    publicPathLabel: "Export PNG/PDF (desde panel)",
    procesosReciclados: ["GENERATIVE_CATALOG", "core.ia", "mkt.redes_programadas"],
    serviciosBackend: ["lib/marketplace/generative-catalog.ts", "lib/ai/*"],
    listoPct: 50,
    estado: "beta",
    plataforma: "ambos",
    redesScore: 9,
    impactoScore: 6,
    rubros: ["cualquier PyME con Instagram", "retail", "gastronomía"],
    reelHook: "Escribí 'vendo zapatillas' y salió el mes de posts.",
    pains: ["No saber qué publicar", "Perfil muerto", "Contratar community caro"],
    outcomes: ["Grilla mensual", "Copies listos", "Consistencia en redes"],
    pasosActivacion: [
      "Activar gen.content.redes_rubro + core.ia",
      "Indicar rubro y tono",
      "Generar grilla",
      "Copiar a Instagram",
    ],
    upsellSkus: ["mkt.pixel_ads", "ECOM-B2C-01"],
  },
  {
    slug: "bot-wa",
    marca: "Claver Bot",
    nombre: "Respuestas automáticas WhatsApp",
    lema: "Respondé clientes mientras empaquetás o dormís.",
    descripcion:
      "Plantillas y respuestas guiadas conectadas al negocio. Base: canal WhatsApp Business + webhooks.",
    sku: "com.whatsapp",
    precioArs: 15000,
    trialDias: 14,
    modoLite: "cobranza",
    dashboardPath: "/dashboard/configuracion",
    publicPathLabel: "Chat WhatsApp",
    procesosReciclados: ["WhatsappService", "webhooks/whatsapp", "plantillas rubro"],
    serviciosBackend: [
      "lib/whatsapp/whatsapp-service.ts",
      "app/api/webhooks/whatsapp/route.ts",
    ],
    listoPct: 35,
    estado: "beta",
    plataforma: "celular",
    redesScore: 9,
    impactoScore: 7,
    rubros: ["tienda Instagram", "comida", "servicios"],
    reelHook: "POV: empaquetás y el celu responde solo.",
    pains: ["200 mensajes sin contestar", "Perder ventas por demora", "No podés desconectar"],
    outcomes: ["Respuestas rápidas", "Plantillas con tu tono", "Menos estrés"],
    pasosActivacion: [
      "Activar com.whatsapp",
      "Vincular número Business / Twilio",
      "Cargar plantillas",
      "Roadmap: intents automáticos",
    ],
    upsellSkus: ["intang.cobranzas_wa", "ECOM-B2C-01"],
  },
  {
    slug: "stock",
    marca: "Claver Stock",
    nombre: "Stock con cámara",
    lema: "Controlá inventario con la cámara del celular.",
    descripcion:
      "Lector de código de barras en POS y ajustes de stock. Sin handheld caro.",
    sku: "core.claver",
    precioArs: 0,
    trialDias: 14,
    modoLite: "pos",
    dashboardPath: "/dashboard/productos",
    procesosReciclados: ["POS", "PosBarcodeCamera", "producto.codigoBarras", "inventario"],
    serviciosBackend: [
      "app/dashboard/pos/page.tsx",
      "components/pos/pos-barcode-camera.tsx",
      "app/api/productos/route.ts",
    ],
    listoPct: 55,
    estado: "beta",
    plataforma: "celular",
    redesScore: 7,
    impactoScore: 7,
    rubros: ["almacén", "kiosco", "depósito chico"],
    reelHook: "Escaneás con el celu viejo y el stock se actualiza.",
    pains: ["Inventario en planilla", "Errores de conteo", "Handheld caro"],
    outcomes: ["Escaneo con cámara", "Stock en tiempo real", "Alertas de quiebre"],
    pasosActivacion: [
      "Activar core.claver",
      "Importar productos CSV o alta manual",
      "Usar cámara en POS",
      "Revisar movimientos en productos",
    ],
    upsellSkus: ["pos.fiado_barrio", "gen.intel.dead_stock"],
  },
  {
    slug: "puntos",
    marca: "Claver Cuota",
    nombre: "Cuotas de socio / gym",
    lema: "Socios, planes y morosos sin cuaderno.",
    descripcion:
      "Planes, membresías y cobro de cuotas para gym de barrio, pilates y clubes. Freemium: Claver Cuota.",
    sku: "niche.gimnasio_barrio",
    skusAdicionales: ["com.whatsapp", "intang.cobranzas_wa"],
    precioArs: 19900,
    trialDias: 14,
    modoLite: "niche",
    dashboardPath: "/dashboard/membresias",
    publicPathLabel: "Identificación por DNI en mostrador",
    procesosReciclados: ["membresias API", "niche.gimnasio", "cuotas", "cliente"],
    serviciosBackend: [
      "app/dashboard/membresias/page.tsx",
      "app/api/membresias/route.ts",
      "lib/niche/niche-apps-catalog.ts",
    ],
    listoPct: 78,
    estado: "disponible",
    plataforma: "ambos",
    redesScore: 8,
    impactoScore: 9,
    rubros: ["gimnasio", "pilates", "club", "cafetería"],
    reelHook: "Cuaderno de socios vs panel de morosos en un toque.",
    pains: ["Cuotas en papel", "Morosos sin avisar", "No saber quién está al día"],
    outcomes: ["Planes claros", "Morosos visibles", "WhatsApp de cuota"],
    pasosActivacion: [
      "Activar niche.gimnasio_barrio",
      "Definir planes y precios",
      "Registrar socios",
      "Cobrar / avisar cuotas",
    ],
    upsellSkus: ["com.whatsapp", "intang.cobranzas_wa", "core.claver"],
  },
  // Portfolio freemium: expensas, renta, seña, caja, abono, reactiva, ruta (+ aliases)
  ...(microSaasSubSaasToAppend(
    new Set([
      "pos",
      "cobra",
      "fiado",
      "turnos",
      "puntos",
      "tienda",
      "presupuestos",
      "menu-qr",
      "contenido-ia",
      "bot-wa",
      "stock",
      "monotributo",
      "servicios",
      "obra",
      "propiedad",
    ]),
  ) as SubSaasApp[]),
]

export const SUB_SAAS_SLUGS = SUB_SAAS_APPS.map((a) => a.slug) as readonly string[]

export type SubSaasSlug = (typeof SUB_SAAS_SLUGS)[number]

/**
 * Orden comercial marketplace /claver/apps:
 * home combate → resto combate → resto disponibles → beta.
 */
export const SUB_SAAS_MARKETPLACE_ORDER = [
  "fiado",
  "cobra",
  "turnos",
  "puntos",
  "expensas",
  "renta",
  "sena",
  "ruta",
  "caja",
  "abono",
  "reactiva",
  "pos",
  "monotributo",
  "servicios",
  "propiedad",
  "obra",
  "tienda",
  "presupuestos",
  "menu-qr",
  "stock",
  "bot-wa",
  "contenido-ia",
] as const satisfies readonly SubSaasSlug[]

/** Slugs destacados en home y marketplace (orden comercial freemium). */
export const SUB_SAAS_DESTACADOS = [
  "fiado",
  "cobra",
  "turnos",
  "puntos",
  "expensas",
  "ruta",
  "sena",
  "caja",
  "renta",
] as const satisfies readonly SubSaasSlug[]

/** Apps con motor usable hoy (no beta / no próximamente). */
export function isSubSaasFuncionalActiva(app: SubSaasApp): boolean {
  return app.estado === "disponible" && app.listoPct >= 65
}

export function sortSubSaasForMarketplace(apps: SubSaasApp[]): SubSaasApp[] {
  const order = new Map(SUB_SAAS_MARKETPLACE_ORDER.map((s, i) => [s, i]))
  return [...apps].sort((a, b) => {
    const ia = order.has(a.slug as any) ? order.get(a.slug as any)! : 1000
    const ib = order.has(b.slug as any) ? order.get(b.slug as any)! : 1000
    if (ia !== ib) return ia - ib
    const fa = isSubSaasFuncionalActiva(a) ? 0 : a.estado === "beta" ? 1 : 2
    const fb = isSubSaasFuncionalActiva(b) ? 0 : b.estado === "beta" ? 1 : 2
    return fa - fb || a.nombre.localeCompare(b.nombre, "es")
  })
}

export function subSaasMarketplaceGroups(): {
  activas: SubSaasApp[]
  beta: SubSaasApp[]
  proximamente: SubSaasApp[]
} {
  const ordered = sortSubSaasForMarketplace(SUB_SAAS_APPS)
  return {
    activas: ordered.filter(isSubSaasFuncionalActiva),
    beta: ordered.filter((a) => a.estado === "beta"),
    proximamente: ordered.filter((a) => a.estado === "proximamente"),
  }
}

export function getSubSaasApp(slug: string): SubSaasApp | null {
  return SUB_SAAS_APPS.find((a) => a.slug === slug) ?? null
}

export function subSaasActivarHref(app: SubSaasApp): string {
  return activarSkuHref(app.sku)
}

export function subSaasLandingHref(slug: string): string {
  return `/claver/apps/${slug}`
}

export function subSaasHrefBySku(sku: string): string | null {
  const app = SUB_SAAS_APPS.find((a) => a.sku === sku || a.skusAdicionales?.includes(sku))
  return app ? subSaasLandingHref(app.slug) : null
}

export function subSaasDestacadas(): SubSaasApp[] {
  return SUB_SAAS_DESTACADOS.map((slug) => getSubSaasApp(slug)).filter(Boolean) as SubSaasApp[]
}

export function formatPublicPath(app: SubSaasApp, ids: { empresaId?: number; slug?: string }): string | null {
  if (!app.publicPath) return null
  let path = app.publicPath
  if (ids.empresaId != null) path = path.replace("{empresaId}", String(ids.empresaId))
  if (ids.slug) path = path.replace("{slug}", ids.slug)
  if (path.includes("{")) return null
  return path
}

