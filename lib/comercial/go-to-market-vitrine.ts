import { SUB_SAAS_APPS, type SubSaasApp } from "./sub-saas-catalog"

export const COMBATE_APPS_SLUGS = [
  "fiado",
  "cobra",
  "monotributo",
  "servicios",
  "obra",
  "propiedad",
  "turnos",
  "pos",
] as const

export type CombateAppSlug = (typeof COMBATE_APPS_SLUGS)[number]

export const COMBATE_APPS: SubSaasApp[] = COMBATE_APPS_SLUGS.map((slug) => {
  const app = SUB_SAAS_APPS.find((a) => a.slug === slug)
  if (!app) throw new Error(`App de combate no encontrada en catálogo: ${slug}`)
  return app
})

/** Puerta de entrada principal de la home (validar con tráfico antes de rotar). */
export const ENTRY_DOOR_SLUG = "fiado" as const

export interface ProductEntryStep {
  step: number
  title: string
  description: string
}

export interface ProductEntryConfig {
  slug: CombateAppSlug
  badge: string
  h1: string
  subtitle: string
  ctaPrimary: string
  ctaSecondary: string
  ctaPrimaryActivar: string
  demoHref: string
  trustBullets: readonly string[]
  steps: readonly ProductEntryStep[]
  testimonial: { quote: string; author: string; role: string }
  benefits: readonly { value: string; label: string }[]
  preview: { title: string; description: string }
  stepsIntro: string
  finalCta: { title: string; subtitle: string }
  ecosistemaSubtitle: string
  seo: { title: string; keywords: readonly string[] }
}

export const FIADO_ENTRY: ProductEntryConfig = {
  slug: "fiado",
  badge: "Claver Fiado · Comercios de barrio",
  h1: "¿Todavía anotás el fiado en un cuaderno?",
  subtitle:
    "Digitalizá el fiado de tu negocio en minutos, desde el celular y sin cambiar toda tu forma de trabajar.",
  ctaPrimary: "Probar gratis",
  ctaSecondary: "Ver demo",
  ctaPrimaryActivar: "fiado",
  demoHref: "/demo/almacen",
  trustBullets: [
    "Libreta digital en el celular",
    "Sabé quién debe y cuánto",
    "Trial 14 días sin tarjeta",
  ],
  steps: [
    {
      step: 1,
      title: "Creá tu cuenta",
      description: "Registrate en dos minutos. Sin instalación ni llamadas.",
    },
    {
      step: 2,
      title: "Cargá tus clientes",
      description: "Importá o cargá los fiadores de tu barrio con límite de crédito.",
    },
    {
      step: 3,
      title: "Anotá el primer fiado",
      description: "Desde el mostrador o el celular. La libreta se actualiza sola.",
    },
  ],
  testimonial: {
    quote:
      "Antes perdía media hora por día buscando en el cuaderno. Ahora sé quién me debe antes de abrir el mostrador.",
    author: "Diego M.",
    role: "Almacén de barrio · Rosario",
  },
  benefits: [
    { value: "~30 min", label: "menos por día armando la libreta" },
    { value: "En vivo", label: "sabés quién debe y cuánto" },
    { value: "WhatsApp", label: "recordatorios sin llamar uno por uno" },
  ],
  preview: {
    title: "Así se ve tu libreta digital",
    description:
      "Quién te debe, cuánto y si pasó el límite — en una pantalla clara, desde el celular o la PC del mostrador.",
  },
  stepsIntro: "Sin migrar todo tu negocio. Empezás con el fiado y seguís vendiendo.",
  finalCta: {
    title: "Dejá el cuaderno esta semana",
    subtitle: "14 días gratis. Digitalizá el fiado y sumá stock, caja o reportes cuando quieras.",
  },
  ecosistemaSubtitle:
    "Empezá con fiado hoy. Cuando el negocio crezca, activás stock, caja, reportes y más — sin cambiar de plataforma.",
  seo: {
    title: "Claver Fiado · Libreta digital para comercios de barrio",
    keywords: [
      "Claver Fiado",
      "fiado digital",
      "libreta fiado",
      "comercio de barrio",
      "almacén",
      "kiosco",
      "Argentina",
    ],
  },
}

