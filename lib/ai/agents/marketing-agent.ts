/**
 * Marketing Agent — Automated marketing campaigns from ERP data
 *
 * Generates email campaigns, retention messages, and promotional
 * content based on real purchase history, segments, and behavior.
 */

import { prisma } from "@/lib/prisma"
import { AgentBase } from "./agent-base"
import { generarMensajesWhatsApp } from "../ai-business"
import { aiService } from "../ai-service"
import { buildEmpresaContexto } from "../context-builder"
import { buildSystemPrompt } from "../system-prompts"
import type { AgentConfig, AgentRunContext, AgentAction } from "./agent-types"

export class MarketingAgent extends AgentBase {
  config: AgentConfig = {
    id: "marketing",
    nombre: "Agente de Marketing Automation",
    descripcion: "Genera campañas de email y WhatsApp basadas en datos reales: clientes inactivos, cumpleaños, productos con stock alto, y segmentación por compras.",
    icono: "megaphone",
    categoria: "marketing",
    tier: "batch",
    schedule: { type: "cron", expression: "0 11 * * 2,4", label: "Martes y jueves a las 11:00" },
    reactsTo: [],
    defaultEnabled: false,
  }

  protected async execute(ctx: AgentRunContext) {
    const acciones: AgentAction[] = []

    // 1. Inactive clients campaign
    const inactivos = await this.detectInactiveClients(ctx.empresaId)
    if (inactivos.length > 0) {
      const result = await generarMensajesWhatsApp(ctx.empresaId, "inactivos")
      if (result?.mensajes?.length) {
        for (const msg of result.mensajes) {
          await prisma.mensajePendienteWhatsApp.create({
            data: {
              empresaId: ctx.empresaId,
              destinatario: msg.destinatario,
              telefono: msg.telefono || "",
              mensaje: msg.mensaje,
              tipo: "cliente_inactivo",
              prioridad: msg.prioridad,
              estado: "pendiente",
            },
          })

          acciones.push({
            tipo: "mensaje_generado",
            descripcion: `Reactivación → ${msg.destinatario}`,
            datos: { tipo: "reactivacion" },
          })
        }
      }
    }

    // 2. Overstock promotion campaign
    const overstock = await this.detectOverstockProducts(ctx.empresaId)
    if (overstock.length > 0) {
      const contexto = await buildEmpresaContexto(ctx.empresaId)
      const promo = await this.generatePromoCampaign(contexto, overstock)

      if (promo) {
        await prisma.alertaIA.create({
          data: {
            empresaId: ctx.empresaId,
            tipo: "oportunidad",
            prioridad: "media",
            titulo: `Campaña sugerida: ${promo.titulo}`,
            descripcion: promo.copy,
            accion: `Enviar a ${promo.audienciaEstimada} clientes por ${promo.canal}`,
            datos: promo as any,
          },
        })

        acciones.push({
          tipo: "campana_creada",
          descripcion: `Campaña "${promo.titulo}" para ${promo.audienciaEstimada} clientes`,
          datos: promo,
        })
      }
    }

    return {
      resumen: acciones.length > 0
        ? `${acciones.length} acciones de marketing: ${acciones.filter((a) => a.tipo === "mensaje_generado").length} mensajes + ${acciones.filter((a) => a.tipo === "campana_creada").length} campañas`
        : "Sin oportunidades de marketing esta semana",
      acciones,
    }
  }

  private async detectInactiveClients(empresaId: number) {
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    return prisma.cliente.findMany({
      where: {
        empresaId,
        activo: true,
        facturas: { some: {} },
        NOT: { facturas: { some: { fecha: { gte: thirtyDaysAgo } } } },
      },
      select: { id: true, nombre: true, email: true, telefono: true },
      take: 20,
    })
  }

  private async detectOverstockProducts(empresaId: number) {
    return prisma.producto.findMany({
      where: {
        empresaId,
        activo: true,
        stock: { gt: 0 },
      },
      orderBy: { stock: "desc" },
      take: 10,
      select: { id: true, nombre: true, stock: true, precioVenta: true, precioCosto: true },
    })
  }

  private async generatePromoCampaign(
    contexto: any,
    products: Array<{ id: number; nombre: string; stock: number; precioVenta: number }>
  ): Promise<{ titulo: string; copy: string; canal: string; audienciaEstimada: number; productos: string[] } | null> {
    const prompt = `Generá una campaña promocional para mover estos productos con exceso de stock:
${JSON.stringify(products.map((p) => ({ nombre: p.nombre, stock: p.stock, precio: p.precioVenta })))}

Respondé SOLO con JSON: { titulo: string, copy: string, canal: "whatsapp"|"email", audienciaEstimada: number, productos: string[] }`

    const response = await aiService.chatJson<{
      titulo: string; copy: string; canal: string; audienciaEstimada: number; productos: string[]
    }>(
      [
        { role: "system", content: buildSystemPrompt(contexto) },
        { role: "user", content: prompt },
      ],
      "batch"
    )

    return response.data ?? null
  }
}
