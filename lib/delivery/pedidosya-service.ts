import { prisma } from "@/lib/prisma"

export interface PedidosYaItem {
  id: string
  name: string
  quantity: number
  unitPrice: number
  notes?: string
}

export interface PedidosYaPayload {
  orderId: string
  restaurantId: string
  empresaId?: number
  customer: {
    name: string
    phone: string
    address?: string
    notes?: string
  }
  items: PedidosYaItem[]
  subtotal: number
  deliveryFee: number
  discount: number
  total: number
  paymentMethod: "ONLINE" | "CASH" | "CARD_ON_DELIVERY"
  createdAt?: string
}

export interface PedidosYaProcessResult {
  ok: boolean
  ordenId?: number
  pedidosYaOrderId: string
  total: number
  comisionEstimada: number
  mensaje: string
}

/**
 * Procesa un pedido entrante de PedidosYa y lo convierte en una Venta/Pedido dentro de Claver ERP.
 */
export async function procesarPedidoPedidosYa(
  payload: PedidosYaPayload,
  empresaId: number,
): Promise<PedidosYaProcessResult> {
  const comisionPct = 0.18 // 18% comisión promedio PedidosYa
  const comisionEstimada = payload.total * comisionPct

  // 1. Buscar o crear cliente genérico para PedidosYa / Cliente particular
  let cliente = await prisma.cliente.findFirst({
    where: {
      empresaId,
      nombre: { contains: payload.customer.name || "Cliente PedidosYa" },
    },
  })

  if (!cliente) {
    cliente = await prisma.cliente.create({
      data: {
        empresaId,
        nombre: payload.customer.name || "Cliente PedidosYa",
        telefono: payload.customer.phone || "",
        direccion: payload.customer.address || "Delivery PedidosYa",
        condicionIva: "Consumidor Final",
        observaciones: `Pedido #PEYA-${payload.orderId}`,
      },
    })
  }

  // 2. Mapear líneas de producto
  const lineas = payload.items.map((it) => ({
    descripcion: it.name,
    cantidad: it.quantity,
    precioUnitario: it.unitPrice,
    subtotal: it.quantity * it.unitPrice,
  }))

  // 3. Crear comprobante/factura en estado pendiente para comanderas y KDS
  const venta = await prisma.factura.create({
    data: {
      empresaId,
      clienteId: cliente.id,
      tipo: "B",
      tipoCbte: 6,
      numero: 1,
      puntoVenta: 99, // Punto de venta dedicado a canales digitales
      subtotal: payload.subtotal,
      iva: payload.subtotal - payload.subtotal / 1.21,
      total: payload.total,
      estado: "completada",
      observaciones: `PedidosYa Order #${payload.orderId}. Pago: ${payload.paymentMethod}. Dir: ${payload.customer.address || "Mostrador"}. Notas: ${payload.customer.notes || "Sin notas"}`,
      lineas: {
        create: lineas.map((l) => ({
          descripcion: l.descripcion,
          cantidad: l.cantidad,
          precioUnitario: l.precioUnitario,
          subtotal: l.subtotal,
          porcentajeIva: 21,
          iva: l.subtotal - l.subtotal / 1.21,
          total: l.subtotal,
        })),
      },
    },
  })

  return {
    ok: true,
    ordenId: venta.id,
    pedidosYaOrderId: payload.orderId,
    total: payload.total,
    comisionEstimada,
    mensaje: `Pedido #${payload.orderId} de PedidosYa ingresado con éxito al POS`,
  }
}
