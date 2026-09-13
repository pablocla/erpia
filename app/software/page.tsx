import type { Metadata } from "next"
import { LandingHomePuertas } from "@/components/marketing/landing-home-puertas"
import { CLAVER_GROUP } from "@/lib/marketing/brand-system"
import { getSiteUrl, LANDING_KEYWORDS } from "@/lib/marketing/landing-seo"

const siteUrl = getSiteUrl()

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: `${CLAVER_GROUP.name} — Sistema de Gestión y Cobro para Comercios, Talleres, Oficios y PyMEs`,
    template: `%s | ${CLAVER_GROUP.name}`,
  },
  description:
    "Software de gestión comercial para Argentina: Punto de Venta (POS), Libreta de Fiados, Talleres Mecánicos por Patente, Gimnasios y Presupuestos con Seña. 100% gratis para arrancar sin tarjeta.",
  keywords: [
    ...LANDING_KEYWORDS,
    "sistema pos argentina",
    "control de stock kiosco",
    "taller mecanico software",
    "gestion gimnasio socios",
    "presupuestos con seña",
    "factura electronica afip arca",
  ],
  authors: [{ name: CLAVER_GROUP.name, url: siteUrl }],
  creator: CLAVER_GROUP.name,
  publisher: CLAVER_GROUP.name,
  robots: { index: true, follow: true },
  alternates: { canonical: "/software" },
  openGraph: {
    title: `${CLAVER_GROUP.name} — Sistema de Gestión y Cobro para Comercios y PyMEs`,
    description:
      "Punto de venta, fiados con WhatsApp, órdenes de taller y presupuestos. Gratis para arrancar sin tarjeta de crédito.",
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
