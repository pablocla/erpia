import type { Metadata } from "next"
import { CLAVER_GROUP, CLAVERP_PRODUCT } from "@/lib/marketing/brand-system"
import { getSiteUrl, LANDING_KEYWORDS } from "@/lib/marketing/landing-seo"

const siteUrl = getSiteUrl()
const description = `${CLAVER_GROUP.descriptor}. ${CLAVERP_PRODUCT.tagline} Trial 14 días.`

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: `${CLAVER_GROUP.name} — Sistemas y servicios para empresas`,
    template: `%s | ${CLAVER_GROUP.name}`,
  },
  description,
  keywords: [...LANDING_KEYWORDS],
  alternates: { canonical: "/claver" },
  openGraph: {
    title: `${CLAVER_GROUP.name} | ${CLAVER_GROUP.tagline}`,
    description,
    type: "website",
    locale: "es_AR",
    url: `${siteUrl}/claver`,
    siteName: CLAVER_GROUP.name,
    images: [{ url: "/claver/opengraph-image", width: 1200, height: 630, alt: CLAVER_GROUP.name }],
  },
  twitter: {
    card: "summary_large_image",
    title: `${CLAVER_GROUP.name} | ${CLAVER_GROUP.tagline}`,
    description,
    images: ["/claver/opengraph-image"],
  },
}

export default function ClaverLayout({ children }: { children: React.ReactNode }) {
  return children
}