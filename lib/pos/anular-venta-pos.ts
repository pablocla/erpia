/**
 * Anulación de venta POS — NC total + reverso de caja + stock vía evento NC_EMITIDA.
 */
import { prisma } from "@/lib/prisma"
import { onNCEmitida } from "@/lib/contabilidad/factura-hooks"
import { eventBus } from "@/lib/events/event-bus"
import type { NCEmitidaPayload } from "@/lib/events/types"
import "@/lib/stock/stock-service"
import "@/lib/cc-cp/cuentas-service"

export function parseReferenciaPos(ref: string | null | undefined) {
  if (!ref) return null
  const m = ref.match(/^FAC-(\w+)-(\d+)$/)
  if (!m) return null
  let tipo = m[1]
  if (tipo === "ticket") tipo = "B"
  return { tipo, numero: parseInt(m[2], 10) }
}

export async function listarVentasPosHoy(empresaId: number) {
  const inicioDia = new Date()
  inicioDia.setHours(0, 0, 0, 0)

  const movimientos = await prisma.movimientoCaja.findMany({
    where: {
      concepto: { startsWith: "Venta POS" },
      createdAt: { gte: inicioDia },
      tipo: "ingreso",
      caja: { empresaId },
    },
    orderBy: { createdAt: "desc" },
    select: {
      referencia: true,
      monto: true,
      medioPago: true,
      createdAt: true,
    },
  })

  const porRef = new Map<
    string,
    { referencia: string; total: number; medios: string[]; hora: Date }
  >()

  for (const m of movimientos) {
    const ref = m.referencia ?? ""
    if (!ref) continue
    const existing = porRef.get(ref)
    const monto = Number(m.monto)
    if (existing) {
      existing.total += monto
      if (!existing.medios.includes(m.medioPago)) {
        existing.medios.push(m.medioPago)
      }
    } else {
      porRef.set(ref, {
        referencia: ref,
        total: monto,
        medios: [m.medioPago],
        hora: m.createdAt,
      })
    }
  }

  const ventas: Array<{
    facturaId: number
    numeroCompleto: string
    total: number
    estado: string
    hora: string
    medios: string[]
    anulable: boolean
  }> = []

  for (const grupo of porRef.values()) {
    const parsed = parseReferenciaPos(grupo.referencia)
    if (!parsed) continue

    const factura = await prisma.factura.findFirst({
      where: {
        empresaId,
        tipo: parsed.tipo,
        numero: parsed.numero,
        createdAt: { gte: inicioDia },
      },
      include: {
        notasCredito: { where: { estado: { not: "anulada" } }, select: { total: true } },
      },
    })

    if (!factura) continue

    const totalNC = factura.notasCredito.reduce((s, nc) => s + Number(nc.total), 0)
    const facturaTotal = Number(factura.total)
    const anulable =
      factura.estado !== "anulada" && totalNC < facturaTotal - 0.01

    ventas.push({
      facturaId: factura.id,
      numeroCompleto: `${factura.tipo}-${String(factura.puntoVenta).padStart(5, "0")}-${String(factura.numero).padStart(8, "0")}`,
      total: facturaTotal,
      estado: factura.estado,
      hora: grupo.hora.toISOString(),
      medios: grupo.medios,
      anulable,
    })
  }

  return ventas.sort(
    (a, b) => new Date(b.hora).getTime() - new Date(a.hora).getTime()
  )
}

export async function anularVentaPos(
  empresaId: number,
  facturaId: number,
  motivo = "Anulación venta POS"
) {
  const inicioDia = new Date()
  inicioDia.setHours(0, 0, 0, 0)

  const factura = await prisma.factura.findFirst({
    where: { id: facturaId, empresaId, createdAt: { gte: inicioDia } },
    include: { lineas: true },
  })

  if (!factura) {
    throw new Error("Factura no encontrada o no es del día de hoy")
  }

  if (factura.estado === "anulada") {
    throw new Error("La venta ya está anulada")
  }

  const refPrefix = `FAC-`
  const movimientos = await prisma.movimientoCaja.findMany({
    where: {
      concepto: { startsWith: "Venta POS" },
      referencia: {
        in: [
          `FAC-${factura.tipo}-${factura.numero}`,
          `FAC-ticket-${factura.numero}`,
        ],
      },
      tipo: "ingreso",
      caja: { empresaId },
    },
  })

  if (movimientos.length === 0) {
    throw new Error("No es una venta registrada desde el POS")
  }

  const existingNCs = await prisma.notaCredito.aggregate({
    where: { facturaId, estado: { not: "anulada" }, empresaId },
    _sum: { total: true },
  })
  const totalNCPrevias = Number(existingNCs._sum.total ?? 0)
  const facturaTotal = Number(factura.total)

  if (totalNCPrevias >= facturaTotal - 0.01) {
    throw new Error("La venta ya tiene una nota de crédito por el total")
  }

  const tipoCbteMap: Record<string, number> = { A: 3, B: 8, C: 13 }
  const tipoCbte = tipoCbteMap[factura.tipo] ?? 8

  const items = factura.lineas.map((linea) => ({
    descripcion: linea.descripcion,
    cantidad: Number(linea.cantidad),
    precioUnitario: Number(linea.precioUnitario),
    porcentajeIva: Number(linea.porcentajeIva),
    productoId: linea.productoId ?? undefined,
    lineaFacturaId: linea.id,
  }))

  let subtotal = 0
  let iva = 0
  for (const item of items) {
    const lineaSub = item.cantidad * item.precioUnitario
    subtotal += lineaSub
    iva += (lineaSub * item.porcentajeIva) / 100
  }
  const total = Math.round((subtotal + iva) * 100) / 100

  const ultimaNC = await prisma.notaCredito.findFirst({
    where: { tipoCbte, puntoVenta: factura.puntoVenta, empresaId },
    orderBy: { numero: "desc" },
  })
  const nuevoNumero = (ultimaNC?.numero ?? 0) + 1

  const cajaId = movimientos[0].cajaId

  const result = await prisma.$transaction(async (tx) => {
    const nc = await tx.notaCredito.create({
      data: {
        tipo: factura.tipo,
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
      await tx.movimientoCaja.create({
        data: {
          cajaId,
          tipo: "egreso",
          concepto: `Anulación POS #${factura.numero}`,
          monto: mov.monto,
          medioPago: mov.medioPago,
          referencia: `NC-${nc.numero}-FAC-${factura.numero}`,
        },
      })
    }

    await tx.factura.update({
      where: { id: factura.id },
      data: { estado: "anulada" },
    })

    return nc
  })

  await onNCEmitida(result.id)

  await eventBus.emit<NCEmitidaPayload>({
    type: "NC_EMITIDA",
    payload: {
      notaCreditoId: result.id,
      facturaId: factura.id,
      clienteId: factura.clienteId,
      total: result.total,
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