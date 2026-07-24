/**
 * Guías de experiencia por app — empaquetado e intuitividad post-login.
 */

import { getIndustryTemplate, type IndustryTemplate } from "@/lib/comercial/industry-templates"
import { getNicheApp } from "@/lib/niche/niche-apps-catalog"
import { getSubSaasApp } from "@/lib/comercial/sub-saas-catalog"
import type { NicheAppDefinition } from "@/lib/niche/types"

export interface AppExperienceGuide {
  emoji: string
  title: string
  subtitle: string
  wowMoment: string
  steps: string[]
  primaryAction?: { label: string; href: string }
  secondaryActions?: { label: string; href: string }[]
}

const INDUSTRY_STEPS: Partial<Record<string, string[]>> = {
  almacen: [
    "Revisá quién te debe en la libreta fiado",
    "Anotá un fiado desde el POS en 2 toques",
    "Mandá recordatorio por WhatsApp al moroso",
  ],
  kiosco: [
    "Mirá deudores del barrio en Libreta Fiado",
    "Vendé mostrador con caja rápida",
    "Controlá stock de golosinas y bebidas",
  ],
  prestamista: [
    "Revisá deudores y cuotas en la libreta",
    "Registrá un nuevo préstamo desde Clientes",
    "Cobrá cuota y actualizá el saldo",
  ],
  consorcios_admin: [
    "Creá el edificio y las unidades",
    "Cargá gastos del mes por rubro",
    "Liquidá expensas y avisá por WhatsApp",
  ],
  salon_belleza: [
    "Configurá profesionales y servicios",
    "Agendá el primer turno del día",
    "Compartí el link web para que reserven solas",
  ],
  gimnasio: [
    "Revisá socios y cuotas vencidas",
    "Registrá un pago de membresía",
    "Reclamá morosos por WhatsApp",
  ],
  veterinaria: [
    "Abrí la historia clínica de una mascota",
    "Agendá turno de consulta",
    "Cobrá mostrador con productos + servicio",
  ],
  bar_restaurant: [
    "Mirá mesas y comandas en cocina",
    "Tomá pedido en salón o delivery",
    "Cerrá caja del turno",
  ],
}

const NICHE_STEPS: Partial<Record<string, string[]>> = {
  consorcios: [
    "Alta del consorcio y unidades con %",
    "Gastos del período (limpieza, luz, etc.)",
    "Liquidar y avisar inquilinos",
  ],
  prestamista: [
    "Lista de deudores con saldo",
    "Nuevo cliente con límite de crédito",
    "Cobro de cuota desde la libreta",
  ],
  peluqueria: [
    "Registrá turno o servicio del día",
    "Marcá cobrado cuando paga la clienta",
    "Recordatorio WhatsApp 24hs antes",
  ],
  gimnasio: [
    "Socios con cuota al día / vencida",
    "Registrar pago de cuota mensual",
    "WhatsApp a morosos antes de cortar acceso",
  ],
  salon: [
    "Nuevo evento con seña y saldo",
    "Seguimiento de saldo pendiente",
    "Aviso por WhatsApp al cliente",
  ],
  consultorio: [
    "Agenda semanal por profesional",
    "Confirmá o cancelá turnos",
    "Compartí link público de reservas",
  ],
  club: [
    "Socios del club y estado de cuota",
    "Registrar cuota del mes",
    "Aviso masivo antes del partido",
  ],
  obras: [
    "Registrá el primer jornal del día",
    "Anotá adelantos por obrero",
    "Liquidá la semana con saldo neto",
  ],
  monotributo: [
    "Creá tu primer presupuesto",
    "Enviá link al cliente por WhatsApp",
    "Emití Factura C cuando acepte",
  ],
  servicios: [
    "Revisá la agenda de hoy",
    "Confirmá turno pendiente",
    "Cobrá morosos con un toque",
  ],
  obra: [
    "Registrá jornales de la semana",
    "Certificá hito de avance",
    "Avisá al cliente el cobro del hito",
  ],
  propiedad: [
    "Revisá tu edificio demo en Consorcios",
    "Liquidá expensas o descargá el PDF",
    "Avisá morosos por WhatsApp en 1 clic",
    "Gestioná propiedades y contratos en Cartera",
  ],
  feria: [
    "Registrá ventas del puesto",
    "Cargá cuota de feria si aplica",
    "Cerrá el día con total en un toque",
  ],
  remis: [
    "Registrá viajes del chofer",
    "Sumá gastos de la jornada",
    "Cerrá y compará con lo esperado",
  ],
  acopio: [
    "Registrá entrega de kg del productor",
    "Liquidá precio y saldo pendiente",
    "Avisá por WhatsApp la liquidación",
  ],
  ecommerce: [
    "Compartí el link de tu tienda (/tienda/tu-slug)",
    "Probá un pedido con Mercado Pago o transferencia",
    "Confirmá pedidos pendiente_pago desde Ventas",
  ],
}

