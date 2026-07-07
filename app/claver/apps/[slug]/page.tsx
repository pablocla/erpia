import { Metadata } from "next"
import { notFound } from "next/navigation"
import { CombateProductLanding } from "@/components/marketing/combate-product-landing"
import { SubSaasLanding } from "@/components/marketing/sub-saas-landing"
import {
  combateLandingMetadata,
  getProductEntry,
  isCombateAppSlug,
} from "@/lib/comercial/go-to-market-vitrine"
import {
  SUB_SAAS_SLUGS,
  getSubSaasApp,
  subSaasLandingHref,
} from "@/lib/comercial/sub-saas-catalog"
import { getSiteUrl } from "@/lib/marketing/landing-seo"

export async function generateStaticParams() {
  return SUB_SAAS_SLUGS.map((slug) => ({ slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const app = getSubSaasApp(slug)
  if (!app) return {}

  const url = `${getSiteUrl()}${subSaasLandingHref(slug)}`
  const meta = isCombateAppSlug(slug)
    ? combateLandingMetadata(slug)
    : {
        title: `${app.nombre} | ${app.marca}`,
        description: `${app.lema} ${app.descripcion}`,
        keywords: [app.marca, app.nombre, ...app.rubros, "Argentina", "Claver"],
      }

  return {
    title: meta.title,
    description: meta.description,
    alternates: { canonical: url },
    openGraph: { title: meta.title, description: meta.description, url },
    keywords: meta.keywords,
  }
}

export default async function SubSaasLandingPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const app = getSubSaasApp(slug)
  if (!app) notFound()

  const entry = getProductEntry(slug)
  if (entry) return <CombateProductLanding app={app} entry={entry} />

  return <SubSaasLanding app={app} />
}