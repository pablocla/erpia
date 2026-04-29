import { plantillasReportesService } from "@/lib/reportes/plantillas-service"

export interface ReporteRenderResult {
  html: string
  metadata: {
    tipo: string
    motor: string
  }
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;")
}

function interpolateTemplate(template: string, params: Record<string, unknown>) {
  return template.replace(/\{\{\s*([a-zA-Z0-9_\.]+)\s*\}\}/g, (_, key) => {
    const parts = key.split(".")
    let value: any = params
    for (const part of parts) {
      if (value == null) return ""
      value = value[part]
    }
    return typeof value === "object" ? JSON.stringify(value) : String(value ?? "")
  })
}

export const reportesService = {
  async render(plantillaId: number, parametros: Record<string, unknown>, empresaId: number): Promise<ReporteRenderResult> {
    const plantilla = await plantillasReportesService.obtener(plantillaId, empresaId)
    if (!plantilla) throw new Error("Plantilla no encontrada")

    const metadata = plantilla.metadata as { tipo?: string; motor?: string; contenido?: string; version?: number } | null
    const tipo = metadata?.tipo ?? "reporte"
    const motor = metadata?.motor ?? "html"
    const contenido = String(metadata?.contenido ?? "")

    if (motor === "html") {
      return {
        html: interpolateTemplate(contenido, parametros),
        metadata: { tipo, motor },
      }
    }

    if (motor === "jasper") {
      const rendered = `<!-- JasperReports Preview: este contenido aún no se transforma -->\n<pre>${escapeHtml(contenido)}</pre>`
      return {
        html: rendered,
        metadata: { tipo, motor },
      }
    }

    return {
      html: interpolateTemplate(contenido, parametros),
      metadata: { tipo, motor },
    }
  },
}