function stepsForIndustry(template: IndustryTemplate): string[] {
  return (
    INDUSTRY_STEPS[template.id] ?? [
      `Entrá a ${template.label} — módulo principal`,
      "Probá la acción que más usás en el día a día",
      "Activá WhatsApp desde Apps si querés avisos automáticos",
    ]
  )
}

function stepsForNiche(app: NicheAppDefinition): string[] {
  return (
    NICHE_STEPS[app.appId] ?? [
      app.accionPrincipal,
      "Revisá pendientes y cobrados",
      "Usá WhatsApp para avisar sin escribir uno por uno",
    ]
  )
}

export function getIndustryExperience(industryId: string | null | undefined): AppExperienceGuide | null {
  if (!industryId) return null
  const template = getIndustryTemplate(industryId)
  if (!template) return null

  const primaryHref = template.goldenPath
  const primaryLabel =
    template.menuLabels[primaryHref] ??
    (primaryHref.includes("fiado") ? "Ver libreta" : "Ir al módulo principal")

  return {
    emoji: template.emoji,
    title: template.label,
    subtitle: template.tagline,
    wowMoment: template.wowMoment,
    steps: stepsForIndustry(template),
    primaryAction: { label: primaryLabel, href: primaryHref },
    secondaryActions: buildSecondaryFromMenu(template, primaryHref),
  }
}

export function getNicheExperience(appId: string): AppExperienceGuide | null {
  const app = getNicheApp(appId)
  if (!app) return null

  const href = app.redirectPath ?? app.goldenPath

  return {
    emoji: app.emoji,
    title: app.nombre,
    subtitle: app.lema,
    wowMoment: app.wowMoment,
    steps: stepsForNiche(app),
    primaryAction: { label: app.accionPrincipal, href },
    secondaryActions: [{ label: "Clientes", href: "/dashboard/clientes" }],
  }
}

export function getFiadoExperience(industryId?: string | null): AppExperienceGuide {
  const industry = industryId ? getIndustryExperience(industryId) : null
  const isPrestamista = industryId === "prestamista"

  return {
    emoji: isPrestamista ? "💵" : "📒",
    title: isPrestamista ? "Libreta de préstamos" : "Libreta Fiado",
    subtitle: isPrestamista
      ? "Cuotas claras. Cero pelea en la calle."
      : "Fiá con límite. Avisá por WhatsApp y email.",
    wowMoment:
      industry?.wowMoment ??
      (isPrestamista ? "Cuota vencida → WhatsApp al cliente" : "Anotá un fiado en 2 toques"),
    steps: isPrestamista
      ? (NICHE_STEPS.prestamista ?? [])
      : (INDUSTRY_STEPS.almacen ?? []),
    primaryAction: { label: "Nuevo cliente fiado", href: "#alta-fiado" },
    secondaryActions: [
      { label: "Vender desde POS", href: "/dashboard/pos" },
      { label: "Configuración", href: "#config-fiado" },
    ],
  }
}

/** Empaque producto Claver Cobrá sobre cuentas a cobrar. */
export function getCobraExperience(): AppExperienceGuide {
  return {
    emoji: "📲",
    title: "Claver Cobrá",
    subtitle: "El mensaje cobra. Vos seguís vendiendo.",
    wowMoment: "Filtrá vencidos → abrí WhatsApp al cliente con el texto listo en 1 toque",
    steps: [
      "Revisá el aging y el total vencido",
      "Filtrá morosos y cobrá de a uno o en lote",
      "Tocá WhatsApp: se abre el chat con el mensaje armado",
    ],
    primaryAction: { label: "Ver solo vencidas", href: "#filtro-vencidas" },
    secondaryActions: [
      { label: "Clientes", href: "/dashboard/clientes" },
      { label: "Configurar Cobrá", href: "#config-cobra" },
    ],
  }
}

