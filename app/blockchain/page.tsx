import type { Metadata } from "next"
import { SegmentLanding } from "@/components/works/segment-landing"
import { getSegmentPack } from "@/components/works/segment-packs"
import { CLAVER_GROUP } from "@/lib/marketing/brand-system"
import { getSiteUrl } from "@/lib/marketing/landing-seo"

const pack = getSegmentPack("blockchain")
const siteUrl = getSiteUrl()

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    absolute: pack.title,
  },
  description: pack.ogDescription,
  robots: { index: true, follow: true },
  alternates: { canonical: "/blockchain" },
  openGraph: {
    title: pack.ogTitle,
    description: pack.ogDescription,
    type: "website",
    url: `${siteUrl}/blockchain`,
    locale: "es_AR",
    siteName: CLAVER_GROUP.name,
  },
  twitter: {
    card: "summary_large_image",
    title: pack.ogTitle,
    description: pack.ogDescription,
  },
}

export default function BlockchainPage() {
  return <SegmentLanding segmento="blockchain" />
}
