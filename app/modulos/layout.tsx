import type { Metadata } from "next"
import { CLAVERP_PRODUCT, CLAVER_GROUP } from "@/lib/marketing/brand-system"

export const metadata: Metadata = {
  title: `Módulos ${CLAVERP_PRODUCT.name} | ${CLAVER_GROUP.name}`,
  description:
    "Clavis by Claver: POS, AFIP, stock, ecommerce, logística, industria, agro e IA. 40+ módulos con onboarding por rubro.",
  openGraph: {
    title: `${CLAVERP_PRODUCT.name} — 40+ módulos, un solo sistema`,
    description:
      "POS, factura electrónica, tienda online, portal B2B, picking, logística e inteligencia artificial. Probá la demo gratis.",
    type: "website",
  },
}

export default function ModulosLayout({ children }: { children: React.ReactNode }) {
  return children
}