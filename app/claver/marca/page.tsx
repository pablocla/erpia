import { SolutionLanding } from "@/components/marketing/solution-landing"
import { BrandGuideSection } from "@/components/marketing/brand-guide-section"
import { getSolution } from "@/lib/marketing/solutions-catalog"

export default function ClaverMarcaPage() {
  const solution = getSolution("marca")
  if (!solution) return null
  return <SolutionLanding solution={solution} extra={<BrandGuideSection />} />
}