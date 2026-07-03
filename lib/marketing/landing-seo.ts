import { CLAVER_GROUP, CLAVERP_PRODUCT } from "@/lib/marketing/brand-system"

/** URL canónica del sitio público */
export function getSiteUrl(): string {
  const raw = process.env.NEXT_PUBLIC_APP_URL ?? process.env.VERCEL_URL
  if (!raw) return `https://${CLAVER_GROUP.domain}`
  if (raw.startsWith("http")) return raw.replace(/\/$/, "")
  return `https://${raw.replace(/\/$/, "")}`
}

export const LANDING_KEYWORDS = [
  "ERP Argentina",
  "POS facturación AFIP",
  "software comercios Argentina",
  "libreta fiado digital",
  "gestión stock PyME",
  "sistema consorcios expensas",
  "ERP distribuidoras",
  "factura electrónica AFIP",
  "Claver ERP",
  "demo ERP gratis",
  "software almacén barrio",
  "cobranzas WhatsApp",
] as const

export const LANDING_FAQ = [
  {
    question: "¿Qué es Claver y para quién está pensado?",
    answer:
      "Claver es el grupo de tecnología que ofrece Claver (ERP y POS con AFIP), Clavergrow (agro) y micro-apps para rubros como almacenes, consorcios y gimnasios. Está pensado para comercios, distribuidoras y PyMEs en Argentina que necesitan ordenar ventas, stock y cobranzas sin Excel.",
  },
  {
    question: "¿Puedo probar el sistema antes de pagar?",
    answer:
      "Sí. Tenés 14 días de prueba gratuita y demos por rubro en claver.com.ar/demo. Elegís tu industria (almacén, consorcios, gimnasio, etc.) y el sistema arma un entorno con módulos y datos de ejemplo.",
  },
  {
    question: "¿Incluye facturación electrónica AFIP?",
    answer:
      "Claver incluye integración AFIP para emitir comprobantes electrónicos desde el POS y el módulo fiscal. La homologación en producción se realiza con acompañamiento de implementación según tu condición fiscal.",
  },
  {
    question: "¿Cuánto cuesta Claver?",
    answer:
      "Los enganches arrancan desde $4.990/mes (Libreta Fiado). El ERP completo y los packs por rubro tienen precios en la sección de precios. Podés empezar con un módulo chico y escalar cuando el negocio crece.",
  },
  {
    question: "¿Mis datos están aislados de otros clientes?",
    answer:
      "Sí. Claver es multi-tenant: cada empresa opera en su propio espacio con usuarios, stock y facturas separados. Es la arquitectura estándar de Claver Cloud.",
  },
  {
    question: "¿Necesito instalar algo en la PC?",
    answer:
      "No. Claver funciona en el navegador (web) desde celular, tablet o computadora. El POS puede usarse en mostrador con impresora térmica según tu configuración.",
  },
] as const

export const LANDING_FEATURED_DEMOS = [
  { id: "almacen", label: "Fiado de barrio", hint: "Libreta + deudores", emoji: "🏪" },
  { id: "prestamista", label: "Préstamos", hint: "Cuotas y morosos", emoji: "💵" },
  { id: "consorcios_admin", label: "Consorcios", hint: "Expensas y avisos", emoji: "🏢" },
  { id: "salon_belleza", label: "Salón / turnos", hint: "Agenda online", emoji: "💇" },
  { id: "gimnasio", label: "Gimnasio", hint: "Membresías", emoji: "🏋️" },
  { id: "bar_restaurant", label: "Restó / bar", hint: "Mesas y comandas", emoji: "🍽️" },
] as const

export function buildLandingJsonLd(siteUrl: string) {
  return [
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: CLAVER_GROUP.name,
      url: siteUrl,
      logo: `${siteUrl}/icon.svg`,
      description: CLAVER_GROUP.descriptor,
      areaServed: { "@type": "Country", name: "Argentina" },
      sameAs: [],
    },
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: CLAVER_GROUP.name,
      url: siteUrl,
      description: CLAVER_GROUP.descriptor,
      inLanguage: "es-AR",
      potentialAction: {
        "@type": "SearchAction",
        target: `${siteUrl}/demo?q={search_term_string}`,
        "query-input": "required name=search_term_string",
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      name: CLAVERP_PRODUCT.name,
      applicationCategory: "BusinessApplication",
      operatingSystem: "Web",
      offers: {
        "@type": "Offer",
        price: "4990",
        priceCurrency: "ARS",
        description: "Desde Libreta Fiado — trial 14 días",
      },
      description: CLAVERP_PRODUCT.descriptor,
      url: `${siteUrl}/claver/claverp`,
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: LANDING_FAQ.map((item) => ({
        "@type": "Question",
        name: item.question,
        acceptedAnswer: { "@type": "Answer", text: item.answer },
      })),
    },
  ]
}