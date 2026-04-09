import { prisma } from "@/lib/prisma"

export class EstadisticasService {
  async obtenerEstadisticasVentas(fechaDesde: Date, fechaHasta: Date) {
    const facturas = await prisma.factura.findMany({
      where: {
        createdAt: {
          gte: fechaDesde,
          lte: fechaHasta,
        },
        estado: "emitida",
      },
    })

    const totalVentas = facturas.reduce((sum, f) => sum + f.total, 0)
    const totalIVA = facturas.reduce((sum, f) => sum + f.iva, 0)
    const cantidadFacturas = facturas.length

    return {
      totalVentas: Math.round(totalVentas * 100) / 100,
      totalIVA: Math.round(totalIVA * 100) / 100,
      cantidadFacturas,
      promedioVenta: cantidadFacturas > 0 ? Math.round((totalVentas / cantidadFacturas) * 100) / 100 : 0,
    }
  }

  async obtenerEstadisticasCompras(fechaDesde: Date, fechaHasta: Date) {
    const compras = await prisma.compra.findMany({
      where: {
        fecha: {
          gte: fechaDesde,
          lte: fechaHasta,
        },
      },
    })

    const totalCompras = compras.reduce((sum, c) => sum + c.total, 0)
    const totalIVA = compras.reduce((sum, c) => sum + c.iva, 0)
    const cantidadCompras = compras.length

    return {
      totalCompras: Math.round(totalCompras * 100) / 100,
      totalIVA: Math.round(totalIVA * 100) / 100,
      cantidadCompras,
      promedioCompra: cantidadCompras > 0 ? Math.round((totalCompras / cantidadCompras) * 100) / 100 : 0,
    }
  }

  async obtenerVentasPorMes(anio: number) {
    const ventas = []

    for (let mes = 1; mes <= 12; mes++) {
      const fechaDesde = new Date(anio, mes - 1, 1)
      const fechaHasta = new Date(anio, mes, 0, 23, 59, 59)

      const facturas = await prisma.factura.findMany({
        where: {
          createdAt: {
            gte: fechaDesde,
            lte: fechaHasta,
          },
          estado: "emitida",
        },
      })

      const total = facturas.reduce((sum, f) => sum + f.total, 0)

      ventas.push({
        mes,
        nombreMes: this.obtenerNombreMes(mes),
        total: Math.round(total * 100) / 100,
        cantidad: facturas.length,
      })
    }

    return ventas
  }

  async obtenerTopClientes(limite = 10) {
    const facturas = await prisma.factura.findMany({
      where: {
        estado: "emitida",
      },
      include: {
        cliente: true,
      },
    })

    // Agrupar por cliente
    const clientesMap = new Map<number, { cliente: any; total: number; cantidad: number }>()

    facturas.forEach((factura) => {
      const clienteId = factura.clienteId
      const actual = clientesMap.get(clienteId) || {
        cliente: factura.cliente,
        total: 0,
        cantidad: 0,
      }

      actual.total += factura.total
      actual.cantidad += 1

      clientesMap.set(clienteId, actual)
    })

    // Convertir a array y ordenar
    const clientes = Array.from(clientesMap.values())
      .sort((a, b) => b.total - a.total)
      .slice(0, limite)

    return clientes.map((c) => ({
      nombre: c.cliente.nombre,
      cuit: c.cliente.cuit,
      total: Math.round(c.total * 100) / 100,
      cantidad: c.cantidad,
    }))
  }

  private obtenerNombreMes(mes: number): string {
    const meses = [
      "Enero",
      "Febrero",
      "Marzo",
      "Abril",
      "Mayo",
      "Junio",
      "Julio",
      "Agosto",
      "Septiembre",
      "Octubre",
      "Noviembre",
      "Diciembre",
    ]
    return meses[mes - 1]
  }
}
