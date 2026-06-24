/**
 * Stock Alerts Agent — Monitors stock levels and generates intelligent alerts
 *
 * Triggers: nightly batch + STOCK_ACTUALIZADO event
 * Actions: creates AlertaIA records for critical stock, demand drops, expiring lots
/**
 * Stock Alerts Agent — Monitors stock levels and generates intelligent alerts
 *
 * Triggers: nightly batch + STOCK_ACTUALIZADO event
 * Actions: creates AlertaIA records for critical stock, demand drops, expiring lots
 */

import { AgentBase } from "./agent-base"
import { analizarAlertasInteligentes } from "../analyzers"
import { crearAlertaIAConNotificacion } from "../notificacion-ia-service"
import { getIANotificacionConfig } from "../ia-notificacion-config"
import { prisma } from "@/lib/prisma"
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

    // Fetch company rubro
    const empresa = await prisma.empresa.findUnique({
      where: { id: ctx.empresaId },
      select: { rubro: true },
    })

    // Use existing analyzer
    const result = await analizarAlertasInteligentes(ctx.empresaId, empresa?.rubro || "comercio")

    if (!result || !result.alertas?.length) {
      return { resumen: "Sin alertas de stock relevantes hoy", acciones }
    }

    const iaConfig = await getIANotificacionConfig(ctx.empresaId)
    const notificar = iaConfig.agentesNotificacion["alertas-stock"] !== false

    for (const alerta of result.alertas) {
      await crearAlertaIAConNotificacion({
        empresaId: ctx.empresaId,
        tipo: alerta.tipo,
        prioridad: alerta.prioridad as "alta" | "media" | "baja",
        titulo: alerta.titulo,
        descripcion: alerta.detalle,
        accion: alerta.accionSugerida,
        origen: "ia_agente",
        agenteId: "alertas-stock",
        notificar,
        datosExtra: { impacto: alerta.impactoEstimado },
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
