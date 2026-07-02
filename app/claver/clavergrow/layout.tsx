import type { Metadata } from "next"
import { CLAVERGROW_PRODUCT, CLAVER_GROUP } from "@/lib/marketing/brand-system"

export const metadata: Metadata = {
  title: `${CLAVERGROW_PRODUCT.name} by ${CLAVER_GROUP.name} — ${CLAVERGROW_PRODUCT.tagline}`,
  description: CLAVERGROW_PRODUCT.descriptor,
  openGraph: {
    title: `${CLAVERGROW_PRODUCT.name} | ${CLAVERGROW_PRODUCT.tagline}`,
    description: CLAVERGROW_PRODUCT.descriptor,
    type: "website",
    images: [
      {
        url: "/claver/clavergrow/opengraph-image",
        width: 1200,
        height: 630,
        alt: `${CLAVERGROW_PRODUCT.name} by ${CLAVER_GROUP.name}`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${CLAVERGROW_PRODUCT.name} | ${CLAVERGROW_PRODUCT.tagline}`,
    description: CLAVERGROW_PRODUCT.descriptor,
    images: ["/claver/clavergrow/opengraph-image"],
  },
}

export default function ClavergrowLayout({ children }: { children: React.ReactNode }) {
  return children
}