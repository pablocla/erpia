/**
 * fiscal-service.ts
 * Lógica compartida para Cierre X / Cierre Z del POS.
 *
 * Cierre X → informe parcial, no cierra nada, se puede generar N veces/día
 * Cierre Z → cierre definitivo de la jornada fiscal, irreversible
 */

import { prisma } from "@/lib/prisma"

// ──────────────────────────────────────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────────────────────────────────────

export interface DesgloseMedioPago {
  efectivo: number
  tarjetaDebito: number
  tarjetaCredito: number
  tarjeta: number        // débito + crédito
  transferencia: number
  qr: number
  cheque: number
  ctaCte: number
  total: number
}

export interface DesgloseIva {
  neto21: number;  iva21: number
  neto105: number; iva105: number
  neto27: number;  iva27: number
  netoExento: number
  netoNoGravado: number
  totalIva: number
  totalNeto: number
}

export interface TopProducto {
  productoId: number | null
  nombre: string
  cantidad: number
  total: number
}

export interface VentaPorHora {
  hora: number
  cantidad: number
  total: number
}

export interface SnapshotFiscal {
  // Identificación
  empresaId: number
  cajaId: number
  desde: Date
  hasta: Date

  // Ventas generales
  cantidadFacturas: number
  cantidadTickets: number
  primerNumFactura: number | null
  ultimoNumFactura: number | null
  totalVentas: number

  // Desglose IVA
  iva: DesgloseIva

  // Desglose medios de pago
  pagos: DesgloseMedioPago

  // Analíticos
  topProductos: TopProducto[]
  ventasPorHora: VentaPorHora[]
  ventasPorTipo: { tipo: string; cantidad: number; total: number }[]
}

// ──────────────────────────────────────────────────────────────────────────────
// computarSnapshot
// ──────────────────────────────────────────────────────────────────────────────

/**
 * Computa el snapshot fiscal desde la base de datos para un rango de fechas y empresa.
 * Fuente de verdad: Factura (con lineas) + MovimientoCaja.
 */
