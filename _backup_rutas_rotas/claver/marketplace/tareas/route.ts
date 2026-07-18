import { type NextRequest, NextResponse } from "next/server"
import { getClaverAnalystContext, getAnalystEmpresaScope } from "@/lib/auth/claver-analyst"
import { listTareasAnalista } from "@/lib/marketplace/analyst-task-service"
import { getRunbookOrDefault } from "@/lib/marketplace/product-runbooks"
import { resolveSku } from "@/lib/marketplace/catalog-resolver"

export async function GET(request: NextRequest) {
  const ctx = await getClaverAnalystContext(request)
  if (!ctx.ok) return ctx.response

  const { searchParams } = new URL(request.url)
  const estado = searchParams.get("estado") ?? undefined
  const scope = await getAnalystEmpresaScope(ctx.auth.email)

  const tareas = await listTareasAnalista({
    analistaEmail: ctx.auth.email,
    empresaIds: scope.mode === "assigned" ? scope.empresaIds : undefined,
    estado,
    limit: 200,
  })

  const enriched = tareas.map((t) => {
    const item = resolveSku(t.sku)
    const runbook = getRunbookOrDefault(t.sku, item?.nombre ?? t.sku, item?.autoCertLevel ?? "SEMI_AUTO")
    return {
      ...t,
      producto: item,
      runbook: {
        activacionCliente: runbook.activacionCliente,
        otorgamiento: runbook.otorgamiento,
        postventa: runbook.postventa,
        ccaFase: runbook.ccaFase,
        pasos: runbook.pasos,
        escalacionSi: runbook.escalacionSi,
      },
    }
  })

  const pendientes = enriched.filter((t) => t.estado === "pendiente" || t.estado === "en_curso").length

  return NextResponse.json({
    data: enriched,
    metricas: {
      total: enriched.length,
      pendientes,
      completadas: enriched.filter((t) => t.estado === "completada").length,
    },
  })
}