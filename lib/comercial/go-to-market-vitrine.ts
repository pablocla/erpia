import { SUB_SAAS_APPS, type SubSaasApp } from "./sub-saas-catalog"

export const COMBATE_APPS_SLUGS = [
  "oficios",
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

/** Puerta de entrada principal de la home: Claver Oficios & Obras. */
export const ENTRY_DOOR_SLUG = "oficios" as const

/**
 * Tres productos de combate above-the-fold en home.
 * Oficios / Fiado / Turnos — el resto vive en catálogo y mega menú.
 */
export const HOME_COMBATE_SLUGS = ["oficios", "fiado", "turnos"] as const

export type HomeDolorSlug = (typeof HOME_COMBATE_SLUGS)[number]

export const HOME_DOLOR_CHIPS: readonly { slug: HomeDolorSlug; label: string; hint: string }[] = [
  { slug: "oficios", label: "Oficios & Obras", hint: "Presupuestos y Señas" },
  { slug: "fiado", label: "Fiado", hint: "Libreta gratis" },
  { slug: "turnos", label: "Turnos", hint: "Link de reserva" },
] as const

export const HOME_DOLOR_STORAGE_KEY = "claver_home_dolor"
/** CustomEvent name para alinear CTAs del shell con el dolor de la home. */
export const HOME_DOLOR_EVENT = "claver:home-dolor"

export function isHomeDolorSlug(value: string | null | undefined): value is HomeDolorSlug {
  return !!value && (HOME_COMBATE_SLUGS as readonly string[]).includes(value)
}

/** Resuelve ?dolor= de la home. Default: oficios. */
export function resolveHomeDolor(raw: string | null | undefined): HomeDolorSlug {
  if (isHomeDolorSlug(raw)) return raw
  return ENTRY_DOOR_SLUG
}

/** Apps de combate que se muestran en la home (3). */
export function homeCombateApps(): SubSaasApp[] {
  return HOME_COMBATE_SLUGS.map((slug) => {
    const app = COMBATE_APPS.find((a) => a.slug === slug)
    if (!app) throw new Error(`Home combate app no encontrada: ${slug}`)
    return app
  })
}

/** Mensaje de WhatsApp prellenado según el dolor activo en home. */
export function ventasWhatsappMessage(dolor: HomeDolorSlug): string {
  const app = COMBATE_APPS.find((a) => a.slug === dolor)
  const marca = app?.marca ?? "Claver"
  if (dolor === "oficios") {
    return `Hola Claver, quiero probar ${marca} (presupuestos en 3 niveles y señas) en mis obras y trabajos.`
  }
  if (dolor === "fiado") {
    return `Hola Claver, quiero probar ${marca} (libreta de fiado) en mi comercio.`
  }
  return `Hola Claver, quiero probar ${marca} (turnero online) en mi negocio.`
}

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

export const OFICIOS_ENTRY: ProductEntryConfig = {
  slug: "oficios",
  badge: "Claver Oficios & Obras · Presupuestos y Cobros en Obra",
  h1: "Dejá el cuaderno sucio y las cotizaciones por audio. Manejá tus obras y cobros desde el celular.",
  subtitle:
    "Cotizaciones en 3 niveles en 30 segundos, cobro de seña con Mercado Pago, fotos antes/después y hoja de ruta para tu cuadrilla por WhatsApp.",
  ctaPrimary: "Probar Oficios gratis",
  ctaSecondary: "Ver demo de presupuesto",
  ctaPrimaryActivar: "oficios",
  demoHref: "/demo/contratista_obra",
  trustBullets: [
    "Cobro de seña con Mercado Pago",
    "Liquidación de cuadrilla sin peleas",
    "Contratos con firma en pantalla",
  ],
  steps: [
    {
      step: 1,
      title: "Creá tu cuenta en 1 minuto",
      description: "Elegí tu oficio (plomería, electricidad, obra, clima) y conectá tu Mercado Pago.",
    },
    {
      step: 2,
      title: "Armá tu primer presupuesto",
      description: "Dictalo por voz o tocalo en 3 niveles (Básico, Recomendado, Premium).",
    },
    {
      step: 3,
      title: "Mandalo por WhatsApp y cobrá la seña",
      description: "El cliente aprueba con 1 tap y te paga la seña directo a tu cuenta.",
    },
  ],
  testimonial: {
    quote:
      "Antes mandaba audios largos y me regateaban. Ahora mando el link en 3 niveles con cobro de seña por Mercado Pago y cierro un 30% más de trabajos.",
    author: "Carlos P.",
    role: "Instalador & Plomero Matriculado · Córdoba",
  },
  benefits: [
    { value: "30 seg", label: "para cotizar desde la obra" },
    { value: "En mano", label: "seña asegurada por Mercado Pago" },
    { value: "WhatsApp", label: "hoja de ruta del día a tu cuadrilla" },
  ],
  preview: {
    title: "Así se ve tu presupuesto interactivo",
    description:
      "Opciones en 3 niveles, fotos antes y después, botón de Mercado Pago y firma digital.",
  },
  stepsIntro: "En tres pasos tenés tu primer presupuesto profesional listo en el celular.",
  finalCta: {
    title: "Empezá a presupuestar y cobrar como una empresa grande",
    subtitle: "Probá Claver Oficios 7 días gratis. Si no cerrás un presupuesto, no pagás nada.",
  },
  ecosistemaSubtitle:
    "Empezá por presupuestos y señas. Después podés activar cuadrilla, facturación AFIP y control de materiales.",
  seo: {
    title: "Claver Oficios · Presupuestos, señas Mercado Pago y cuadrilla para profesionales",
    keywords: [
      "Claver Oficios",
      "presupuestos plomero",
      "presupuestos electricista",
      "jornales albañil",
      "contratista obra",
      "seña Mercado Pago",
      "Argentina",
    ],
  },
}

export const FIADO_ENTRY: ProductEntryConfig = {
  slug: "fiado",
  badge: "Claver Fiado · Gratis para siempre",
  h1: "¿Todavía anotás el fiado en un cuaderno?",
  subtitle:
    "Libreta digital en el celular: quién debe, cuánto y el límite de cada cliente. Anotás y cobrás en segundos, sin Excel ni papel.",
  ctaPrimary: "Usar Fiado gratis",
  ctaSecondary: "Ver demo",
  ctaPrimaryActivar: "fiado",
  demoHref: "/demo/almacen",
  trustBullets: [
    "Gratis para siempre",
    "Quién debe y cuánto, en vivo",
    "Funciona en el celular",
  ],
  steps: [
    {
      step: 1,
      title: "Creá tu cuenta",
      description: "Dos minutos. Sin instalación ni tarjeta.",
    },
    {
      step: 2,
      title: "Cargá tus clientes",
      description: "Nombre, teléfono y límite de crédito por persona.",
    },
    {
      step: 3,
      title: "Anotá el primer fiado",
      description: "Desde el mostrador o el celu. La libreta se actualiza sola.",
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
      "Deuda por cliente, límites y cobros — una pantalla clara en el celular o en la PC del mostrador.",
  },
  stepsIntro: "En tres pasos tenés la libreta lista y seguís vendiendo.",
  finalCta: {
    title: "Pasá la libreta al celular esta semana",
    subtitle: "Claver Fiado es gratis para siempre. Probá Cobrá, turnos o POS 14 días cuando quieras.",
  },
  ecosistemaSubtitle:
    "La libreta es gratis. Después podés activar Cobrá por WhatsApp, stock, caja y reportes en la misma cuenta.",
  seo: {
    title: "Claver Fiado · Libreta digital gratis para comercios",
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
  badge: "Claver Cobrá · WhatsApp + panel de deuda",
  h1: "¿Seguís llamando morosos uno por uno?",
  subtitle:
    "Recordatorios por WhatsApp con tono amable, panel de lo recuperable y link de pago. Vos atendés el negocio; el seguimiento corre solo.",
  ctaPrimary: "Probar Cobrá 14 días",
  ctaSecondary: "Ver demo",
  ctaPrimaryActivar: "cobra",
  demoHref: "/demo/almacen",
  trustBullets: [
    "Avisos por WhatsApp",
    "Panel de deuda en vivo",
    "14 días sin tarjeta",
  ],
  steps: [
    {
      step: 1,
      title: "Creá tu cuenta",
      description: "Minutos. Sin instalación ni armado técnico.",
    },
    {
      step: 2,
      title: "Cargá clientes con saldo",
      description: "Importá deudores o usá la libreta de fiado si ya la tenés.",
    },
    {
      step: 3,
      title: "Activá los avisos",
      description: "Se envían los recordatorios. Vos seguís en el mostrador.",
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
      "Vencidos, montos y mensajes enviados — en una pantalla clara, celular o PC.",
  },
  stepsIntro: "Activás cobranza y el seguimiento corre mientras vendés.",
  finalCta: {
    title: "Recuperá deuda sin perseguir a nadie",
    subtitle: "14 días gratis. WhatsApp + panel. Sumá Fiado o POS cuando te sirva.",
  },
  ecosistemaSubtitle:
    "Cobrá se integra con Fiado, caja y facturación cuando los actives — en la misma cuenta.",
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
  ecosistemaSubtitle: "Después podés sumar compras, OCR de remitos u otras apps en la misma cuenta.",
  seo: {
    title: "Claver Obra · Software para contratistas y jornales",
    keywords: ["contratista", "jornales", "obra", "liquidación obreros", "Argentina", "Claver"],
  },
}

export const TURNOS_ENTRY: ProductEntryConfig = {
  slug: "turnos",
  badge: "Claver Turnos · Salones, barberías y consultorios",
  h1: "¿Coordinás turnos por WhatsApp todo el día?",
  subtitle:
    "Un link de reserva 24/7: el cliente elige horario y recibe recordatorio. Menos audios, menos no-shows, más tiempo para atender.",
  ctaPrimary: "Probar Turnos 14 días",
  ctaSecondary: "Ver demo",
  ctaPrimaryActivar: "turnos",
  demoHref: "/demo/salon_belleza",
  trustBullets: [
    "Link de reserva 24/7",
    "Menos idas y vueltas por chat",
    "14 días sin tarjeta",
  ],
  steps: [
    {
      step: 1,
      title: "Creá tu cuenta",
      description: "Minutos. El cliente no instala nada.",
    },
    {
      step: 2,
      title: "Cargá servicios y horarios",
      description: "Profesionales, duración y franjas disponibles.",
    },
    {
      step: 3,
      title: "Compartí tu link",
      description: "Instagram, WhatsApp o QR en el local. Reservan solos.",
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
      "Turnos del día, huecos y reservas del link público — celular o PC.",
  },
  stepsIntro: "En tres pasos tenés agenda pública y seguís atendiendo.",
  finalCta: {
    title: "Dejá de coordinar turnos a mano",
    subtitle: "14 días gratis. Link de reserva + recordatorios. Sumá Cobrá u otras apps cuando quieras.",
  },
  ecosistemaSubtitle:
    "Turnos convive con Cobrá, facturación y más en la misma cuenta cuando los actives.",
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
  oficios: OFICIOS_ENTRY,
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

/**
 * Copy de la vitrine home — comercial y funcional.
 * Sin marco “dolor → sistema/ERP” y sin renombrar productos.
 */
export const GTM_VITRINE_COPY = {
  heroTagline: FIADO_ENTRY.h1,
  heroDescription: FIADO_ENTRY.subtitle,
  combateTitle: "Elegí cómo empezar",
  combateSubtitle:
    "Precios en pesos, trial 14 días sin tarjeta. Activás en minutos desde el celular o la PC.",
  combateHeadingId: "combate-heading",
  packsHomeTitle: "Packs por rubro, precio cerrado",
  packsHomeSubtitle:
    "Listos para almacén, kiosco, servicios y más. Un pack, varias funciones, una sola factura.",
  verCatalogoLabel: "Ver todos los packs y apps",
  ecosistemaTitle: "También podés sumar",
  ecosistemaSubtitle: FIADO_ENTRY.ecosistemaSubtitle,
  collapsibleTitle: "Demos y más opciones",
  collapsibleSubtitle: "Probá con datos de ejemplo o explorá el catálogo completo.",
  trustBarTitle: "Hecho para comercios en Argentina",
  trustItems: [
    { label: "14 días de prueba", hint: "Sin tarjeta" },
    { label: "Factura AFIP", hint: "Cuando la actives" },
    { label: "Celular y PC", hint: "Sin instalar" },
    { label: "Precios en ARS", hint: "Cancelás cuando quieras" },
  ],
  heroMicrocopy: "Sin tarjeta · Cancelás cuando quieras · Soporte en español",
  ctaProbar: "Probar gratis",
  ctaVerProductos: "Ver productos",
  ctaVerPack: "Ver pack",
  badgeGratis: "Gratis",
  badgeElegido: "En pantalla",
  badgeTrial: "14 días gratis",
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

// --- US LOCALIZATION ---

export const HOME_DOLOR_CHIPS_US: readonly { slug: HomeDolorSlug; label: string; hint: string }[] = [
  { slug: "fiado", label: "House Tabs", hint: "Free app" },
  { slug: "cobra", label: "Collect", hint: "SMS Reminders" },
  { slug: "turnos", label: "Bookings", hint: "Public link" },
] as const

export const GTM_VITRINE_COPY_US = {
  heroTagline: "Still using a notebook for house accounts?",
  heroDescription: "Digital tabs on your phone. See who owes what and set credit limits. Track debt and collect in seconds, without Excel or paper.",
  combateTitle: "Choose where to start",
  combateSubtitle: "14-day free trial, no credit card required. Setup in minutes from your phone or PC.",
  combateHeadingId: "combate-heading",
  packsHomeTitle: "Industry packs, simple pricing",
  packsHomeSubtitle: "Ready for local grocers, service pros, and more. One pack, all features, one bill.",
  verCatalogoLabel: "See all apps and packs",
  ecosistemaTitle: "You can also add",
  ecosistemaSubtitle: "The House Tabs app is forever free. Later, you can activate SMS Collections, Inventory, and POS on the same account.",
  collapsibleTitle: "Demos and more options",
  collapsibleSubtitle: "Try with sample data or explore the full catalog.",
  trustBarTitle: "Built for local businesses",
  trustItems: [
    { label: "14-day trial", hint: "No card needed" },
    { label: "Phone and PC", hint: "No installation" },
    { label: "Cancel anytime", hint: "No contracts" },
    { label: "Local support", hint: "We are here" },
  ],
  heroMicrocopy: "No credit card · Cancel anytime · Fast support",
  ctaProbar: "Start Free Trial",
  ctaVerProductos: "See Products",
  ctaVerPack: "See Pack",
  badgeGratis: "Free",
  badgeElegido: "On screen",
  badgeTrial: "14-day free",
}

export const PRODUCT_ENTRIES_US: Record<CombateAppSlug, ProductEntryConfig> = {
  ...PRODUCT_ENTRIES, // fallback for non-home ones for now
  fiado: {
    ...FIADO_ENTRY,
    badge: "Claver House Tabs · Free forever",
    h1: "Still using a notebook for house accounts?",
    subtitle: "Digital tabs on your phone. See who owes what and set credit limits. Track debt and collect in seconds, without Excel or paper.",
    ctaPrimary: "Use House Tabs free",
    ctaSecondary: "Watch demo",
    trustBullets: ["Free forever", "Live debt tracking", "Works on mobile"],
    steps: [
      { step: 1, title: "Create account", description: "Two minutes. No installation." },
      { step: 2, title: "Add customers", description: "Name, phone, and credit limit." },
      { step: 3, title: "Record first tab", description: "From the counter or your phone. Updates instantly." },
    ],
    testimonial: {
      quote: "I used to lose half an hour a day searching the notebook. Now I know exactly who owes me before they even reach the counter.",
      author: "Diego M.",
      role: "Local Grocer"
    },
    benefits: [
      { value: "~30 min", label: "saved every day" },
      { value: "Live", label: "tracking of who owes what" },
      { value: "SMS", label: "reminders without calling" },
    ],
    preview: { title: "Your digital notebook", description: "Debt by customer, limits, and payments — a clear view on your phone or PC." },
    stepsIntro: "Three steps and your tabs are ready.",
    finalCta: { title: "Move your notebook to your phone", subtitle: "House Tabs is free forever. Try SMS Collections, Bookings, or POS 14 days free." },
    ecosistemaSubtitle: "The House Tabs app is free. You can add SMS Collections, Inventory, and POS later on the same account."
  },
  cobra: {
    ...COBRA_ENTRY,
    badge: "Claver Collect · SMS + Debt Dashboard",
    h1: "Still calling late payers one by one?",
    subtitle: "Friendly SMS reminders, live debt dashboard, and payment links. You run the business; collections run automatically.",
    ctaPrimary: "Try Collect 14 days",
    ctaSecondary: "Watch demo",
    trustBullets: ["SMS Reminders", "Live debt dashboard", "14-day free trial"],
    steps: [
      { step: 1, title: "Create account", description: "Minutes. No technical setup." },
      { step: 2, title: "Import balances", description: "Add debtors or use House Tabs if you already have it." },
      { step: 3, title: "Turn on reminders", description: "Messages send automatically. You stay at the counter." },
    ],
    testimonial: {
      quote: "I stopped calling at 8 PM. The messages go out automatically and I collect more without awkward conversations.",
      author: "Laura P.",
      role: "Distributor"
    },
    benefits: [
      { value: "-70%", label: "fewer awkward calls per week" },
      { value: "Live", label: "view of recoverable debt" },
      { value: "Link", label: "payment links inside SMS" },
    ],
    preview: { title: "Your collections dashboard", description: "Overdue tabs, amounts, and sent messages — clear on any screen." },
    stepsIntro: "Turn on collections and the follow-ups run while you sell.",
    finalCta: { title: "Recover debt without chasing anyone", subtitle: "14 days free. SMS + dashboard. Add House Tabs or POS anytime." },
    ecosistemaSubtitle: "Collect integrates with House Tabs, POS, and Billing whenever you need them — all in one account."
  },
  turnos: {
    ...TURNOS_ENTRY,
    badge: "Claver Bookings · Salons, barbers & pros",
    h1: "Coordinating appointments on WhatsApp all day?",
    subtitle: "A 24/7 public booking link: clients pick their time and get SMS reminders. Less chatting, fewer no-shows, more time working.",
    ctaPrimary: "Try Bookings 14 days",
    ctaSecondary: "Watch demo",
    trustBullets: ["24/7 booking link", "Fewer chat interruptions", "14-day free trial"],
    steps: [
      { step: 1, title: "Create account", description: "Minutes. Clients don't need to install anything." },
      { step: 2, title: "Add services & hours", description: "Staff, duration, and availability slots." },
      { step: 3, title: "Share your link", description: "Instagram, SMS, or QR in store. They book themselves." },
    ],
    testimonial: {
      quote: "It used to take ten messages to book a single slot. Now I just send the link and my calendar fills up while I work.",
      author: "Carolina R.",
      role: "Beauty Salon"
    },
    benefits: [
      { value: "24/7", label: "bookings even when you're busy" },
      { value: "-40%", label: "fewer no-shows with reminders" },
      { value: "1 link", label: "for Instagram, SMS, and QR" },
    ],
    preview: { title: "Your online calendar", description: "Today's schedule, gaps, and public bookings — on phone or PC." },
    stepsIntro: "Three steps to your public calendar.",
    finalCta: { title: "Stop coordinating manually", subtitle: "14 days free. Booking link + reminders. Add Collect or other apps anytime." },
    ecosistemaSubtitle: "Bookings lives alongside Collect, POS, and more in the same account."
  }
}
