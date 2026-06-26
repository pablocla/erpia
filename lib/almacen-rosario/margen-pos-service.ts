/**
 * #2 Alerta margen negativo — costo reposición vs precio góndola.
 */
import { prisma } from "@/lib/prisma"
import { getAlmacenRosarioConfig } from "./config"

export interface MargenPosEvaluacion {
  activo: boolean
  margenNegativo: boolean
  precioVenta: number
  precioCompra: number
  precioSugerido: number
  margenPct: number
  bloquear: boolean
  autoAjustar: boolean
  mensaje?: string
}

export async function evaluarMargenProducto(
  empresaId: number,
  productoId: number,
  precioVentaActual?: number,
  skuActivo = true,
): Promise<MargenPosEvaluacion> {
  if (!skuActivo) {
    return {
      activo: false,
      margenNegativo: false,
      precioVenta: 0,
      precioCompra: 0,
      precioSugerido: 0,
      margenPct: 0,
      bloquear: false,
      autoAjustar: false,
    }
  }

  const [producto, config] = await Promise.all([
    prisma.producto.findFirst({
      where: { id: productoId, empresaId },
      select: {
        precioVenta: true,
        precioCompra: true,
        margenGanancia: true,
        nombre: true,
      },
    }),
    getAlmacenRosarioConfig(empresaId),
  ])

  if (!producto) {
    return {
      activo: true,
      margenNegativo: false,
      precioVenta: 0,
      precioCompra: 0,
      precioSugerido: 0,
      margenPct: 0,
      bloquear: false,
      autoAjustar: false,
    }
  }

  const precioVenta = precioVentaActual ?? Number(producto.precioVenta)
  const precioCompra = Number(producto.precioCompra)
  const margenObjetivo =
    producto.margenGanancia > 0 ? producto.margenGanancia : config.margen.margenDefaultPct
  const precioSugerido =
    precioCompra > 0
      ? Math.round(precioCompra * (1 + margenObjetivo / 100) * 100) / 100
      : precioVenta

  const margenNegativo = precioCompra > 0 && precioVenta < precioCompra
  const margenPct =
    precioCompra > 0
      ? Math.round(((precioVenta - precioCompra) / precioCompra) * 1000) / 10
      : 0

  return {
    activo: true,
    margenNegativo,
    precioVenta,
    precioCompra,
    precioSugerido,
    margenPct,
    bloquear: margenNegativo && config.margen.bloquearVenta,
    autoAjustar: margenNegativo && config.margen.autoAjustarPrecio,
    mensaje: margenNegativo
      ? `Costo lista ($${precioCompra.toLocaleString("es-AR")}) superó precio góndola. Sugerido: $${precioSugerido.toLocaleString("es-AR")}`
      : undefined,
  }
}