/**
 * Servicio de analytics server-side para tracking de pageviews, funnels y alertas.
 * Consume los modelos PageView y FunnelStep de Prisma.
 */

import { prisma } from "@/lib/prisma"

// ─── Funnel Definitions ────────────────────────────────────────────────

export const FUNNEL_DEFINITIONS = {
  adquisicion: {
    id: "adquisicion",
    label: "Adquisición",
    description: "Anónimo → Registro",
    steps: [
      { order: 1, name: "visit_landing", label: "Visita landing" },
      { order: 2, name: "view_pricing", label: "Ve precios" },
      { order: 3, name: "click_register", label: "Click registrarse" },
      { order: 4, name: "submit_register", label: "Envía formulario" },
      { order: 5, name: "complete_signup", label: "Registro completo" },
      { order: 6, name: "first_login", label: "Primer login" },
    ],
  },
  activacion: {
    id: "activacion",
    label: "Activación",
    description: "Registro → Primera venta",
    steps: [
      { order: 1, name: "first_login", label: "Primer login" },
      { order: 2, name: "add_first_product", label: "Carga primer producto" },
      { order: 3, name: "configure_empresa", label: "Configura empresa" },
      { order: 4, name: "first_sale", label: "Primera venta POS" },
      { order: 5, name: "first_caja_close", label: "Primer cierre de caja" },
    ],
  },
  conversion: {
    id: "conversion",
    label: "Conversión",
    description: "Trial → Pago",
    steps: [
      { order: 1, name: "use_free_features", label: "Usa features gratis" },
      { order: 2, name: "hit_paywall", label: "Llega al paywall" },
      { order: 3, name: "view_plans", label: "Ve planes" },
      { order: 4, name: "start_subscription", label: "Inicia suscripción" },
      { order: 5, name: "payment_confirmed", label: "Pago confirmado" },
    ],
  },
  retencion: {
    id: "retencion",
    label: "Retención",
    description: "Uso continuado",
    steps: [
      { order: 1, name: "weekly_login", label: "Login semanal" },
      { order: 2, name: "use_pos", label: "Usa POS" },
      { order: 3, name: "use_facturacion", label: "Usa facturación" },
      { order: 4, name: "use_reportes", label: "Usa reportes" },
      { order: 5, name: "renew_subscription", label: "Renueva suscripción" },
    ],
  },
  facebook_erp: {
    id: "facebook_erp",
    label: "Facebook → ERP",
    description: "Anuncio → /erp → entra al sistema",
    steps: [
      { order: 1, name: "visit_landing", label: "Entra a /erp" },
      { order: 2, name: "click_modulo", label: "Toca un módulo CORE" },
      { order: 3, name: "enter_demo", label: "Entra al ERP demo" },
      { order: 4, name: "complete_signup", label: "Crea cuenta propia" },
    ],
  },
} as const

export type FunnelId = keyof typeof FUNNEL_DEFINITIONS

// ─── Track PageView ────────────────────────────────────────────────────

export async function trackPageView(data: {
  sessionId: string
  empresaId?: number | null
  usuarioId?: number | null
  path: string
  referrer?: string | null
  userAgent?: string | null
  duracionMs?: number | null
  evento?: string
  metadata?: Record<string, unknown> | null
}) {
  try {
    await prisma.pageView.create({
      data: {
        sessionId: data.sessionId,
        empresaId: data.empresaId ?? null,
        usuarioId: data.usuarioId ?? null,
        path: data.path,
        referrer: data.referrer ?? null,
        userAgent: data.userAgent ?? null,
        duracionMs: data.duracionMs ?? null,
        evento: data.evento ?? "pageview",
        metadata: (data.metadata as any) ?? undefined,
      },
    })
  } catch {
    // Non-blocking — analytics should never break the app
    console.error("[analytics] Failed to track pageview")
  }
}

// ─── Track Funnel Step ─────────────────────────────────────────────────

