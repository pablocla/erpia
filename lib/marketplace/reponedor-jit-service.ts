/**
 * Reponedor JIT — propuestas de compra según velocidad de venta y stock mínimo.
 */
import { prisma } from "@/lib/prisma"

export interface PropuestaReposicion {
  productoId: number
  codigo: string
  nombre: string
  stockActual: number
  stockMinimo: number
  velocidadDiaria: number
  cantidadSugerida: number
  diasCobertura: number
  urgencia: "alta" | "media" | "baja"
}

export async function generarPropuestasReposicion(
  empresaId: number,
  diasHistorico = 30,
): Promise<PropuestaReposicion[]> {
  const desde = new Date()
  desde.setDate(desde.getDate() - diasHistorico)

  const productos = await prisma.producto.findMany({
    where: { empresaId, activo: true, deletedAt: null },
    select: {
      id: true,
      codigo: true,
      nombre: true,
      stock: true,
      stockMinimo: true,
      lineasFactura: {
        where: { factura: { empresaId, createdAt: { gte: desde } } },
        select: { cantidad: true },
      },
    },
    take: 200,
  })

  const propuestas: PropuestaReposicion[] = []

  for (const p of productos) {
    const vendido = p.lineasFactura.reduce((s, l) => s + Number(l.cantidad), 0)
    const velocidadDiaria = vendido / Math.max(diasHistorico, 1)
    const minimo = p.stockMinimo > 0 ? p.stockMinimo : 5
    const objetivo = Math.max(minimo * 2, velocidadDiaria * 14)
    const faltante = objetivo - p.stock
    if (faltante <= 0) continue

    const diasCobertura = velocidadDiaria > 0 ? p.stock / velocidadDiaria : 999
    propuestas.push({
      productoId: p.id,
      codigo: p.codigo,
      nombre: p.nombre,
      stockActual: p.stock,
      stockMinimo: minimo,
      velocidadDiaria: Math.round(velocidadDiaria * 100) / 100,
      cantidadSugerida: Math.ceil(faltante),
      diasCobertura: Math.round(diasCobertura * 10) / 10,
      urgencia: diasCobertura < 3 ? "alta" : diasCobertura < 7 ? "media" : "baja",
    })
  }

  return propuestas
    .sort((a, b) => {
      const order = { alta: 0, media: 1, baja: 2 }
      return order[a.urgencia] - order[b.urgencia]
    })
    .slice(0, 50)
}