/**
 * Picking dirigido + FEFO — integra con ListaPicking existente.
 */

import { prisma } from "@/lib/prisma"
import { allocateFefo } from "./fefo"
import { ajustarStockUbicacion, candidatesParaPick } from "./stock-ubicacion-service"

function nextNumero(prefix: string) {
  return `${prefix}-${Date.now().toString(36).toUpperCase()}`
}

/**
 * Genera lista de picking con bins FEFO y orden de path.
 * Si no hay stock por ubicación, cae a picking ERP clásico (ubicacion null).
 */
export async function generarPickingDirigido(empresaId: number, pedidoVentaId: number, depositoId?: number) {
  const pedido = await prisma.pedidoVenta.findFirst({
    where: { id: pedidoVentaId, empresaId },
    include: { lineas: { include: { producto: true } } },
  })
  if (!pedido) throw new Error("PEDIDO_NO_ENCONTRADO")

  let depId = depositoId
  if (!depId) {
    const dep = await prisma.deposito.findFirst({
      where: { empresaId, activo: true, tipo: "principal" },
      orderBy: { id: "asc" },
    })
    depId = dep?.id
  }
  if (!depId) {
    const any = await prisma.deposito.findFirst({ where: { empresaId, activo: true } })
    depId = any?.id
  }

  type LineaCreate = {
    productoId: number | null
    descripcion: string
    cantidadPedida: number
    cantidadPicada: number
    ubicacion: string | null
    ubicacionId: number | null
    loteId: number | null
    ordenPath: number
    estado: string
  }

  const lineasCreate: LineaCreate[] = []
  let pathCounter = 0

  for (const l of pedido.lineas) {
    const desc = l.descripcion ?? l.producto?.nombre ?? "Ítem"
    const qty = Number(l.cantidad)
    if (!l.productoId || !depId) {
      lineasCreate.push({
        productoId: l.productoId,
        descripcion: desc,
        cantidadPedida: qty,
        cantidadPicada: 0,
        ubicacion: l.producto?.ubicacionDeposito ?? null,
        ubicacionId: null,
        loteId: null,
        ordenPath: pathCounter++,
        estado: "pendiente",
      })
      continue
    }

    const candidates = await candidatesParaPick(empresaId, depId, l.productoId)
    const { allocations, shortfall } = allocateFefo(candidates, qty)

    if (allocations.length === 0) {
      lineasCreate.push({
        productoId: l.productoId,
        descripcion: desc + (shortfall > 0 ? " [sin bin]" : ""),
        cantidadPedida: qty,
        cantidadPicada: 0,
        ubicacion: l.producto?.ubicacionDeposito ?? null,
        ubicacionId: null,
        loteId: null,
        ordenPath: pathCounter++,
        estado: "pendiente",
      })
      continue
    }

    for (const a of allocations) {
      lineasCreate.push({
        productoId: l.productoId,
        descripcion: desc,
        cantidadPedida: a.cantidad,
        cantidadPicada: 0,
        ubicacion: a.codigoUbicacion,
        ubicacionId: a.ubicacionId,
        loteId: a.loteId,
        ordenPath: a.ordenPath,
        estado: "pendiente",
      })
    }
    if (shortfall > 0) {
      lineasCreate.push({
        productoId: l.productoId,
        descripcion: `${desc} [faltante ${shortfall}]`,
        cantidadPedida: shortfall,
        cantidadPicada: 0,
        ubicacion: null,
        ubicacionId: null,
        loteId: null,
        ordenPath: 9999,
        estado: "pendiente",
      })
    }
  }

  lineasCreate.sort((a, b) => a.ordenPath - b.ordenPath)

  const lista = await prisma.listaPicking.create({
    data: {
      empresaId,
      pedidoVentaId,
      numero: nextNumero("PK"),
      estado: "pendiente",
      zonaAlmacen: depId ? `DEP-${depId}` : null,
      lineas: { create: lineasCreate },
    },
    include: {
      lineas: {
        include: {
          producto: { select: { id: true, codigo: true, nombre: true } },
          ubicacionRef: { select: { id: true, codigo: true } },
          lote: { select: { id: true, numeroLote: true, fechaVencimiento: true } },
        },
        orderBy: { ordenPath: "asc" },
      },
    },
  })

  // Tareas WMS pick por línea con bin
  if (depId) {
    for (const linea of lista.lineas) {
      if (!linea.ubicacionId || !linea.productoId) continue
      await prisma.tareaWms.create({
        data: {
          empresaId,
          depositoId: depId,
          numero: nextNumero("PCK"),
          tipo: "pick",
          estado: "pendiente",
          productoId: linea.productoId,
          loteId: linea.loteId,
          cantidadPedida: linea.cantidadPedida,
          fromUbicacionId: linea.ubicacionId,
          listaPickingId: lista.id,
          pedidoVentaId,
          ordenPath: linea.ordenPath,
        },
      })
    }
  }

  return lista
}

/**
 * Confirma picado de una línea: descuenta stock de bin (FEFO ya asignado).
 */
