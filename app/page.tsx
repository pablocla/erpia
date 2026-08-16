import type { Metadata } from "next"
import { ClaverMatrixHub } from "@/components/marketing/claver-matrix-hub"
import { LandingJsonLd } from "@/components/marketing/landing-json-ld"
import { CLAVER_GROUP, CLAVERP_PRODUCT } from "@/lib/marketing/brand-system"
import { getSiteUrl, LANDING_KEYWORDS } from "@/lib/marketing/landing-seo"
import { getEffectiveMarketId } from "@/lib/i18n/request-market"
const siteUrl = getSiteUrl()

export async function generateMetadata(): Promise<Metadata> {
  const market = await getEffectiveMarketId()
  const isUs = market === "us"

  const title = isUs
    ? `${CLAVER_GROUP.name} — Business apps that pay for themselves`
    : `${CLAVER_GROUP.name} — Presupuestos en 3 niveles, señas con Mercado Pago y cuadrilla para obras y oficios`
    
  const description = isUs
    ? "Free digital house tabs, automated collections via SMS, booking confirmations, and B2B ordering for local businesses. Start your 14-day free trial."
    : "App para plomeros, electricistas, pintores, técnicos y capataces en Argentina. Cotizaciones en 30 segs, fotos antes/después, señas con Mercado Pago y liquidación de cuadrilla."

  const keywords = isUs
    ? ["house account app", "collections SMS", "appointment no-show", "deposit invoice", "local business software"]
    : [...LANDING_KEYWORDS]

  return {
    metadataBase: new URL(siteUrl),
    title: {
      default: title,
      template: `%s | ${CLAVER_GROUP.name}`,
    },
    description,
    keywords,
    authors: [{ name: CLAVER_GROUP.name, url: siteUrl }],
    creator: CLAVER_GROUP.name,
    publisher: CLAVER_GROUP.name,
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
    alternates: {
      canonical: "/",
    },
    openGraph: {
      title: `${CLAVER_GROUP.name} | ${isUs ? "Business Apps" : CLAVER_GROUP.tagline}`,
      description,
      type: "website",
      url: siteUrl,
      locale: isUs ? "en_US" : "es_AR",
      siteName: CLAVER_GROUP.name,
      images: [
        {
          url: "/og-image.jpg",
          width: 1200,
          height: 630,
          alt: CLAVER_GROUP.name,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${CLAVER_GROUP.name} | ${isUs ? "Business Apps" : CLAVER_GROUP.tagline}`,
      description,
      images: ["/og-image.jpg"],
    },
    category: "technology",
  }
}

/** Raíz pública — home Grupo Claver (claver.com.ar) */
export default async function HomePage() {
  const market = await getEffectiveMarketId()
  const isUs = market === "us"

  return (
    <>
      <LandingJsonLd />
      <ClaverMatrixHub isUs={isUs} />
    </>
  )
}