export const COBRA_ENTRY: ProductEntryConfig = {
  slug: "cobra",
  badge: "Claver Cobrá · Recuperá deuda sin llamar",
  h1: "¿Seguís llamando morosos uno por uno?",
  subtitle:
    "Mandá recordatorios por WhatsApp con tono amable, recuperá deuda sin quedar mal vos y seguí vendiendo en el mostrador.",
  ctaPrimary: "Probar gratis",
  ctaSecondary: "Ver demo",
  ctaPrimaryActivar: "cobra",
  demoHref: "/demo/almacen",
  trustBullets: [
    "Recordatorios automáticos por WhatsApp",
    "Panel de deuda recuperable",
    "Trial 14 días sin tarjeta",
  ],
  steps: [
    {
      step: 1,
      title: "Creá tu cuenta",
      description: "Registrate en minutos. Sin instalación ni configuración técnica.",
    },
    {
      step: 2,
      title: "Cargá clientes con saldo",
      description: "Importá deudores o conectá con tu libreta de fiado existente.",
    },
    {
      step: 3,
      title: "Activá los avisos",
      description: "El sistema les manda el recordatorio. Vos seguís atendiendo el negocio.",
    },
  ],
  testimonial: {
    quote:
      "Dejé de llamar a las 8 de la noche. Los mensajes salen solos y cobro más sin incomodar a nadie en persona.",
    author: "Laura P.",
    role: "Distribuidora · Córdoba",
  },
  benefits: [
    { value: "−70%", label: "menos llamadas incómodas por semana" },
    { value: "En vivo", label: "sabés cuánto podés recuperar" },
    { value: "Link", label: "de pago en el mensaje de WhatsApp" },
  ],
  preview: {
    title: "Así se ve tu panel de cobranza",
    description:
      "Morosos, montos vencidos y mensajes enviados — todo en un panel claro, desde el celular o la PC.",
  },
  stepsIntro: "Sin cambiar tu forma de vender. Activás cobranza y el sistema hace el seguimiento.",
  finalCta: {
    title: "Dejá de perseguir deuda a mano",
    subtitle: "14 días gratis. Recuperá morosos con WhatsApp y sumá fiado, caja o reportes cuando quieras.",
  },
  ecosistemaSubtitle:
    "Empezá con cobranza hoy. Cuando crezcas, activás fiado, factura AFIP, stock y más — en la misma plataforma.",
  seo: {
    title: "Claver Cobrá · Cobranzas por WhatsApp para tu negocio",
    keywords: [
      "Claver Cobrá",
      "cobranzas WhatsApp",
      "recupero de morosos",
      "cuentas por cobrar",
      "recordatorios automáticos",
      "Argentina",
    ],
  },
}

