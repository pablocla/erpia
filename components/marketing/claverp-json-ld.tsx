import { buildClaverpJsonLd } from "@/lib/marketing/claverp-landing-seo"
import { getSiteUrl } from "@/lib/marketing/landing-seo"

export function ClaverpJsonLd() {
  const graphs = buildClaverpJsonLd(getSiteUrl())
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(graphs) }}
    />
  )
}