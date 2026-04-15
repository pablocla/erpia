/**
 * Onboarding Agent — Automated company setup by rubro
 *
 * Converses with business owner to detect rubro, company size, needs.
 * Auto-configures ERP modules, categories, roles, and sample data.
 */

import { AgentBase } from "./agent-base"
import { procesarOnboardingConversacional } from "../analyzers"
import type { AgentConfig, AgentRunContext, AgentAction } from "./agent-types"

export class OnboardingAgent extends AgentBase {
  config: AgentConfig = {
    id: "onboarding",
    nombre: "Agente de Onboarding por Rubro",
    descripcion: "Conversa con el dueño del negocio, detecta el rubro, y configura automáticamente el ERP: módulos, categorías, IVA, roles, productos de ejemplo.",
    icono: "rocket",
    categoria: "operativo",
    tier: "realtime",
    schedule: { type: "manual", label: "Se ejecuta durante el onboarding inicial" },
    reactsTo: [],
    defaultEnabled: true,
  }

  protected async execute(ctx: AgentRunContext) {
    const acciones: AgentAction[] = []
    const mensaje = (ctx.eventPayload as any)?.mensaje

    if (!mensaje) {
      return { resumen: "Sin mensaje de usuario para procesar", acciones }
    }

    const result = await procesarOnboardingConversacional(mensaje)

    if (result) {
      acciones.push({
        tipo: "configuracion",
        descripcion: `Rubro detectado: ${result.rubro_detectado} (confianza: ${Math.round(result.confianza * 100)}%)`,
        datos: {
          rubro: result.rubro_detectado,
          confianza: result.confianza,
          modulosSugeridos: result.modulos_sugeridos,
          categoriasSugeridas: result.categorias_sugeridas,
          preguntasSiguientes: result.preguntas_siguientes,
        },
      })
    }

    return {
      resumen: result
        ? `Rubro detectado: ${result.rubro_detectado} (${Math.round(result.confianza * 100)}%). ${result.modulos_sugeridos?.length ?? 0} módulos sugeridos.`
        : "No se pudo procesar el mensaje de onboarding",
      acciones,
    }
  }
}
