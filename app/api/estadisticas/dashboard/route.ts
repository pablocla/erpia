import { type NextRequest, NextResponse } from "next/server"
import { EstadisticasService } from "@/lib/impuestos/estadisticas-service"
import { IVAService } from "@/lib/impuestos/iva-service"
import { getAuthContext } from "@/lib/auth/empresa-guard"

export async function GET(request: NextRequest) {
  try {
    const ctx = await getAuthContext(request)
    if (!ctx.ok) return ctx.response

    const searchParams = request.nextUrl.searchParams
    const periodo = searchParams.get("periodo") || "mes" // "hoy" | "ayer" | "mes" | "trimestre" | "anio"

    const estadisticasService = new EstadisticasService()
    const ivaService = new IVAService()

    const hoy = new Date()
    let fechaDesde: Date
    const fechaHasta: Date = hoy

    if (periodo === "hoy") {
      fechaDesde = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate())
    } else if (periodo === "ayer") {
      fechaDesde = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() - 1)
    } else if (periodo === "mes") {
      fechaDesde = new Date(hoy.getFullYear(), hoy.getMonth(), 1)
    } else if (periodo === "trimestre") {
      const mesInicio = Math.floor(hoy.getMonth() / 3) * 3
      fechaDesde = new Date(hoy.getFullYear(), mesInicio, 1)
    } else {
      fechaDesde = new Date(hoy.getFullYear(), 0, 1)
    }

    const { anclaPuedeVerRango, PAYLOAD_CAP_REPORTES } = await import("@/lib/comercial/caps-ancla")
    if (!(await anclaPuedeVerRango(ctx.auth.empresaId, fechaDesde, fechaHasta))) {
      return NextResponse.json(PAYLOAD_CAP_REPORTES, { status: 402 })
    }

    // Obtener estadísticas
    const ventas = await estadisticasService.obtenerEstadisticasVentas(fechaDesde, fechaHasta)
    const compras = await estadisticasService.obtenerEstadisticasCompras(fechaDesde, fechaHasta)
    const topClientes = await estadisticasService.obtenerTopClientes(5)
    const ventasPorMes = await estadisticasService.obtenerVentasPorMes(hoy.getFullYear())

    // Calcular IVA del mes actual
    const ivaActual = await ivaService.calcularIVAPeriodo(hoy.getMonth() + 1, hoy.getFullYear())

    return NextResponse.json({
      success: true,
      periodo,
      ventas,
      compras,
      iva: {
        debito: ivaActual.ivaVentas.total,
        credito: ivaActual.ivaCompras.total,
        saldo: ivaActual.saldo,
      },
      topClientes,
      ventasPorMes,
    })
  } catch (error) {
    console.error("Error al obtener estadísticas:", error)
    return NextResponse.json({ error: "Error al obtener estadísticas" }, { status: 500 })
  }
}
