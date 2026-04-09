import { type NextRequest, NextResponse } from "next/server"
import { getAuthContext } from "@/lib/auth/empresa-guard"
import { generarReporte, isIAEnabled } from "@/lib/ai"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const periodoEnum = z.enum(["dia", "semana", "mes"])

/**
 * GET /api/ai/reporte?periodo=dia|semana|mes
 * Genera reporte IA y lo persiste en ReporteIA.
 */
export async function GET(request: NextRequest) {
  try {
    const ctx = await getAuthContext(request)
    if (!ctx.ok) return ctx.response

    if (!(await isIAEnabled(ctx.auth.empresaId))) {
      return NextResponse.json({ error: "Módulo IA no está habilitado para esta empresa" }, { status: 403 })
    }

    const url = new URL(request.url)
    const periodoRaw = url.searchParams.get("periodo") ?? "dia"
    const parsed = periodoEnum.safeParse(periodoRaw)
    if (!parsed.success) {
      return NextResponse.json({ error: "periodo debe ser dia|semana|mes" }, { status: 400 })
    }
    const periodo = parsed.data

    const reporte = await generarReporte(ctx.auth.empresaId, periodo)

    // Persist
    if (reporte.resumen !== "No se pudo generar el reporte.") {
      await prisma.reporteIA.create({
        data: {
          empresaId: ctx.auth.empresaId,
          periodo,
          resumen: reporte.resumen,
          metricasClave: reporte.metricas_clave as any,
          insights: reporte.insights as any,
          recomendaciones: reporte.recomendaciones as any,
          alertasCriticas: reporte.alertas_criticas as any,
        },
      })
    }

    return NextResponse.json({ success: true, data: reporte })
  } catch (error) {
    console.error("[AI Reporte] Error:", error)
    return NextResponse.json({ error: "Error generando reporte" }, { status: 500 })
  }
}
