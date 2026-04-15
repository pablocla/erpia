/**
 * Anomalías Agent — Detects suspicious/unusual operations
 *
 * Scans last 7 days for: unusual prices, excessive discounts,
 * off-hours operations, supplier price spikes, frequent cancellations.
 */

import { prisma } from "@/lib/prisma"
import { AgentBase } from "./agent-base"
import { detectarAnomalias } from "../analyzers"
import type { AgentConfig, AgentRunContext, AgentAction } from "./agent-types"

export class AnomaliasAgent extends AgentBase {
  config: AgentConfig = {
    id: "anomalias",
    nombre: "Agente de Detección de Anomalías",
    descripcion: "Escanea operaciones de los últimos 7 días. Detecta precios sospechosos, descuentos excesivos, operaciones fuera de horario, y patrones inusuales.",
    icono: "shield-alert",
    categoria: "financiero",
    tier: "nightly",
    schedule: { type: "cron", expression: "0 23 * * *", label: "Todos los días a las 23:00" },
    reactsTo: ["FACTURA_EMITIDA", "CAJA_CERRADA"],
    defaultEnabled: true,
  }

  protected async execute(ctx: AgentRunContext) {
    const acciones: AgentAction[] = []

    const result = await detectarAnomalias(ctx.empresaId)

    if (!result?.anomalias?.length) {
      return { resumen: "Sin anomalías detectadas en los últimos 7 días", acciones }
    }

    for (const anomalia of result.anomalias) {
      await prisma.alertaIA.create({
        data: {
          empresaId: ctx.empresaId,
          tipo: "anomalia",
          prioridad: anomalia.severidad === "critica" ? "alta" : anomalia.severidad === "media" ? "media" : "baja",
          titulo: anomalia.titulo,
          descripcion: anomalia.detalle,
          accion: anomalia.accionRecomendada,
          datos: { tipo: anomalia.tipo, impacto: anomalia.impactoEstimado } as any,
        },
      })

      acciones.push({
        tipo: "anomalia_detectada",
        descripcion: `[${anomalia.severidad.toUpperCase()}] ${anomalia.titulo}`,
        datos: {
          tipo: anomalia.tipo,
          severidad: anomalia.severidad,
          impacto: anomalia.impactoEstimado,
        },
      })
    }

    const criticas = result.anomalias.filter((a) => a.severidad === "critica").length
    return {
      resumen: `${result.anomalias.length} anomalías detectadas (${criticas} críticas). ${result.resumen}`,
      acciones,
    }
  }
}
