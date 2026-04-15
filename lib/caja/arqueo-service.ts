/**
 * Arqueo de Caja — Service
 *
 * Reconciliación de caja: compara montos declarados por el cajero
 * contra movimientos del sistema para detectar diferencias.
 */

import { prisma } from "@/lib/prisma"

interface DatosArqueo {
  efectivoDeclarado: number
  tarjetaDeclarado: number
  transferenciaDeclarado: number
  chequeDeclarado: number
  qrDeclarado: number
  justificacion?: string
}

export class ArqueoCajaService {
  /**
   * Perform a cash register reconciliation.
   * Sums system movements by medio de pago and compares with declared amounts.
   */
  async realizarArqueo(cajaId: number, empresaId: number, datos: DatosArqueo) {
    const caja = await prisma.caja.findUnique({
      where: { id: cajaId },
      include: { movimientos: true },
    })
    if (!caja) throw new Error("Caja no encontrada")

    // Aggregate system amounts by payment method
    const sistemaEfectivo = caja.movimientos
      .filter((m) => m.medioPago === "efectivo")
      .reduce((s, m) => s + m.monto, 0)
    const sistemaTarjeta = caja.movimientos
      .filter((m) => m.medioPago === "tarjeta")
      .reduce((s, m) => s + m.monto, 0)
    const sistemaTransferencia = caja.movimientos
      .filter((m) => m.medioPago === "transferencia")
      .reduce((s, m) => s + m.monto, 0)
    const sistemaCheque = caja.movimientos
      .filter((m) => m.medioPago === "cheque")
      .reduce((s, m) => s + m.monto, 0)
    const sistemaQR = caja.movimientos
      .filter((m) => m.medioPago === "qr")
      .reduce((s, m) => s + m.monto, 0)

    const totalDeclarado = datos.efectivoDeclarado + datos.tarjetaDeclarado +
      datos.transferenciaDeclarado + datos.chequeDeclarado + datos.qrDeclarado
    const totalSistema = sistemaEfectivo + sistemaTarjeta + sistemaTransferencia +
      sistemaCheque + sistemaQR
    const diferencia = totalDeclarado - totalSistema

    const arqueo = await prisma.arqueoCaja.create({
      data: {
        cajaId,
        empresaId,
        efectivoDeclarado: datos.efectivoDeclarado,
        tarjetaDeclarado: datos.tarjetaDeclarado,
        transferenciaDeclarado: datos.transferenciaDeclarado,
        chequeDeclarado: datos.chequeDeclarado,
        qrDeclarado: datos.qrDeclarado,
        efectivoSistema: sistemaEfectivo,
        tarjetaSistema: sistemaTarjeta,
        transferenciaSistema: sistemaTransferencia,
        chequeSistema: sistemaCheque,
        qrSistema: sistemaQR,
        diferencia,
        justificacion: datos.justificacion,
        estado: Math.abs(diferencia) < 0.01 ? "aprobado" : "con_diferencia",
      },
    })

    // Update Caja with arqueo fields
    await prisma.caja.update({
      where: { id: cajaId },
      data: {
        arqueoEfectivo: datos.efectivoDeclarado,
        arqueoTarjeta: datos.tarjetaDeclarado,
        arqueoTransferencia: datos.transferenciaDeclarado,
        arqueoCheque: datos.chequeDeclarado,
        arqueoQR: datos.qrDeclarado,
        diferencia,
        diferenciaJustif: datos.justificacion,
      },
    })

    return {
      id: arqueo.id,
      diferencia,
      estado: arqueo.estado,
      detalle: {
        efectivo: { declarado: datos.efectivoDeclarado, sistema: sistemaEfectivo, diferencia: datos.efectivoDeclarado - sistemaEfectivo },
        tarjeta: { declarado: datos.tarjetaDeclarado, sistema: sistemaTarjeta, diferencia: datos.tarjetaDeclarado - sistemaTarjeta },
        transferencia: { declarado: datos.transferenciaDeclarado, sistema: sistemaTransferencia, diferencia: datos.transferenciaDeclarado - sistemaTransferencia },
        cheque: { declarado: datos.chequeDeclarado, sistema: sistemaCheque, diferencia: datos.chequeDeclarado - sistemaCheque },
        qr: { declarado: datos.qrDeclarado, sistema: sistemaQR, diferencia: datos.qrDeclarado - sistemaQR },
      },
    }
  }

  /**
   * List arqueos for a caja
   */
  async listarPorCaja(cajaId: number) {
    return prisma.arqueoCaja.findMany({
      where: { cajaId },
      orderBy: { fecha: "desc" },
    })
  }
}

export const arqueoCajaService = new ArqueoCajaService()
