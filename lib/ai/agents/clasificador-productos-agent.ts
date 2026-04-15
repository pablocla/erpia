/**
 * Clasificador Agent — Auto-classifies products from text descriptions
 *
 * Reacts to new products being created, classifies category, IVA rate,
 * unit measure, detects duplicates.
 */

import { prisma } from "@/lib/prisma"
import { AgentBase } from "./agent-base"
import { clasificarProducto } from "../analyzers"
import type { AgentConfig, AgentRunContext, AgentAction } from "./agent-types"

export class ClasificadorProductosAgent extends AgentBase {
  config: AgentConfig = {
    id: "clasificador-productos",
    nombre: "Clasificador Automático de Productos",
    descripcion: "Clasifica productos nuevos automáticamente: categoría, IVA, unidad de medida, código sugerido. Detecta posibles duplicados.",
    icono: "tags",
    categoria: "operativo",
    tier: "realtime",
    schedule: { type: "manual", label: "Se ejecuta al crear productos o bajo demanda" },
    reactsTo: [],
    defaultEnabled: true,
  }

  protected async execute(ctx: AgentRunContext) {
    const acciones: AgentAction[] = []

    // Find unclassified products (no category assigned)
    const unclassified = await prisma.producto.findMany({
      where: {
        empresaId: ctx.empresaId,
        activo: true,
        categoriaId: null,
      },
      select: { id: true, nombre: true, descripcion: true, codigoBarras: true },
      take: 20,
    })

    if (!unclassified.length) {
      return { resumen: "Todos los productos están clasificados", acciones }
    }

    for (const producto of unclassified) {
      const descripcion = `${producto.nombre} ${producto.descripcion || ""}`.trim()
      const result = await clasificarProducto(ctx.empresaId, descripcion)

      if (!result) continue

      // Try to find matching category
      const categoria = await prisma.categoria.findFirst({
        where: {
          empresaId: ctx.empresaId,
          nombre: { contains: result.categoria_sugerida, mode: "insensitive" },
        },
        select: { id: true },
      })

      // Update product with classification
      await prisma.producto.update({
        where: { id: producto.id },
        data: {
          ...(categoria ? { categoriaId: categoria.id } : {}),
          unidadMedida: result.unidad_medida || undefined,
        },
      })

      // Create notification if duplicates found
      if (result.posibles_duplicados?.length > 0) {
        await prisma.alertaIA.create({
          data: {
            empresaId: ctx.empresaId,
            tipo: "general",
            prioridad: "baja",
            titulo: `Posible duplicado: ${producto.nombre}`,
            descripcion: `Productos similares encontrados: ${result.posibles_duplicados.join(", ")}`,
            accion: "Revisar y unificar productos duplicados",
            datos: { productoId: producto.id, duplicados: result.posibles_duplicados } as any,
          },
        })
      }

      acciones.push({
        tipo: "producto_clasificado",
        descripcion: `${producto.nombre} → ${result.categoria_sugerida} (IVA ${result.alicuota_iva}%)`,
        datos: {
          productoId: producto.id,
          categoria: result.categoria_sugerida,
          iva: result.alicuota_iva,
          duplicados: result.posibles_duplicados,
        },
      })
    }

    return {
      resumen: `${acciones.length} productos clasificados automáticamente de ${unclassified.length} pendientes`,
      acciones,
    }
  }
}