export const PROPIEDAD_ENTRY: ProductEntryConfig = {
  slug: "propiedad",
  badge: "Claver Propiedad · Consorcios e inmobiliaria",
  h1: "¿Seguís liquidando expensas en Excel?",
  subtitle:
    "Administrá consorcios y contratos de alquiler desde un panel. Cobrá morosos por WhatsApp y publicá en portales argentinos sin cargar todo a mano.",
  ctaPrimary: "Probar gratis",
  ctaSecondary: "Ver demo",
  ctaPrimaryActivar: "propiedad",
  demoHref: "/demo/inmobiliaria",
  trustBullets: [
    "Liquidación de expensas en minutos",
    "Morosos con aviso WhatsApp",
    "Trial 14 días sin tarjeta",
  ],
  steps: [
    {
      step: 1,
      title: "Creá tu cuenta",
      description: "Registrate en minutos. Pack Consorcios + Contratos + Cobranza WA.",
    },
    {
      step: 2,
      title: "Cargá edificio y unidades",
      description: "Inquilinos con % de expensa y teléfono para WhatsApp.",
    },
    {
      step: 3,
      title: "Liquidá y cobrá",
      description: "Gastos del mes → expensas automáticas → aviso a morosos.",
    },
  ],
  testimonial: {
    quote:
      "Antes tardaba medio día con la planilla. Ahora liquido, mando los avisos y sigo con otras tareas del edificio.",
    author: "Roberto S.",
    role: "Administrador de consorcios · CABA",
  },
  benefits: [
    { value: "5 min", label: "para liquidar un mes completo" },
    { value: "1 toque", label: "WhatsApp a cada moroso" },
    { value: "3+", label: "portales inmobiliarios conectables" },
  ],
  preview: {
    title: "Así se ve tu panel de propiedad",
    description:
      "Expensas liquidadas, morosos destacados y portales conectados — en una pantalla clara, celular o PC.",
  },
  stepsIntro: "Sin planillas ni carpetas. Empezás con consorcios y sumás portales cuando quieras.",
  finalCta: {
    title: "Dejá el Excel de expensas esta semana",
    subtitle: "14 días gratis. Consorcios, contratos y cobranza WA — portales Zonaprop y ML cuando los necesités.",
  },
  ecosistemaSubtitle:
    "Empezá con expensas hoy. Cuando crezcas, activás ERP completo, factura AFIP e IA de cobranza — sin cambiar de plataforma.",
  seo: {
    title: "Claver Propiedad · Software consorcios e inmobiliaria Argentina",
    keywords: [
      "Claver Propiedad",
      "software consorcios",
      "expensas",
      "administración edificios",
      "inmobiliaria Argentina",
      "Zonaprop",
      "Argenprop",
      "alquileres",
    ],
  },
}

export const MONOTRIBUTO_ENTRY: ProductEntryConfig = {
  slug: "monotributo",
  badge: "Claver Monotributo · Autónomos y freelances",
  h1: "¿Seguís cotizando en Word y cobrando tarde?",
  subtitle:
    "Armá presupuestos desde el celular, emití factura C AFIP y dejá que WhatsApp haga el seguimiento de cobro — sin incomodar a nadie.",
  ctaPrimary: "Probar gratis",
  ctaSecondary: "Ver demo",
  ctaPrimaryActivar: "monotributo",
  demoHref: "/demo/freelance_mt",
  trustBullets: [
    "Presupuesto en 30 segundos",
    "Factura C integrada",
    "Trial 14 días sin tarjeta",
  ],
  steps: [
    { step: 1, title: "Creá tu cuenta", description: "Pack Monotributo: presupuesto + cobranza + WhatsApp." },
    { step: 2, title: "Cargá tu primer cliente", description: "Nombre, teléfono y CUIT si facturás B2B." },
    { step: 3, title: "Cotizá y cobrá", description: "Presupuesto → factura C → recordatorio automático si no pagan." },
  ],
  testimonial: {
    quote: "Antes tardaba una hora en armar el presupuesto y otro día en mandar la factura. Ahora lo hago entre cliente y cliente.",
    author: "Lucía M.",
    role: "Diseñadora independiente · Córdoba",
  },
  benefits: [
    { value: "30 seg", label: "para un presupuesto nuevo" },
    { value: "Factura C", label: "AFIP sin salir del panel" },
    { value: "WA", label: "cobro amable automático" },
  ],
  preview: {
    title: "Así se ve tu panel de monotributista",
    description: "Presupuestos, facturas y cobros pendientes — en una pantalla clara desde el celular.",
  },
  stepsIntro: "Sin Word ni Excel. Empezás cotizando y sumás ERP cuando crezcas.",
  finalCta: {
    title: "Profesionalizá tu monotributo esta semana",
    subtitle: "14 días gratis. Presupuesto, factura C y cobranza WA en un pack.",
  },
  ecosistemaSubtitle:
    "Empezá liviano. Cuando necesités stock, contabilidad o equipo, activás módulos sin migrar de plataforma.",
  seo: {
    title: "Claver Monotributo · Presupuesto y factura C para autónomos",
    keywords: ["monotributo", "factura C", "presupuesto freelance", "autónomo Argentina", "Claver"],
  },
}

