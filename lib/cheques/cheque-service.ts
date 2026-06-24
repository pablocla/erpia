/**
 * Cheque Service — Circuito integrado tesorería ↔ contabilidad ↔ CC/CP
 *
 * Flujos:
 *  - Cobro con cheque: crea Cheque en cartera + asiento a 1.1.5
 *  - Pago con cheque propio: crea Cheque emitido + asiento a 2.8
 *  - Depósito: mueve a banco + MovimientoBancario + asiento
 *  - Rechazo: re-débito CC cliente + asiento de reversa
 */

import { prisma } from "@/lib/prisma"
import { eventBus } from "@/lib/events/event-bus"
import { getCuentaLabel } from "@/lib/config/parametro-service"
import { periodoFiscalService } from "@/lib/contabilidad/periodo-fiscal-service"
import type { PrismaClient } from "@prisma/client"
import type { ChequeRechazadoPayload, ChequeDepositadoPayload } from "@/lib/events/types"

type TxClient = Omit<PrismaClient, "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends">

export interface ChequeInput {
  numero: string
  monto?: number
  fechaEmision: Date | string
  fechaVencimiento: Date | string
  cuitBancoLibrador?: string
  bancoNombre?: string
  cuentaEmisorId?: number
  observaciones?: string
}

export const TRANSICIONES_CHEQUE: Record<string, string[]> = {
  cartera: ["depositado", "endosado", "anulado"],
  depositado: ["debitado", "rechazado"],
  endosado: ["rechazado"],
  rechazado: ["cartera"],
  debitado: [],
  anulado: [],
}

async function resolveTipoAsientoId(codigo: string, empresaId: number, tx: TxClient = prisma): Promise<number | undefined> {
  const tipo = await tx.tipoAsiento.findFirst({ where: { empresaId, codigo, activo: true } })
  return tipo?.id ?? undefined
}

async function nextNumeroAsiento(tx: TxClient, empresaId: number): Promise<number> {
  const ultimo = await tx.asientoContable.findFirst({
    where: { empresaId },
    orderBy: { numero: "desc" },
  })
  return (ultimo?.numero ?? 0) + 1
}

function parseDate(value: Date | string): Date {
  return value instanceof Date ? value : new Date(value)
}

export class ChequeService {
  /**
   * Crea cheque de tercero vinculado a un recibo de cobranza.
   */
  async crearDesdeCobro(
    tx: TxClient,
    input: {
      reciboId: number
      clienteId: number
      cheque: ChequeInput
      montoDefault: number
    }
  ) {
    const monto = input.cheque.monto ?? input.montoDefault
    return tx.cheque.create({
      data: {
        numero: input.cheque.numero,
        tipoCheque: "tercero",
        monto,
        fechaEmision: parseDate(input.cheque.fechaEmision),
        fechaVencimiento: parseDate(input.cheque.fechaVencimiento),
        cuitBancoLibrador: input.cheque.cuitBancoLibrador,
        bancoNombre: input.cheque.bancoNombre,
        estado: "cartera",
        observaciones: input.cheque.observaciones,
        clienteId: input.clienteId,
        reciboId: input.reciboId,
      },
    })
  }

  /**
   * Crea cheque propio vinculado a una orden de pago.
   */
  async crearDesdePago(
    tx: TxClient,
    input: {
      ordenPagoId: number
      proveedorId: number
      cheque: ChequeInput
      montoDefault: number
    }
  ) {
    const monto = input.cheque.monto ?? input.montoDefault
    return tx.cheque.create({
      data: {
        numero: input.cheque.numero,
        tipoCheque: "propio",
        monto,
        fechaEmision: parseDate(input.cheque.fechaEmision),
        fechaVencimiento: parseDate(input.cheque.fechaVencimiento),
        cuitBancoLibrador: input.cheque.cuitBancoLibrador,
        bancoNombre: input.cheque.bancoNombre,
        estado: "cartera",
        observaciones: input.cheque.observaciones,
        proveedorId: input.proveedorId,
        ordenPagoId: input.ordenPagoId,
        cuentaEmisorId: input.cheque.cuentaEmisorId ?? null,
      },
    })
  }