export async function confirmarPickLinea(input: {
  empresaId: number
  lineaId: number
  cantidadPicada: number
  operarioNombre?: string
  createdBy?: number
}) {
  const linea = await prisma.lineaPicking.findFirst({
    where: { id: input.lineaId },
    include: {
      lista: true,
      producto: true,
      ubicacionRef: true,
    },
  })
  if (!linea || linea.lista.empresaId !== input.empresaId) {
    throw new Error("LINEA_NO_ENCONTRADA")
  }

  const qty = input.cantidadPicada
  if (qty < 0) throw new Error("CANTIDAD_INVALIDA")

  // Descontar bin si hay ubicación WMS
  if (linea.ubicacionId && linea.productoId && qty > 0) {
    const depId =
      (
        await prisma.ubicacionAlmacen.findUnique({
          where: { id: linea.ubicacionId },
          select: { depositoId: true },
        })
      )?.depositoId ?? null

    if (depId) {
      await ajustarStockUbicacion({
        empresaId: input.empresaId,
        depositoId: depId,
        ubicacionId: linea.ubicacionId,
        productoId: linea.productoId,
        loteId: linea.loteId,
        cantidadDelta: -qty,
        tipo: "pick",
        motivo: `Pick lista ${linea.lista.numero}`,
        createdBy: input.createdBy,
        syncDeposito: true,
        fromUbicacionId: linea.ubicacionId,
      })
    }
  }

  const estado =
    qty <= 0 ? "pendiente" : qty + 0.0001 >= linea.cantidadPedida ? "completo" : "parcial"

  const updated = await prisma.lineaPicking.update({
    where: { id: linea.id },
    data: { cantidadPicada: qty, estado },
  })

  // Completar tarea pick asociada
  await prisma.tareaWms.updateMany({
    where: {
      empresaId: input.empresaId,
      listaPickingId: linea.listaId,
      productoId: linea.productoId ?? undefined,
      fromUbicacionId: linea.ubicacionId ?? undefined,
      tipo: "pick",
      estado: { in: ["pendiente", "asignada", "en_proceso"] },
    },
    data: {
      estado: estado === "completo" ? "completada" : qty > 0 ? "en_proceso" : "pendiente",
      cantidadHecha: qty,
      operarioNombre: input.operarioNombre,
      completedAt: estado === "completo" ? new Date() : null,
    },
  })

  const todas = await prisma.lineaPicking.findMany({ where: { listaId: linea.listaId } })
  const allDone = todas.every((l) => l.estado === "completo" || l.id === linea.id && estado === "completo")
  if (allDone && todas.every((l) => (l.id === linea.id ? estado : l.estado) === "completo")) {
    await prisma.listaPicking.update({
      where: { id: linea.listaId },
      data: { estado: "completada" },
    })
  } else if (qty > 0) {
    await prisma.listaPicking.update({
      where: { id: linea.listaId },
      data: { estado: "en_proceso", operario: input.operarioNombre ?? undefined },
    })
  }

  return updated
}

/** RF: scan ubicación + SKU + cantidad */
export async function rfPickScan(input: {
  empresaId: number
  tareaId: number
  codigoUbicacion: string
  codigoProducto: string
  cantidad: number
  operarioNombre?: string
  createdBy?: number
}) {
  const tarea = await prisma.tareaWms.findFirst({
    where: { id: input.tareaId, empresaId: input.empresaId, tipo: "pick" },
    include: {
      fromUbicacion: true,
      producto: true,
    },
  })
  if (!tarea) throw new Error("TAREA_NO_ENCONTRADA")
  if (tarea.estado === "completada") throw new Error("TAREA_YA_COMPLETADA")

  const codUbi = input.codigoUbicacion.trim().toUpperCase()
  if (tarea.fromUbicacion && tarea.fromUbicacion.codigo !== codUbi) {
    throw new Error("UBICACION_INCORRECTA")
  }

  const codProd = input.codigoProducto.trim().toUpperCase()
  const prodMatch =
    tarea.producto &&
    (tarea.producto.codigo?.toUpperCase() === codProd ||
      String(tarea.producto.id) === input.codigoProducto)
  if (tarea.productoId && !prodMatch) {
    // allow barcode match
    const byBarcode = await prisma.producto.findFirst({
      where: {
        empresaId: input.empresaId,
        OR: [
          { codigo: { equals: input.codigoProducto, mode: "insensitive" } },
          { codigoBarras: input.codigoProducto },
        ],
      },
    })
    if (!byBarcode || byBarcode.id !== tarea.productoId) {
      throw new Error("PRODUCTO_INCORRECTO")
    }
  }

  if (!tarea.fromUbicacionId || !tarea.productoId) {
    throw new Error("TAREA_INCOMPLETA")
  }

  await ajustarStockUbicacion({
    empresaId: input.empresaId,
    depositoId: tarea.depositoId,
    ubicacionId: tarea.fromUbicacionId,
    productoId: tarea.productoId,
    loteId: tarea.loteId,
    cantidadDelta: -input.cantidad,
    tipo: "pick",
    motivo: `RF pick ${tarea.numero}`,
    tareaWmsId: tarea.id,
    createdBy: input.createdBy,
    syncDeposito: true,
    fromUbicacionId: tarea.fromUbicacionId,
  })

  const hecha = tarea.cantidadHecha + input.cantidad
  const done = hecha + 0.0001 >= tarea.cantidadPedida

  return prisma.tareaWms.update({
    where: { id: tarea.id },
    data: {
      cantidadHecha: hecha,
      estado: done ? "completada" : "en_proceso",
      operarioNombre: input.operarioNombre ?? tarea.operarioNombre,
      completedAt: done ? new Date() : null,
    },
    include: {
      fromUbicacion: true,
      producto: { select: { id: true, codigo: true, nombre: true } },
    },
  })
}
