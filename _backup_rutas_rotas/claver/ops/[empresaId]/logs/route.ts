import { type NextRequest, NextResponse } from "next/server"
import { getClaverAnalystEmpresaContext } from "@/lib/auth/claver-analyst"
import { aggregateLogs, logsToCsv } from "@/lib/ops/logs-aggregator"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ empresaId: string }> },
) {
  try {
    const { empresaId: empresaIdStr } = await params
    const empresaId = Number(empresaIdStr)
    if (isNaN(empresaId)) {
      return NextResponse.json({ error: "empresaId inválido" }, { status: 400 })
    }

    const ctx = await getClaverAnalystEmpresaContext(request, empresaId)
    if (!ctx.ok) return ctx.response

    const sp = request.nextUrl.searchParams
    const format = sp.get("format")
    const logs = await aggregateLogs({
      empresaId,
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
          "Content-Disposition": `attachment; filename="logs-empresa-${empresaId}.csv"`,
        },
      })
    }

    return NextResponse.json({ data: logs, total: logs.length })
  } catch (error) {
    console.error("Error claver ops logs:", error)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}