/**
 * #10 Venta con stock cero — no bloquea, registra anomalía.
 */
import { prisma } from "@/lib/prisma"
import { persistSistemaLog } from "@/lib/ops/sistema-log"
import { crearAlertaIAConNotificacion } from "@/lib/ai/notificacion-ia-service"

export interface StockCeroEvaluacion {
  activo: boolean
  stockActual: number
  alerta: boolean
  mensaje?: string
}

export async function evaluarStockCero(
  productoId: number,
  empresaId: number,
  stockActual: number,
  skuActivo = true,
): Promise<StockCeroEvaluacion> {
  if (!skuActivo) {
    return { activo: false, stockActual, alerta: false }
  }
  const alerta = stockActual <= 0
  return {
    activo: true,
    stockActual,
    alerta,
    mensaje: alerta
      ? `Stock en cero — se registrará la venta y avisamos al dueño`
      : undefined,
  }
}

export async function registrarVentaStockCero(input: {
  empresaId: number
  productoId: number
  productoNombre: string
  cantidad: number
  stockAntes: number
  facturaId?: number
  usuarioId?: number
}) {
  await persistSistemaLog({
    empresaId: input.empresaId,
    severidad: "warning",
    categoria: "stock_cero",
    contexto: "almacen-rosario",
    mensaje: `Venta con stock ${input.stockAntes}: ${input.productoNombre} x${input.cantidad}`,
    metadata: {
      productoId: input.productoId,
      productoNombre: input.productoNombre,
      cantidad: input.cantidad,
      stockAntes: input.stockAntes,
      facturaId: input.facturaId,
    },
  })
}

export async function reporteStockCeroDia(empresaId: number, dias = 1) {
  const desde = new Date()
  desde.setDate(desde.getDate() - dias)

  const db = prisma as typeof prisma & { sistemaLog: { findMany: typeof prisma.reglaAlerta.findMany } }
  const logs = await db.sistemaLog.findMany({
    where: {
      empresaId,
      categoria: "stock_cero",
      createdAt: { gte: desde },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  })

  const porProducto = new Map<number, { nombre: string; unidades: number; eventos: number }>()
  for (const log of logs) {
    const meta = log.metadata as Record<string, unknown> | null
    const pid = Number(meta?.productoId ?? 0)
    const cant = Number(meta?.cantidad ?? 1)
    if (!pid) continue
    const prev = porProducto.get(pid) ?? { nombre: String(meta?.productoNombre ?? `SKU ${pid}`), unidades: 0, eventos: 0 }
    prev.unidades += cant
    prev.eventos += 1
    porProducto.set(pid, prev)
  }

  return {
    totalEventos: logs.length,
    productos: [...porProducto.entries()].map(([productoId, v]) => ({
      productoId,
      ...v,
    })),
  }
}

export async function alertarStockCeroDiario(empresaId: number) {
  const reporte = await reporteStockCeroDia(empresaId)
  if (reporte.totalEventos === 0) return null

  const top = reporte.productos.sort((a, b) => b.unidades - a.unidades).slice(0, 5)
  await crearAlertaIAConNotificacion({
    empresaId,
    tipo: "stock_cero",
    prioridad: reporte.totalEventos >= 5 ? "alta" : "media",
    titulo: `${reporte.totalEventos} venta(s) con stock en cero hoy`,
    descripcion: top.map((p) => `${p.nombre}: ${p.unidades} u.`).join(" · "),
    accion: "Revisar ingreso de mercadería o ajuste de inventario",
    origen: "cron",
    agenteId: "stock-cero-alert",
  })
  return reporte
}