export async function trackFunnelStep(data: {
  sessionId: string
  empresaId?: number | null
  usuarioId?: number | null
  funnelId: FunnelId
  stepName: string
}) {
  const def = FUNNEL_DEFINITIONS[data.funnelId]
  if (!def) return
  const step = def.steps.find((s) => s.name === data.stepName)
  if (!step) return

  try {
    // Upsert: don't duplicate if same session already completed this step
    const existing = await prisma.funnelStep.findFirst({
      where: {
        sessionId: data.sessionId,
        funnelId: data.funnelId,
        stepName: data.stepName,
      },
    })
    if (existing) return

    await prisma.funnelStep.create({
      data: {
        sessionId: data.sessionId,
        empresaId: data.empresaId ?? null,
        usuarioId: data.usuarioId ?? null,
        funnelId: data.funnelId,
        stepOrder: step.order,
        stepName: data.stepName,
        completed: true,
      },
    })
  } catch {
    console.error("[analytics] Failed to track funnel step")
  }
}

// ─── Dashboard Queries ─────────────────────────────────────────────────

export async function getAnalyticsDashboard(days = 7) {
  const since = new Date()
  since.setDate(since.getDate() - days)

  const sincePrev = new Date()
  sincePrev.setDate(sincePrev.getDate() - days * 2)

  const [
    pageviews,
    pageviewsPrev,
    uniqueSessions,
    uniqueSessionsPrev,
    topPages,
    avgDuration,
    eventCounts,
    recentPageviews,
  ] = await Promise.all([
    // Total pageviews current period
    prisma.pageView.count({
      where: { createdAt: { gte: since }, evento: "pageview" },
    }),
    // Total pageviews previous period (for comparison)
    prisma.pageView.count({
      where: {
        createdAt: { gte: sincePrev, lt: since },
        evento: "pageview",
      },
    }),
    // Unique sessions current
    prisma.pageView.groupBy({
      by: ["sessionId"],
      where: { createdAt: { gte: since }, evento: "pageview" },
    }),
    // Unique sessions previous
    prisma.pageView.groupBy({
      by: ["sessionId"],
      where: {
        createdAt: { gte: sincePrev, lt: since },
        evento: "pageview",
      },
    }),
    // Top 10 pages
    prisma.pageView.groupBy({
      by: ["path"],
      where: { createdAt: { gte: since }, evento: "pageview" },
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
      take: 10,
    }),
    // Average duration
    prisma.pageView.aggregate({
      where: {
        createdAt: { gte: since },
        evento: "pageview",
        duracionMs: { not: null },
      },
      _avg: { duracionMs: true },
    }),
    // Event counts by type
    prisma.pageView.groupBy({
      by: ["evento"],
      where: { createdAt: { gte: since } },
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
    }),
    // Recent pageviews for live feed
    prisma.pageView.findMany({
      where: { createdAt: { gte: since } },
      orderBy: { createdAt: "desc" },
      take: 50,
      select: {
        id: true,
        sessionId: true,
        path: true,
        evento: true,
        createdAt: true,
        empresaId: true,
        referrer: true,
      },
    }),
  ])

  const visitors = uniqueSessions.length
  const visitorsPrev = uniqueSessionsPrev.length
  const visitorsChange =
    visitorsPrev > 0 ? Math.round(((visitors - visitorsPrev) / visitorsPrev) * 100) : null

  // Bounce rate: sessions with only 1 pageview / total sessions
  const sessionCounts = await prisma.pageView.groupBy({
    by: ["sessionId"],
    where: { createdAt: { gte: since }, evento: "pageview" },
    _count: { id: true },
  })
  const bounceSessions = sessionCounts.filter((s) => s._count.id === 1).length
  const bounceRate = sessionCounts.length > 0 ? Math.round((bounceSessions / sessionCounts.length) * 100) : 0

  return {
    periodo: { days, desde: since.toISOString() },
    trafico: {
      pageviews,
      pageviewsPrev,
      pageviewsChange:
        pageviewsPrev > 0 ? Math.round(((pageviews - pageviewsPrev) / pageviewsPrev) * 100) : null,
      visitors,
      visitorsPrev,
      visitorsChange,
      bounceRate,
      avgDurationMs: Math.round(avgDuration._avg.duracionMs ?? 0),
    },
    topPages: topPages.map((p) => ({
      path: p.path,
      views: p._count.id,
    })),
    eventos: eventCounts.map((e) => ({
      evento: e.evento,
      count: e._count.id,
    })),
    feed: recentPageviews,
  }
}

// ─── Funnel Analytics ──────────────────────────────────────────────────

