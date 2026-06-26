/**
 * Sistema de marca — Grupo Claver
 * Claver = matriz · Clavis = producto ERP (una línea del conglomerado)
 */

/** Marca matriz — conglomerado de sistemas y servicios */
export const CLAVER_GROUP = {
  name: "Claver",
  tagline: "Tecnología que ordena tu negocio.",
  descriptor: "Sistemas, servicios e implementación para empresas en Argentina",
  domain: "claver.com.ar",
  tone: ["confiable", "premium", "local", "escalable"],
} as const

/** Producto ERP — línea de negocio dentro de Claver */
export const CLAVERP_PRODUCT = {
  name: "Clavis",
  slug: "claverp",
  tagline: "Un sistema. Toda tu operación.",
  descriptor: "ERP & POS con facturación AFIP para comercios y distribuidoras",
  parent: "Claver",
} as const

/** @deprecated Usar CLAVERP_PRODUCT */
export const BRAND_RECOMMENDED = {
  name: CLAVERP_PRODUCT.name,
  tagline: CLAVERP_PRODUCT.tagline,
  descriptor: CLAVERP_PRODUCT.descriptor,
  domain: CLAVER_GROUP.domain,
  tone: CLAVER_GROUP.tone,
} as const

export const BRAND_NAME_CANDIDATES = [
  {
    name: "Clavis",
    score: 10,
    pros: ["Elegante", "Latín: llave", "Vinculado a Claver", "Claro como producto ERP", "Registrable"],
    cons: ["Solo cubre la línea ERP"],
    tagline: CLAVERP_PRODUCT.tagline,
    vibe: "Producto flagship del grupo Claver",
  },
] as const

export const BRAND_COLORS = {
  /** Claver matriz — slate profundo */
  group: {
    DEFAULT: "#0F172A",
    accent: "#64748B",
  },
  /** Clavis — azul operativo */
  primary: {
    50: "#EFF6FF",
    100: "#DBEAFE",
    500: "#2563EB",
    600: "#1D4ED8",
    700: "#1E3A8A",
    DEFAULT: "#1D4ED8",
  },
  accent: {
    400: "#FBBF24",
    500: "#F59E0B",
    600: "#D97706",
    DEFAULT: "#F59E0B",
  },
  success: { DEFAULT: "#059669", light: "#D1FAE5" },
  fiscal: { DEFAULT: "#DC2626", light: "#FEE2E2" },
  ink: { DEFAULT: "#0F172A", muted: "#64748B", subtle: "#94A3B8" },
  surface: { light: "#F8FAFC", card: "#FFFFFF", dark: "#0F172A" },
} as const

export const BRAND_TYPOGRAPHY = {
  display: "Fraunces",
  body: "Manrope",
  mono: "Geist Mono",
  scale: {
    hero: "clamp(2.5rem, 5vw, 4.5rem)",
    h2: "clamp(1.75rem, 3vw, 3rem)",
    body: "1rem",
    caption: "0.875rem",
  },
} as const

export const LOGO_SPEC = {
  group: {
    concept: "Claver — la C como eje",
    description:
      "Isotipo matriz: arco en C con trazo sólido. Representa el grupo que contiene múltiples productos. Tipografía Fraunces en wordmark.",
  },
  product: {
    concept: "Clavis — módulos conectados, la llave de tu operación",
    description:
      "Isotipo producto: nodos unidos bajo la marca Claver. Se usa con subline 'by Claver' o lockup anidado.",
  },
  variants: ["group-full", "group-icon", "claverp-full", "claverp-icon", "monochrome", "reversed"],
  minSizePx: 16,
  donts: [
    "No usar Clavis sin contexto Claver en materiales corporativos",
    "No mezclar isotipos de distintos productos del grupo",
    "No rotar ni distorsionar",
  ],
} as const

export const MARKETING_ROADMAP = [
  {
    phase: "Fase 1 — Identidad Grupo",
    quarter: "Q2 2026",
    items: [
      "Marca matriz Claver + producto Clavis",
      "Logo dual + favicon + OG image",
      "Hub /claver como punto de entrada",
      "Kit partners contadores",
    ],
    status: "en_curso" as const,
  },
  {
    phase: "Fase 2 — Clavis comercial",
    quarter: "Q2 2026",
    items: [
      "Landings verticales bajo /claver/claverp",
      "Catálogo 40+ módulos",
      "Demo + trial por rubro",
      "Formulario leads unificado",
    ],
    status: "en_curso" as const,
  },
  {
    phase: "Fase 3 — Nuevas líneas Claver",
    quarter: "Q3 2026",
    items: [
      "ClavPay / ClavLog en roadmap público",
      "Programa referidos 20%",
      "Video demo Clavis 90 seg",
      "Google Ads por vertical",
    ],
    status: "pendiente" as const,
  },
  {
    phase: "Fase 4 — Conglomerado LATAM",
    quarter: "Q4 2026",
    items: [
      "Servicios de implementación Claver Consult",
      "White-label para partners",
      "Expansión fiscal regional",
    ],
    status: "pendiente" as const,
  },
] as const

/** Rutas públicas del ecosistema Claver */
export const CLAVER_ROUTES = {
  matrix: "/claver",
  claverp: "/claver/claverp",
  claverpModulos: "/claver/claverp/modulos",
  claverpSolution: (slug: string) => `/claver/claverp/${slug}`,
  marca: "/claver/marca",
  cloud: "/claver-cloud",
} as const

export const CLAVER_NAV = [
  { href: "/claver", label: "Claver" },
  { href: "/claver/claverp", label: "Clavis" },
  { href: "/claver-cloud", label: "Claver Cloud" },
  { href: "/claver/claverp/pos-afip", label: "POS & AFIP" },
  { href: "/claver/claverp/ecommerce", label: "Ecommerce" },
  { href: "/claver/claverp/distribuidoras", label: "Distribuidoras" },
  { href: "/claver/claverp/precios", label: "Precios" },
  { href: "/claver/marca", label: "Marca" },
] as const

/** @deprecated Usar CLAVER_NAV */
export const MARKETING_NAV = CLAVER_NAV