import { Suspense } from "react"
import { ClaverAppsMarketplace } from "@/components/marketing/claver-apps-marketplace"

export const metadata = {
  title: "Catálogo de apps y packs | Claver",
  description:
    "Apps activas para vender hoy: Fiado gratis, Cobrá, Turnos, POS y packs por rubro. Mismas herramientas del producto, ordenadas y listas para activar.",
}

export default function AppsPage() {
  return (
    <Suspense>
      <ClaverAppsMarketplace />
    </Suspense>
  )
}
