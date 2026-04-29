/**
 * GET  /api/pos/cierre-z   → preview del Cierre Z (mismos datos, sin ejecutar)
 * POST /api/pos/cierre-z   → ejecuta el Cierre Z: cierra jornada + caja + persiste totales
 *
 * Reglas:
 *  - Solo un Cierre Z por jornada por empresa
 *  - Requiere que la caja esté abierta (la cierra automáticamente) o cerrada
 *  - Una vez ejecutado, la jornada queda en estado "cerrada_z" → irreversible
 *  - Incrementa el contador Z de la empresa
 */
import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getAuthContext } from "@/lib/auth/empresa-guard"
import { computarSnapshot, obtenerOCrearJornada } from "@/lib/pos/fiscal-service"
import { z } from "zod"

function inicioDia(d = new Date()) {
  const t = new Date(d); t.setHours(0, 0, 0, 0); return t
}

const cierreZSchema = z.object({
  confirmar: z.boolean().default(false),
  observaciones: z.string().optional(),
  // Arqueo manual (opcional — si no se pasa se usan los valores del sistema)
  arqueoEfectivo:      z.number().min(0).optional(),
  arqueoTarjeta:       z.number().min(0).optional(),
  arqueoTransferencia: z.number().min(0).optional(),
  arqueoQR:            z.number().min(0).optional(),
  arqueoCheque:        z.number().min(0).optional(),
  diferenciaJustif:    z.string().optional(),
})

// ── GET — preview ─────────────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  try {
    const ctx = await getAuthContext(request)
    if (!ctx.ok) return ctx.response

    const { empresaId } = ctx.auth

    const caja = await prisma.caja.findFirst({
      where: { empresaId, estado: "abierta" },
    })

    const jornada = await obtenerOCrearJornada(empresaId)

    if (jornada.estado === "cerrada_z") {
      return NextResponse.json({
        ok: true,
        estado: "ya_cerrada",
        jornada,
        mensaje: "La jornada fiscal ya fue cerrada con Cierre Z hoy.",
      })
    }

    // Para preview usamos la caja activa o la última cerrada del día
    const cajaRef = caja ?? await prisma.caja.findFirst({
      where: { empresaId, estado: "cerrada", fecha: { gte: inicioDia() } },
      orderBy: { createdAt: "desc" },
    })

    if (!cajaRef) {
      return NextResponse.json({ error: "No hay caja del día" }, { status: 400 })
    }

    const snapshot = await computarSnapshot(
      empresaId,
      cajaRef.id,
      inicioDia(),
      new Date(),
    )

    return NextResponse.json({
      ok: true,
      estado: "pendiente",
      preview: true,
      jornada: { id: jornada.id, numeroZ: jornada.numeroZ, fecha: jornada.fecha },
      caja: { id: cajaRef.id, estado: cajaRef.estado, turno: cajaRef.turno },
      snapshot,
    })
  } catch (error: any) {
    console.error("Error en GET /api/pos/cierre-z:", error)
    return NextResponse.json({ error: error?.message ?? "Error interno" }, { status: 500 })
  }
}

