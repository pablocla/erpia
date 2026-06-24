import { notFound } from "next/navigation"
import { SolutionLanding } from "@/components/marketing/solution-landing"
import { getSolution, SOLUTION_SLUGS } from "@/lib/marketing/solutions-catalog"
import { CLAVERP_PRODUCT } from "@/lib/marketing/brand-system"
import type { Metadata } from "next"

interface PageProps {
  params: Promise<{ slug: string }>
}

const CLAVERP_SLUGS = SOLUTION_SLUGS.filter((s) => s !== "marca")

export function generateStaticParams() {
  return CLAVERP_SLUGS.map((slug) => ({ slug }))
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const solution = getSolution(slug)
  if (!solution) return { title: "Solución no encontrada" }
  return {
    title: `${solution.headline} | ${CLAVERP_PRODUCT.name}`,
    description: solution.subheadline,
  }
}

export default async function ClavERPSolutionPage({ params }: PageProps) {
  const { slug } = await params
  if (slug === "marca") notFound()
  const solution = getSolution(slug)
  if (!solution) notFound()
  return <SolutionLanding solution={solution} />
}