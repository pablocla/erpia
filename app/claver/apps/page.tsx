import { Suspense } from "react"
import { ClaverAppsMarketplace } from "@/components/marketing/claver-apps-marketplace"
import { UsAppsMarketplace } from "@/components/marketing/us-apps-marketplace"
import { getEffectiveMarketId } from "@/lib/i18n/request-market"

export async function generateMetadata() {
  const marketId = await getEffectiveMarketId()
  if (marketId === "us") {
    return {
      title: "US apps catalog | Claver",
      description:
        "Collections, bookings, house tabs, memberships, POS, and field sales — English apps with automatic activation on the Claver core.",
    }
  }
  return {
    title: "Catálogo de apps y packs | Claver",
    description:
      "Apps activas para vender hoy: Fiado gratis, Cobrá, Turnos, POS y packs por rubro. Mismas herramientas del producto, ordenadas y listas para activar.",
  }
}

export default async function AppsPage() {
  const marketId = await getEffectiveMarketId()

  if (marketId === "us") {
    return <UsAppsMarketplace />
  }

  return (
    <Suspense>
      <ClaverAppsMarketplace />
    </Suspense>
  )
}
