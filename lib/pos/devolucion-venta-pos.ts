/**
 * Devolución parcial desde POS — NC por ítems + reverso proporcional de caja + stock vía NC_EMITIDA.
 */
import { prisma } from "@/lib/prisma"
import { onNCEmitida } from "@/lib/contabilidad/factura-hooks"
import { eventBus } from "@/lib/events/event-bus"
import type { NCEmitidaPayload } from "@/lib/events/types"
import "@/lib/stock/stock-service"
import "@/lib/cc-cp/cuentas-service"

export interface LineaDevolucionInput {
  lineaFacturaId: number
  cantidad: number
}

export async function obtenerFacturaDevolucion(empresaId: number, facturaId: number) {
  const inicioDia = new Date()
  inicioDia.setHours(0, 0, 0, 0)

  const factura = await prisma.factura.findFirst({
    where: { id: facturaId, empresaId, createdAt: { gte: inicioDia } },
    include: {
      lineas: true,
      notasCredito: {
        where: { estado: { not: "anulada" } },
        include: { lineas: true },
      },
    },
  })

  if (!factura) {
    throw new Error("Factura no encontrada o no es del día de hoy")
  }

  if (factura.estado === "anulada") {
    throw new Error("La venta ya está anulada")
  }

  const devueltoPorLinea = new Map<number, number>()
  for (const nc of factura.notasCredito) {
    for (const ln of nc.lineas) {
      if (!ln.lineaFacturaId) continue
      devueltoPorLinea.set(
        ln.lineaFacturaId,
        (devueltoPorLinea.get(ln.lineaFacturaId) ?? 0) + Number(ln.cantidad),
      )
    }
  }

  const lineas = factura.lineas.map((l) => {
    const vendida = Number(l.cantidad)
    const devuelta = devueltoPorLinea.get(l.id) ?? 0
    const disponible = Math.max(0, vendida - devuelta)
    return {
      lineaFacturaId: l.id,
      productoId: l.productoId,
      descripcion: l.descripcion,
      cantidadVendida: vendida,
      cantidadDevuelta: devuelta,
      cantidadDisponible: disponible,
      precioUnitario: Number(l.precioUnitario),
      porcentajeIva: Number(l.porcentajeIva),
    }
  })

  const totalNC = factura.notasCredito.reduce((s, nc) => s + Number(nc.total), 0)
  const facturaTotal = Number(factura.total)

  return {
    facturaId: factura.id,
    numeroCompleto: `${factura.tipo}-${String(factura.puntoVenta).padStart(5, "0")}-${String(factura.numero).padStart(8, "0")}`,
    total: facturaTotal,
    totalDevuelto: totalNC,
    devolvable: totalNC < facturaTotal - 0.01,
    lineas: lineas.filter((l) => l.cantidadDisponible > 0),
  }
}

