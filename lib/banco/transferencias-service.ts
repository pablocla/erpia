import { prisma } from "@/lib/prisma"

export interface TransferenciaInput {
  empresaId: number
  cuentaOrigenId: number
  cuentaDestinoId: number
  importe: number
  fecha?: Date
  descripcion?: string
  referencia?: string
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
    const descripcionBase = descripcion?.trim() || "Transferencia entre cuentas"
    const origenLabel = origen.alias ?? origen.cbu ?? String(origen.id)
    const destinoLabel = destino.alias ?? destino.cbu ?? String(destino.id)

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

      return { debitoId: debito.id, creditoId: credito.id }
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
