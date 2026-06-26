/**
 * Registro rápido de mermas y roturas en retail.
 */
import { prisma } from "@/lib/prisma"
import { StockService } from "@/lib/stock/stock-service"

const stockService = new StockService()

export type MotivoMerma = "vencimiento" | "rotura" | "robo" | "muestra" | "otro"

export async function registrarMermaRotura(input: {
  empresaId: number
  productoId: number
  cantidad: number
  motivo: MotivoMerma
  observaciones?: string
}) {
  if (input.cantidad <= 0) throw new Error("Cantidad inválida")

  const producto = await prisma.producto.findFirst({
    where: { id: input.productoId, empresaId: input.empresaId, activo: true },
  })
  if (!producto) throw new Error("Producto no encontrado")

  const deposito = await prisma.deposito.findFirst({
    where: { empresaId: input.empresaId, activo: true },
    orderBy: { id: "asc" },
  })
  if (!deposito) throw new Error("No hay depósito configurado")

  await stockService.ajustarStockManual(
    input.productoId,
    -input.cantidad,
    `Merma/rotura: ${input.motivo}${input.observaciones ? ` — ${input.observaciones}` : ""}`,
    deposito.id,
  )

  const valorPerdida = Number(producto.precioCompra) * input.cantidad

  return {
    productoId: producto.id,
    nombre: producto.nombre,
    cantidad: input.cantidad,
    motivo: input.motivo,
    valorPerdidaEstimada: Math.round(valorPerdida * 100) / 100,
  }
}