import type { Metadata } from "next"
import { LandingHomePuertas } from "@/components/marketing/landing-home-puertas"
import { CLAVER_GROUP } from "@/lib/marketing/brand-system"
import { getSiteUrl } from "@/lib/marketing/landing-seo"

const siteUrl = getSiteUrl()

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Stock, venta y cobro para PyMEs · Claver",
    template: `%s | ${CLAVER_GROUP.name}`,
  },
  description: "Ferretería, oficios y gym. Sin tarjeta para arrancar.",
  keywords: [
    "stock venta cobro PyME",
    "software ferretería Argentina",
    "gestión oficios servicios",
    "software gym socios",
    "punto de venta Argentina",
    "sistema pos argentina",
    "control de stock ferretería",
    "taller mecanico software",
    "gestion gimnasio socios",
    "presupuestos con seña",
    "factura electronica afip arca",
    "Claver",
  ],
  authors: [{ name: CLAVER_GROUP.name, url: siteUrl }],
  creator: CLAVER_GROUP.name,
  publisher: CLAVER_GROUP.name,
  robots: { index: true, follow: true },
  alternates: { canonical: "/software" },
  openGraph: {
    title: "Stock, venta y cobro para PyMEs · Claver",
    description: "Ferretería, oficios y gym. Sin tarjeta para arrancar.",
    type: "website",
    url: `${siteUrl}/software`,
    locale: "es_AR",
    siteName: CLAVER_GROUP.name,
    images: [{ url: "/og-image.jpg", width: 1200, height: 630, alt: CLAVER_GROUP.name }],
  },
}

/** Soft Tier A entry (moved from /). Holding home lives at /. */
export default function SoftwarePage() {
  return <LandingHomePuertas />
}
