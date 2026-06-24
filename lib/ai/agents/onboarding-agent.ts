/**
 * Onboarding Agent — Automated company setup by rubro
 *
 * Converses with business owner to detect rubro, company size, needs.
 * Auto-configures ERP modules, categories, roles, and sample data.
 */

import { AgentBase } from "./agent-base"
import { procesarOnboardingConversacional } from "../analyzers"
import type { AgentConfig, AgentRunContext, AgentAction } from "./agent-types"
import { generarConfiguracionOnboarding, Rubro } from "@/lib/onboarding/onboarding-ia"

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
      const rubro = (result.rubro_detectado || "otro") as Rubro
      const datos = result.datos_extraidos || {}
      
      const config = generarConfiguracionOnboarding({
        rubro,
        tamano: (datos.tamano || "micro") as any,
        tieneStock: !!datos.tieneStock,
        tienePersonal: !!datos.tienePersonal,
        necesitaFacturacion: !!datos.necesitaFacturacion,
        necesitaContabilidad: !!datos.necesitaFacturacion,
        condicionAfip: "monotributista",
        tieneLocal: !!datos.tieneLocal,
        tieneDelivery: !!datos.tieneDelivery,
      })

      acciones.push({
        tipo: "configuracion",
        descripcion: `Rubro detectado: ${result.rubro_detectado} (confianza: ${Math.round(result.confianza)}%)`,
        datos: {
          rubro: result.rubro_detectado,
          confianza: result.confianza,
          modulosSugeridos: config.modulosActivos,
          categoriasSugeridas: Array.from(new Set(config.productosEjemplo.map(p => p.nombre.split(" ")[0]))),
          preguntasSiguientes: result.preguntasSiguientes || [],
        },
      })

      return {
        resumen: `Rubro detectado: ${result.rubro_detectado} (${Math.round(result.confianza)}%). ${config.modulosActivos.length} módulos sugeridos.`,
        acciones,
      }
    }

    return {
      resumen: "No se pudo procesar el mensaje de onboarding",
      acciones,
    }
  }
}
