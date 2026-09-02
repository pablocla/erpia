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
    title: `${CLAVER_GROUP.name} — Sistema de Gestión y Cobro para Comercios y PyMEs`,
    description:
      "Punto de venta, fiados con WhatsApp, órdenes de taller y presupuestos. Gratis para arrancar sin tarjeta de crédito.",
    type: "website",
    url: siteUrl,
    locale: "es_AR",
    siteName: CLAVER_GROUP.name,
    images: [{ url: "/og-image.jpg", width: 1200, height: 630, alt: CLAVER_GROUP.name }],
  },
  twitter: {
    card: "summary_large_image",
    title: `${CLAVER_GROUP.name} — Sistema de Gestión para Comercios y PyMEs`,
    description: "Punto de venta rápido, libreta de fiados y presupuestos con seña. 100% gratis para arrancar.",
    images: ["/og-image.jpg"],
  },
  category: "technology",
}

/** Home Principal: Multi-Puerta Inteligente para todos los rubros comerciales */
export default function HomePage() {
  return <LandingHomePuertas />
}
