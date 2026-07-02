import { ClavernetHero } from "@/components/clavernet/hero-section"
import { TopSellersBoard } from "@/components/clavernet/top-sellers-board"

export const metadata = {
  title: "Clavernet | Partner Network",
  description: "La red de Partners de Claver ERP. Programá, vendé y enseñá.",
}

export default function ClavernetLandingPage() {
  return (
    <div className="bg-white">
      <ClavernetHero />
      <TopSellersBoard />
    </div>
  )
}
