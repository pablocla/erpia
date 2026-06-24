import { prisma } from "@/lib/prisma"
import type { ReportDefinition, ReportFilter } from "@/lib/reporting/semantic/types"

const MAX_ROWS = 10000

function toNumber(v: unknown): number {
  if (v == null) return 0
  if (typeof v === "object" && v !== null && "toNumber" in v) {
    return Number((v as { toNumber: () => number }).toNumber())
  }
  return Number(v)
}

function formatMes(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
}

function applyFiltersDate(
  where: Record<string, unknown>,
  filtros: ReportFilter[],
  dateField: "createdAt" | "fecha",
) {
  for (const f of filtros) {
    if (f.campo === "fecha" || f.campo === "desde" || f.campo === "hasta" || f.campo === "mes" || f.campo === "anio") {
      if (f.campo === "mes" || f.campo === "anio") continue
      const key = dateField
      const range = (where[key] as Record<string, Date>) ?? {}
      if (f.op === "gte") range.gte = new Date(String(f.valor))
      if (f.op === "lte") range.lte = new Date(String(f.valor))
      if (f.op === "gt") range.gt = new Date(String(f.valor))
      if (f.op === "lt") range.lt = new Date(String(f.valor))
      if (Object.keys(range).length) where[key] = range
    }
    if (f.campo === "estado" && f.op === "eq") where.estado = f.valor
    if (f.campo === "estado" && f.op === "in" && Array.isArray(f.valor)) {
      where.estado = { in: f.valor }
    }
    if (f.campo === "cliente" && f.op === "contains") {
      where.cliente = { nombre: { contains: String(f.valor), mode: "insensitive" } }
    }
    if (f.campo === "proveedor" && f.op === "contains") {
      where.proveedor = { nombre: { contains: String(f.valor), mode: "insensitive" } }
    }
  }
}

async function fetchVentas(empresaId: number, def: ReportDefinition) {
  const where: Record<string, unknown> = {
    empresaId,
    deletedAt: null,
    estado: { not: "anulada" },
  }
  applyFiltersDate(where, def.filtros, "createdAt")

  const facturas = await prisma.factura.findMany({
    where: where as never,
    include: { cliente: { select: { nombre: true } } },
    orderBy: { createdAt: "desc" },
    take: def.limit ?? MAX_ROWS,
  })

  return facturas.map((f) => {
    const d = new Date(f.createdAt)
    return {
      fecha: d.toISOString().split("T")[0],
      mes: formatMes(d),
      anio: String(d.getFullYear()),
      cliente: f.cliente?.nombre ?? "—",
      estado: f.estado,
      tipo: f.tipo,
      numero: `${String(f.puntoVenta).padStart(4, "0")}-${String(f.numero).padStart(8, "0")}`,
      total: toNumber(f.total),
      subtotal: toNumber(f.subtotal),
      iva: toNumber(f.iva),
      cantidad: 1,
    }
  })
}

async function fetchClientes(empresaId: number, def: ReportDefinition) {
  const where: Record<string, unknown> = { empresaId }
  for (const f of def.filtros) {
    if (f.campo === "nombre" && f.op === "contains") {
      where.nombre = { contains: String(f.valor), mode: "insensitive" }
    }
  }
  const clientes = await prisma.cliente.findMany({
    where: where as never,
    orderBy: { nombre: "asc" },
    take: def.limit ?? MAX_ROWS,
  })
  return clientes.map((c) => ({
    nombre: c.nombre,
    cuit: c.cuit ?? "",
    condicion_iva: c.condicionIva,
    cantidad: 1,
  }))
}

async function fetchProductos(empresaId: number, def: ReportDefinition) {
  const where: Record<string, unknown> = { empresaId }
  for (const f of def.filtros) {
    if (f.campo === "nombre" && f.op === "contains") {
      where.nombre = { contains: String(f.valor), mode: "insensitive" }
    }
  }
  const productos = await prisma.producto.findMany({
    where: where as never,
    include: { categoria: { select: { nombre: true } } },
    orderBy: { nombre: "asc" },
    take: def.limit ?? MAX_ROWS,
  })
  return productos.map((p) => ({
    codigo: p.codigo,
    nombre: p.nombre,
    categoria: p.categoria?.nombre ?? "—",
    precio: toNumber(p.precioVenta),
    stock: toNumber(p.stock),
    cantidad: 1,
  }))
}

async function fetchCompras(empresaId: number, def: ReportDefinition) {
  const where: Record<string, unknown> = { empresaId }
  applyFiltersDate(where, def.filtros, "fecha")
  const compras = await prisma.compra.findMany({
    where: where as never,
    include: { proveedor: { select: { nombre: true } } },
    orderBy: { fecha: "desc" },
    take: def.limit ?? MAX_ROWS,
  })
  return compras.map((c) => {
    const d = new Date(c.fecha)
    return {
      fecha: d.toISOString().split("T")[0],
      mes: formatMes(d),
      proveedor: c.proveedor?.nombre ?? "—",
      total: toNumber(c.total),
      iva: toNumber(c.iva),
      cantidad: 1,
    }
  })
}

async function fetchStockMovimientos(empresaId: number, def: ReportDefinition) {
  const where: Record<string, unknown> = { empresaId }
  applyFiltersDate(where, def.filtros, "createdAt")
  const movs = await prisma.movimientoStock.findMany({
    where: where as never,
    include: { producto: { select: { nombre: true } } },
    orderBy: { createdAt: "desc" },
    take: def.limit ?? MAX_ROWS,
  })
  return movs.map((m) => ({
    fecha: new Date(m.createdAt).toISOString().split("T")[0],
    producto: m.producto?.nombre ?? "—",
    tipo: m.tipo,
    cantidad: toNumber(m.cantidad),
  }))
}

export async function fetchClaverpSource(
  empresaId: number,
  def: ReportDefinition,
): Promise<Record<string, unknown>[]> {
  switch (def.fuente) {
    case "ventas":
      return fetchVentas(empresaId, def)
    case "clientes":
      return fetchClientes(empresaId, def)
    case "productos":
      return fetchProductos(empresaId, def)
    case "compras":
      return fetchCompras(empresaId, def)
    case "stock_movimientos":
      return fetchStockMovimientos(empresaId, def)
    default:
      throw new Error(`Fuente no soportada: ${def.fuente}`)
  }
}