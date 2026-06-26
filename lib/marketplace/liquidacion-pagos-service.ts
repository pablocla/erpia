/**
 * Conciliador de liquidaciones MP / tarjetas vs ventas POS.
 */
import { prisma } from "@/lib/prisma"

export interface LiquidacionDiscrepancia {
  referencia: string
  montoPos: number
  montoLiquidado: number
  diferencia: number
  medio: string
}

export interface LiquidacionResumen {
  periodoDesde: string
  ventasQrTarjeta: number
  liquidadoMp: number
  diferencia: number
  discrepancias: LiquidacionDiscrepancia[]
  alerta: boolean
}

export async function conciliarLiquidacionPagos(
  empresaId: number,
  dias = 7,
): Promise<LiquidacionResumen> {
  const desde = new Date()
  desde.setDate(desde.getDate() - dias)
  desde.setHours(0, 0, 0, 0)

  const movimientos = await prisma.movimientoCaja.findMany({
    where: {
      tipo: "ingreso",
      createdAt: { gte: desde },
      medioPago: { in: ["qr", "tarjeta_debito", "tarjeta_credito"] },
      caja: { empresaId },
    },
    select: { referencia: true, monto: true, medioPago: true },
  })

  const transacciones = await prisma.mercadoPagoTransaccion.findMany({
    where: {
      empresaId,
      estado: "approved",
      createdAt: { gte: desde },
    },
    select: { monto: true, mpPaymentId: true, conciliado: true },
  })

  const montoPos = movimientos.reduce((s, m) => s + Number(m.monto), 0)
  const liquidadoMp = transacciones.reduce((s, t) => s + Number(t.monto), 0)
  const diferencia = Math.round((montoPos - liquidadoMp) * 100) / 100

  const discrepancias: LiquidacionDiscrepancia[] = []
  if (Math.abs(diferencia) > 100) {
    discrepancias.push({
      referencia: "TOTAL_PERIODO",
      montoPos,
      montoLiquidado: liquidadoMp,
      diferencia,
      medio: "qr+tarjeta vs MP",
    })
  }

  const noConciliados = transacciones.filter((t) => !t.conciliado).length
  if (noConciliados > 0) {
    discrepancias.push({
      referencia: "MP_SIN_CONCILIAR",
      montoPos: 0,
      montoLiquidado: noConciliados,
      diferencia: noConciliados,
      medio: "mercadopago",
    })
  }

  return {
    periodoDesde: desde.toISOString().slice(0, 10),
    ventasQrTarjeta: montoPos,
    liquidadoMp,
    diferencia,
    discrepancias,
    alerta: Math.abs(diferencia) > 500 || noConciliados > 2,
  }
}