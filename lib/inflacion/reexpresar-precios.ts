/**
 * Reexpresión masiva de precios de productos por % manual o índice IPC.
 * Estrategia de retención §4.2 del documento de auditoría.
 */

import { prisma } from "@/lib/prisma"
import { reexpresarMonto } from "./reexpresar"
import type { IndiceCodigo } from "./types"

export type ModoReexpresionPrecios = "porcentaje" | "ipc"

export interface ReexpresarPreciosInput {
  empresaId: number
  modo: ModoReexpresionPrecios
  /** Porcentaje de ajuste (ej. 12.5 = +12.5%). Solo modo porcentaje. */
  porcentaje?: number
  /** Índice IPC/UVA. Solo modo ipc. */
  indiceCodigo?: IndiceCodigo
  /** Fecha origen de precios (default: hace 30 días). Solo modo ipc. */
  fechaOrigen?: Date | string
  /** Fecha de valuación (default: hoy). Solo modo ipc. */
  fechaValuacion?: Date | string
  /** IDs de productos a ajustar. Si vacío, todos los activos. */
  productoIds?: number[]
  /** Categoría opcional para filtrar. */
  categoriaId?: number
  /** Actualizar también precio de compra (costo). Default false. */
  ajustarCosto?: boolean
  /** Tope de variación relativa (ej. 0.5 = +50% máx). */
  topeVariacion?: number
  /** Simular sin grabar. */
  dryRun?: boolean
  /** Redondeo: 0 = entero, 2 = centavos. Default 0 (centavos de peso ARS típicos en góndola). */
  decimales?: number
}

export interface ProductoReexpresado {
  id: number
  codigo: string
  nombre: string
  precioVentaAnterior: number
  precioVentaNuevo: number
  precioCompraAnterior?: number
  precioCompraNuevo?: number
  factor: number
}

export interface ReexpresarPreciosResult {
  modo: ModoReexpresionPrecios
  factor: number
  afectados: number
  dryRun: boolean
  productos: ProductoReexpresado[]
  disclaimer?: string
}

function roundMoney(n: number, decimales: number): number {
  const f = 10 ** Math.max(0, Math.min(4, decimales))
  return Math.round(n * f) / f
}

function clampFactor(factor: number, tope?: number): number {
  if (tope == null || tope < 0) return factor
  const max = 1 + tope
  if (factor > max) return max
  if (factor < 1 / max) return 1 / max
  return factor
}

/**
 * Aplica reexpresión de precios en lote.
 */
export async function reexpresarPreciosProductos(
  input: ReexpresarPreciosInput,
): Promise<ReexpresarPreciosResult> {
  const decimales = input.decimales ?? 0
  const dryRun = Boolean(input.dryRun)
  let factor = 1
  let disclaimer: string | undefined

  if (input.modo === "porcentaje") {
    const pct = Number(input.porcentaje)
    if (!Number.isFinite(pct)) {
      throw new Error("Porcentaje inválido")
    }
    factor = 1 + pct / 100
    factor = clampFactor(factor, input.topeVariacion)
  } else {
    // IPC: usar un monto unitario de referencia para obtener el factor
    const sample = reexpresarMonto({
      montoOriginal: 100,
      fechaOrigen: input.fechaOrigen ?? new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      fechaValuacion: input.fechaValuacion ?? new Date(),
      indiceCodigo: input.indiceCodigo ?? "IPC_NACIONAL",
      topeVariacionPeriodo: input.topeVariacion,
    })
    factor = sample.factor
    disclaimer = sample.disclaimer
    if (sample.estimado && sample.factor === 1) {
      throw new Error(
        "Sin índice IPC disponible para el período. Cargá el índice en Contabilidad → Inflación o usá modo porcentaje.",
      )
    }
  }

  if (factor <= 0 || !Number.isFinite(factor)) {
    throw new Error("Factor de reexpresión inválido")
  }

  const where: {
    empresaId: number
    activo: boolean
    id?: { in: number[] }
    categoriaId?: number
  } = {
    empresaId: input.empresaId,
    activo: true,
  }
  if (input.productoIds?.length) {
    where.id = { in: input.productoIds }
  }
  if (input.categoriaId) {
    where.categoriaId = input.categoriaId
  }

  const productos = await prisma.producto.findMany({
    where,
    select: {
      id: true,
      codigo: true,
      nombre: true,
      precioVenta: true,
      precioCompra: true,
    },
    orderBy: { nombre: "asc" },
    take: 10_000,
  })

  const result: ProductoReexpresado[] = []

  for (const p of productos) {
    const prevVenta = Number(p.precioVenta)
    const prevCompra = Number(p.precioCompra)
    const nuevoVenta = roundMoney(prevVenta * factor, decimales)
    const nuevoCompra = input.ajustarCosto
      ? roundMoney(prevCompra * factor, decimales)
      : undefined

    result.push({
      id: p.id,
      codigo: p.codigo,
      nombre: p.nombre,
      precioVentaAnterior: prevVenta,
      precioVentaNuevo: nuevoVenta,
      precioCompraAnterior: input.ajustarCosto ? prevCompra : undefined,
      precioCompraNuevo: nuevoCompra,
      factor,
    })
  }

  if (!dryRun && result.length > 0) {
    // Actualización en lotes de 50 para no saturar el pool
    const chunkSize = 50
    for (let i = 0; i < result.length; i += chunkSize) {
      const chunk = result.slice(i, i + chunkSize)
      await prisma.$transaction(
        chunk.map((r) =>
          prisma.producto.update({
            where: { id: r.id },
            data: {
              precioVenta: r.precioVentaNuevo,
              ...(input.ajustarCosto && r.precioCompraNuevo != null
                ? { precioCompra: r.precioCompraNuevo }
                : {}),
            },
          }),
        ),
      )
    }
  }

  return {
    modo: input.modo,
    factor: Math.round(factor * 10000) / 10000,
    afectados: result.length,
    dryRun,
    productos: result.slice(0, 200), // preview acotado
    disclaimer,
  }
}
