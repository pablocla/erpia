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
    ? `${CLAVER_GROUP.name} — Free digital house tabs for local shops`
    : `${CLAVER_GROUP.name} Fiado — Libreta digital gratis para comercios y almacenes`

  const description = isUs
    ? "Free digital house accounts and customer debt ledger for neighborhood shops."
    : "Libreta digital de fiado gratis para almacenes, kioscos y comercios de barrio en Argentina. Sabé quién te debe y cuánto en tiempo real desde el celular."

  return {
    metadataBase: new URL(siteUrl),
    title: {
      default: title,
      template: `%s | ${CLAVER_GROUP.name}`,
    },
    description,
    keywords: [
      "Claver Fiado",
      "libreta de fiado gratis",
      "fiado digital",
      "almacen",
      "kiosco",
      "cuentas corrientes clientes",
      "Argentina",
    ],
    alternates: {
      canonical: "/fiado",
    },
    openGraph: {
      title,
      description,
      type: "website",
      url: `${siteUrl}/fiado`,
      locale: isUs ? "en_US" : "es_AR",
      siteName: CLAVER_GROUP.name,
    },
  }
}

/** Landing dedicada a Claver Fiado (Libreta digital gratuita para comercios) */
export default async function FiadoPage() {
  const market = await getEffectiveMarketId()
  const isUs = market === "us"

  return (
    <>
      <LandingJsonLd />
      <ClaverMatrixHub isUs={isUs} initialDolor="fiado" />
    </>
  )
}
