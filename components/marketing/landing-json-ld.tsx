import { buildLandingJsonLd, getSiteUrl } from "@/lib/marketing/landing-seo"

export function LandingJsonLd() {
  const graphs = buildLandingJsonLd(getSiteUrl())
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(graphs) }}
    />
  )
}