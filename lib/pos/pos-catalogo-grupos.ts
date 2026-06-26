/**
 * Agrupa variantes (mismo nombre base) y combos (BOM/receta) para grilla POS.
 */
import { prisma } from "@/lib/prisma"
import type { Prisma } from "@prisma/client"

export interface VarianteGrupo {
  grupoKey: string
  nombreBase: string
  variantes: Array<{
    id: number
    nombre: string
    codigo: string
    codigoBarras: string | null
    precioVenta: number
    stock: number
    etiqueta: string
  }>
}

export interface ComboPos {
  productoId: number
  nombre: string
  precioVenta: number
  componentes: Array<{ productoId: number; nombre: string; cantidad: number }>
}

function nombreBaseVariante(nombre: string): string | null {
  const idx = nombre.lastIndexOf(" - ")
  if (idx <= 0) return null
  return nombre.slice(0, idx).trim()
}

function etiquetaVariante(nombre: string, base: string): string {
  return nombre.slice(base.length + 3).trim() || nombre
}

export async function obtenerGruposPosCatalogo(empresaId: number) {
  const productos = await prisma.producto.findMany({
    where: { empresaId, activo: true, deletedAt: null },
    select: {
      id: true,
      nombre: true,
      codigo: true,
      codigoBarras: true,
      precioVenta: true,
      stock: true,
    },
    orderBy: { nombre: "asc" },
    take: 500,
  })

  const gruposMap = new Map<string, VarianteGrupo>()

  for (const p of productos) {
    const base = nombreBaseVariante(p.nombre)
    if (!base) continue
    const key = base.toLowerCase()
    const entry = gruposMap.get(key) ?? {
      grupoKey: key,
      nombreBase: base,
      variantes: [],
    }
    entry.variantes.push({
      id: p.id,
      nombre: p.nombre,
      codigo: p.codigo,
      codigoBarras: p.codigoBarras,
      precioVenta: Number(p.precioVenta),
      stock: p.stock,
      etiqueta: etiquetaVariante(p.nombre, base),
    })
    gruposMap.set(key, entry)
  }

  const variantes = [...gruposMap.values()].filter((g) => g.variantes.length > 1)

  const boms = await prisma.listaMateriales.findMany({
    where: { empresaId, activo: true, productoId: { not: null } },
    include: {
      producto: { select: { id: true, nombre: true, precioVenta: true } },
      componentes: {
        include: { producto: { select: { id: true, nombre: true } } },
      },
    },
    take: 100,
  })

  const combos: ComboPos[] = boms
    .filter((b) => b.producto && b.componentes.length > 0)
    .map((b) => ({
      productoId: b.producto!.id,
      nombre: b.producto!.nombre,
      precioVenta: Number(b.producto!.precioVenta),
      componentes: b.componentes
        .filter((c) => c.productoId && c.producto)
        .map((c) => ({
          productoId: c.productoId!,
          nombre: c.producto!.nombre,
          cantidad: c.cantidad,
        })),
    }))

  const productoIdsConVariantes = new Set(
    variantes.flatMap((g) => g.variantes.map((v) => v.id)),
  )
  const productoIdsCombo = new Set(combos.map((c) => c.productoId))

  return {
    variantes,
    combos,
    productoIdsConVariantes: [...productoIdsConVariantes],
    productoIdsCombo: [...productoIdsCombo],
  }
}

export async function descontarStockCombo(
  tx: Prisma.TransactionClient,
  empresaId: number,
  productoId: number,
  cantidadVendida: number,
) {
  const bom = await tx.listaMateriales.findFirst({
    where: { empresaId, productoId, activo: true },
    include: { componentes: true },
  })
  if (!bom?.componentes.length) return false

  for (const comp of bom.componentes) {
    if (!comp.productoId) continue
    const producto = await tx.producto.findFirst({
      where: { id: comp.productoId, empresaId },
      select: { stock: true, nombre: true },
    })
    if (!producto) continue
    const req = comp.cantidad * cantidadVendida
    const stockNuevo = producto.stock - req
    if (stockNuevo < 0) {
      throw new Error(`Stock insuficiente (combo) para ${producto.nombre}`)
    }
    await tx.producto.update({
      where: { id: comp.productoId },
      data: { stock: stockNuevo },
    })
    await tx.movimientoStock.create({
      data: {
        productoId: comp.productoId,
        tipo: "salida",
        cantidad: req,
        motivo: `Venta combo POS`,
        empresaId,
      },
    })
  }
  return true
}