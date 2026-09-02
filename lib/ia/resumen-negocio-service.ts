/**
 * Servicio de IA: Resumen Diario y Semanal del Negocio en Lenguaje Natural
 * Genera un briefing listo para WhatsApp o lectura en 30 segundos con ventas, margen, productos top y deudas.
 */

import { aiService } from "@/lib/ai/ai-service"
import { prisma } from "@/lib/prisma"

export interface MetricasNegocioPeriodo {
  totalVentasArs: number
  cantidadTickets: number
  ticketPromedioArs: number
  gananciaEstimadaArs: number
  topProductos: { nombre: string; cantidad: number; total: number }[]
  deudaFiadosArs: number
  nuevosFiadosHoyArs: number
  metodosPago: Record<string, number>
}

const SYSTEM_PROMPT_RESUMEN = `Sos el copiloto financiero y comercial de un comerciante de barrio en Argentina (kiosquero, almacenero, ferretero, mecánico).
Tu tono es directo, cálido, motivador y sumamente claro (usás voseo argentino: "vendiste", "tenés", "ojo con").
Nunca uses tecnicismos complicados ni jerga de Wall Street.
Tu objetivo es darle al dueño del negocio un resumen de 3 párrafos cortos que le responda:
1. ¿Cómo le fue en plata hoy y cómo se compara con un día normal?
2. ¿Qué fue lo que más salió y qué le dejó mejor margen?
3. ¿Cuánta plata tiene en la calle (fiados) y qué acción concreta puede tomar ahora mismo?`

export async function obtenerMetricasPeriodo(
  empresaId: number,
  dias = 1
): Promise<MetricasNegocioPeriodo> {
  const desde = new Date()
  desde.setHours(0, 0, 0, 0)
  if (dias > 1) {
    desde.setDate(desde.getDate() - (dias - 1))
  }

  // 1. Facturas y ventas
  const facturas = await prisma.factura.findMany({
    where: {
      empresaId,
      createdAt: { gte: desde },
    },
    include: {
      lineas: {
        include: { producto: true },
      },
    },
  })

  let totalVentasArs = 0
  let gananciaEstimadaArs = 0
  const productosMap: Record<string, { cantidad: number; total: number }> = {}
  const metodosPago: Record<string, number> = {}

  for (const f of facturas) {
    const totalFactura = Number(f.total) || 0
    totalVentasArs += totalFactura

    // Líneas
    if (Array.isArray(f.lineas)) {
      for (const l of f.lineas) {
        const nombre = l.producto?.nombre || l.descripcion || "Varios"
        const cant = Number(l.cantidad) || 1
        const sub = Number(l.subtotal) || Number(l.precioUnitario) * cant || 0
        const costo = Number(l.producto?.precioCompra) || 0

        if (!productosMap[nombre]) {
          productosMap[nombre] = { cantidad: 0, total: 0 }
        }
        productosMap[nombre].cantidad += cant
        productosMap[nombre].total += sub

        // Margen
        gananciaEstimadaArs += Math.max(0, sub - (costo * cant))
      }
    }
  }

  const topProductos = Object.entries(productosMap)
    .map(([nombre, v]) => ({ nombre, cantidad: v.cantidad, total: v.total }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 5)

  // 2. Fiados (Cuentas Corrientes)
  let deudaFiadosArs = 0
  let nuevosFiadosHoyArs = 0

  try {
    const clientesConDeuda = await prisma.cliente.findMany({
      where: { empresaId, saldoCuentaCorriente: { gt: 0 } },
      select: { saldoCuentaCorriente: true },
    })
    deudaFiadosArs = clientesConDeuda.reduce((sum, c) => sum + Number(c.saldoCuentaCorriente || 0), 0)
  } catch {
    // Si no está habilitado CC
  }

  const cantidadTickets = facturas.length
  const ticketPromedioArs = cantidadTickets > 0 ? Math.round(totalVentasArs / cantidadTickets) : 0

  return {
    totalVentasArs,
    cantidadTickets,
    ticketPromedioArs,
    gananciaEstimadaArs: gananciaEstimadaArs || Math.round(totalVentasArs * 0.35),
    topProductos,
    deudaFiadosArs,
    nuevosFiadosHoyArs,
    metodosPago,
  }
}

export async function generarResumenIaNegocio(
  empresaId: number,
  nombreEmpresa = "tu negocio",
  dias = 1
) {
  const metricas = await obtenerMetricasPeriodo(empresaId, dias)

  const prompt = `Analizá los números de "${nombreEmpresa}" de los últimos ${dias === 1 ? "del día de hoy" : `${dias} días`}:

- Total Vendido: $${metricas.totalVentasArs.toLocaleString("es-AR")} ARS
- Cantidad de Ventas / Tickets: ${metricas.cantidadTickets}
- Ticket Promedio: $${metricas.ticketPromedioArs.toLocaleString("es-AR")} ARS
- Ganancia Bruta Estimada: $${metricas.gananciaEstimadaArs.toLocaleString("es-AR")} ARS
- Productos más vendidos: ${metricas.topProductos.map((p) => `${p.nombre} (${p.cantidad} u. / $${p.total})`).join(", ") || "Sin detalle"}
- Deuda de clientes en Fiado / Libreta: $${metricas.deudaFiadosArs.toLocaleString("es-AR")} ARS
- Métodos de cobro: ${JSON.stringify(metricas.metodosPago)}

Escribí el briefing para el comerciante. Que sea conciso, motivador y con 1 recomendación práctica para mañana.`

  try {
    const response = await aiService.chat(
      [
        { role: "system", content: SYSTEM_PROMPT_RESUMEN },
        { role: "user", content: prompt },
      ],
      "realtime",
      { temperature: 0.4 }
    )

    return {
      metricas,
      resumenTexto: response.content,
      proveedorIa: response.provider,
    }
  } catch (error) {
    console.error("[resumen-negocio] Error generando texto IA:", error)
    return {
      metricas,
      resumenTexto: `Hoy facturaste $${metricas.totalVentasArs.toLocaleString("es-AR")} en ${metricas.cantidadTickets} tickets, con un ticket promedio de $${metricas.ticketPromedioArs.toLocaleString("es-AR")}. Tenés $${metricas.deudaFiadosArs.toLocaleString("es-AR")} pendientes de cobro en la libreta de fiado.`,
      proveedorIa: "fallback",
    }
  }
}
