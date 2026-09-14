import type { Metadata } from "next"
import { SegmentLanding } from "@/components/works/segment-landing"
import { getSegmentPack } from "@/components/works/segment-packs"
import { CLAVER_GROUP } from "@/lib/marketing/brand-system"
import { getSiteUrl } from "@/lib/marketing/landing-seo"

const pack = getSegmentPack("energy")
const siteUrl = getSiteUrl()

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    absolute: pack.title,
  },
  description: pack.ogDescription,
  // Explicit keywords so /energy does not inherit any Fiado/ERP root residual.
  keywords: [
    "Claver Energy",
    "solar con partners",
    "EPC solar Argentina",
    "cotización solar kWp",
    "instalación solar partners",
    "seña proyecto solar",
    "Works Energy Claver",
  ],
  robots: { index: true, follow: true },
  alternates: { canonical: "/energy" },
  openGraph: {
    title: pack.ogTitle,
    description: pack.ogDescription,
    type: "website",
    url: `${siteUrl}/energy`,
    locale: "es_AR",
    siteName: CLAVER_GROUP.name,
  },
  twitter: {
    card: "summary_large_image",
    title: pack.ogTitle,
    description: pack.ogDescription,
  },
}

export default function EnergyPage() {
  return <SegmentLanding segmento="energy" />
}