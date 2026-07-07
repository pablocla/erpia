import { Suspense } from "react"
import { ClaverAppsMarketplace } from "@/components/marketing/claver-apps-marketplace"

export const metadata = {
  title: "Catálogo de apps y automatizaciones | Claver",
  description:
    "Diez apps para vender hoy — fiado, cobranzas WA, turnos, tienda, menú QR y más. Automatizaciones, packs y módulos activables en minutos.",
}

export default function AppsPage() {
  return (
    <Suspense>
      <ClaverAppsMarketplace />
    </Suspense>
  )
}
