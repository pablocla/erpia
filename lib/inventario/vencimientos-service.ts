/**
 * Servicio de Control de Vencimientos de Mercadería para Kioscos y Almacenes
 * Detecta lotes perecederos próximos a vencer (lácteos, snacks, fiambres) y sugiere promociones de liquidación.
 */

import { prisma } from "@/lib/prisma"

export interface AlertaVencimiento {
  id: number
  codigo: string
  nombre: string
  stock: number
  precioVenta: number
  precioCompra: number
  fechaVencimiento: string
  diasParaVencer: number
  estadoVencimiento: "vencido" | "urgente_7_dias" | "alerta_30_dias" | "normal"
  accionSugerida: string
}

export async function obtenerAlertasVencimiento(empresaId: number): Promise<{
  totalProductosPerecederos: number
  vencidos: number
  urgentes7Dias: number
  alertas30Dias: number
  productos: AlertaVencimiento[]
}> {
  const hoy = new Date()
  hoy.setHours(0, 0, 0, 0)

  let lotes: any[] = []

  try {
    lotes = await prisma.lote.findMany({
      where: {
        producto: { empresaId, activo: true },
        fechaVencimiento: { not: null },
      },
      include: {
        producto: {
          select: {
            id: true,
            codigo: true,
            nombre: true,
            precioVenta: true,
            precioCompra: true,
          },
        },
      },
      orderBy: { fechaVencimiento: "asc" },
    })
  } catch {
    // Si no hay lotes registrados aún
  }

  let vencidos = 0
  let urgentes7Dias = 0
  let alertas30Dias = 0

  const items: AlertaVencimiento[] = lotes.map((l) => {
    const fVenc = l.fechaVencimiento ? new Date(l.fechaVencimiento) : hoy
    const diffMs = fVenc.getTime() - hoy.getTime()
    const dias = Math.ceil(diffMs / (1000 * 60 * 60 * 24))

    let estadoVencimiento: "vencido" | "urgente_7_dias" | "alerta_30_dias" | "normal" = "normal"
    let accionSugerida = "Stock al día"

    if (dias < 0) {
      estadoVencimiento = "vencido"
      accionSugerida = "Retirar de góndola urgente / Dar de baja"
      vencidos++
    } else if (dias <= 7) {
      estadoVencimiento = "urgente_7_dias"
      accionSugerida = `Vence en ${dias} días: liquidar al 30% off o 2x1`
      urgentes7Dias++
    } else if (dias <= 30) {
      estadoVencimiento = "alerta_30_dias"
      accionSugerida = `Vence en ${dias} días: poner al frente de góndola`
      alertas30Dias++
    }

    return {
      id: l.id,
      codigo: l.producto.codigo || "S/COD",
      nombre: l.producto.nombre,
      stock: Number(l.cantidadInicial ?? l.stock ?? 1),
      precioVenta: Number(l.producto.precioVenta) || 0,
      precioCompra: Number(l.producto.precioCompra) || 0,
      fechaVencimiento: fVenc.toISOString(),
      diasParaVencer: dias,
      estadoVencimiento,
      accionSugerida,
    }
  })

  return {
    totalProductosPerecederos: lotes.length,
    vencidos,
    urgentes7Dias,
    alertas30Dias,
    productos: items,
  }
}
