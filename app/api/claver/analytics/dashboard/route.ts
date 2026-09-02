import { NextRequest, NextResponse } from "next/server"
import { getAuthContext } from "@/lib/auth/empresa-guard"
import {
  getAnalyticsDashboard,
  getFunnelAnalytics,
  getAnalyticsAlerts,
  FUNNEL_DEFINITIONS,
  type FunnelId,
} from "@/lib/analytics/tracking-service"

/**
 * GET /api/claver/analytics/dashboard
 * Dashboard data for Claver Cloud analytics page.
 * Requires Claver Cloud access (analista/superadmin).
 */
export async function GET(request: NextRequest) {
  const auth = await getAuthContext(request)
  if (!auth.ok) return auth.response

  const url = new URL(request.url)
  const days = Math.min(parseInt(url.searchParams.get("days") ?? "7", 10), 90)
  const funnelId = url.searchParams.get("funnel") as FunnelId | null

  // If specific funnel requested
  if (funnelId && funnelId in FUNNEL_DEFINITIONS) {
    const funnel = await getFunnelAnalytics(funnelId, days)
    return NextResponse.json({ funnel })
  }

  // Full dashboard
  const [dashboard, alerts, ...funnels] = await Promise.all([
    getAnalyticsDashboard(days),
    getAnalyticsAlerts(),
    ...Object.keys(FUNNEL_DEFINITIONS).map((fid) =>
      getFunnelAnalytics(fid as FunnelId, days)
    ),
  ])

  return NextResponse.json({
    ...dashboard,
    alerts,
    funnels: funnels.filter(Boolean),
    funnelDefinitions: Object.values(FUNNEL_DEFINITIONS).map((f) => ({
      id: f.id,
      label: f.label,
      description: f.description,
      stepCount: f.steps.length,
    })),
  })
}
