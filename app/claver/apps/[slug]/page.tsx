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
import { marketAppAsSubSaas, getMarketCatalogApp } from "@/lib/comercial/market-catalog"
import { US_SAAS_SLUGS, fmtPrecioUsd, getUsSaasApp } from "@/lib/comercial/us-saas-catalog"
import { getSiteUrl } from "@/lib/marketing/landing-seo"
import { getEffectiveMarketId } from "@/lib/i18n/request-market"
import { getSkinOficio } from "@/lib/comercial/skins-oficios"

export async function generateStaticParams() {
  const ar = SUB_SAAS_SLUGS.map((slug) => ({ slug }))
  const usOnly = US_SAAS_SLUGS.filter((s) => !(SUB_SAAS_SLUGS as readonly string[]).includes(s)).map(
    (slug) => ({ slug }),
  )
  return [...ar, ...usOnly]
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const us = getUsSaasApp(slug)
  if (us) {
    const url = `${getSiteUrl()}/claver/apps/${us.slug}`
    return {
      title: `${us.nombre} | ${us.marca}`,
      description: `${us.lema} ${us.descripcion}`,
      alternates: { canonical: url },
      openGraph: {
        title: `${us.nombre} | ${us.marca}`,
        description: us.lema,
        url,
        locale: "en_US",
      },
      keywords: [us.marca, us.nombre, ...us.rubros, "Claver", "SaaS", "United States"],
    }
  }

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

const US_LANDING_COPY = {
  catalogLabel: "App catalog",
  trialCta: "Start free trial",
  contactCta: "Talk to sales",
  painsTitle: "Today's pain",
  outcomesTitle: "What you get",
  stepsTitle: "Activation steps",
  available: "Live",
  beta: "Beta",
  soon: "Coming soon",
  ready: "ready",
  bothPlatforms: "Mobile + desktop",
} as const

export default async function SubSaasLandingPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>
  searchParams?: Promise<{ oficio?: string }>
}) {
  const { slug } = await params
  const sp = searchParams ? await searchParams : {}
  const marketId = await getEffectiveMarketId()
  const usDirect = getUsSaasApp(slug)

  if (usDirect || marketId === "us") {
    const marketApp = getMarketCatalogApp("us", slug)
    if (marketApp) {
      const asSub = marketAppAsSubSaas(marketApp)
      const us = getUsSaasApp(marketApp.slug) ?? usDirect
      const priceLabel = us
        ? us.precioUsd === 0
          ? "Free forever"
          : `${fmtPrecioUsd(us.precioUsd)}/mo · ${us.trialDias}-day trial`
        : undefined

      return (
        <SubSaasLanding
          app={{
            ...asSub,
            // Prefer marketing slug on CTA for English brand in activar-intent
            slug: marketApp.slug,
          }}
          priceLabel={priceLabel}
          localeCopy={{
            ...US_LANDING_COPY,
            trialCta: `Start ${asSub.trialDias}-day free trial`,
          }}
        />
      )
    }
  }

  const baseApp = getSubSaasApp(slug)
  if (!baseApp) notFound()

  let app = baseApp
  if (slug === "oficios" && sp.oficio) {
    const skin = getSkinOficio(sp.oficio)
    if (skin) {
      app = {
        ...baseApp,
        marca: skin.nombre,
        nombre: skin.nombre,
        lema: skin.lema,
        descripcion: skin.descripcion,
        pains: skin.pains,
        outcomes: skin.outcomes,
      }
    }
  }

  const entry = getProductEntry(slug)
  if (entry) {
    let customEntry = entry
    if (slug === "oficios" && sp.oficio) {
      const skin = getSkinOficio(sp.oficio)
      if (skin) {
        customEntry = {
          ...entry,
          heroH1: skin.h1,
          heroSub: skin.descripcion,
        }
      }
    }
    return <CombateProductLanding app={app} entry={customEntry} />
  }

  return <SubSaasLanding app={app} />
}