export const SERVICIOS_ENTRY: ProductEntryConfig = {
  slug: "servicios",
  badge: "Claver Servicios Pro · Empresas de servicios",
  h1: "¿Tu equipo vive en WhatsApp y Excel a la vez?",
  subtitle:
    "Unificá agenda, presupuestos y cobranza para plomeros, electricistas, IT, limpieza o cualquier empresa de servicios chica.",
  ctaPrimary: "Probar gratis",
  ctaSecondary: "Ver demo",
  ctaPrimaryActivar: "servicios",
  demoHref: "/demo/servicios_pro",
  trustBullets: ["Agenda con link público", "Presupuestos centralizados", "Morosos con WhatsApp"],
  steps: [
    { step: 1, title: "Creá tu cuenta", description: "Pack Servicios Pro con agenda, core y cobranza." },
    { step: 2, title: "Configurá servicios", description: "Profesionales, duración y precios de referencia." },
    { step: 3, title: "Operá en calle", description: "Turno del día + presupuesto en visita + cobro de hitos." },
  ],
  testimonial: {
    quote: "Teníamos tres planillas distintas. Hoy el técnico ve su agenda y la oficina ve quién debe.",
    author: "Marcos T.",
    role: "Frío Sur Instalaciones · Mendoza",
  },
  benefits: [
    { value: "1 panel", label: "agenda + cotizaciones + cobros" },
    { value: "24/7", label: "link de reserva para clientes" },
    { value: "−60%", label: "menos mensajes de coordinación" },
  ],
  preview: {
    title: "Así se ve tu operación de servicios",
    description: "Turnos del día, pipeline de presupuestos y morosos — celular o PC.",
  },
  stepsIntro: "Sin ERP de fábrica. Solo lo que una empresa de servicios usa todos los días.",
  finalCta: {
    title: "Ordená tu empresa de servicios",
    subtitle: "14 días gratis. Agenda, presupuestos y cobranza en un pack.",
  },
  ecosistemaSubtitle: "Sumá IA, stock o logística cuando el negocio escale — mismo tenant.",
  seo: {
    title: "Claver Servicios Pro · Software para empresas de servicios",
    keywords: ["empresa de servicios", "presupuestos", "agenda", "plomería", "electricista", "Argentina"],
  },
}

export const OBRA_ENTRY: ProductEntryConfig = {
  slug: "obra",
  badge: "Claver Obra · Contratistas y refacciones",
  h1: "¿Los viernes liquidás jornales a mano?",
  subtitle:
    "Registrá jornales y adelantos, liquidá con saldo neto por obrero y cobrá hitos al dueño de obra por WhatsApp.",
  ctaPrimary: "Probar gratis",
  ctaSecondary: "Ver demo",
  ctaPrimaryActivar: "obra",
  demoHref: "/demo/contratista_obra",
  trustBullets: ["Liquidación semanal clara", "Adelantos descontados solos", "Cobro de hitos por WA"],
  steps: [
    { step: 1, title: "Creá tu cuenta", description: "Pack Obra: jornales + cobranza + WhatsApp." },
    { step: 2, title: "Alta obreros", description: "Como clientes con teléfono para avisos." },
    { step: 3, title: "Liquidá el viernes", description: "Jornales menos adelantos = pago neto en un toque." },
  ],
  testimonial: {
    quote: "Dejamos de pelear los viernes. Cada uno ve su número y el cliente recibe el aviso del hito.",
    author: "Raúl G.",
    role: "Contratista · Buenos Aires",
  },
  benefits: [
    { value: "5 min", label: "liquidación semanal completa" },
    { value: "0", label: "cuadernos de obra" },
    { value: "WA", label: "cobro de hitos al cliente" },
  ],
  preview: {
    title: "Así se ve tu panel de obra",
    description: "Obreros, jornales, adelantos y lo que debe el cliente — en una sola vista.",
  },
  stepsIntro: "Pensado para la obra chica. Sin planillas ni calculadora los viernes.",
  finalCta: {
    title: "Liquidá obra sin pelea",
    subtitle: "14 días gratis. Jornales, adelantos y cobranza en un pack.",
  },
  ecosistemaSubtitle: "Después sumá compras, OCR de remitos o ERP completo si crecés.",
  seo: {
    title: "Claver Obra · Software para contratistas y jornales",
    keywords: ["contratista", "jornales", "obra", "liquidación obreros", "Argentina", "Claver"],
  },
}

