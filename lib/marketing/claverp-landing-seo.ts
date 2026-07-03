import { CLAVER_GROUP, CLAVERP_PRODUCT } from "@/lib/marketing/brand-system"
import { SOLUTION_SLUGS } from "@/lib/marketing/solutions-catalog"
import { getSiteUrl } from "@/lib/marketing/landing-seo"

export const CLAVERP_KEYWORDS = [
  "ERP Argentina",
  "POS AFIP",
  "factura electrónica comercios",
  "software PyME Argentina",
  "gestión stock depósitos",
  "ERP distribuidoras",
  "sistema restaurantes comandas",
  "contabilidad automática Argentina",
  "portal B2B mayoristas",
  "ecommerce integrado ERP",
  "libreta fiado digital",
  "Claver ERP precios",
] as const

export const CLAVERP_FAQ = [
  {
    question: "¿Qué incluye Claver ERP?",
    answer:
      "Ventas y POS, facturación AFIP, stock multi-depósito, compras, caja, cuentas corrientes, contabilidad, impuestos (IVA, IIBB), ecommerce, logística, industria y módulos por rubro. Activás solo lo que necesitás desde el marketplace de Claver Cloud.",
  },
  {
    question: "¿Puedo usar solo el POS sin el ERP completo?",
    answer:
      "Sí. Muchos comercios arrancan con POS + AFIP o con Libreta Fiado ($4.990/mes) y escalan módulos cuando el negocio crece. El cotizador en esta página te permite estimar un pack a medida.",
  },
  {
    question: "¿Cómo funciona la facturación electrónica AFIP?",
    answer:
      "Claver integra WSFE/WSFEX para solicitar CAE desde el POS o facturación masiva. Incluye reintentos, CAEA en contingencia y libros IVA. La homologación en producción se hace con tu certificado y acompañamiento de implementación.",
  },
  {
    question: "¿Hay demo por rubro?",
    answer:
      "Sí. En /demo podés probar almacén, distribuidora, restó, gimnasio y más. Cada demo activa módulos y datos de ejemplo para tu industria en menos de un minuto.",
  },
  {
    question: "¿Cuánto cuesta y hay trial?",
    answer:
      "Planes desde módulos individuales (ver precios y cotizador). Incluye 14 días de prueba gratuita al registrarte. Los precios están en pesos argentinos + IVA.",
  },
  {
    question: "¿Necesito servidor propio o instalación?",
    answer:
      "No. Claver es 100% web (SaaS). Accedés desde navegador en PC, tablet o celular. Tus datos están aislados por empresa en Claver Cloud.",
  },
] as const

export const CLAVERP_TRUST_ITEMS = [
  { label: "Facturación AFIP integrada" },
  { label: "40+ módulos activables" },
  { label: "Trial 14 días gratis" },
  { label: "Datos aislados por empresa" },
] as const

/** Demos ERP más relevantes para conversión desde landing producto */
export const CLAVERP_FEATURED_DEMOS = [
  { id: "almacen", label: "Almacén / fiado", emoji: "🏪" },
  { id: "bar_restaurant", label: "Restó y bar", emoji: "🍽️" },
  { id: "gimnasio", label: "Gimnasio", emoji: "🏋️" },
  { id: "consorcios_admin", label: "Consorcios", emoji: "🏢" },
] as const

export function buildClaverpJsonLd(siteUrl: string = getSiteUrl()) {
  const productUrl = `${siteUrl}/claver/claverp`

  return [
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: CLAVER_GROUP.name, item: siteUrl },
        { "@type": "ListItem", position: 2, name: CLAVERP_PRODUCT.name, item: productUrl },
      ],
    },
    {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      name: CLAVERP_PRODUCT.name,
      applicationCategory: "BusinessApplication",
      applicationSubCategory: "ERP",
      operatingSystem: "Web",
      description: CLAVERP_PRODUCT.descriptor,
      url: productUrl,
      inLanguage: "es-AR",
      offers: {
        "@type": "AggregateOffer",
        lowPrice: "4990",
        highPrice: "99900",
        priceCurrency: "ARS",
        offerCount: "40",
        description: "Módulos desde Libreta Fiado — trial 14 días",
      },
      featureList: [
        "POS y facturación AFIP",
        "Stock multi-depósito",
        "Ecommerce B2B/B2C",
        "Logística y hojas de ruta",
        "Contabilidad e impuestos",
      ],
      provider: {
        "@type": "Organization",
        name: CLAVER_GROUP.name,
        url: siteUrl,
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: CLAVERP_FAQ.map((item) => ({
        "@type": "Question",
        name: item.question,
        acceptedAnswer: { "@type": "Answer", text: item.answer },
      })),
    },
    ...SOLUTION_SLUGS.filter((s) => s !== "marca" && s !== "precios").map((slug) => ({
      "@context": "https://schema.org",
      "@type": "WebPage",
      name: `Claver — ${slug}`,
      url: `${siteUrl}/claver/claverp/${slug}`,
      isPartOf: { "@type": "WebSite", url: productUrl },
    })),
  ]
}

export function claverpPageMetadata() {
  const siteUrl = getSiteUrl()
  const title = `${CLAVERP_PRODUCT.name} — ERP y POS con facturación AFIP para PyMEs`
  const description = `${CLAVERP_PRODUCT.descriptor}. POS, stock, compras, caja, ecommerce y 40+ módulos. Trial 14 días gratis. Argentina.`

  return {
    siteUrl,
    title,
    description,
  }
}