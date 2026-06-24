import { type NextRequest, NextResponse } from "next/server"
import { getAuthContext } from "@/lib/auth/empresa-guard"
import { canAccessClientOps } from "@/lib/auth/claver-analyst"
import { aggregateLogs, logsToCsv } from "@/lib/ops/logs-aggregator"

export async function GET(request: NextRequest) {
  try {
    const ctx = await getAuthContext(request)
    if (!ctx.ok) return ctx.response
    if (!canAccessClientOps(ctx.auth.rol)) {
      return NextResponse.json({ error: "Sin permisos" }, { status: 403 })
    }

    const sp = request.nextUrl.searchParams
    const format = sp.get("format")
    const logs = await aggregateLogs({
      empresaId: ctx.auth.empresaId,
      categoria: sp.get("categoria") ?? undefined,
      severidad: sp.get("severidad") ?? undefined,
      desde: sp.get("desde") ? new Date(sp.get("desde")!) : undefined,
      hasta: sp.get("hasta") ? new Date(sp.get("hasta")!) : undefined,
      take: Number(sp.get("take") ?? 100),
    })

    if (format === "csv") {
      return new NextResponse(logsToCsv(logs), {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": 'attachment; filename="logs-ops.csv"',
        },
      })
    }

    return NextResponse.json({ data: logs, total: logs.length })
  } catch (error) {
    console.error("Error ops logs:", error)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}