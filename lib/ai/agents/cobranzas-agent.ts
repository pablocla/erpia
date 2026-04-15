/**
 * Cobranzas Agent — Intelligent collections management
 *
 * Analyzes accounts receivable aging, prioritizes by risk,
 * generates personalized WhatsApp/email messages for each debtor.
 */

import { prisma } from "@/lib/prisma"
import { AgentBase } from "./agent-base"
import { analizarCobranza } from "../analyzers"
import type { AgentConfig, AgentRunContext, AgentAction } from "./agent-types"

export class CobranzasAgent extends AgentBase {
  config: AgentConfig = {
    id: "cobranzas",
    nombre: "Agente de Cobranzas Inteligente",
    descripcion: "Analiza aging de cuentas a cobrar, prioriza por probabilidad de cobro, genera mensajes personalizados de WhatsApp para cada deudor.",
    icono: "banknote",
    categoria: "financiero",
    tier: "batch",
    schedule: { type: "cron", expression: "0 8 * * 1-5", label: "Lunes a viernes a las 8:00" },
    reactsTo: ["FACTURA_EMITIDA", "RECIBO_EMITIDO"],
    defaultEnabled: true,
  }

  protected async execute(ctx: AgentRunContext) {
    const acciones: AgentAction[] = []

    const result = await analizarCobranza(ctx.empresaId)

    if (!result?.prioridad?.length) {
      return { resumen: "Sin cuentas vencidas para gestionar", acciones }
    }

    // Generate WhatsApp messages for each debtor
    for (const cliente of result.prioridad) {
      await prisma.mensajePendienteWhatsApp.create({
        data: {
          empresaId: ctx.empresaId,
          destinatario: cliente.clienteNombre,
          telefono: "",
          mensaje: cliente.mensajeWhatsApp,
          tipo: "cobranza",
          prioridad: Math.min(10, Math.round(cliente.probabilidadCobro * 10)),
          estado: "pendiente",
        },
      })

      acciones.push({
        tipo: "mensaje_generado",
        descripcion: `WhatsApp cobranza → ${cliente.clienteNombre} ($${cliente.montoTotal.toLocaleString("es-AR")}, ${cliente.diasVencido} días)`,
        datos: {
          clienteId: cliente.clienteId,
          monto: cliente.montoTotal,
          riesgo: cliente.riesgo,
          probabilidadCobro: cliente.probabilidadCobro,
        },
      })
    }

    // Create summary alert
    await prisma.alertaIA.create({
      data: {
        empresaId: ctx.empresaId,
        tipo: "cobranza_urgente",
        prioridad: result.resumen.clientesCriticos > 0 ? "alta" : "media",
        titulo: `Cobranzas: $${result.resumen.totalVencido.toLocaleString("es-AR")} vencido`,
        descripcion: `${result.prioridad.length} clientes con deuda vencida. Estimado recuperable: $${result.resumen.estimadoRecuperable.toLocaleString("es-AR")}. ${result.resumen.accionInmediata}`,
        accion: result.resumen.accionInmediata,
        datos: result.resumen as any,
      },
    })

    acciones.push({
      tipo: "alerta_creada",
      descripcion: `Resumen cobranzas: $${result.resumen.totalVencido.toLocaleString("es-AR")} vencido, ${result.resumen.clientesCriticos} críticos`,
    })

    return {
      resumen: `${result.prioridad.length} mensajes de cobranza generados. Total vencido: $${result.resumen.totalVencido.toLocaleString("es-AR")}. Estimado recuperable: $${result.resumen.estimadoRecuperable.toLocaleString("es-AR")}`,
      acciones,
    }
  }
}