  /**
   * Deposita un cheque de tercero: asiento + movimiento bancario.
   */
  async depositar(chequeId: number, cuentaDepositoId: number, empresaId: number, fecha?: Date) {
    const cheque = await prisma.cheque.findFirst({
      where: {
        id: chequeId,
        tipoCheque: "tercero",
        OR: [
          { cliente: { empresaId } },
          { recibo: { cliente: { empresaId } } },
        ],
      },
      include: { cliente: true, recibo: true },
    })

    if (!cheque) throw new Error("Cheque no encontrado")
    if (cheque.estado !== "cartera") {
      throw new Error(`Solo se pueden depositar cheques en cartera (estado actual: ${cheque.estado})`)
    }

    const cuenta = await prisma.cuentaBancaria.findFirst({
      where: { id: cuentaDepositoId, empresaId },
    })
    if (!cuenta) throw new Error("Cuenta bancaria de depósito no encontrada")

    const fechaOp = fecha ?? new Date()
    await periodoFiscalService.validarPeriodoAbierto(fechaOp, empresaId)
    const monto = Number(cheque.monto)

    const [ctaBanco, ctaCartera] = await Promise.all([
      getCuentaLabel(empresaId, "cobro", "banco", "1.2", "Banco Cuenta Corriente"),
      getCuentaLabel(empresaId, "cobro", "cheques_cartera", "1.1.5", "Cheques en Cartera"),
    ])

    const actualizado = await prisma.$transaction(async (tx) => {
      const ch = await tx.cheque.update({
        where: { id: chequeId },
        data: { estado: "depositado", cuentaDepositoId, updatedAt: new Date() },
      })

      await tx.movimientoBancario.create({
        data: {
          fecha: fechaOp,
          tipo: "credito",
          importe: monto,
          descripcion: `Depósito cheque N° ${cheque.numero}`,
          referencia: `CHQ-${cheque.numero}`,
          cuentaBancariaId: cuentaDepositoId,
          estado: "pendiente",
        },
      })

      const numeroAsiento = await nextNumeroAsiento(tx, empresaId)
      await tx.asientoContable.create({
        data: {
          fecha: fechaOp,
          numero: numeroAsiento,
          descripcion: `Depósito cheque N° ${cheque.numero} - ${cheque.cliente?.nombre ?? "Cliente"}`,
          tipo: "cheque_deposito",
          tipoAsientoId: await resolveTipoAsientoId("COBRO", empresaId, tx),
          empresaId,
          movimientos: {
            create: [
              { cuenta: ctaBanco, debe: monto, haber: 0 },
              { cuenta: ctaCartera, debe: 0, haber: monto },
            ],
          },
        },
      })

      return ch
    })

    await eventBus.emit<ChequeDepositadoPayload>({
      type: "CHEQUE_DEPOSITADO",
      payload: { chequeId: actualizado.id, monto, cuentaDepositoId },
      timestamp: new Date(),
      empresaId,
    })

    return { ...actualizado, monto: Number(actualizado.monto) }
  }

  /**
   * Marca cheque rechazado y re-débita la cuenta corriente del cliente.
   */
  async rechazar(chequeId: number, empresaId: number, observaciones?: string) {
    const cheque = await prisma.cheque.findFirst({
      where: {
        id: chequeId,
        tipoCheque: "tercero",
        OR: [
          { cliente: { empresaId } },
          { recibo: { cliente: { empresaId } } },
        ],
      },
      include: {
        cliente: true,
        recibo: { include: { items: true } },
      },
    })

    if (!cheque) throw new Error("Cheque no encontrado")
    const permitidos = TRANSICIONES_CHEQUE[cheque.estado] ?? []
    if (!permitidos.includes("rechazado")) {
      throw new Error(`No se puede rechazar un cheque en estado '${cheque.estado}'`)
    }

    const clienteId = cheque.clienteId ?? cheque.recibo?.clienteId
    if (!clienteId) throw new Error("Cheque sin cliente asociado")

    const monto = Number(cheque.monto)
    const estadoAnterior = cheque.estado
    const fechaOp = new Date()
    await periodoFiscalService.validarPeriodoAbierto(fechaOp, empresaId)

    const [ctaDeudores, ctaCartera, ctaBanco] = await Promise.all([
      getCuentaLabel(empresaId, "cobro", "deudores", "1.3", "Deudores por Ventas"),
      getCuentaLabel(empresaId, "cobro", "cheques_cartera", "1.1.5", "Cheques en Cartera"),
      getCuentaLabel(empresaId, "cobro", "banco", "1.2", "Banco Cuenta Corriente"),
    ])

    const cuentaHaber = estadoAnterior === "depositado" ? ctaBanco : ctaCartera

    const result = await prisma.$transaction(async (tx) => {
      const ch = await tx.cheque.update({
        where: { id: chequeId },
        data: {
          estado: "rechazado",
          observaciones: observaciones
            ? `${cheque.observaciones ?? ""}\n[Rechazado: ${observaciones}]`.trim()
            : cheque.observaciones,
          updatedAt: new Date(),
        },
      })

      // Re-débito en cuenta corriente: nueva CC por cheque rechazado
      const cc = await tx.cuentaCobrar.create({
        data: {
          clienteId,
          numeroCuota: 1,
          montoOriginal: monto,
          saldo: monto,
          fechaEmision: fechaOp,
          fechaVencimiento: fechaOp,
          estado: "pendiente",
          observaciones: `Cheque rechazado N° ${cheque.numero}`,
        },
      })

      const numeroAsiento = await nextNumeroAsiento(tx, empresaId)
      await tx.asientoContable.create({
        data: {
          fecha: fechaOp,
          numero: numeroAsiento,
          descripcion: `Cheque rechazado N° ${cheque.numero} - ${cheque.cliente?.nombre ?? clienteId}`,
          tipo: "cheque_rechazado",
          tipoAsientoId: await resolveTipoAsientoId("COBRO", empresaId, tx),
          empresaId,
          movimientos: {
            create: [
              { cuenta: ctaDeudores, debe: monto, haber: 0 },
              { cuenta: cuentaHaber, debe: 0, haber: monto },
            ],
          },
        },
      })

      return { cheque: ch, cuentaCobrarId: cc.id }
    })

    await eventBus.emit<ChequeRechazadoPayload>({
      type: "CHEQUE_RECHAZADO",
      payload: {
        chequeId: result.cheque.id,
        monto,
        clienteId,
        cuentaCobrarId: result.cuentaCobrarId,
      },
      timestamp: new Date(),
      empresaId,
    })

    return { ...result.cheque, monto: Number(result.cheque.monto), cuentaCobrarId: result.cuentaCobrarId }
  }

