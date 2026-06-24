import { prisma } from "@/lib/prisma"
import { VentasService } from "@/lib/ventas/ventas-service"

export async function resolverClienteCanal(
  empresaId: number,
  canal: string,
  identificador: string,
  datos: { nombre: string; email?: string; telefono?: string },
) {
  const codigo = `${canal.toUpperCase()}-${identificador}`
  const existente = await prisma.cliente.findFirst({ where: { empresaId, codigo } })
  if (existente) return existente

  return prisma.cliente.create({
    data: {
      empresaId,
      nombre: datos.nombre,
      codigo,
      email: datos.email,
      telefono: datos.telefono,
      condicionIva: "Consumidor Final",
      observaciones: `Cliente importado desde ${canal}`,
    },
  })
}

export async function pedidoCanalYaImportado(empresaId: number, prefijo: string, orderId: string) {
  return prisma.pedidoVenta.findFirst({
    where: { empresaId, observaciones: { contains: `${prefijo}${orderId}` } },
  })
}

export async function crearPedidoDesdeLineas(
  empresaId: number,
  clienteId: number,
  prefijo: string,
  orderId: string,
  notaExtra: string,
  lineas: Array<{
    productoId?: number
    descripcion: string
    cantidad: number
    precioUnitario: number
    sku?: string | null
  }>,
) {
  if (await pedidoCanalYaImportado(empresaId, prefijo, orderId)) {
    return { duplicado: true as const, pedidoVentaId: null, numero: null }
  }

  const ventas = new VentasService()
  const lineasResueltas = await Promise.all(lineas.map(async (l) => {
    let productoId = l.productoId
    if (!productoId && l.sku) {
      const prod = await prisma.producto.findFirst({
        where: { empresaId, codigo: l.sku },
        select: { id: true },
      })
      productoId = prod?.id
    }
    return {
      productoId,
      descripcion: l.descripcion,
      cantidad: l.cantidad,
      precioUnitario: l.precioUnitario,
    }
  }))

  if (lineasResueltas.length === 0) {
    return { duplicado: false as const, pedidoVentaId: null, numero: null }
  }

  const pv = await ventas.crearPedidoVenta({
    empresaId,
    clienteId,
    observaciones: `${prefijo}${orderId} | ${notaExtra}`,
    lineas: lineasResueltas,
    usarListaPrecios: false,
  })

  return { duplicado: false as const, pedidoVentaId: pv.id, numero: pv.numero }
}