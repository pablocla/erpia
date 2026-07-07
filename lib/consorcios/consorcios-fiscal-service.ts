/**
 * Sprint 5 — Emisión fiscal de expensas vía numeración interna coherente.
 * Complementa ConsorciosService.liquidarExpensas cuando emitirFactura=true.
 */

import { prisma } from "@/lib/prisma"

export async function asignarNumeroInternoExpensa(
  facturaId: number,
  empresaId: number,
  puntoVenta: number,
): Promise<number> {
  const ultima = await prisma.factura.findFirst({
    where: {
      empresaId,
      puntoVenta,
      tipoCbte: 6,
      numero: { gt: 0 },
    },
    orderBy: { numero: "desc" },
    select: { numero: true },
  })

  const numero = (ultima?.numero ?? 0) + 1

  await prisma.factura.update({
    where: { id: facturaId },
    data: {
      numero,
      estado: "pendiente_cae",
      observaciones: `Expensa interna PV ${puntoVenta} — pendiente AFIP`,
    },
  })

  return numero
}

export async function marcarExpensasListasAfip(empresaId: number, periodo: string): Promise<number> {
  const expensas = await prisma.consorcioExpensa.findMany({
    where: {
      periodo,
      unidad: { consorcio: { empresaId } },
      facturaId: { not: null },
    },
    include: {
      factura: true,
      unidad: { include: { consorcio: true } },
    },
  })

  let actualizadas = 0
  const pv = expensas[0]?.unidad.consorcio.empresaId
    ? (
        await prisma.empresa.findUnique({
          where: { id: empresaId },
          select: { puntoVenta: true },
        })
      )?.puntoVenta ?? 1
    : 1

  for (const exp of expensas) {
    if (!exp.factura || exp.factura.numero > 0) continue
    await asignarNumeroInternoExpensa(exp.factura.id, empresaId, pv)
    actualizadas++
  }

  return actualizadas
}