/** Claver Confirmá — agenda + link público + menos no-shows. */
export function getConfirmaExperience(): AppExperienceGuide {
  return {
    emoji: "📅",
    title: "Claver Confirmá",
    subtitle: "Menos no-shows. Más sillas ocupadas.",
    wowMoment: "Compartí el link de reserva y confirmá turnos por WhatsApp la víspera",
    steps: [
      "Cargá profesionales y servicios",
      "Compartí el link público de agenda",
      "Confirmá pendientes por WhatsApp en 1 toque",
    ],
    primaryAction: { label: "Nuevo turno", href: "#nuevo-turno" },
    secondaryActions: [
      { label: "Copiar link público", href: "#link-agenda" },
      { label: "Clientes", href: "/dashboard/clientes" },
    ],
  }
}

/** Claver Cuota — membresías / socios. */
export function getCuotaExperience(): AppExperienceGuide {
  return {
    emoji: "🏋️",
    title: "Claver Cuota",
    subtitle: "Socios al día. Morosos a la vista.",
    wowMoment: "Ves quién venció y le mandás WhatsApp de cuota en un toque",
    steps: [
      "Definí planes (mensual, trimestral…)",
      "Registrá socios y fechas de vencimiento",
      "Filtrá vencidos y avisá por WhatsApp",
    ],
    primaryAction: { label: "Nuevo plan", href: "#nuevo-plan" },
    secondaryActions: [
      { label: "Solo vencidos", href: "#filtro-vencidos" },
      { label: "Cobros", href: "/dashboard/cuentas-cobrar" },
    ],
  }
}

/** Claver Abono — facturación recurrente. */
export function getAbonoExperience(): AppExperienceGuide {
  return {
    emoji: "🔁",
    title: "Claver Abono",
    subtitle: "El abono del mes se emite solo.",
    wowMoment: "Plantillas activas + emisión manual o cron; enganche a cobranzas",
    steps: [
      "Creá el abono (cliente, monto, día del mes)",
      "Activá la plantilla",
      "Emití ahora o dejá que corra el cron",
    ],
    primaryAction: { label: "Nuevo abono", href: "#nuevo-abono" },
    secondaryActions: [
      { label: "Cobros", href: "/dashboard/cuentas-cobrar" },
      { label: "Clientes", href: "/dashboard/clientes" },
    ],
  }
}

function buildSecondaryFromMenu(
  template: IndustryTemplate,
  primaryHref: string,
): { label: string; href: string }[] {
  return Object.entries(template.menuLabels)
    .filter(([href]) => href !== primaryHref && href !== "/dashboard")
    .slice(0, 2)
    .map(([href, label]) => ({ label, href }))
}

export function getSubSaasExperience(slug: string): AppExperienceGuide | null {
  if (slug === "cobra") return getCobraExperience()
  if (slug === "fiado") return getFiadoExperience()
  if (slug === "turnos") return getConfirmaExperience()
  if (slug === "puntos") return getCuotaExperience()
  if (slug === "abono") return getAbonoExperience()

  const app = getSubSaasApp(slug)
  if (!app) return null

  const steps =
    NICHE_STEPS[app.slug] ??
    app.pasosActivacion

  const emojiBySlug: Record<string, string> = {
    turnos: "📅",
    pos: "🛒",
    tienda: "🏪",
    monotributo: "🧾",
    presupuestos: "📄",
    puntos: "🏋️",
    propiedad: "🏢",
    expensas: "🏢",
    stock: "📦",
    abono: "🔁",
    sena: "📝",
    servicios: "🛠️",
  }

  return {
    emoji: emojiBySlug[app.slug] ?? "🚀",
    title: app.marca,
    subtitle: app.lema,
    wowMoment: app.reelHook || app.outcomes[0] || "Primer resultado rápido",
    steps: steps.slice(0, 4),
    primaryAction: {
      label: "Ir al panel",
      href: app.dashboardPath || "/dashboard",
    },
    secondaryActions: [{ label: "Más apps", href: "/dashboard/apps" }],
  }
}