export async function getFunnelAnalytics(funnelId: FunnelId, days = 30) {
  const def = FUNNEL_DEFINITIONS[funnelId]
  if (!def) return null

  const since = new Date()
  since.setDate(since.getDate() - days)

  const stepCounts = await prisma.funnelStep.groupBy({
    by: ["stepName", "stepOrder"],
    where: {
      funnelId,
      completed: true,
      createdAt: { gte: since },
    },
    _count: { id: true },
    orderBy: { stepOrder: "asc" },
  })

  const steps = def.steps.map((s) => {
    const found = stepCounts.find((sc) => sc.stepName === s.name)
    return {
      order: s.order,
      name: s.name,
      label: s.label,
      count: found?._count.id ?? 0,
    }
  })

  // Calculate drop-off between each step
  const stepsWithDropoff = steps.map((s, i) => {
    const prev = i === 0 ? s.count : steps[i - 1].count
    const dropoff = prev > 0 ? Math.round(((prev - s.count) / prev) * 100) : 0
    const conversionFromFirst = steps[0].count > 0 ? Math.round((s.count / steps[0].count) * 100) : 0
    return { ...s, dropoff, conversionFromFirst }
  })

  // Find worst drop-off point
  const worstDropoff = stepsWithDropoff.reduce(
    (worst, s) => (s.dropoff > worst.dropoff ? s : worst),
    stepsWithDropoff[0]
  )

  return {
    funnelId,
    label: def.label,
    description: def.description,
    days,
    steps: stepsWithDropoff,
    worstDropoff: worstDropoff
      ? { step: worstDropoff.label, dropoff: worstDropoff.dropoff }
      : null,
    overallConversion:
      steps[0].count > 0
        ? Math.round((steps[steps.length - 1].count / steps[0].count) * 100)
        : 0,
  }
}

// ─── Alerts ────────────────────────────────────────────────────────────

export type AnalyticsAlert = {
  id: string
  severity: "critical" | "warning" | "info"
  title: string
  description: string
}

export async function getAnalyticsAlerts(): Promise<AnalyticsAlert[]> {
  const alerts: AnalyticsAlert[] = []
  const now = new Date()

  // 1. Traffic drop: current 7d vs previous 7d
  const since7d = new Date(now.getTime() - 7 * 86400000)
  const sincePrev7d = new Date(now.getTime() - 14 * 86400000)

  const [current7d, prev7d] = await Promise.all([
    prisma.pageView.groupBy({
      by: ["sessionId"],
      where: { createdAt: { gte: since7d }, evento: "pageview" },
    }),
    prisma.pageView.groupBy({
      by: ["sessionId"],
      where: { createdAt: { gte: sincePrev7d, lt: since7d }, evento: "pageview" },
    }),
  ])

  if (prev7d.length > 5 && current7d.length < prev7d.length * 0.5) {
    alerts.push({
      id: "traffic_drop",
      severity: "critical",
      title: "Caída de tráfico",
      description: `Visitantes 7d: ${current7d.length} (anterior: ${prev7d.length}). Caída del ${Math.round(((prev7d.length - current7d.length) / prev7d.length) * 100)}%.`,
    })
  }

  // 2. High bounce rate
  const sessionPageCounts = await prisma.pageView.groupBy({
    by: ["sessionId"],
    where: { createdAt: { gte: since7d }, evento: "pageview" },
    _count: { id: true },
  })
  const totalSessions = sessionPageCounts.length
  const bounceSessions = sessionPageCounts.filter((s) => s._count.id === 1).length
  const bounceRate = totalSessions > 0 ? (bounceSessions / totalSessions) * 100 : 0

  if (totalSessions > 10 && bounceRate > 80) {
    alerts.push({
      id: "high_bounce",
      severity: "warning",
      title: "Bounce rate alto",
      description: `${Math.round(bounceRate)}% de los visitantes se van sin navegar. Revisá la landing o el primer impacto.`,
    })
  }

  // 3. Churn signal: tenants without login in 14+ days
  const since14d = new Date(now.getTime() - 14 * 86400000)
  try {
    const activeEmpresas = await prisma.pageView.groupBy({
      by: ["empresaId"],
      where: {
        empresaId: { not: null },
        createdAt: { lt: since14d },
        evento: "pageview",
      },
    })
    const recentEmpresas = await prisma.pageView.groupBy({
      by: ["empresaId"],
      where: {
        empresaId: { not: null },
        createdAt: { gte: since14d },
        evento: "pageview",
      },
    })
    const recentIds = new Set(recentEmpresas.map((e) => e.empresaId))
    const churning = activeEmpresas.filter((e) => e.empresaId && !recentIds.has(e.empresaId))

    if (churning.length > 0) {
      alerts.push({
        id: "churn_signal",
        severity: "critical",
        title: "Señal de churn",
        description: `${churning.length} tenant(s) sin actividad en 14+ días.`,
      })
    }
  } catch {
    // Skip if query fails
  }

  // 4. Traffic spike (positive)
  if (prev7d.length > 5 && current7d.length > prev7d.length * 1.5) {
    alerts.push({
      id: "traffic_spike",
      severity: "info",
      title: "Pico de tráfico",
      description: `Visitantes 7d: ${current7d.length} (+${Math.round(((current7d.length - prev7d.length) / prev7d.length) * 100)}% vs semana anterior).`,
    })
  }

  return alerts
}

