/**
 * Stock Alerts Agent — Monitors stock levels and generates intelligent alerts
 *
 * Triggers: nightly batch + STOCK_ACTUALIZADO event
 * Actions: creates AlertaIA records for critical stock, demand drops, expiring lots
 */

import { prisma } from "@/lib/prisma"
import { AgentBase } from "./agent-base"
import { analizarAlertasInteligentes } from "../analyzers"
import type { AgentConfig, AgentRunContext, AgentAction } from "./agent-types"

export class StockAlertsAgent extends AgentBase {
  config: AgentConfig = {
    id: "alertas-stock",
    nombre: "Alertas de Stock Inteligentes",
    descripcion: "Analiza niveles de stock, detecta productos críticos, vencimientos próximos y caídas de demanda. Genera alertas priorizadas.",
    icono: "package-search",
    categoria: "operativo",
    tier: "batch",
    schedule: { type: "cron", expression: "0 6 * * *", label: "Todos los días a las 6:00" },
    reactsTo: ["STOCK_ACTUALIZADO"],
    defaultEnabled: true,
  }

  protected async execute(ctx: AgentRunContext) {
    const acciones: AgentAction[] = []

    // Use existing analyzer
    const result = await analizarAlertasInteligentes(ctx.empresaId)

    if (!result || !result.alertas?.length) {
      return { resumen: "Sin alertas de stock relevantes hoy", acciones }
    }

    // Persist each alert
    for (const alerta of result.alertas) {
      await prisma.alertaIA.create({
        data: {
          empresaId: ctx.empresaId,
          tipo: alerta.tipo,
          prioridad: alerta.prioridad,
          titulo: alerta.titulo,
          descripcion: alerta.detalle,
          accion: alerta.accionSugerida,
          datos: { impacto: alerta.impactoEstimado },
        },
      })

      acciones.push({
        tipo: "alerta_creada",
        descripcion: `[${alerta.prioridad.toUpperCase()}] ${alerta.titulo}`,
        datos: { tipo: alerta.tipo, prioridad: alerta.prioridad },
      })
    }

    const altas = result.alertas.filter((a) => a.prioridad === "alta").length
    return {
      resumen: `${result.alertas.length} alertas generadas (${altas} altas). ${result.resumenEjecutivo}`,
      acciones,
    }
  }
}
