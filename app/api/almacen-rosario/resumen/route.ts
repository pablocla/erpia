import { type NextRequest, NextResponse } from "next/server"
import { getAuthContext } from "@/lib/auth/empresa-guard"
import { canUseSku } from "@/lib/platform/entitlements"
import { listarOfertasZeroWasteHoy } from "@/lib/almacen-rosario/zero-waste-service"
import { reporteStockCeroDia } from "@/lib/almacen-rosario/stock-cero-service"
import { promocionesDelDia } from "@/lib/almacen-rosario/promos-pago-service"
import { ALMACEN_ROSARIO_SKUS } from "@/lib/almacen-rosario/config"
import { listarValesActivos } from "@/lib/almacen-rosario/vale-dinero-service"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  const ctx = await getAuthContext(request)
  if (!ctx.ok) return ctx.response

  const empresaId = ctx.auth.empresaId

  const activaciones = await Promise.all(
    ALMACEN_ROSARIO_SKUS.map(async (sku) => ({
      sku,
      activo: (await canUseSku(empresaId, sku)).ok,
    })),
  )

  const envasesActivo = activaciones.find((a) => a.sku === "pos.envases_gaseosas")?.activo
  const valesActivo = activaciones.find((a) => a.sku === "pos.vale_dinero")?.activo

  const [ofertasZeroWaste, stockCero, promos, productosCosto, valesActivos, saldosEnvase] = await Promise.all([
    listarOfertasZeroWasteHoy(empresaId),
    reporteStockCeroDia(empresaId),
    promocionesDelDia(empresaId),
    prisma.producto.findMany({
      where: { empresaId, activo: true, deletedAt: null, precioCompra: { gt: 0 } },
      select: { precioCompra: true, precioVenta: true },
    }),
    valesActivo ? listarValesActivos(empresaId, 20) : Promise.resolve([]),
    envasesActivo
      ? (prisma as typeof prisma & {
          movimientoEnvase: {
            groupBy: (args: object) => Promise<
              Array<{ clienteId: number | null; tipo: string; _sum: { cantidad: number | null } }>
            >
          }
        }).movimientoEnvase.groupBy({
          by: ["clienteId", "tipo"],
          where: { empresaId, clienteId: { not: null } },
          _sum: { cantidad: true },
        })
      : Promise.resolve([]),
  ])

  const productosMargenNegativo = productosCosto.filter(
    (p) => Number(p.precioVenta) < Number(p.precioCompra),
  ).length

  const clientesConEnvases = new Set<number>()
  const saldoPorCliente = new Map<number, number>()
  for (const g of saldosEnvase as Array<{ clienteId: number | null; tipo: string; _sum: { cantidad: number | null } }>) {
    if (!g.clienteId) continue
    const prev = saldoPorCliente.get(g.clienteId) ?? 0
    const cant = g._sum.cantidad ?? 0
    const next = g.tipo === "entrega" ? prev + cant : g.tipo === "retorno" ? prev - cant : prev
    saldoPorCliente.set(g.clienteId, next)
    if (next > 0) clientesConEnvases.add(g.clienteId)
  }

  return NextResponse.json({
    activaciones,
    ofertasZeroWaste,
    stockCeroHoy: stockCero,
    promocionesHoy: promos,
    productosMargenNegativo,
    valesActivos,
    envases: {
      clientesConSaldo: clientesConEnvases.size,
      unidadesPrestadas: [...saldoPorCliente.values()].filter((s) => s > 0).reduce((a, b) => a + b, 0),
    },
  })
}