import type { Metadata } from "next"
import { SegmentLanding } from "@/components/works/segment-landing"
import { getSegmentPack } from "@/components/works/segment-packs"
import { CLAVER_GROUP } from "@/lib/marketing/brand-system"
import { getSiteUrl } from "@/lib/marketing/landing-seo"

const pack = getSegmentPack("infra")
const siteUrl = getSiteUrl()

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    absolute: pack.title,
  },
  description: pack.ogDescription,
  keywords: [
    "Claver Infra",
    "obra con partners",
    "naves industriales",
    "colo liviano",
    "match partner obra",
    "Works Infra Claver",
  ],
  robots: { index: true, follow: true },
  alternates: { canonical: "/infra" },
  openGraph: {
    title: pack.ogTitle,
    description: pack.ogDescription,
    type: "website",
    url: `${siteUrl}/infra`,
    locale: "es_AR",
    siteName: CLAVER_GROUP.name,
  },
  twitter: {
    card: "summary_large_image",
    title: pack.ogTitle,
    description: pack.ogDescription,
  },
}

export default function InfraPage() {
  return <SegmentLanding segmento="infra" />
}