import { createHash } from "crypto"
import { prisma } from "@/lib/prisma"

export type TipoDeclaracion = "IVA" | "IIBB" | "SICORE" | "CONVENIO_MULTILATERAL" | "SIRE"

export function periodoKey(mes: number, anio: number): string {
  return `${anio}${String(mes).padStart(2, "0")}`
}

export function hashDetalle(data: unknown): string {
  return createHash("sha256").update(JSON.stringify(data)).digest("hex")
}

export async function persistirDeclaracion(params: {
  empresaId: number
  tipo: TipoDeclaracion
  mes: number
  anio: number
  jurisdiccion?: string | null
  detalle: Record<string, unknown>
  montoTotal: number
  montoAPagar?: number
  saldoFavorAnterior?: number
}) {
  const periodo = periodoKey(params.mes, params.anio)
  const hash = hashDetalle(params.detalle)
  const montoAPagar = params.montoAPagar ?? Math.max(0, params.montoTotal)

  const existing = await prisma.declaracionJurada.findFirst({
    where: {
      empresaId: params.empresaId,
      tipo: params.tipo,
      periodo,
      jurisdiccion: params.jurisdiccion ?? null,
      nroRectificativa: 0,
    },
  })

  if (existing) {
    return prisma.declaracionJurada.update({
      where: { id: existing.id },
      data: {
        estado: "generada",
        montoTotal: params.montoTotal,
        montoAPagar,
        saldoFavorAnterior: params.saldoFavorAnterior ?? 0,
        hashContenido: hash,
        observaciones: JSON.stringify(params.detalle),
      },
    })
  }

  return prisma.declaracionJurada.create({
    data: {
      empresaId: params.empresaId,
      tipo: params.tipo,
      periodo,
      jurisdiccion: params.jurisdiccion ?? null,
      estado: "generada",
      montoTotal: params.montoTotal,
      montoAPagar,
      saldoFavorAnterior: params.saldoFavorAnterior ?? 0,
      hashContenido: hash,
      observaciones: JSON.stringify(params.detalle),
    },
  })
}

export async function obtenerDeclaracion(
  empresaId: number,
  tipo: TipoDeclaracion,
  mes: number,
  anio: number,
  jurisdiccion?: string | null,
) {
  const periodo = periodoKey(mes, anio)
  return prisma.declaracionJurada.findFirst({
    where: {
      empresaId,
      tipo,
      periodo,
      jurisdiccion: jurisdiccion ?? null,
      nroRectificativa: 0,
    },
  })
}