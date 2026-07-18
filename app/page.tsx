import type { Metadata } from "next"
import { ClaverMatrixHub } from "@/components/marketing/claver-matrix-hub"
import { LandingJsonLd } from "@/components/marketing/landing-json-ld"
import { CLAVER_GROUP, CLAVERP_PRODUCT } from "@/lib/marketing/brand-system"
import { getSiteUrl, LANDING_KEYWORDS } from "@/lib/marketing/landing-seo"

const siteUrl = getSiteUrl()
const title = `${CLAVER_GROUP.name} — Fiado, cobranzas, turnos y POS para Argentina`
const description = `${CLAVER_GROUP.tagline} Libreta de fiado gratis, Cobrá por WhatsApp, turnos online, POS con AFIP y packs por rubro. 14 días de prueba sin tarjeta.`

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: title,
    template: `%s | ${CLAVER_GROUP.name}`,
  },
  description,
  keywords: [...LANDING_KEYWORDS],
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
    title: `${CLAVER_GROUP.name} | ${CLAVER_GROUP.tagline}`,
    description,
    type: "website",
    locale: "es_AR",
    url: siteUrl,
    siteName: CLAVER_GROUP.name,
    images: [
      {
        url: "/claver/opengraph-image",
        width: 1200,
        height: 630,
        alt: `${CLAVER_GROUP.name} — software para comercios en Argentina`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${CLAVER_GROUP.name} | ${CLAVER_GROUP.tagline}`,
    description,
    images: ["/claver/opengraph-image"],
  },
  category: "technology",
}

/** Raíz pública — home Grupo Claver (claver.com.ar) */
export default function HomePage() {
  return (
    <>
      <LandingJsonLd />
      <ClaverMatrixHub />
    </>
  )
}