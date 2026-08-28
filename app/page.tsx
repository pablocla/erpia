import type { Metadata } from "next"
import { LandingHomePuertas } from "@/components/marketing/landing-home-puertas"
import { CLAVER_GROUP } from "@/lib/marketing/brand-system"
import { getSiteUrl, LANDING_KEYWORDS } from "@/lib/marketing/landing-seo"

const siteUrl = getSiteUrl()

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: `${CLAVER_GROUP.name} — Caja, fiado o presupuesto de obra. Sin tarjeta.`,
    template: `%s | ${CLAVER_GROUP.name}`,
  },
  description:
    "Para el local: caja y quién te debe, gratis. Para el oficio: presupuesto en 3 niveles y seña. Sin tarjeta. Hecho para Argentina.",
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
  alternates: { canonical: "/" },
  openGraph: {
    title: `${CLAVER_GROUP.name} — Caja, fiado o presupuesto de obra`,
    description:
      "Local o oficio. Sin tarjeta para arrancar. Se paga cuando el sistema cierra un cobro o una factura.",
    type: "website",
    url: siteUrl,
    locale: "es_AR",
    siteName: CLAVER_GROUP.name,
    images: [{ url: "/og-image.jpg", width: 1200, height: 630, alt: CLAVER_GROUP.name }],
  },
  twitter: {
    card: "summary_large_image",
    title: `${CLAVER_GROUP.name} — Caja, fiado o presupuesto de obra`,
    description: "Hecho para comercios de Argentina. Sin tarjeta para arrancar.",
    images: ["/og-image.jpg"],
  },
  category: "technology",
}

/** Home de calle: Argentina primero. Sin hub US, sin precios, sin menú ERP. */
export default function HomePage() {
  return <LandingHomePuertas />
}
