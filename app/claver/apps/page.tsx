import { Suspense } from "react"
import { ClaverAppsMarketplace } from "@/components/marketing/claver-apps-marketplace"

export const metadata = {
  title: "Claver AutoPool — Automatizaciones instantáneas",
  description:
    "Prendelo una vez. Labura todos los días. Pool de automatizaciones Claver que se activan solas en minutos.",
}

export default function AppsPage() {
  return (
    <Suspense>
      <ClaverAppsMarketplace />
    </Suspense>
  )
}
