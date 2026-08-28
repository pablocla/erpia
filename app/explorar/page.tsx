import type { Metadata } from "next"
import { ClaverMatrixHub } from "@/components/marketing/claver-matrix-hub"
import { LandingJsonLd } from "@/components/marketing/landing-json-ld"

export const metadata: Metadata = {
  title: "Explorar apps y packs",
  description: "Catálogo completo de apps Claver. La puerta de calle es claver.com.ar — acá está el detalle.",
  robots: { index: false, follow: true },
}

/** Hub viejo (precios, packs, 11 apps). No es la home. */
export default function ExplorarPage() {
  return (
    <>
      <LandingJsonLd />
      <ClaverMatrixHub />
    </>
  )
}
