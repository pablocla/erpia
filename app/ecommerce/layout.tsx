import type { Metadata } from "next"
import { BRAND_NAME } from "@/lib/brand"

export const metadata: Metadata = {
  title: `Ecommerce integrado al ERP | ${BRAND_NAME}`,
  description: "Tienda online y portal B2B con stock unificado, picking, factura AFIP y cobros. Potenciá tu distribuidora o comercio minorista argentino con el canal online conectado a tu ERP.",
  openGraph: {
    title: `Ecommerce integrado al ERP | ${BRAND_NAME}`,
    description: "Tienda online y portal B2B con stock unificado, picking, factura AFIP y cobros.",
    type: "website",
    images: [{ url: "/claver/opengraph-image", width: 1200, height: 630, alt: BRAND_NAME }],
  },
  twitter: {
    card: "summary_large_image",
    title: `Ecommerce integrado al ERP | ${BRAND_NAME}`,
    description: "Tienda online y portal B2B con stock unificado, picking, factura AFIP y cobros.",
    images: ["/claver/opengraph-image"],
  },
}

export default function EcommerceLayout({ children }: { children: React.ReactNode }) {
  return <div className="antialiased">{children}</div>
}
