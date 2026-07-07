import { prisma } from "@/lib/prisma"
import { periodoFiscalService } from "@/lib/contabilidad/periodo-fiscal-service"
import { getCuentaLabel } from "@/lib/config/parametro-service"
import { buildMovimientosConCentro } from "@/lib/contabilidad/movimiento-builder"

export interface TransferenciaInput {
  empresaId: number
  cuentaOrigenId: number
  cuentaDestinoId: number
  importe: number
  fecha?: Date
  descripcion?: string
  referencia?: string
}

async function nextNumeroAsiento(empresaId: number): Promise<number> {
  const ultimo = await prisma.asientoContable.findFirst({
    where: { empresaId },
    orderBy: { numero: "desc" },
    select: { numero: true },
  })
  return (ultimo?.numero ?? 0) + 1
}

export class TransferenciasService {
  async transferir(input: TransferenciaInput) {
    const { empresaId, cuentaOrigenId, cuentaDestinoId, importe, fecha, descripcion, referencia } = input

    if (cuentaOrigenId === cuentaDestinoId) {
      throw new Error("La cuenta origen y destino no pueden ser iguales")
    }
    if (importe <= 0) {
      throw new Error("El importe debe ser positivo")
    }

    const cuentas = await prisma.cuentaBancaria.findMany({
      where: { id: { in: [cuentaOrigenId, cuentaDestinoId] } },
      select: { id: true, alias: true, cbu: true, empresaId: true },
    })

    const origen = cuentas.find((c) => c.id === cuentaOrigenId)
    const destino = cuentas.find((c) => c.id === cuentaDestinoId)

    if (!origen || !destino) {
      throw new Error("Cuenta bancaria no encontrada")
    }
    if (origen.empresaId !== empresaId || destino.empresaId !== empresaId) {
      throw new Error("Cuenta bancaria fuera de la empresa")
    }

    const ref = referencia ?? `TRF-${Date.now()}`
    const fechaMov = fecha ?? new Date()
    await periodoFiscalService.validarPeriodoAbierto(fechaMov, empresaId)

    const descripcionBase = descripcion?.trim() || "Transferencia entre cuentas"
    const origenLabel = origen.alias ?? origen.cbu ?? String(origen.id)
    const destinoLabel = destino.alias ?? destino.cbu ?? String(destino.id)

    const [ctaBanco] = await Promise.all([
      getCuentaLabel(empresaId, "transferencia", "banco", "1.2", "Banco Cuenta Corriente"),
    ])

    const result = await prisma.$transaction(async (tx) => {
      const debito = await tx.movimientoBancario.create({
        data: {
          cuentaBancariaId: cuentaOrigenId,
          fecha: fechaMov,
          tipo: "debito",
          importe,
          descripcion: `${descripcionBase} → ${destinoLabel}`,
          referencia: ref,
        },
      })

      const credito = await tx.movimientoBancario.create({
        data: {
          cuentaBancariaId: cuentaDestinoId,
          fecha: fechaMov,
          tipo: "credito",
          importe,
          descripcion: `${descripcionBase} ← ${origenLabel}`,
          referencia: ref,
        },
      })

      const numero = await nextNumeroAsiento(empresaId)
      const movimientos = await buildMovimientosConCentro(empresaId, [
        { cuentaLabel: ctaBanco, debe: importe, haber: 0 },
        { cuentaLabel: ctaBanco, debe: 0, haber: importe },
      ])

      const asiento = await tx.asientoContable.create({
        data: {
          empresaId,
          fecha: fechaMov,
          numero,
          descripcion: `${descripcionBase} (${origenLabel} → ${destinoLabel})`,
          tipo: "transferencia",
          movimientos: { create: movimientos },
        },
      })

      return { debitoId: debito.id, creditoId: credito.id, asientoId: asiento.id }
    })

    return {
      referencia: ref,
      importe,
      fecha: fechaMov,
      ...result,
    }
  }
}

export const transferenciasService = new TransferenciasService()