export async function computarSnapshot(
  empresaId: number,
  cajaId: number,
  desde: Date,
  hasta: Date,
): Promise<SnapshotFiscal> {

  // ── 1. Facturas del período (incluye tickets = pendiente_cae) ────────────
  const facturas = await prisma.factura.findMany({
    where: {
      empresaId,
      estado: { in: ["emitida", "pendiente_cae"] },
      createdAt: { gte: desde, lte: hasta },
    },
    include: { lineas: true },
    orderBy: { numero: "asc" },
  })

  // ── 2. Movimientos de caja del período ───────────────────────────────────
  const movimientos = await prisma.movimientoCaja.findMany({
    where: {
      cajaId,
      tipo: "ingreso",
      createdAt: { gte: desde, lte: hasta },
    },
  })

  // ── 3. Totales generales ─────────────────────────────────────────────────
  const cantidadFacturas = facturas.filter((f) => f.tipo !== "ticket").length
  const cantidadTickets  = facturas.filter((f) => f.tipo === "ticket" || f.estado === "pendiente_cae").length
  const totalVentas      = facturas.reduce((s, f) => s + (f.total ?? 0), 0)

  const nums = facturas.map((f) => f.numero).filter(Boolean) as number[]
  const primerNumFactura = nums.length ? Math.min(...nums) : null
  const ultimoNumFactura = nums.length ? Math.max(...nums) : null

  // ── 4. Desglose IVA ──────────────────────────────────────────────────────
  const iva: DesgloseIva = {
    neto21: 0, iva21: 0,
    neto105: 0, iva105: 0,
    neto27: 0,  iva27: 0,
    netoExento: 0,
    netoNoGravado: 0,
    totalIva: 0,
    totalNeto: 0,
  }

  for (const factura of facturas) {
    for (const linea of factura.lineas) {
      const pct = linea.porcentajeIva ?? 21
      const ivaLinea   = linea.iva   ?? 0
      const totalLinea = linea.subtotal ?? 0
      const netoLinea  = totalLinea - ivaLinea

      if (pct === 21)      { iva.neto21  += netoLinea; iva.iva21  += ivaLinea }
      else if (pct === 10.5){ iva.neto105 += netoLinea; iva.iva105 += ivaLinea }
      else if (pct === 27)  { iva.neto27  += netoLinea; iva.iva27  += ivaLinea }
      else if (pct === 0)   { iva.netoExento += netoLinea }
      else                  { iva.netoNoGravado += netoLinea }

      iva.totalIva  += ivaLinea
      iva.totalNeto += netoLinea
    }
  }

  // Redondear a 2 decimales
  for (const k of Object.keys(iva) as (keyof DesgloseIva)[]) {
    iva[k] = parseFloat((iva[k] as number).toFixed(2))
  }

  // ── 5. Desglose medios de pago (desde MovimientoCaja) ────────────────────
  const sumMedio = (medio: string) =>
    movimientos.filter((m) => m.medioPago === medio).reduce((s, m) => s + m.monto, 0)

  const pagos: DesgloseMedioPago = {
    efectivo:       parseFloat(sumMedio("efectivo").toFixed(2)),
    tarjetaDebito:  parseFloat(sumMedio("tarjeta_debito").toFixed(2)),
    tarjetaCredito: parseFloat(sumMedio("tarjeta_credito").toFixed(2)),
    tarjeta:        parseFloat((sumMedio("tarjeta_debito") + sumMedio("tarjeta_credito")).toFixed(2)),
    transferencia:  parseFloat(sumMedio("transferencia").toFixed(2)),
    qr:             parseFloat(sumMedio("qr").toFixed(2)),
    cheque:         parseFloat(sumMedio("cheque").toFixed(2)),
    ctaCte:         parseFloat(sumMedio("cuenta_corriente").toFixed(2)),
    total:          0,
  }
  pagos.total = parseFloat(
    (pagos.efectivo + pagos.tarjeta + pagos.transferencia + pagos.qr + pagos.cheque + pagos.ctaCte).toFixed(2)
  )

  // ── 6. Top productos ─────────────────────────────────────────────────────
  const productoMap = new Map<string, TopProducto>()
  for (const factura of facturas) {
    for (const linea of factura.lineas) {
      const key = String(linea.productoId ?? linea.descripcion)
      const existing = productoMap.get(key)
      if (existing) {
        existing.cantidad += linea.cantidad
        existing.total    += linea.subtotal ?? 0
      } else {
        productoMap.set(key, {
          productoId: linea.productoId,
          nombre:     linea.descripcion,
          cantidad:   linea.cantidad,
          total:      linea.subtotal ?? 0,
        })
      }
    }
  }
  const topProductos = [...productoMap.values()]
    .sort((a, b) => b.total - a.total)
    .slice(0, 10)
    .map((p) => ({ ...p, total: parseFloat(p.total.toFixed(2)) }))

  // ── 7. Ventas por hora ───────────────────────────────────────────────────
  const horaMap = new Map<number, { cantidad: number; total: number }>()
  for (const factura of facturas) {
    const hora = new Date(factura.createdAt).getHours()
    const existing = horaMap.get(hora)
    if (existing) {
      existing.cantidad += 1
      existing.total    += factura.total ?? 0
    } else {
      horaMap.set(hora, { cantidad: 1, total: factura.total ?? 0 })
    }
  }
  const ventasPorHora: VentaPorHora[] = [...horaMap.entries()]
    .sort(([a], [b]) => a - b)
    .map(([hora, d]) => ({ hora, cantidad: d.cantidad, total: parseFloat(d.total.toFixed(2)) }))

  // ── 8. Ventas por tipo ────────────────────────────────────────────────────
  const tipoMap = new Map<string, { cantidad: number; total: number }>()
  for (const factura of facturas) {
    const tipo = factura.tipo ?? "ticket"
    const existing = tipoMap.get(tipo)
    if (existing) {
      existing.cantidad += 1
      existing.total    += factura.total ?? 0
    } else {
      tipoMap.set(tipo, { cantidad: 1, total: factura.total ?? 0 })
    }
  }
  const ventasPorTipo = [...tipoMap.entries()].map(([tipo, d]) => ({
    tipo,
    cantidad: d.cantidad,
    total: parseFloat(d.total.toFixed(2)),
  }))

  return {
    empresaId,
    cajaId,
    desde,
    hasta,
    cantidadFacturas,
    cantidadTickets,
    primerNumFactura,
    ultimoNumFactura,
    totalVentas: parseFloat(totalVentas.toFixed(2)),
    iva,
    pagos,
    topProductos,
    ventasPorHora,
    ventasPorTipo,
  }
}

// ──────────────────────────────────────────────────────────────────────────────
// obtenerOCrearJornada
// ──────────────────────────────────────────────────────────────────────────────

export async function obtenerOCrearJornada(empresaId: number): Promise<{
  id: number
  fecha: Date
  estado: string
  numeroZ: number
}> {
  const hoy = new Date()
  hoy.setHours(0, 0, 0, 0)

  const existing = await prisma.jornadaFiscal.findUnique({
    where: { empresaId_fecha: { empresaId, fecha: hoy } },
  })
  if (existing) return existing

  // Calcular siguiente número Z
  const ultimaJornada = await prisma.jornadaFiscal.findFirst({
    where: { empresaId },
    orderBy: { numeroZ: "desc" },
  })
  const siguienteZ = (ultimaJornada?.numeroZ ?? 0) + 1

  return prisma.jornadaFiscal.create({
    data: { empresaId, fecha: hoy, numeroZ: siguienteZ },
  })
}
