/**
 * Evaluación unificada al agregar producto al carrito POS.
 */
import { prisma } from "@/lib/prisma"
import { canUseSku } from "@/lib/platform/entitlements"
import { evaluarMargenProducto } from "./margen-pos-service"
import { evaluarZeroWaste } from "./zero-waste-service"
import { evaluarStockCero } from "./stock-cero-service"

export interface AlertaPosAlmacen {
  tipo: "margen" | "zero_waste" | "stock_cero"
  severidad: "error" | "warning" | "info"
  mensaje: string
}

export interface EvaluacionProductoPos {
  productoId: number
  nombre: string
  precioFinal: number
  descuentoPct: number
  bloquear: boolean
  alertas: AlertaPosAlmacen[]
}

export async function evaluarProductoParaPos(
  empresaId: number,
  productoId: number,
  precioLista?: number,
): Promise<EvaluacionProductoPos> {
  const producto = await prisma.producto.findFirst({
    where: { id: productoId, empresaId },
    select: { id: true, nombre: true, precioVenta: true, stock: true },
  })

  if (!producto) {
    return {
      productoId,
      nombre: "",
      precioFinal: 0,
      descuentoPct: 0,
      bloquear: true,
      alertas: [{ tipo: "margen", severidad: "error", mensaje: "Producto no encontrado" }],
    }
  }

  const [margenSku, zeroSku, stockSku] = await Promise.all([
    canUseSku(empresaId, "pos.margen_guard"),
    canUseSku(empresaId, "pos.zero_waste"),
    canUseSku(empresaId, "pos.stock_cero_alert"),
  ])

  const precioBase = precioLista ?? Number(producto.precioVenta)
  const alertas: AlertaPosAlmacen[] = []
  let precioFinal = precioBase
  let descuentoPct = 0
  let bloquear = false

  const margen = await evaluarMargenProducto(
    empresaId,
    productoId,
    precioBase,
    margenSku.ok,
  )

  if (margen.margenNegativo && margen.mensaje) {
    alertas.push({ tipo: "margen", severidad: "warning", mensaje: margen.mensaje })
    if (margen.bloquear) {
      bloquear = true
      alertas.push({
        tipo: "margen",
        severidad: "error",
        mensaje: "Venta bloqueada — actualizá el precio antes de cobrar",
      })
    } else if (margen.autoAjustar && margen.precioSugerido > precioBase) {
      precioFinal = margen.precioSugerido
      alertas.push({
        tipo: "margen",
        severidad: "info",
        mensaje: `Precio ajustado automáticamente a $${precioFinal.toLocaleString("es-AR")}`,
      })
    }
  }

  const zero = await evaluarZeroWaste(empresaId, productoId, producto.nombre, zeroSku.ok)
  if (zero.aplica) {
    descuentoPct = Math.max(descuentoPct, zero.descuentoPct)
    if (zero.motivo) {
      alertas.push({ tipo: "zero_waste", severidad: "info", mensaje: zero.motivo })
    }
  }

  const stock = await evaluarStockCero(productoId, empresaId, producto.stock, stockSku.ok)
  if (stock.alerta && stock.mensaje) {
    alertas.push({ tipo: "stock_cero", severidad: "warning", mensaje: stock.mensaje })
  }

  return {
    productoId,
    nombre: producto.nombre,
    precioFinal,
    descuentoPct,
    bloquear,
    alertas,
  }
}