export async function devolucionParcialPos(
  empresaId: number,
  facturaId: number,
  lineasDevolver: LineaDevolucionInput[],
  motivo = "Devolución parcial POS",
) {
  if (!lineasDevolver.length) {
    throw new Error("Seleccioná al menos un ítem para devolver")
  }

  const detalle = await obtenerFacturaDevolucion(empresaId, facturaId)
  if (!detalle.devolvable) {
    throw new Error("Esta venta ya fue devuelta por el total")
  }

  const factura = await prisma.factura.findFirst({
    where: { id: facturaId, empresaId },
    include: { lineas: true },
  })
  if (!factura) throw new Error("Factura no encontrada")

  const lineaMap = new Map(factura.lineas.map((l) => [l.id, l]))
  const disponibleMap = new Map(
    detalle.lineas.map((l) => [l.lineaFacturaId, l.cantidadDisponible]),
  )

  const items: Array<{
    descripcion: string
    cantidad: number
    precioUnitario: number
    porcentajeIva: number
    productoId?: number
    lineaFacturaId: number
  }> = []

  for (const input of lineasDevolver) {
    if (input.cantidad <= 0) continue
    const linea = lineaMap.get(input.lineaFacturaId)
    if (!linea) throw new Error(`Línea ${input.lineaFacturaId} no pertenece a la factura`)
    const disp = disponibleMap.get(input.lineaFacturaId) ?? 0
    if (input.cantidad > disp + 0.0001) {
      throw new Error(`Cantidad excede lo devolvable para "${linea.descripcion}"`)
    }
    items.push({
      descripcion: linea.descripcion,
      cantidad: input.cantidad,
      precioUnitario: Number(linea.precioUnitario),
      porcentajeIva: Number(linea.porcentajeIva),
      productoId: linea.productoId ?? undefined,
      lineaFacturaId: linea.id,
    })
  }

  if (!items.length) throw new Error("Cantidades inválidas")

  let subtotal = 0
  let iva = 0
  for (const item of items) {
    const lineaSub = item.cantidad * item.precioUnitario
    subtotal += lineaSub
    iva += (lineaSub * item.porcentajeIva) / 100
  }
  const total = Math.round((subtotal + iva) * 100) / 100

  const movimientos = await prisma.movimientoCaja.findMany({
    where: {
      concepto: { startsWith: "Venta POS" },
      referencia: {
        in: [`FAC-${factura.tipo}-${factura.numero}`, `FAC-ticket-${factura.numero}`],
      },
      tipo: "ingreso",
      caja: { empresaId },
    },
  })

  if (!movimientos.length) {
    throw new Error("No es una venta registrada desde el POS")
  }

  const facturaTotal = Number(factura.total)
  const ratio = total / facturaTotal

  const tipoCbteMap: Record<string, number> = { A: 3, B: 8, C: 13, TK: 8 }
  const tipoCbte = tipoCbteMap[factura.tipo] ?? 8

  const ultimaNC = await prisma.notaCredito.findFirst({
    where: { tipoCbte, puntoVenta: factura.puntoVenta, empresaId },
    orderBy: { numero: "desc" },
  })
  const nuevoNumero = (ultimaNC?.numero ?? 0) + 1
  const cajaId = movimientos[0].cajaId

  const result = await prisma.$transaction(async (tx) => {
    const nc = await tx.notaCredito.create({
      data: {
        tipo: factura.tipo === "TK" ? "B" : factura.tipo,
        tipoCbte,
        numero: nuevoNumero,
        puntoVenta: factura.puntoVenta,
        motivo,
        subtotal,
        iva,
        total,
        estado: "emitida",
        facturaId: factura.id,
        clienteId: factura.clienteId,
        empresaId,
        lineas: {
          create: items.map((item) => ({
            descripcion: item.descripcion,
            cantidad: item.cantidad,
            precioUnitario: item.precioUnitario,
            porcentajeIva: item.porcentajeIva,
            subtotal: item.cantidad * item.precioUnitario,
            iva: (item.cantidad * item.precioUnitario * item.porcentajeIva) / 100,
            total:
              item.cantidad *
              item.precioUnitario *
              (1 + item.porcentajeIva / 100),
            productoId: item.productoId,
            lineaFacturaId: item.lineaFacturaId,
          })),
        },
      },
    })

    for (const mov of movimientos) {
      const montoEgreso = Math.round(Number(mov.monto) * ratio * 100) / 100
      if (montoEgreso <= 0) continue
      await tx.movimientoCaja.create({
        data: {
          cajaId,
          tipo: "egreso",
          concepto: `Devolución POS #${factura.numero}`,
          monto: montoEgreso,
          medioPago: mov.medioPago,
          referencia: `NC-${nc.numero}-FAC-${factura.numero}`,
        },
      })
    }

    const totalNCPrevias = await tx.notaCredito.aggregate({
      where: { facturaId, estado: { not: "anulada" }, empresaId },
      _sum: { total: true },
    })
    const totalDevuelto = Number(totalNCPrevias._sum.total ?? 0)
    if (totalDevuelto >= facturaTotal - 0.01) {
      await tx.factura.update({
        where: { id: factura.id },
        data: { estado: "anulada" },
      })
    }

    return nc
  })

  await onNCEmitida(result.id)

  await eventBus.emit<NCEmitidaPayload>({
    type: "NC_EMITIDA",
    payload: {
      notaCreditoId: result.id,
      facturaId: factura.id,
      clienteId: factura.clienteId,
      total: Number(result.total),
      motivo,
    },
    timestamp: new Date(),
  })

  return {
    notaCreditoId: result.id,
    facturaId: factura.id,
    numeroNC: `${result.tipo}-${String(result.puntoVenta).padStart(5, "0")}-${String(result.numero).padStart(8, "0")}`,
    total: Number(result.total),
  }
}