export const TURNOS_ENTRY: ProductEntryConfig = {
  slug: "turnos",
  badge: "Claver Turnos · Salones y consultorios",
  h1: "¿Coordinás turnos por WhatsApp todo el día?",
  subtitle:
    "Compartí un link de reserva. Tus clientes eligen horario solos y reciben recordatorio automático — sin idas y vueltas.",
  ctaPrimary: "Probar gratis",
  ctaSecondary: "Ver demo",
  ctaPrimaryActivar: "turnos",
  demoHref: "/demo/salon_belleza",
  trustBullets: [
    "Link de reserva 24/7",
    "Menos mensajes para coordinar",
    "Trial 14 días sin tarjeta",
  ],
  steps: [
    {
      step: 1,
      title: "Creá tu cuenta",
      description: "Registrate en minutos. Sin app para instalar en el celular del cliente.",
    },
    {
      step: 2,
      title: "Cargá servicios y horarios",
      description: "Profesionales, duración de cada servicio y franjas disponibles.",
    },
    {
      step: 3,
      title: "Compartí tu link",
      description: "Pegalo en Instagram, WhatsApp o QR en el local. El cliente reserva solo.",
    },
  ],
  testimonial: {
    quote:
      "Antes eran diez audios para un turno. Ahora mando el link y la agenda se llena sola mientras atiendo.",
    author: "Carolina R.",
    role: "Salón de belleza · Buenos Aires",
  },
  benefits: [
    { value: "24/7", label: "reservas aunque estés atendiendo" },
    { value: "−40%", label: "menos no-shows con recordatorio" },
    { value: "1 link", label: "para Instagram, WhatsApp y QR" },
  ],
  preview: {
    title: "Así se ve tu agenda online",
    description:
      "Turnos del día, huecos libres y reservas del link público — en una pantalla clara, celular o PC.",
  },
  stepsIntro: "Sin pelear por WhatsApp. Empezás con turnos y seguís atendiendo.",
  finalCta: {
    title: "Dejá de coordinar turnos a mano",
    subtitle: "14 días gratis. Agenda online y sumá cobranza, tienda o reportes cuando quieras.",
  },
  ecosistemaSubtitle:
    "Empezá con turnos hoy. Cuando el negocio crezca, activás cobranza, factura, ecommerce y más — sin cambiar de plataforma.",
  seo: {
    title: "Claver Turnos · Agenda online y recordatorios automáticos",
    keywords: [
      "Claver Turnos",
      "turnero online",
      "agenda salón",
      "turnos veterinaria",
      "reservas WhatsApp",
      "consultorio",
      "Argentina",
    ],
  },
}

export const POS_ENTRY: ProductEntryConfig = {
  slug: "pos",
  badge: "Claver POS — Mostrador y Kiosco",
  h1: "Facturá a la velocidad de la luz",
  subtitle: "Punto de venta táctil, rápido y sin cortes. Funciona en PC, tablet o celular.",
  ctaPrimary: "Probar gratis",
  ctaSecondary: "Ver demo",
  ctaPrimaryActivar: "pos",
  demoHref: "/demo/kiosco",
  trustBullets: ["Compatible con lectoras de barra", "Ticket AFIP en 1 clic", "Modo Offline"],
  steps: [
    { step: 1, title: "Armá tu catálogo", description: "Cargá tus productos estrella en minutos." },
    { step: 2, title: "Conectá tus dispositivos", description: "Usá tu PC actual o celular, sin hardware caro." },
    { step: 3, title: "Empezá a cobrar", description: "Pantalla táctil optimizada para filas rápidas." },
  ],
  testimonial: {
    quote: "Antes se armaba fila en hora pico. Ahora toco la pantalla y sale el ticket. Cambió todo.",
    author: "Martín R.",
    role: "Kiosco 24hs",
  },
  benefits: [
    { value: "3 seg", label: "por ticket impreso" },
    { value: "Offline", label: "seguís cobrando sin internet" },
    { value: "AFIP", label: "integrado automáticamente" },
  ],
  preview: {
    title: "Así se ve tu nueva caja",
    description: "Panel táctil a la izquierda, ticket en vivo a la derecha. Toca los productos para probarlo ahora mismo.",
  },
  stepsIntro: "Sin instalaciones complejas ni servidores.",
  finalCta: { title: "Modernizá tu mostrador hoy", subtitle: "14 días gratis de prueba completa." },
  ecosistemaSubtitle: "Empezá por la caja. Luego sumá control de stock, compras y proveedores.",
  seo: {
    title: "Claver POS — Punto de Venta y Caja Rápida",
    keywords: ["Punto de venta", "POS Argentina", "Software para Kioscos"],
  },
}

