/**
 * Compras Predictivo Agent — Predictive purchasing suggestions
 *
 * Analyzes 8-week sales trends, lead times, and stock levels
 * to suggest automatic purchase orders before stockouts.
 */

import { AgentBase } from "./agent-base"
import { predecirCompras } from "../analyzers"
import { crearAlertaIAConNotificacion } from "../notificacion-ia-service"
import { getIANotificacionConfig } from "../ia-notificacion-config"
import type { AgentConfig, AgentRunContext, AgentAction } from "./agent-types"

export class ComprasPredictiveAgent extends AgentBase {
  config: AgentConfig = {
    id: "compras-predictivo",
    nombre: "Agente de Compras Predictivo",
    descripcion: "Analiza ventas históricas + estacionalidad + lead time de proveedores. Sugiere órdenes de compra antes de que se quede sin stock.",
    icono: "shopping-cart",
    categoria: "operativo",
    tier: "nightly",
    schedule: { type: "cron", expression: "0 22 * * 0", label: "Domingos a las 22:00" },
    reactsTo: ["STOCK_ACTUALIZADO"],
    defaultEnabled: true,
  }

  protected async execute(ctx: AgentRunContext) {
    const acciones: AgentAction[] = []

    const result = await predecirCompras(ctx.empresaId)

    if (!result?.reposiciones?.length) {
      return { resumen: "Stock saludable, sin reposiciones necesarias esta semana", acciones }
    }

    // Create alerts for each reposition suggestion
    const urgentes = result.reposiciones.filter((r) => r.urgencia === "inmediata")
    const semana = result.reposiciones.filter((r) => r.urgencia === "esta_semana")
    const proxima = result.reposiciones.filter((r) => r.urgencia === "proxima_semana")

    const iaConfig = await getIANotificacionConfig(ctx.empresaId)
    const notificar = iaConfig.agentesNotificacion["compras-predictivo"] !== false

    for (const repo of result.reposiciones) {
      await crearAlertaIAConNotificacion({
        empresaId: ctx.empresaId,
        tipo: "stock_critico",
        prioridad: repo.urgencia === "inmediata" ? "alta" : repo.urgencia === "esta_semana" ? "media" : "baja",
        titulo: `Reponer: ${repo.productoNombre}`,
        descripcion: `Stock actual: ${repo.stockActual}. Consumo semanal estimado: ${repo.consumoSemanal}. Cobertura de stock: ${repo.diasCobertura} días.`,
        accion: `Comprar ${repo.cantidadSugerida} unidades al proveedor habitual`,
        origen: "ia_agente",
        agenteId: "compras-predictivo",
        notificar,
        datosExtra: repo as Record<string, unknown>,
      })

      acciones.push({
        tipo: "reposicion_sugerida",
        descripcion: `${repo.productoNombre}: comprar ${repo.cantidadSugerida} u. (${repo.urgencia})`,
        datos: {
          productoId: repo.productoId,
          stockActual: repo.stockActual,
          cantidadSugerida: repo.cantidadSugerida,
          urgencia: repo.urgencia,
        },
      })
    }

    return {
      resumen: `${result.reposiciones.length} reposiciones sugeridas: ${urgentes.length} inmediatas, ${semana.length} esta semana, ${proxima.length} próxima semana`,
      acciones,
    }
  }
}
