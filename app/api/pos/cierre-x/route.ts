/**
 * GET  /api/pos/cierre-x   → computa el snapshot en tiempo real (sin guardar)
 * POST /api/pos/cierre-x   → guarda el snapshot como CierreX en DB (imprime el X)
 */
import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getAuthContext } from "@/lib/auth/empresa-guard"
import { computarSnapshot, obtenerOCrearJornada } from "@/lib/pos/fiscal-service"

// Inicio del día actual
function inicioDia(d = new Date()) {
  const t = new Date(d); t.setHours(0, 0, 0, 0); return t
}
function finDia(d = new Date()) {
  const t = new Date(d); t.setHours(23, 59, 59, 999); return t
}

// ── GET ───────────────────────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  try {
    const ctx = await getAuthContext(request)
    if (!ctx.ok) return ctx.response

    const { empresaId } = ctx.auth

    // Caja abierta
    const caja = await prisma.caja.findFirst({
      where: { empresaId, estado: "abierta" },
    })
    if (!caja) {
      return NextResponse.json({ error: "No hay caja abierta" }, { status: 400 })
    }

    const jornada = await obtenerOCrearJornada(empresaId)
    if (jornada.estado === "cerrada_z") {
      return NextResponse.json({ error: "La jornada fiscal ya fue cerrada con Cierre Z" }, { status: 400 })
    }

    const snapshot = await computarSnapshot(
      empresaId,
      caja.id,
      inicioDia(),
      new Date(),
    )

    // Cantidad de cierres X ya emitidos hoy
    const cierresXHoy = await prisma.cierreX.count({
      where: {
        empresaId,
        timestamp: { gte: inicioDia() },
      },
    })

    return NextResponse.json({
      ok: true,
      snapshot,
      jornada: {
        id: jornada.id,
        fecha: jornada.fecha,
        estado: jornada.estado,
        numeroZ: jornada.numeroZ,
      },
      cierresXHoy,
      caja: {
        id: caja.id,
        turno: caja.turno,
        saldoInicial: caja.saldoInicial,
        fecha: caja.fecha,
      },
      generadoEn: new Date().toISOString(),
    })
  } catch (error: any) {
    console.error("Error en GET /api/pos/cierre-x:", error)
    return NextResponse.json({ error: error?.message ?? "Error interno" }, { status: 500 })
  }
}

// ── POST ──────────────────────────────────────────────────────────────────────
// Persiste el snapshot en la tabla CierreX (registro imprimible)

export async function POST(request: NextRequest) {
  try {
    const ctx = await getAuthContext(request)
    if (!ctx.ok) return ctx.response

    const { empresaId } = ctx.auth

    const caja = await prisma.caja.findFirst({
      where: { empresaId, estado: "abierta" },
    })
    if (!caja) {
      return NextResponse.json({ error: "No hay caja abierta" }, { status: 400 })
    }

    const jornada = await obtenerOCrearJornada(empresaId)
    if (jornada.estado === "cerrada_z") {
      return NextResponse.json({ error: "La jornada fiscal ya fue cerrada con Cierre Z" }, { status: 400 })
    }

    const snapshot = await computarSnapshot(
      empresaId,
      caja.id,
      inicioDia(),
      new Date(),
    )

    // Siguiente número de cierre X para la jornada
    const prevCount = await prisma.cierreX.count({
      where: { jornadaId: jornada.id },
    })
    const numeroCierreX = prevCount + 1

    const cierreX = await prisma.cierreX.create({
      data: {
        numeroCierreX,
        totalVentas:       snapshot.totalVentas,
        totalNeto:         snapshot.iva.totalNeto,
        totalIva21:        snapshot.iva.iva21,
        totalIva105:       snapshot.iva.iva105,
        totalIva27:        snapshot.iva.iva27,
        totalIvaExento:    snapshot.iva.netoExento,
        totalEfectivo:     snapshot.pagos.efectivo,
        totalTarjeta:      snapshot.pagos.tarjeta,
        totalTransferencia: snapshot.pagos.transferencia,
        totalQR:           snapshot.pagos.qr,
        totalCheque:       snapshot.pagos.cheque,
        cantidadFacturas:  snapshot.cantidadFacturas + snapshot.cantidadTickets,
        topProductos:      snapshot.topProductos as any,
        ventasPorHora:     snapshot.ventasPorHora as any,
        ventasPorTipo:     snapshot.ventasPorTipo as any,
        jornadaId:         jornada.id,
        cajaId:            caja.id,
        empresaId,
        generadoPor:       ctx.auth.userId,
      },
    })

    return NextResponse.json({
      ok: true,
      cierreXId: cierreX.id,
      numeroCierreX,
      snapshot,
      generadoEn: cierreX.timestamp.toISOString(),
    }, { status: 201 })
  } catch (error: any) {
    console.error("Error en POST /api/pos/cierre-x:", error)
    return NextResponse.json({ error: error?.message ?? "Error interno" }, { status: 500 })
  }
}
