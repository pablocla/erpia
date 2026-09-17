import { NextRequest, NextResponse } from "next/server"
import { getClaverAnalystContext } from "@/lib/auth/claver-analyst"
import { listProtheusAudit, listProtheusFleet, pingProtheusTenant } from "@/lib/claver-cloud/protheus-fleet"

export async function GET(request: NextRequest) {
  const ctx = await getClaverAnalystContext(request)
  if (!ctx.ok) return ctx.response

  const empresaIdRaw = request.nextUrl.searchParams.get("empresaId")
  const auditOnly = request.nextUrl.searchParams.get("audit") === "1"
  const empresaId = empresaIdRaw ? Number(empresaIdRaw) : undefined

  if (auditOnly) {
    const audit = await listProtheusAudit({
      empresaId: Number.isFinite(empresaId) ? empresaId : undefined,
    })
    return NextResponse.json({ audit })
  }

  const [tenants, audit] = await Promise.all([
    listProtheusFleet(),
    listProtheusAudit({ take: 40 }),
  ])
  const pingOk = tenants.filter((t) => t.lastPingOk === true).length
  const pingFail = tenants.filter((t) => t.lastPingOk === false).length
  const ready = tenants.filter((t) => t.restReady).length
  return NextResponse.json({
    summary: { total: tenants.length, restReady: ready, pingOk, pingFail },
    tenants,
    audit,
  })
}

export async function POST(request: NextRequest) {
  const ctx = await getClaverAnalystContext(request)
  if (!ctx.ok) return ctx.response
  const body = (await request.json()) as { empresaId?: number; pingAll?: boolean }
  if (body.pingAll) {
    const tenants = await listProtheusFleet()
    const results = []
    for (const t of tenants.filter((x) => x.restReady).slice(0, 25)) {
      results.push({ empresaId: t.empresaId, ...(await pingProtheusTenant(t.empresaId)) })
    }
    return NextResponse.json({ results })
  }
  if (!body.empresaId || !Number.isFinite(body.empresaId)) {
    return NextResponse.json({ error: "empresaId requerido" }, { status: 400 })
  }
  const ping = await pingProtheusTenant(body.empresaId)
  return NextResponse.json({ empresaId: body.empresaId, ...ping })
}
