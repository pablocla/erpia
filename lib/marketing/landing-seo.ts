import { CLAVER_GROUP, CLAVERP_PRODUCT } from "@/lib/marketing/brand-system"
import { getPublicAppUrl } from "@/lib/config/public-app-url"

/** URL canónica del sitio público (misma fuente que webhooks MP / billing) */
export function getSiteUrl(): string {
  const fromPublic = getPublicAppUrl()
  if (fromPublic && !fromPublic.includes("localhost")) return fromPublic
  // Producción sin env: dominio de marca
  if (!process.env.NEXT_PUBLIC_APP_URL && !process.env.NEXT_PUBLIC_BASE_URL && !process.env.VERCEL_URL) {
    return `https://${CLAVER_GROUP.domain}`
  }
  return fromPublic
}

export const LANDING_KEYWORDS = [
  "software comercios Argentina",
  "POS facturación AFIP",
  "libreta fiado digital",
  "cobranzas WhatsApp",
  "gestión stock PyME",
  "sistema consorcios expensas",
  "factura electrónica AFIP",
  "Claver",
  "software almacén barrio",
  "demo software comercio gratis",
  "turnos online Argentina",
] as const

export const LANDING_FAQ = [
  {
    question: "¿Qué es Claver y para quién está pensado?",
    answer:
      "Claver es software para comercios y PyMEs en Argentina: libreta de fiado, cobranzas por WhatsApp, turnos, POS con facturación AFIP, stock y packs por rubro. Ordenás ventas, cobros y el día a día desde el celular o la PC.",
  },
  {
    question: "¿Puedo probar antes de pagar?",
    answer:
      "Sí. 14 días gratis sin tarjeta en la mayoría de las apps y packs. También hay demos por rubro en claver.com.ar/demo con datos de ejemplo, sin instalación.",
  },
  {
    question: "¿Incluye facturación electrónica AFIP?",
    answer:
      "Sí, desde el POS y el módulo fiscal. Podés empezar con Fiado o Cobrá y activar facturación cuando la necesites. La homologación en producción se acompaña según tu condición fiscal.",
  },
  {
    question: "¿Cuánto cuesta?",
    answer:
      "Claver Fiado es gratis para siempre. Cobrá, Turnos, POS y packs tienen precio mensual en pesos, visible en cada producto. Solo pagás lo que activás.",
  },
  {
    question: "¿Mis datos están aislados de otros clientes?",
    answer:
      "Sí. Cada empresa tiene su espacio: usuarios, stock y facturas separados.",
  },
  {
    question: "¿Necesito instalar algo?",
    answer:
      "No. Funciona en el navegador en celular, tablet o PC. El POS puede ir en mostrador con impresora térmica si la configurás.",
  },
] as const

export const LANDING_FEATURED_DEMOS = [
  { id: "almacen", label: "Fiado de barrio", hint: "Libreta + deudores", emoji: "🏪" },
  { id: "prestamista", label: "Préstamos", hint: "Cuotas y morosos", emoji: "💵" },
  { id: "freelance_mt", label: "Monotributo", hint: "Presupuesto y factura C", emoji: "💼" },
  { id: "servicios_pro", label: "Servicios Pro", hint: "Agenda y cobros", emoji: "🔧" },
  { id: "contratista_obra", label: "Obra", hint: "Jornales y liquidación", emoji: "🔨" },
  { id: "inmobiliaria", label: "Inmobiliaria", hint: "Expensas y portales", emoji: "🏠" },
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