export const PRODUCT_ENTRIES: Record<CombateAppSlug, ProductEntryConfig> = {
  fiado: FIADO_ENTRY,
  cobra: COBRA_ENTRY,
  monotributo: MONOTRIBUTO_ENTRY,
  servicios: SERVICIOS_ENTRY,
  obra: OBRA_ENTRY,
  propiedad: PROPIEDAD_ENTRY,
  turnos: TURNOS_ENTRY,
  pos: POS_ENTRY,
}

export function getProductEntry(slug: string): ProductEntryConfig | null {
  if (slug in PRODUCT_ENTRIES) return PRODUCT_ENTRIES[slug as CombateAppSlug]
  return null
}

export function isCombateAppSlug(slug: string): slug is CombateAppSlug {
  return COMBATE_APPS_SLUGS.includes(slug as CombateAppSlug)
}

/** Otras puertas de entrada (landings por rubro en fase 2). */
export const FUTURE_ENTRY_DOORS = [
  {
    slug: "stock",
    rubro: "Ferreterías y almacenes",
    h1: "Controlá tu stock desde el celular.",
    href: "/demo/almacen",
  },
  {
    slug: "propiedad",
    rubro: "Administradores de consorcios",
    h1: "Gestioná expensas y reclamos sin planillas.",
    href: "/claver/apps/propiedad",
  },
] as const

export const ECOSISTEMA_CAPACIDADES = [
  { label: "Stock", href: "/claver/claverp", hint: "Multi-depósito y alertas" },
  { label: "Caja diaria", href: "/claver/claverp", hint: "Turnos y arqueo" },
  { label: "Expensas", href: "/claver/apps/propiedad", hint: "Consorcios y avisos" },
  { label: "Monotributo", href: "/claver/apps/monotributo", hint: "Presupuesto y factura C" },
  { label: "Servicios", href: "/claver/apps/servicios", hint: "Agenda y cotizaciones" },
  { label: "Obra", href: "/claver/apps/obra", hint: "Jornales y liquidación" },
  { label: "Turnos", href: "/claver/apps/turnos", hint: "Agenda y reservas" },
  { label: "Automatizaciones", href: "/claver/apps", hint: "WhatsApp y alertas" },
  { label: "Reportes", href: "/claver/claverp", hint: "Ventas y morosos" },
  { label: "Dashboards", href: "/claver/claverp", hint: "KPIs por rol" },
] as const

export const GTM_VITRINE_COPY = {
  heroTagline: FIADO_ENTRY.h1,
  heroDescription: FIADO_ENTRY.subtitle,
  combateTitle: "Productos de Combate",
  combateSubtitle: "Soluciones simples, rápidas y efectivas para tu día a día.",
  verCatalogoLabel: "Ver catálogo completo (ERP)",
  ecosistemaTitle: "Claver también puede ayudarte con",
  ecosistemaSubtitle: FIADO_ENTRY.ecosistemaSubtitle,
}

export function combateLandingMetadata(slug: CombateAppSlug) {
  const entry = PRODUCT_ENTRIES[slug]
  return {
    title: entry.seo.title,
    description: `${entry.subtitle} Trial 14 días. ${entry.trustBullets.join(". ")}.`,
    keywords: [...entry.seo.keywords],
  }
}

/** @deprecated Usar combateLandingMetadata("fiado") */
export function fiadoLandingMetadata() {
  return combateLandingMetadata("fiado")
}
