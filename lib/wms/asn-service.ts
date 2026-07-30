/**
 * ASN — Advanced Shipping Notice + recepción (ciega opcional)
 */

import { prisma } from "@/lib/prisma"
import { putawayDesdeRecepcionAsn } from "./putaway-service"

function nextNumero(prefix: string) {
  return `${prefix}-${Date.now().toString(36).toUpperCase()}`
}

export async function listarAsn(empresaId: number, estado?: string) {
  return prisma.asnRecepcion.findMany({
    where: { empresaId, ...(estado ? { estado } : {}) },
    include: {
      lineas: {
        include: {
          producto: { select: { id: true, codigo: true, nombre: true } },
        },
      },
      deposito: { select: { id: true, codigo: true, nombre: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  })
}

export async function crearAsn(input: {
  empresaId: number
  depositoId: number
  ordenCompraId?: number | null
  proveedorId?: number | null
  eta?: string | null
  recepcionCiega?: boolean
  notas?: string
  lineas: Array<{
    productoId?: number | null
    descripcion: string
    cantidadEsperada: number
    loteId?: number | null
  }>
}) {
  if (!input.lineas.length) throw new Error("ASN_SIN_LINEAS")

  return prisma.asnRecepcion.create({
    data: {
      empresaId: input.empresaId,
      depositoId: input.depositoId,
      numero: nextNumero("ASN"),
      ordenCompraId: input.ordenCompraId ?? null,
      proveedorId: input.proveedorId ?? null,
      eta: input.eta ? new Date(input.eta) : null,
      recepcionCiega: input.recepcionCiega ?? false,
      notas: input.notas ?? null,
      estado: "esperada",
      lineas: {
        create: input.lineas.map((l) => ({
          productoId: l.productoId ?? null,
          descripcion: l.descripcion,
          cantidadEsperada: l.cantidadEsperada,
          loteId: l.loteId ?? null,
        })),
      },
    },
    include: { lineas: true },
  })
}

export async function recibirAsn(input: {
  empresaId: number
  asnId: number
  lineas: Array<{ lineaAsnId: number; cantidadRecibida: number; loteId?: number | null }>
  autoPutaway?: boolean
}) {
  const result = await putawayDesdeRecepcionAsn({
    empresaId: input.empresaId,
    asnId: input.asnId,
    lineas: input.lineas,
  })

  if (input.autoPutaway !== false) {
    const { completarPutaway } = await import("./putaway-service")
    for (const t of result.tareas) {
      try {
        await completarPutaway({
          empresaId: input.empresaId,
          tareaId: t.id,
        })
      } catch {
        /* deja tarea pendiente si falla */
      }
    }
  }

  return prisma.asnRecepcion.findFirst({
    where: { id: input.asnId, empresaId: input.empresaId },
    include: { lineas: true, tareas: true },
  })
}

export async function cerrarAsn(empresaId: number, asnId: number) {
  const asn = await prisma.asnRecepcion.findFirst({
    where: { id: asnId, empresaId },
    include: { lineas: true },
  })
  if (!asn) throw new Error("ASN_NO_ENCONTRADO")

  for (const l of asn.lineas) {
    if (l.cantidadRecibida + 0.0001 < l.cantidadEsperada && l.estado !== "completo") {
      await prisma.lineaAsn.update({
        where: { id: l.id },
        data: {
          estado: l.cantidadRecibida > 0 ? "faltante" : "faltante",
        },
      })
    }
  }

  return prisma.asnRecepcion.update({
    where: { id: asnId },
    data: { estado: "cerrada", closedAt: new Date() },
    include: { lineas: true },
  })
}

/** Vista RF: oculta cantidades esperadas si recepción ciega */
export function vistaRecepcionRf(asn: {
  recepcionCiega: boolean
  lineas: Array<Record<string, unknown> & { cantidadEsperada: number }>
}) {
  if (!asn.recepcionCiega) return asn
  return {
    ...asn,
    lineas: asn.lineas.map((l) => {
      const { cantidadEsperada: _c, ...rest } = l
      return { ...rest, cantidadEsperada: null as number | null }
    }),
  }
}
