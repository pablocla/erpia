import { prisma } from "@/lib/prisma"
import { generarPropuestasReposicion } from "./reponedor-jit-service"

export interface PedidosAutomaticosResult {
  ordenesCreadas: number
  mensajesEncolados: number
  detalles: Array<{
    proveedorId: number
    proveedorNombre: string
    ordenCompraId: number
    ordenNumero: string
    totalProductos: number
    mensajeId?: number
    telefonoDestino?: string
  }>
}

/**
 * Busca el proveedor de un producto basado en:
 * 1. El último proveedor en Ordenes de Comp de la empresa.
 * 2. El último proveedor en Facturas de Compra de la empresa.
 * 3. Primer proveedor activo de la empresa (fallback).
 */
async function buscarProveedorDeProducto(empresaId: number, productoId: number) {
  // 1. Última Orden de Compra
  const ultimaOc = await prisma.lineaOrdenCompra.findFirst({
    where: {
      productoId,
      ordenCompra: {
        empresaId,
        proveedor: {
          activo: true,
          deletedAt: null,
        },
      },
    },
    orderBy: {
      ordenCompra: {
        fechaEmision: "desc",
      },
    },
    include: {
      ordenCompra: {
        include: {
          proveedor: true,
        },
      },
    },
  })

  if (ultimaOc?.ordenCompra?.proveedor) {
    return ultimaOc.ordenCompra.proveedor
  }

  // 2. Última Compra (Factura recibida)
  const ultimaCompra = await prisma.lineaCompra.findFirst({
    where: {
      productoId,
      compra: {
        empresaId,
        deletedAt: null,
        proveedor: {
          activo: true,
          deletedAt: null,
        },
      },
    },
    orderBy: {
      compra: {
        fecha: "desc",
      },
    },
    include: {
      compra: {
        include: {
          proveedor: true,
        },
      },
    },
  })

  if (ultimaCompra?.compra?.proveedor) {
    return ultimaCompra.compra.proveedor
  }

  // 3. Fallback: Primer proveedor activo
  return prisma.proveedor.findFirst({
    where: {
      empresaId,
      activo: true,
      deletedAt: null,
    },
  })
}

/**
 * Procesa las propuestas de stock bajo y autogenera órdenes de compra borrador
 * y sus correspondientes mensajes de WhatsApp para proveedores.
 */
export async function procesarPedidosAutomaticosProveedores(
  empresaId: number,
): Promise<PedidosAutomaticosResult> {
  // 1. Obtener propuestas
  const propuestas = await generarPropuestasReposicion(empresaId)
  if (propuestas.length === 0) {
    return { ordenesCreadas: 0, mensajesEncolados: 0, detalles: [] }
  }

  // 2. Mapear productos a proveedores
  const productosConProveedor = await Promise.all(
    propuestas.map(async (p) => {
      const proveedor = await buscarProveedorDeProducto(empresaId, p.productoId)
      return { propuesta: p, proveedor }
    }),
  )

  // 3. Agrupar propuestas por proveedor
  const grupos: Record<number, { proveedor: any; items: typeof productosConProveedor }> = {}
  for (const item of productosConProveedor) {
    if (!item.proveedor) continue
    const provId = item.proveedor.id
    if (!grupos[provId]) {
      grupos[provId] = { proveedor: item.proveedor, items: [] }
    }
    grupos[provId].items.push(item)
  }

  const detalles: PedidosAutomaticosResult["detalles"] = []

  // 4. Obtener datos de la empresa para el mensaje
  const empresa = await prisma.empresa.findUnique({
    where: { id: empresaId },
    select: { nombre: true },
  })
  const empresaNombre = empresa?.nombre ?? `Empresa #${empresaId}`

  // 5. Crear Orden de Compra + Mensaje por cada grupo
  for (const provIdStr of Object.keys(grupos)) {
    const provId = parseInt(provIdStr, 10)
    const { proveedor, items } = grupos[provId]

    // Obtener costo de compra del producto
    const lineasData = await Promise.all(
      items.map(async (item, index) => {
        const prod = await prisma.producto.findUnique({
          where: { id: item.propuesta.productoId },
          select: { precioCompra: true, unidad: true },
        })
        const precioUnitario = prod?.precioCompra ? Number(prod.precioCompra) : 0
        const unidad = prod?.unidad ?? "unidad"

        return {
          productoId: item.propuesta.productoId,
          nombre: item.propuesta.nombre,
          codigo: item.propuesta.codigo,
          cantidad: item.propuesta.cantidadSugerida,
          unidad,
          precioUnitario,
          subtotal: item.propuesta.cantidadSugerida * precioUnitario,
          orden: index + 1,
        }
      }),
    )

    const subtotal = lineasData.reduce((s, l) => s + l.subtotal, 0)
    const impuestos = subtotal * 0.21
    const total = subtotal + impuestos

    // Generar el siguiente número de orden para esta empresa
    const ultima = await prisma.ordenCompra.findFirst({
      where: { empresaId },
      orderBy: { numero: "desc" },
    })
    const num = (parseInt(ultima?.numero ?? "0", 10) + 1).toString().padStart(8, "0")

    // Crear la Orden de Compra
    const oc = await prisma.ordenCompra.create({
      data: {
        numero: num,
        fechaEmision: new Date(),
        subtotal,
        impuestos,
        total,
        estado: "borrador",
        observaciones: "Generado automáticamente por Reponedor JIT",
        proveedorId: provId,
        empresaId,
        lineas: {
          create: lineasData.map((l) => ({
            descripcion: `${l.nombre} (Cod: ${l.codigo})`,
            cantidad: l.cantidad,
            precioUnitario: l.precioUnitario,
            subtotal: l.subtotal,
            orden: l.orden,
            productoId: l.productoId,
          })),
        },
      },
    })

    // Componer el mensaje de WhatsApp
    const lineasTexto = lineasData
      .map((l) => `• ${l.cantidad} ${l.unidad} x ${l.nombre} (Cod: ${l.codigo})`)
      .join("\n")

    const fechaTexto = new Date().toLocaleDateString("es-AR")
    const mensajeTexto = `Hola *${proveedor.nombre}*, te enviamos el pedido de reposición automática de la empresa *${empresaNombre}*:\n\n*Orden de Compra: #${num}*\n*Fecha:* ${fechaTexto}\n\n*Detalle del Pedido:*\n${lineasTexto}\n\nPor favor, confirmanos la recepción del pedido, precio unitario vigente y fecha estimada de entrega. ¡Muchas gracias!`

    let mensajeId: number | undefined
    let destinatarioTel: string | undefined

    if (proveedor.telefono) {
      destinatarioTel = proveedor.telefono
      const waMsg = await prisma.mensajePendienteWhatsApp.create({
        data: {
          destinatario: proveedor.nombre,
          telefono: proveedor.telefono,
          mensaje: mensajeTexto,
          tipo: "pedido",
          prioridad: 3,
          estado: "pendiente",
          empresaId,
        },
      })
      mensajeId = waMsg.id
    }

    detalles.push({
      proveedorId: provId,
      proveedorNombre: proveedor.nombre,
      ordenCompraId: oc.id,
      ordenNumero: num,
      totalProductos: items.length,
      mensajeId,
      telefonoDestino: destinatarioTel,
    })
  }

  const ordenesCreadas = detalles.length
  const mensajesEncolados = detalles.filter((d) => d.mensajeId !== undefined).length

  return {
    ordenesCreadas,
    mensajesEncolados,
    detalles,
  }
}
