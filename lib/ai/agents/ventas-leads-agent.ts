/**
 * Ventas/Leads Agent — Sales automation via WhatsApp
 *
 * Monitors inactive clients, generates reactivation messages,
 * and produces WhatsApp outreach for leads.
 */

import { prisma } from "@/lib/prisma"
import { AgentBase } from "./agent-base"
import { generarMensajesWhatsApp } from "../ai-business"
import type { AgentConfig, AgentRunContext, AgentAction } from "./agent-types"

export class VentasLeadsAgent extends AgentBase {
  config: AgentConfig = {
    id: "ventas-leads",
    nombre: "Agente de Ventas / Leads",
    descripcion: "Detecta clientes inactivos, genera mensajes de reactivación por WhatsApp, y produce outreach personalizado basado en historial de compras.",
    icono: "message-circle",
    categoria: "comercial",
    tier: "batch",
    schedule: { type: "cron", expression: "0 9 * * 1,3,5", label: "Lunes, miércoles y viernes a las 9:00" },
    reactsTo: [],
    defaultEnabled: true,
  }

  protected async execute(ctx: AgentRunContext) {
    const acciones: AgentAction[] = []

    // Generate messages for inactive clients
    const inactivos = await generarMensajesWhatsApp(ctx.empresaId, "inactivos")

    if (inactivos?.mensajes?.length) {
      for (const msg of inactivos.mensajes) {
        await prisma.mensajePendienteWhatsApp.create({
          data: {
            empresaId: ctx.empresaId,
            destinatario: msg.destinatario,
            telefono: msg.telefono || "",
            mensaje: msg.mensaje,
            tipo: msg.tipo,
            prioridad: msg.prioridad,
            estado: "pendiente",
          },
        })

        acciones.push({
          tipo: "mensaje_generado",
          descripcion: `WhatsApp reactivación → ${msg.destinatario}`,
          datos: { tipo: msg.tipo, prioridad: msg.prioridad },
        })
      }
    }

    // Generate cobranza messages
    const cobranza = await generarMensajesWhatsApp(ctx.empresaId, "cobranza")

    if (cobranza?.mensajes?.length) {
      for (const msg of cobranza.mensajes) {
        const exists = await prisma.mensajePendienteWhatsApp.findFirst({
          where: {
            empresaId: ctx.empresaId,
            destinatario: msg.destinatario,
            tipo: "cobranza",
            estado: "pendiente",
          },
        })
        if (exists) continue

        await prisma.mensajePendienteWhatsApp.create({
          data: {
            empresaId: ctx.empresaId,
            destinatario: msg.destinatario,
            telefono: msg.telefono || "",
            mensaje: msg.mensaje,
            tipo: msg.tipo,
            prioridad: msg.prioridad,
            estado: "pendiente",
          },
        })

        acciones.push({
          tipo: "mensaje_generado",
          descripcion: `WhatsApp cobranza → ${msg.destinatario}`,
          datos: { tipo: msg.tipo, prioridad: msg.prioridad },
        })
      }
    }

    const total = acciones.length
    return {
      resumen: total > 0
        ? `${total} mensajes WhatsApp generados (${inactivos?.mensajes?.length ?? 0} reactivación, ${cobranza?.mensajes?.length ?? 0} cobranza)`
        : "Sin clientes inactivos ni cobranzas pendientes para contactar",
      acciones,
    }
  }
}
