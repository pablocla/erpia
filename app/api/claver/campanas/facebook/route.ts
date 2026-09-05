import { type NextRequest, NextResponse } from "next/server"
import { getClaverAnalystContext } from "@/lib/auth/claver-analyst"
import { getFacebookCampaignPulse } from "@/lib/analytics/tracking-service"
import {
  CLAVER_PRODUCTION_ORIGIN,
  CORE_ERP_MODULES,
  FACEBOOK_CAMPAIGNS,
  FACEBOOK_LANDING_PATH,
  buildFacebookCampaignUrl,
  productionFacebookUrl,
} from "@/lib/marketing/facebook-campaigns"

/**
 * GET /api/claver/campanas/facebook
 * Pulso + kit de la campaña Facebook → /erp (admin Claver Cloud).
 */
export async function GET(request: NextRequest) {
  const ctx = await getClaverAnalystContext(request)
  if (!ctx.ok) return ctx.response

  const days = Math.min(parseInt(request.nextUrl.searchParams.get("days") ?? "7", 10) || 7, 90)

  const pulso = await getFacebookCampaignPulse(days)

  return NextResponse.json({
    originProduccion: CLAVER_PRODUCTION_ORIGIN,
    landingPath: FACEBOOK_LANDING_PATH,
    campanas: FACEBOOK_CAMPAIGNS.map((c) => ({
      ...c,
      urlProduccion: productionFacebookUrl(c),
      urlLocalEjemplo: buildFacebookCampaignUrl("http://localhost:3000", c),
    })),
    modulosCore: CORE_ERP_MODULES,
    instruccionesMeta: {
      destino: productionFacebookUrl(),
      cta: FACEBOOK_CAMPAIGNS[0]?.ctaMeta,
      notaPixel:
        "No hace falta Pixel para el pulso interno: Claver guarda utm_* y fbclid en la sesión. Si más adelante activás Meta Pixel, usá el mismo URL.",
      parametros: [
        "utm_source=facebook",
        "utm_medium=paid",
        "utm_campaign=erp-core",
        "utm_content=video",
        "ref=fb",
      ],
    },
    pulso,
  })
}
