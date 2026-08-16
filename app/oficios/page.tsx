import type { Metadata } from "next"
import { ClaverMatrixHub } from "@/components/marketing/claver-matrix-hub"
import { LandingJsonLd } from "@/components/marketing/landing-json-ld"
import { CLAVER_GROUP } from "@/lib/marketing/brand-system"
import { getSiteUrl } from "@/lib/marketing/landing-seo"
import { getEffectiveMarketId } from "@/lib/i18n/request-market"

const siteUrl = getSiteUrl()

export async function generateMetadata(): Promise<Metadata> {
  const market = await getEffectiveMarketId()
  const isUs = market === "us"

  const title = isUs
    ? `${CLAVER_GROUP.name} — Estimates, down payments and crew management for contractors`
    : `${CLAVER_GROUP.name} Oficios — Presupuestos en 3 niveles, señas con Mercado Pago y cuadrilla`

  const description = isUs
    ? "Fast 3-tier estimates, down payment collection, and WhatsApp job assignments for contractors and service pros."
    : "Software para plomeros, electricistas, pintores, técnicos y capataces en Argentina. Cotizá en 30 segundos, cobrá la seña por Mercado Pago y manejá tu cuadrilla desde el celular."

  return {
    metadataBase: new URL(siteUrl),
    title: {
      default: title,
      template: `%s | ${CLAVER_GROUP.name}`,
    },
    description,
    keywords: [
      "Claver Oficios",
      "presupuestos plomero",
      "presupuestos electricista",
      "jornales albañil",
      "contratista obra",
      "seña Mercado Pago",
      "hoja de ruta cuadrilla",
      "Argentina",
    ],
    alternates: {
      canonical: "/oficios",
    },
    openGraph: {
      title,
      description,
      type: "website",
      url: `${siteUrl}/oficios`,
      locale: isUs ? "en_US" : "es_AR",
      siteName: CLAVER_GROUP.name,
    },
  }
}

/** Landing dedicada a Claver Oficios & Obras (Presupuestos, Señas MP y Cuadrilla) */
export default async function OficiosPage() {
  const market = await getEffectiveMarketId()
  const isUs = market === "us"

  return (
    <>
      <LandingJsonLd />
      <ClaverMatrixHub isUs={isUs} initialDolor="oficios" />
    </>
  )
}
