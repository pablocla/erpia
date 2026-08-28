import { prisma } from "@/lib/prisma"

export interface RappiItem {
  id: string
  name: string
  quantity: number
  unitPrice: number
  comments?: string
}

export interface RappiPayload {
  orderId: string
  storeId: string
  empresaId?: number
  customer: {
    name: string
    phone: string
    address?: string
    notes?: string
  }
  items: RappiItem[]
  subtotal: number
  deliveryFee: number
  discount: number
  total: number
  paymentMethod: "ONLINE" | "CASH" | "CARD_ON_DELIVERY"
  createdAt?: string
}

export interface RappiProcessResult {
  ok: boolean
  ordenId?: number
  rappiOrderId: string
  total: number
  comisionEstimada: number
  mensaje: string
}

/**
 * Procesa un pedido entrante de Rappi y lo convierte en una Venta/Pedido dentro de Claver ERP.
 */
export async function procesarPedidoRappi(
  payload: RappiPayload,
  empresaId: number,
): Promise<RappiProcessResult> {
  const comisionPct = 0.20 // 20% comisión promedio Rappi
  const comisionEstimada = payload.total * comisionPct

  // 1. Buscar o crear cliente genérico para Rappi
  let cliente = await prisma.cliente.findFirst({
    where: {
      empresaId,
      nombre: { contains: payload.customer.name || "Cliente Rappi" },
    },
  })

  if (!cliente) {
    cliente = await prisma.cliente.create({
      data: {
        empresaId,
        nombre: payload.customer.name || "Cliente Rappi",
        telefono: payload.customer.phone || "",
        direccion: payload.customer.address || "Delivery Rappi",
        condicionIva: "Consumidor Final",
        observaciones: `Pedido #RAPPI-${payload.orderId}`,
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

  // 3. Crear comprobante/factura en estado completada para comanderas y KDS
  const venta = await prisma.factura.create({
    data: {
      empresaId,
      clienteId: cliente.id,
      tipo: "B",
      tipoCbte: 6,
      numero: 1,
      puntoVenta: 98, // Punto de venta dedicado a Rappi
      subtotal: payload.subtotal,
      iva: payload.subtotal - payload.subtotal / 1.21,
      total: payload.total,
      estado: "completada",
      observaciones: `Rappi Order #${payload.orderId}. Pago: ${payload.paymentMethod}. Dir: ${payload.customer.address || "Mostrador"}. Notas: ${payload.customer.notes || "Sin notas"}`,
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
    rappiOrderId: payload.orderId,
    total: payload.total,
    comisionEstimada,
    mensaje: `Pedido #${payload.orderId} de Rappi ingresado con éxito al POS`,
  }
}