  /**
   * Debita cheque propio emitido (pago a proveedor).
   */
  async debitarPropio(chequeId: number, empresaId: number, fecha?: Date) {
    const cheque = await prisma.cheque.findFirst({
      where: {
        id: chequeId,
        tipoCheque: "propio",
        OR: [
          { proveedor: { empresaId } },
          { ordenPago: { proveedor: { empresaId } } },
        ],
      },
      include: { proveedor: true },
    })

    if (!cheque) throw new Error("Cheque propio no encontrado")
    if (cheque.estado !== "cartera") {
      throw new Error(`Solo se pueden debitar cheques propios en cartera (estado: ${cheque.estado})`)
    }

    const monto = Number(cheque.monto)
    const fechaOp = fecha ?? new Date()
    await periodoFiscalService.validarPeriodoAbierto(fechaOp, empresaId)

    const [ctaBanco, ctaChequesPagar] = await Promise.all([
      getCuentaLabel(empresaId, "pago", "banco", "1.2", "Banco Cuenta Corriente"),
      getCuentaLabel(empresaId, "pago", "cheques_a_pagar", "2.8", "Cheques a Pagar"),
    ])

    const actualizado = await prisma.$transaction(async (tx) => {
      const ch = await tx.cheque.update({
        where: { id: chequeId },
        data: { estado: "debitado", updatedAt: new Date() },
      })

      if (cheque.cuentaEmisorId) {
        await tx.movimientoBancario.create({
          data: {
            fecha: fechaOp,
            tipo: "debito",
            importe: monto,
            descripcion: `Débito cheque propio N° ${cheque.numero}`,
            referencia: `CHQ-P-${cheque.numero}`,
            cuentaBancariaId: cheque.cuentaEmisorId,
            estado: "pendiente",
          },
        })
      }

      const numeroAsiento = await nextNumeroAsiento(tx, empresaId)
      await tx.asientoContable.create({
        data: {
          fecha: fechaOp,
          numero: numeroAsiento,
          descripcion: `Débito cheque propio N° ${cheque.numero} - ${cheque.proveedor?.nombre ?? "Proveedor"}`,
          tipo: "cheque_debito",
          tipoAsientoId: await resolveTipoAsientoId("PAGO", empresaId, tx),
          empresaId,
          movimientos: {
            create: [
              { cuenta: ctaChequesPagar, debe: monto, haber: 0 },
              { cuenta: ctaBanco, debe: 0, haber: monto },
            ],
          },
        },
      })

      return ch
    })

    return { ...actualizado, monto: Number(actualizado.monto) }
  }

  validarTransicion(estadoActual: string, estadoNuevo: string): boolean {
    return (TRANSICIONES_CHEQUE[estadoActual] ?? []).includes(estadoNuevo)
  }
}

export const chequeService = new ChequeService()