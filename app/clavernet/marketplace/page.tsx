import { MarketplaceTabs } from "@/components/clavernet/marketplace-tabs"

export const metadata = {
  title: "Marketplace Interno | Clavernet",
  description: "Directorio de Apps, Sellers, Developers e Implementadores.",
}

export default function ClavernetMarketplacePage() {
  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      <div className="mb-10">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Marketplace Interno</h1>
        <p className="text-slate-600">
          Explora los productos disponibles para vender y conecta con otros miembros de la red Clavernet.
        </p>
      </div>

      <MarketplaceTabs />
    </div>
  )
}
