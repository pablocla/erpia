import { type NextRequest, NextResponse } from "next/server"
import { getClaverAnalystContext } from "@/lib/auth/claver-analyst"
import { getPlataformaMetricas } from "@/lib/ops/ops-metrics-service"

export async function GET(request: NextRequest) {
  try {
    const ctx = await getClaverAnalystContext(request)
    if (!ctx.ok) return ctx.response

    const metricas = await getPlataformaMetricas(ctx.auth.email)
    return NextResponse.json(metricas)
  } catch (error) {
    console.error("Error ops metricas:", error)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}