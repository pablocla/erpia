import { type NextRequest, NextResponse } from "next/server"
import { getClaverAnalystContext } from "@/lib/auth/claver-analyst"
import {
  provisionAndValidateIndustry,
  validateDemoEmpresa,
  validateFeaturedDemos,
} from "@/lib/comercial/demo-health-validator"
import { auditDemosWithGemini } from "@/lib/comercial/demo-gemini-auditor"
import { INDUSTRY_TEMPLATES } from "@/lib/comercial/industry-templates"
import { resolveAutoSubscribe, partitionSkusForAutoActivate } from "@/lib/comercial/product-auto-subscribe"
import { skusParaActivar } from "@/lib/comercial/pack-calle-catalog"

export const maxDuration = 300
export const dynamic = "force-dynamic"

/**
 * GET /api/claver/demo-health
 * Catálogo de demos + política de auto-subscribe (sin provisionar).
 *
 * POST /api/claver/demo-health
 * Body:
 *  { "mode": "featured" | "one" | "empresa", "industryId"?, "empresaId"?, "withGemini"?, "skipHttp"?, "keepTenant"? }
 */
export async function GET(request: NextRequest) {
  const ctx = await getClaverAnalystContext(request)
  if (!ctx.ok) return ctx.response

  const featured = INDUSTRY_TEMPLATES.filter((t) => t.featured).map((t) => {
    const skus = t.engancheId ? skusParaActivar(t.engancheId) : []
    const part = partitionSkusForAutoActivate(skus, {
      context: "industry_demo",
      engancheId: t.engancheId,
    })
    return {
      industryId: t.id,
      label: t.label,
      emoji: t.emoji,
      goldenPath: t.goldenPath,
      engancheId: t.engancheId ?? null,
      isRetail: t.isRetail,
      autoSubscribe: part,
      policySample: skus.slice(0, 5).map((sku) => resolveAutoSubscribe(sku, { context: "industry_demo" })),
    }
  })

  return NextResponse.json({
    ok: true,
    message:
      "Demos featured: provision auto-activa anclas/trial. Pago = MP. Planned/setup = analista. POST para validar con checks (+ Gemini opcional).",
    featured,
    howTo: {
      validateFeatured: { method: "POST", body: { mode: "featured", withGemini: true } },
      validateOne: { method: "POST", body: { mode: "one", industryId: "almacen", withGemini: false } },
      validateEmpresa: { method: "POST", body: { mode: "empresa", empresaId: 1, industryId: "almacen" } },
    },
  })
}

export async function POST(request: NextRequest) {
  const ctx = await getClaverAnalystContext(request)
  if (!ctx.ok) return ctx.response

  const body = await request.json().catch(() => ({}))
  const mode = typeof body.mode === "string" ? body.mode : "featured"
  const withGemini = Boolean(body.withGemini)
  const skipHttp = body.skipHttp !== false // default true en serverless (no self-fetch confiable)
  const keepTenant = Boolean(body.keepTenant)

  try {
    if (mode === "empresa") {
      const empresaId = Number(body.empresaId)
      const industryId = typeof body.industryId === "string" ? body.industryId : ""
      if (!empresaId || !industryId) {
        return NextResponse.json({ error: "empresaId e industryId requeridos" }, { status: 400 })
      }
      const report = await validateDemoEmpresa(empresaId, industryId, { skipHttp: true })
      const audit = withGemini ? await auditDemosWithGemini([report], { force: true }) : null
      return NextResponse.json({ ok: report.ok, report, audit })
    }

    if (mode === "one") {
      const industryId = typeof body.industryId === "string" ? body.industryId.trim() : ""
      if (!industryId) {
        return NextResponse.json({ error: "industryId requerido" }, { status: 400 })
      }
      const report = await provisionAndValidateIndustry(industryId, { skipHttp, keepTenant })
      const audit = withGemini ? await auditDemosWithGemini([report], { force: true }) : null
      return NextResponse.json({ ok: report.ok, report, audit })
    }

    // featured (default)
    const industryIds = Array.isArray(body.industryIds)
      ? body.industryIds.filter((x: unknown) => typeof x === "string")
      : undefined

    const { reports, summary } = await validateFeaturedDemos({
      industryIds,
      skipHttp,
      keepTenant,
    })
    const audit = withGemini
      ? await auditDemosWithGemini(reports, { force: true })
      : await auditDemosWithGemini(reports)

    return NextResponse.json({
      ok: reports.every((r) => r.ok),
      summary,
      reports,
      audit,
      analyst: ctx.auth.email,
    })
  } catch (e) {
    console.error("[demo-health]", e)
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Error validando demos" },
      { status: 500 },
    )
  }
}
