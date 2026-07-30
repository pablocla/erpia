/**
 * Putaway dirigido — sugiere bin y ejecuta guardado en ubicación.
 */

import { prisma } from "@/lib/prisma"
import { suggestPutawayBin } from "./fefo"
import { ajustarStockUbicacion } from "./stock-ubicacion-service"

function nextNumero(prefix: string) {
  return `${prefix}-${Date.now().toString(36).toUpperCase()}`
}

export async function sugerirBinPutaway(
  empresaId: number,
  depositoId: number,
  productoId: number,
) {
  const producto = await prisma.producto.findFirst({
    where: { id: productoId, empresaId },
    select: { id: true, ubicacionPreferidaId: true, ubicacionDeposito: true },
  })
  if (!producto) throw new Error("PRODUCTO_NO_ENCONTRADO")

  if (producto.ubicacionPreferidaId) {
    const pref = await prisma.ubicacionAlmacen.findFirst({
      where: { id: producto.ubicacionPreferidaId, empresaId, activo: true },
    })
    if (pref) return pref
  }

  if (producto.ubicacionDeposito) {
    const byCode = await prisma.ubicacionAlmacen.findFirst({
      where: {
        empresaId,
        depositoId,
        codigo: producto.ubicacionDeposito.trim().toUpperCase(),
        activo: true,
      },
    })
    if (byCode) return byCode
  }

  const bins = await prisma.ubicacionAlmacen.findMany({
    where: {
      empresaId,
      depositoId,
      activo: true,
      tipo: { in: ["pick", "bin", "bulk"] },
    },
    include: {
      stocks: { select: { cantidad: true } },
    },
  })

  const scored = bins.map((b) => ({
    id: b.id,
    codigo: b.codigo,
    tipo: b.tipo,
    ordenPath: b.ordenPath,
    ocupacion: b.stocks.reduce((s, x) => s + x.cantidad, 0),
    capacidad: b.capacidad,
  }))

  const id = suggestPutawayBin(null, scored)
  if (!id) return null
  return bins.find((b) => b.id === id) ?? null
}

export async function crearTareaPutaway(input: {
  empresaId: number
  depositoId: number
  productoId: number
  cantidad: number
  loteId?: number | null
  toUbicacionId?: number | null
  asnId?: number | null
  createdBy?: number
}) {
  const { empresaId, depositoId, productoId, cantidad } = input
  if (cantidad <= 0) throw new Error("CANTIDAD_INVALIDA")

  let toId = input.toUbicacionId ?? null
  if (!toId) {
    const sug = await sugerirBinPutaway(empresaId, depositoId, productoId)
    toId = sug?.id ?? null
  }
  if (!toId) throw new Error("SIN_UBICACION_PUTAWAY")

  const tarea = await prisma.tareaWms.create({
    data: {
      empresaId,
      depositoId,
      numero: nextNumero("PUT"),
      tipo: "putaway",
      estado: "pendiente",
      productoId,
      loteId: input.loteId ?? null,
      cantidadPedida: cantidad,
      toUbicacionId: toId,
      asnId: input.asnId ?? null,
      operarioId: input.createdBy ?? null,
    },
    include: {
      toUbicacion: true,
      producto: { select: { id: true, codigo: true, nombre: true } },
    },
  })

  return tarea
}

export async function completarPutaway(input: {
  empresaId: number
  tareaId: number
  cantidad?: number
  toUbicacionId?: number
  operarioNombre?: string
  createdBy?: number
}) {
  const tarea = await prisma.tareaWms.findFirst({
    where: { id: input.tareaId, empresaId: input.empresaId, tipo: "putaway" },
  })
  if (!tarea) throw new Error("TAREA_NO_ENCONTRADA")
  if (tarea.estado === "completada") throw new Error("TAREA_YA_COMPLETADA")
  if (!tarea.productoId) throw new Error("TAREA_SIN_PRODUCTO")

  const qty = input.cantidad ?? tarea.cantidadPedida
  const toUbicacionId = input.toUbicacionId ?? tarea.toUbicacionId
  if (!toUbicacionId) throw new Error("SIN_UBICACION_DESTINO")

  await ajustarStockUbicacion({
    empresaId: input.empresaId,
    depositoId: tarea.depositoId,
    ubicacionId: toUbicacionId,
    productoId: tarea.productoId,
    loteId: tarea.loteId,
    cantidadDelta: qty,
    tipo: "putaway",
    motivo: `Putaway ${tarea.numero}`,
    tareaWmsId: tarea.id,
    createdBy: input.createdBy,
    syncDeposito: true,
    toUbicacionId,
  })

  return prisma.tareaWms.update({
    where: { id: tarea.id },
    data: {
      estado: "completada",
      cantidadHecha: qty,
      toUbicacionId,
      operarioNombre: input.operarioNombre ?? tarea.operarioNombre,
      completedAt: new Date(),
    },
    include: {
      toUbicacion: true,
      producto: { select: { id: true, codigo: true, nombre: true } },
    },
  })
}

/** Recepción ASN → crea tareas putaway por línea recibida */
export async function putawayDesdeRecepcionAsn(input: {
  empresaId: number
  asnId: number
  lineas: Array<{ lineaAsnId: number; cantidadRecibida: number; loteId?: number | null }>
}) {
  const asn = await prisma.asnRecepcion.findFirst({
    where: { id: input.asnId, empresaId: input.empresaId },
    include: { lineas: true },
  })
  if (!asn) throw new Error("ASN_NO_ENCONTRADO")

  const tareas = []
  for (const item of input.lineas) {
    const linea = asn.lineas.find((l) => l.id === item.lineaAsnId)
    if (!linea?.productoId || item.cantidadRecibida <= 0) continue

    const recibida = linea.cantidadRecibida + item.cantidadRecibida
    let estado = "parcial"
    if (recibida >= linea.cantidadEsperada) estado = "completo"
    if (recibida > linea.cantidadEsperada) estado = "excedente"

    await prisma.lineaAsn.update({
      where: { id: linea.id },
      data: {
        cantidadRecibida: recibida,
        estado,
        loteId: item.loteId ?? linea.loteId,
      },
    })

    const tarea = await crearTareaPutaway({
      empresaId: input.empresaId,
      depositoId: asn.depositoId,
      productoId: linea.productoId,
      cantidad: item.cantidadRecibida,
      loteId: item.loteId ?? linea.loteId,
      asnId: asn.id,
    })
    tareas.push(tarea)
  }

  await prisma.asnRecepcion.update({
    where: { id: asn.id },
    data: { estado: "en_recepcion" },
  })

  return { tareas }
}
