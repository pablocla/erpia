/**
 * Reportes Agent — Natural language business reports
 *
 * Generates daily/weekly/monthly reports with narrative text,
 * KPIs, insights, comparisons, and actionable recommendations.
 */

import { prisma } from "@/lib/prisma"
import { AgentBase } from "./agent-base"
import { generarReporte } from "../ai-business"
import type { AgentConfig, AgentRunContext, AgentAction } from "./agent-types"

export class ReportesAgent extends AgentBase {
  config: AgentConfig = {
    id: "reportes",
    nombre: "Agente de Reportes en Lenguaje Natural",
    descripcion: "Genera reportes diarios, semanales y mensuales con métricas, insights comparativos y recomendaciones. 'Cómo me fue hoy vs la semana pasada' en 10 segundos.",
    icono: "file-text",
    categoria: "operativo",
    tier: "batch",
    schedule: { type: "cron", expression: "0 7 * * *", label: "Todos los días a las 7:00" },
    reactsTo: ["CAJA_CERRADA"],
    defaultEnabled: true,
  }

  protected async execute(ctx: AgentRunContext) {
    const acciones: AgentAction[] = []

    // Determine period — daily by default, weekly on Mondays, monthly on 1st
    const today = new Date()
    const dayOfWeek = today.getDay()
    const dayOfMonth = today.getDate()

    const periodos: Array<"dia" | "semana" | "mes"> = ["dia"]
    if (dayOfWeek === 1) periodos.push("semana")
    if (dayOfMonth === 1) periodos.push("mes")

    for (const periodo of periodos) {
      const result = await generarReporte(ctx.empresaId, periodo)

      if (!result) continue

      // Persist report
      await prisma.reporteIA.create({
        data: {
          empresaId: ctx.empresaId,
          periodo,
          resumen: result.resumen,
          metricasClave: result.metricas_clave as any,
          insights: result.insights.join("\n"),
          recomendaciones: result.recomendaciones.join("\n"),
          alertasCriticas: result.alertas_criticas.join("\n"),
        },
      })

      acciones.push({
        tipo: "reporte_generado",
        descripcion: `Reporte ${periodo === "dia" ? "diario" : periodo === "semana" ? "semanal" : "mensual"} generado`,
        datos: {
          periodo,
          metricas: result.metricas_clave.length,
          insights: result.insights.length,
          alertasCriticas: result.alertas_criticas.length,
        },
      })

      // If critical alerts in report, also create AlertaIA
      if (result.alertas_criticas.length > 0) {
        await prisma.alertaIA.create({
          data: {
            empresaId: ctx.empresaId,
            tipo: "general",
            prioridad: "alta",
            titulo: `Alertas críticas en reporte ${periodo}`,
            descripcion: result.alertas_criticas.join(". "),
            accion: result.recomendaciones[0] ?? "Revisar reporte completo",
          },
        })

        acciones.push({
          tipo: "alerta_creada",
          descripcion: `${result.alertas_criticas.length} alertas críticas del reporte`,
        })
      }
    }

    return {
      resumen: `${periodos.length} reporte(s) generado(s): ${periodos.join(", ")}`,
      acciones,
    }
  }
}
