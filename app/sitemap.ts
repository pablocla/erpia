import type { MetadataRoute } from "next"
import { getSiteUrl, LANDING_FEATURED_DEMOS } from "@/lib/marketing/landing-seo"
import { SOLUTION_SLUGS } from "@/lib/marketing/solutions-catalog"

export default function sitemap(): MetadataRoute.Sitemap {
  const base = getSiteUrl()
  const now = new Date()

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: base, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/claver`, lastModified: now, changeFrequency: "weekly", priority: 0.95 },
    { url: `${base}/demo`, lastModified: now, changeFrequency: "weekly", priority: 0.95 },
    { url: `${base}/login/register`, lastModified: now, changeFrequency: "monthly", priority: 0.85 },
    { url: `${base}/claver/claverp`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: `${base}/claver/claverp/modulos`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${base}/claver/claverp/precios`, lastModified: now, changeFrequency: "monthly", priority: 0.85 },
    { url: `${base}/claver/claverp/pos-afip`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${base}/claver/clavergrow`, lastModified: now, changeFrequency: "weekly", priority: 0.85 },
    { url: `${base}/claver/ecommerce`, lastModified: now, changeFrequency: "monthly", priority: 0.75 },
    { url: `${base}/claver/apps`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${base}/claver/marca`, lastModified: now, changeFrequency: "yearly", priority: 0.5 },
    { url: `${base}/claver/almacen-rosario`, lastModified: now, changeFrequency: "monthly", priority: 0.75 },
  ]

  const demoRoutes: MetadataRoute.Sitemap = LANDING_FEATURED_DEMOS.map((pack) => ({
    url: `${base}/demo/${pack.id}`,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: 0.88,
  }))

  const claverpSolutions: MetadataRoute.Sitemap = SOLUTION_SLUGS.map((slug) => ({
    url: `${base}/claver/claverp/${slug}`,
    lastModified: now,
    changeFrequency: "monthly" as const,
    priority: slug === "pos-afip" ? 0.9 : 0.82,
  }))

  return [...staticRoutes, ...demoRoutes, ...claverpSolutions]
}