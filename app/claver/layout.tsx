import type { Metadata } from "next"
import { CLAVER_GROUP } from "@/lib/marketing/brand-system"

export const metadata: Metadata = {
  title: `${CLAVER_GROUP.name} — Sistemas y servicios para empresas`,
  description: CLAVER_GROUP.descriptor,
  openGraph: {
    title: `${CLAVER_GROUP.name} | ${CLAVER_GROUP.tagline}`,
    description: CLAVER_GROUP.descriptor,
    type: "website",
    images: [{ url: "/claver/opengraph-image", width: 1200, height: 630, alt: CLAVER_GROUP.name }],
  },
  twitter: {
    card: "summary_large_image",
    title: `${CLAVER_GROUP.name} | ${CLAVER_GROUP.tagline}`,
    description: CLAVER_GROUP.descriptor,
    images: ["/claver/opengraph-image"],
  },
}

export default function ClaverLayout({ children }: { children: React.ReactNode }) {
  return children
}