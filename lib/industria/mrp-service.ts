import { prisma } from "@/lib/prisma"

/* ═══════════════════════════════════════════════════════════════════════════
   MRP — PLANIFICACIÓN DE NECESIDADES DE MATERIALES
   Equivalente a SAP PP-MRP + Tango Producción
   Calcula qué comprar/producir basado en:
   - Stock actual vs punto de pedido
   - Pedidos de venta confirmados (demanda)
   - BOM (listas de materiales) para producción
   ═══════════════════════════════════════════════════════════════════════════ */

interface SugerenciaInput {
  productoId: number
  tipo: "comprar" | "producir" | "transferir"
  cantidad: number
  fechaNecesidad: Date
  prioridad: "critica" | "alta" | "normal" | "baja"
  razon: string
}

// ─── Ejecutar corrida MRP ───────────────────────────────────────────────────

export async function ejecutarMRP(empresaId: number, horizonte: number = 30) {
  const corrida = await prisma.correridaMRP.create({
    data: {
      horizonte,
      estado: "ejecutando",
      empresaId,
    },
  })

  try {
    const sugerencias: SugerenciaInput[] = []
    const fechaHorizonte = new Date()
    fechaHorizonte.setDate(fechaHorizonte.getDate() + horizonte)

    // 1. Productos bajo punto de pedido (stock mínimo)
    const productos = await prisma.producto.findMany({
      where: { empresaId, activo: true },
    })

    for (const prod of productos) {
      if (prod.stockMinimo != null && prod.stock < prod.stockMinimo) {
        const cantidadFaltante = (prod.stockMinimo * 1.2) - prod.stock // 20% extra
        const tieneBOM = await prisma.listaMateriales.findFirst({
          where: { productoId: prod.id },
        })

        sugerencias.push({
          productoId: prod.id,
          tipo: tieneBOM ? "producir" : "comprar",
          cantidad: Math.ceil(cantidadFaltante),
          fechaNecesidad: new Date(), // Urgente
          prioridad: prod.stock <= 0 ? "critica" : "alta",
          razon: `Stock actual (${prod.stock}) bajo mínimo (${prod.stockMinimo})`,
        })
      }
    }

    // 2. Demanda de pedidos de venta confirmados
    const pedidos = await prisma.pedidoVenta.findMany({
      where: {
        empresaId,
        estado: { in: ["confirmado", "en_preparacion"] },
        fechaEntrega: { lte: fechaHorizonte },
      },
      include: { lineas: true },
    })

    const demandaPorProducto = new Map<number, { cantidad: number; fechaMin: Date }>()

    for (const pedido of pedidos) {
      for (const linea of pedido.lineas) {
        const actual = demandaPorProducto.get(linea.productoId) ?? {
          cantidad: 0,
          fechaMin: pedido.fechaEntrega ?? new Date(),
        }
        actual.cantidad += linea.cantidad - (linea.cantidadEntregada ?? 0)
        if (pedido.fechaEntrega && pedido.fechaEntrega < actual.fechaMin) {
          actual.fechaMin = pedido.fechaEntrega
        }
        demandaPorProducto.set(linea.productoId, actual)
      }
    }

    for (const [productoId, demanda] of demandaPorProducto) {
      if (demanda.cantidad <= 0) continue
      const prod = productos.find((p) => p.id === productoId)
      if (!prod) continue

      const stockDisponible = prod.stock - (prod.stockMinimo ?? 0)
      if (stockDisponible < demanda.cantidad) {
        const faltante = demanda.cantidad - Math.max(0, stockDisponible)
        const tieneBOM = await prisma.listaMateriales.findFirst({
          where: { productoId },
        })

        sugerencias.push({
          productoId,
          tipo: tieneBOM ? "producir" : "comprar",
          cantidad: Math.ceil(faltante),
          fechaNecesidad: demanda.fechaMin,
          prioridad: "alta",
          razon: `Pedido(s) de venta requieren ${demanda.cantidad} unidades`,
        })
      }
    }

    // 3. Explosión BOM — para productos a producir, verificar componentes
    const produccionSugerida = sugerencias.filter((s) => s.tipo === "producir")
    for (const sug of produccionSugerida) {
      const bom = await prisma.listaMateriales.findFirst({
        where: { productoId: sug.productoId },
        include: { componentes: true },
      })
      if (!bom) continue

      for (const comp of bom.componentes) {
        const cantidadNecesaria = comp.cantidad * sug.cantidad
        const prodComp = productos.find((p) => p.id === comp.insumoId)
        if (!prodComp) continue

        if (prodComp.stock < cantidadNecesaria) {
          const faltante = cantidadNecesaria - prodComp.stock
          // Evitar duplicados
          const yaExiste = sugerencias.find(
            (s) => s.productoId === comp.insumoId && s.tipo === "comprar",
          )
          if (!yaExiste) {
            sugerencias.push({
              productoId: comp.insumoId,
              tipo: "comprar",
              cantidad: Math.ceil(faltante),
              fechaNecesidad: sug.fechaNecesidad,
              prioridad: sug.prioridad,
              razon: `Componente para BOM "${bom.nombre}" — producción de ${sug.cantidad} unidades`,
            })
          }
        }
      }
    }

    // Consolidar sugerencias (agrupar por producto+tipo)
    const consolidado = new Map<string, SugerenciaInput>()
    for (const s of sugerencias) {
      const key = `${s.productoId}-${s.tipo}`
      const existing = consolidado.get(key)
      if (existing) {
        existing.cantidad = Math.max(existing.cantidad, s.cantidad)
        if (s.fechaNecesidad < existing.fechaNecesidad) existing.fechaNecesidad = s.fechaNecesidad
        if (prioridadNumerica(s.prioridad) > prioridadNumerica(existing.prioridad)) {
          existing.prioridad = s.prioridad
        }
        existing.razon += ` + ${s.razon}`
      } else {
        consolidado.set(key, { ...s })
      }
    }

    // Guardar
    const datasToCreate = Array.from(consolidado.values()).map((s) => ({
      corridaId: corrida.id,
      productoId: s.productoId,
      tipo: s.tipo,
      cantidad: s.cantidad,
      fechaNecesidad: s.fechaNecesidad,
      prioridad: s.prioridad,
      estado: "pendiente",
      razon: s.razon,
    }))

    if (datasToCreate.length > 0) {
      await prisma.sugerenciaMRP.createMany({ data: datasToCreate })
    }

    await prisma.correridaMRP.update({
      where: { id: corrida.id },
      data: { estado: "completado", totalSugerencias: datasToCreate.length },
    })

    return {
      corridaId: corrida.id,
      totalSugerencias: datasToCreate.length,
      porTipo: {
        comprar: datasToCreate.filter((s) => s.tipo === "comprar").length,
        producir: datasToCreate.filter((s) => s.tipo === "producir").length,
      },
    }
  } catch (error) {
    await prisma.correridaMRP.update({
      where: { id: corrida.id },
      data: { estado: "error" },
    })
    throw error
  }
}

// ─── Convertir sugerencia en OC / OP ────────────────────────────────────────

export async function aceptarSugerencia(sugerenciaId: number) {
  return prisma.sugerenciaMRP.update({
    where: { id: sugerenciaId },
    data: { estado: "aceptada" },
  })
}

export async function rechazarSugerencia(sugerenciaId: number) {
  return prisma.sugerenciaMRP.update({
    where: { id: sugerenciaId },
    data: { estado: "rechazada" },
  })
}

// ─── Listar última corrida ──────────────────────────────────────────────────

export async function ultimaCorrida(empresaId: number) {
  return prisma.correridaMRP.findFirst({
    where: { empresaId, estado: "completado" },
    orderBy: { createdAt: "desc" },
    include: {
      sugerencias: {
        orderBy: [{ prioridad: "asc" }, { fechaNecesidad: "asc" }],
      },
    },
  })
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function prioridadNumerica(p: string): number {
  return p === "critica" ? 4 : p === "alta" ? 3 : p === "normal" ? 2 : 1
}
