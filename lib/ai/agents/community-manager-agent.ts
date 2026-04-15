/**
 * Community Manager Agent — Automated social media content from ERP data
 *
 * Generates post suggestions based on: stock levels, margins,
 * new products, seasonal events, and past performance.
 */

import { prisma } from "@/lib/prisma"
import { AgentBase } from "./agent-base"
import { aiService } from "../ai-service"
import { buildEmpresaContexto } from "../context-builder"
import { buildSystemPrompt } from "../system-prompts"
import type { AgentConfig, AgentRunContext, AgentAction } from "./agent-types"

export class CommunityManagerAgent extends AgentBase {
  config: AgentConfig = {
    id: "community-manager",
    nombre: "Community Manager IA",
    descripcion: "Genera contenido para redes sociales basado en productos con mejor margen, stock a mover, novedades y fechas comerciales argentinas.",
    icono: "share-2",
    categoria: "marketing",
    tier: "batch",
    schedule: { type: "cron", expression: "0 10 * * 1,3,5", label: "Lunes, miércoles y viernes a las 10:00" },
    reactsTo: [],
    defaultEnabled: false,
  }

  protected async execute(ctx: AgentRunContext) {
    const acciones: AgentAction[] = []

    const contexto = await buildEmpresaContexto(ctx.empresaId)
    const systemPrompt = buildSystemPrompt(contexto)

    // Get top products by margin and overstock
    const [topMargin, overstock, newProducts] = await Promise.all([
      prisma.producto.findMany({
        where: { empresaId: ctx.empresaId, activo: true },
        orderBy: { precioVenta: "desc" },
        take: 5,
        select: { id: true, nombre: true, precioVenta: true, precioCosto: true, stock: true },
      }),
      prisma.producto.findMany({
        where: { empresaId: ctx.empresaId, activo: true, stock: { gt: 0 } },
        orderBy: { stock: "desc" },
        take: 5,
        select: { id: true, nombre: true, precioVenta: true, stock: true },
      }),
      prisma.producto.findMany({
        where: { empresaId: ctx.empresaId, activo: true },
        orderBy: { createdAt: "desc" },
        take: 3,
        select: { id: true, nombre: true, precioVenta: true, createdAt: true },
      }),
    ])

    const today = new Date()
    const fechasComerciales = getFechasComercialesArgentinas(today)

    const userPrompt = `Generá 3 posts para redes sociales (Instagram/Facebook) para esta empresa.

DATOS DEL ERP (reales):
- Productos con mejor margen: ${JSON.stringify(topMargin.map((p) => ({ nombre: p.nombre, precio: p.precioVenta, margen: p.precioCosto ? Math.round(((p.precioVenta - p.precioCosto) / p.precioVenta) * 100) : null })))}
- Productos con más stock (hay que mover): ${JSON.stringify(overstock.map((p) => ({ nombre: p.nombre, stock: p.stock, precio: p.precioVenta })))}
- Productos nuevos: ${JSON.stringify(newProducts.map((p) => ({ nombre: p.nombre, precio: p.precioVenta })))}
- Fechas comerciales próximas: ${fechasComerciales.length ? fechasComerciales.join(", ") : "ninguna esta semana"}

REGLAS:
- Tono: profesional pero cercano, español rioplatense
- Incluir precio cuando sea relevante
- Incluir call-to-action (consultar por WA, visitar local, etc)
- NO usar emojis excesivos
- Cada post: { tipo: "feed"|"story"|"reel_idea", texto: string, hashtags: string[], productoId?: number, objetivo: "vender"|"engagement"|"informar" }

Respondé ÚNICAMENTE con JSON válido: { posts: [...] }`

    const response = await aiService.chatJson<{ posts: Array<{ tipo: string; texto: string; hashtags: string[]; productoId?: number; objetivo: string }> }>(
      [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      "batch"
    )

    if (response.data?.posts?.length) {
      for (const post of response.data.posts) {
        // Store as a pending alert for human review
        await prisma.alertaIA.create({
          data: {
            empresaId: ctx.empresaId,
            tipo: "general",
            prioridad: "baja",
            titulo: `[CM] Post ${post.tipo}: ${post.objetivo}`,
            descripcion: post.texto,
            accion: `Publicar en ${post.tipo}. Hashtags: ${post.hashtags.join(" ")}`,
            datos: post as any,
          },
        })

        acciones.push({
          tipo: "post_generado",
          descripcion: `Post ${post.tipo} (${post.objetivo}): ${post.texto.slice(0, 80)}...`,
          datos: post,
        })
      }
    }

    return {
      resumen: `${acciones.length} posts generados para redes sociales`,
      acciones,
    }
  }
}

/** Get upcoming Argentine commercial dates */
function getFechasComercialesArgentinas(today: Date): string[] {
  const month = today.getMonth() + 1
  const day = today.getDate()
  const fechas: string[] = []

  const calendario: Record<string, [number, number]> = {
    "Día del Amigo": [7, 20],
    "Día del Padre": [6, 15], // 3rd Sunday June, approx
    "Día de la Madre": [10, 19], // 3rd Sunday Oct, approx
    "Navidad": [12, 25],
    "Black Friday AR": [11, 28],
    "Hot Sale": [5, 12],
    "Cyber Monday AR": [11, 4],
    "Día del Niño": [8, 18],
    "San Valentín": [2, 14],
  }

  for (const [nombre, [m, d]] of Object.entries(calendario)) {
    const daysUntil = Math.abs((m - month) * 30 + (d - day))
    if (daysUntil <= 7) {
      fechas.push(`${nombre} (${d}/${m})`)
    }
  }

  return fechas
}