// ── POST — ejecutar Cierre Z ──────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const ctx = await getAuthContext(request)
    if (!ctx.ok) return ctx.response

    const { empresaId } = ctx.auth

    const body = await request.json()
    const parsed = cierreZSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: "Datos inválidos", detalles: parsed.error.flatten() }, { status: 400 })
    }
    const data = parsed.data

    if (!data.confirmar) {
      return NextResponse.json(
        { error: "Debe confirmar explícitamente el Cierre Z enviando confirmar: true" },
        { status: 400 },
      )
    }

    // ── Verificar jornada ────────────────────────────────────────────────────
    const jornada = await obtenerOCrearJornada(empresaId)
    if (jornada.estado === "cerrada_z") {
      return NextResponse.json(
        { error: "La jornada ya tiene Cierre Z emitido. Solo se puede emitir uno por día." },
        { status: 409 },
      )
    }

    // ── Buscar caja del día ──────────────────────────────────────────────────
    let caja = await prisma.caja.findFirst({
      where: { empresaId, estado: "abierta" },
      include: { movimientos: true },
    })

    // Calcular snapshot ANTES de cerrar la caja
    const cajaParaSnapshot = caja ?? await prisma.caja.findFirst({
      where: { empresaId, estado: "cerrada", fecha: { gte: inicioDia() } },
      orderBy: { createdAt: "desc" },
    })

    if (!cajaParaSnapshot) {
      return NextResponse.json({ error: "No hay caja del día para cerrar" }, { status: 400 })
    }

    const snapshot = await computarSnapshot(
      empresaId,
      cajaParaSnapshot.id,
      inicioDia(),
      new Date(),
    )

    // ── Transacción atómica ──────────────────────────────────────────────────
    const resultado = await prisma.$transaction(async (tx) => {

      // 1. Cerrar caja abierta si la hay
      if (caja) {
        const montoA = (value: unknown) => Number(value ?? 0)

        const ingresos = caja.movimientos
          .filter((m) => m.tipo === "ingreso")
          .reduce((s, m) => s + montoA(m.monto), 0)
        const egresos = caja.movimientos
          .filter((m) => m.tipo === "egreso")
          .reduce((s, m) => s + montoA(m.monto), 0)
        const saldoFinal = montoA(caja.saldoInicial) + ingresos - egresos

        const porMedio = (medio: string) =>
          caja!.movimientos.filter((m) => m.medioPago === medio)
            .reduce((s, m) => s + (m.tipo === "ingreso" ? montoA(m.monto) : -montoA(m.monto)), 0)

        const sistemaEfectivo = montoA(caja.saldoInicial) + porMedio("efectivo")
        const sistemaTarjeta = porMedio("tarjeta_debito") + porMedio("tarjeta_credito")
        const sistemaTransf = porMedio("transferencia")
        const sistemaQR = porMedio("qr")
        const sistemaCheque = porMedio("cheque")

        const totalDeclarado =
          (data.arqueoEfectivo      ?? sistemaEfectivo) +
          (data.arqueoTarjeta       ?? sistemaTarjeta) +
          (data.arqueoTransferencia ?? sistemaTransf) +
          (data.arqueoQR            ?? sistemaQR) +
          (data.arqueoCheque        ?? sistemaCheque)
        const totalSistema = sistemaEfectivo + sistemaTarjeta + sistemaTransf + sistemaQR + sistemaCheque
        const diferencia   = parseFloat((totalDeclarado - totalSistema).toFixed(2))

        await tx.caja.update({
          where: { id: caja.id },
          data: {
            estado: "cerrada",
            saldoFinal,
            diferencia,
            diferenciaJustif: data.diferenciaJustif,
            observaciones: data.observaciones,
            arqueoEfectivo:      data.arqueoEfectivo,
            arqueoTarjeta:       data.arqueoTarjeta,
            arqueoTransferencia: data.arqueoTransferencia,
            arqueoQR:            data.arqueoQR,
            arqueoCheque:        data.arqueoCheque,
            cerradoPor:          ctx.auth.userId,
          },
        })
      }

      // 2. Cerrar la JornadaFiscal con todos los totales
      const jornadaCerrada = await tx.jornadaFiscal.update({
        where: { id: jornada.id },
        data: {
          estado:             "cerrada_z",
          fechaCierre:        new Date(),
          cerradoPor:         ctx.auth.userId,
          observaciones:      data.observaciones,
          totalVentas:        snapshot.totalVentas,
          totalNeto:          snapshot.iva.totalNeto,
          totalIva21:         snapshot.iva.iva21,
          totalIva105:        snapshot.iva.iva105,
          totalIva27:         snapshot.iva.iva27,
          totalIvaExento:     snapshot.iva.netoExento,
          totalIvaNoGravado:  snapshot.iva.netoNoGravado,
          totalEfectivo:      snapshot.pagos.efectivo,
          totalTarjeta:       snapshot.pagos.tarjeta,
          totalTransferencia: snapshot.pagos.transferencia,
          totalQR:            snapshot.pagos.qr,
          totalCheque:        snapshot.pagos.cheque,
          totalCtaCte:        snapshot.pagos.ctaCte,
          cantidadFacturas:   snapshot.cantidadFacturas,
          cantidadTickets:    snapshot.cantidadTickets,
          primerNumFactura:   snapshot.primerNumFactura,
          ultimoNumFactura:   snapshot.ultimoNumFactura,
        },
      })

      // 3. Guardar CierreX final como snapshot del Z
      await tx.cierreX.create({
        data: {
          numeroCierreX:     0, // 0 = snapshot del Z
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
          cajaId:            cajaParaSnapshot.id,
          empresaId,
          generadoPor:       ctx.auth.userId,
        },
      })

      return jornadaCerrada
    })

    return NextResponse.json({
      ok: true,
      mensaje: `Cierre Z N° ${resultado.numeroZ} ejecutado correctamente.`,
      jornada: {
        id: resultado.id,
        numeroZ: resultado.numeroZ,
        fecha: resultado.fecha,
        totalVentas: resultado.totalVentas,
        cantidadFacturas: resultado.cantidadFacturas,
      },
      snapshot,
    }, { status: 200 })

  } catch (error: any) {
    console.error("Error en POST /api/pos/cierre-z:", error)
    return NextResponse.json({ error: error?.message ?? "Error interno al ejecutar Cierre Z" }, { status: 500 })
  }
}
