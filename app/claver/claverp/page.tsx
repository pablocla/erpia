import type { Metadata } from "next"
import { ClavERPProductHub } from "@/components/marketing/claverp-product-hub"
import { ClaverpJsonLd } from "@/components/marketing/claverp-json-ld"
import { CLAVERP_KEYWORDS, claverpPageMetadata } from "@/lib/marketing/claverp-landing-seo"
import { CLAVERP_PRODUCT, CLAVER_GROUP } from "@/lib/marketing/brand-system"

const { siteUrl, title, description } = claverpPageMetadata()

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title,
  description,
  keywords: [...CLAVERP_KEYWORDS],
  alternates: {
    canonical: "/claver/claverp",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },
  openGraph: {
    title: `${CLAVERP_PRODUCT.name} | ${CLAVERP_PRODUCT.tagline}`,
    description,
    type: "website",
    locale: "es_AR",
    url: `${siteUrl}/claver/claverp`,
    siteName: CLAVER_GROUP.name,
    images: [
      {
        url: "/claver/claverp/opengraph-image",
        width: 1200,
        height: 630,
        alt: `${CLAVERP_PRODUCT.name} — ERP y POS Argentina`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${CLAVERP_PRODUCT.name} | ${CLAVERP_PRODUCT.tagline}`,
    description,
    images: ["/claver/claverp/opengraph-image"],
  },
}

export default function ClavERPPage() {
  return (
    <>
      <ClaverpJsonLd />
      <ClavERPProductHub />
    </>
  )
}