function metaString(metadata: unknown, key: string): string | null {
  if (!metadata || typeof metadata !== "object") return null
  const value = (metadata as Record<string, unknown>)[key]
  return typeof value === "string" && value.length > 0 ? value : null
}

export async function getFacebookCampaignPulse(days = 7) {
  const since = new Date()
  since.setDate(since.getDate() - days)

  const hits = await prisma.pageView.findMany({
    where: {
      createdAt: { gte: since },
      OR: [
        { path: { startsWith: "/erp" } },
        { evento: { startsWith: "fb_" } },
        { metadata: { path: ["utmSource"], equals: "facebook" } },
        { metadata: { path: ["ref"], equals: "fb" } },
      ],
    },
    orderBy: { createdAt: "desc" },
    take: 2000,
    select: {
      id: true,
      sessionId: true,
      path: true,
      evento: true,
      referrer: true,
      createdAt: true,
      empresaId: true,
      metadata: true,
    },
  })

  const sessions = new Set(hits.map((h) => h.sessionId))
  const landings = hits.filter((h) => h.path.startsWith("/erp") || h.evento === "fb_pulse")
  const moduloClicks = hits.filter((h) => h.evento === "fb_click_modulo")
  const enters = hits.filter((h) => h.evento === "fb_enter_erp")
  const dashboardHits = hits.filter((h) => h.path.startsWith("/dashboard"))
  const dashboardSessions = new Set(dashboardHits.map((h) => h.sessionId))

  const byCampaign = new Map<string, { sessions: Set<string>; hits: number; enters: number }>()
  const byPath = new Map<string, number>()
  const byModulo = new Map<string, number>()

  for (const hit of hits) {
    const campaign = metaString(hit.metadata, "utmCampaign") ?? "sin-campaign"
    let bucket = byCampaign.get(campaign)
    if (!bucket) {
      bucket = { sessions: new Set(), hits: 0, enters: 0 }
      byCampaign.set(campaign, bucket)
    }
    bucket.sessions.add(hit.sessionId)
    bucket.hits += 1
    if (hit.evento === "fb_enter_erp") bucket.enters += 1

    byPath.set(hit.path, (byPath.get(hit.path) ?? 0) + 1)

    const modulo = metaString(hit.metadata, "modulo")
    if (modulo) byModulo.set(modulo, (byModulo.get(modulo) ?? 0) + 1)
  }

  return {
    periodo: { days, desde: since.toISOString() },
    pulso: {
      hits: hits.length,
      sesiones: sessions.size,
      landings: landings.length,
      clicksModulo: moduloClicks.length,
      entradasErp: enters.length,
      sesionesEnDashboard: dashboardSessions.size,
    },
    porCampana: [...byCampaign.entries()]
      .map(([id, b]) => ({
        utmCampaign: id,
        sesiones: b.sessions.size,
        hits: b.hits,
        entradasErp: b.enters,
      }))
      .sort((a, b) => b.sesiones - a.sesiones),
    porSubpagina: [...byPath.entries()]
      .map(([path, views]) => ({ path, views }))
      .sort((a, b) => b.views - a.views)
      .slice(0, 20),
    porModulo: [...byModulo.entries()]
      .map(([modulo, clicks]) => ({ modulo, clicks }))
      .sort((a, b) => b.clicks - a.clicks),
    recientes: hits.slice(0, 40).map((h) => ({
      id: h.id,
      sessionId: h.sessionId.slice(0, 8),
      path: h.path,
      evento: h.evento,
      utmCampaign: metaString(h.metadata, "utmCampaign"),
      modulo: metaString(h.metadata, "modulo"),
      createdAt: h.createdAt.toISOString(),
    })),
  }
}
