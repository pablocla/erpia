/**
 * Context Builder — Construye el snapshot del negocio para alimentar la IA.
 *
 * Este archivo es el CORE del motor IA: convierte datos reales de Prisma
 * en un contexto compacto que el LLM puede interpretar.
 *
 * - Usa SOLO Prisma (sin SQL crudo)
 * - Promise.allSettled para que una query fallida no mate todo el contexto
 * - Cache TTL de 60 segundos para no bombardear la DB en chat multi-turn
 * - empresaId: Int (como todo el schema)
 */

import { prisma } from "@/lib/prisma"

// ─── TYPES ────────────────────────────────────────────────────────────────────

export interface EmpresaContexto {
  empresa: {
    id: number
    nombre: string
    rubro: string
    cuit: string
    condicionIva: string
  }
  snapshot: {
    ventasHoy: { total: number; cantidad: number }
    ventasSemana: { total: number; cantidad: number }
    ventasMes: { total: number; cantidad: number }
    ticketPromedio: number
    stockCritico: Array<{ nombre: string; stock: number; stockMinimo: number; unidad: string }>
    topProductos: Array<{ nombre: string; cantidad: number; total: number }>
    clientesDeudores: Array<{ nombre: string; deuda: number; diasVencido: number }>
    turnosPendientesHoy: number
    turnosPendientesManana: number
    cajaAbierta: boolean
    saldoCaja: number
  }
  maestros: {
    productos: Array<{ sku: string; nombre: string; descripcion: string | null; precio: number; precioCompra: number; stock: number; stockMinimo: number; unidad: string; categoria: string; activo: boolean; esPlato: boolean; esInsumo: boolean }>
    clientes: Array<{ nombre: string; cuit: string | null; condicionIva: string; saldo: number; limiteCredito: number; activo: boolean }>
    proveedores: Array<{ nombre: string; cuit: string | null; activo: boolean }>
    categorias: Array<{ nombre: string; cantidadProductos: number }>
    totalProductos: number
    totalClientes: number
    totalProveedores: number
  }
  historico: {
    ventasUltimos30Dias: Array<{ fecha: string; total: number; cantidad: number }>
    productosEstancados: Array<{ nombre: string; diasSinVenta: number }>
    clientesInactivos: Array<{ nombre: string; diasSinCompra: number; promedioCompra: number }>
  }
  config: {
    moneda: string
    timezone: string
  }
}

// ─── CACHE ────────────────────────────────────────────────────────────────────

import { getAIConfig } from "./ai-config"

const contextCache = new Map<number, { data: EmpresaContexto; ts: number }>()

function getCacheTtl(): number {
  return getAIConfig().contextCacheTtlMs
}

export function invalidateContextCache(empresaId: number): void {
  contextCache.delete(empresaId)
}

// ─── HELPER: safe settled ─────────────────────────────────────────────────────

function settled<T>(result: PromiseSettledResult<T>, fallback: T): T {
  return result.status === "fulfilled" ? result.value : fallback
}

// ─── BUILDER ──────────────────────────────────────────────────────────────────

export async function buildEmpresaContexto(empresaId: number): Promise<EmpresaContexto> {
  // Check cache
  const cached = contextCache.get(empresaId)
  if (cached && Date.now() - cached.ts < getCacheTtl()) {
    return cached.data
  }

  const ahora = new Date()
  const hoy = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate())
  const semanaAtras = new Date(hoy.getTime() - 7 * 24 * 60 * 60 * 1000)
  const mesAtras = new Date(hoy.getTime() - 30 * 24 * 60 * 60 * 1000)
  const manana = new Date(hoy.getTime() + 24 * 60 * 60 * 1000)
  const pasadoManana = new Date(manana.getTime() + 24 * 60 * 60 * 1000)

  const results = await Promise.allSettled([
    // 0: empresa
    prisma.empresa.findUniqueOrThrow({
      where: { id: empresaId },
      select: { id: true, nombre: true, rubro: true, cuit: true, condicionIva: true },
    }),
    // 1: ventas hoy (facturas emitidas)
    prisma.factura.aggregate({
      where: { empresaId, createdAt: { gte: hoy }, estado: "emitida" },
      _sum: { total: true },
      _count: { id: true },
    }),
    // 2: ventas semana
    prisma.factura.aggregate({
      where: { empresaId, createdAt: { gte: semanaAtras }, estado: "emitida" },
      _sum: { total: true },
      _count: { id: true },
    }),
    // 3: ventas mes
    prisma.factura.aggregate({
      where: { empresaId, createdAt: { gte: mesAtras }, estado: "emitida" },
      _sum: { total: true },
      _count: { id: true },
    }),
    // 4: stock critico (productos con stock <= stockMinimo)
    prisma.producto.findMany({
      where: {
        empresaId,
        activo: true,
        deletedAt: null,
        stockMinimo: { gt: 0 },
      },
      select: { nombre: true, stock: true, stockMinimo: true, unidad: true },
      orderBy: { stock: "asc" },
      take: 20,
    }),
    // 5: top productos del mes (por facturación)
    prisma.lineaFactura.groupBy({
      by: ["productoId"],
      where: {
        factura: { empresaId, createdAt: { gte: mesAtras }, estado: "emitida" },
        productoId: { not: null },
      },
      _sum: { cantidad: true, total: true },
      orderBy: { _sum: { total: "desc" } },
      take: 10,
    }),
    // 6: cuentas a cobrar vencidas
    prisma.cuentaCobrar.findMany({
      where: {
        factura: { empresaId },
        estado: { in: ["pendiente", "parcial", "vencida"] },
        saldo: { gt: 0 },
      },
      include: { cliente: { select: { nombre: true, nombreFantasia: true } } },
      orderBy: { saldo: "desc" },
      take: 15,
    }),
    // 7: turnos pendientes hoy
    prisma.turno.count({
      where: {
        profesional: { empresaId },
        fecha: { gte: hoy, lt: manana },
        estado: { in: ["confirmado", "pendiente"] },
      },
    }),
    // 8: turnos pendientes mañana
    prisma.turno.count({
      where: {
        profesional: { empresaId },
        fecha: { gte: manana, lt: pasadoManana },
        estado: { in: ["confirmado", "pendiente"] },
      },
    }),
    // 9: caja abierta con movimientos para calcular saldo real
    prisma.caja.findFirst({
      where: { empresaId, estado: "abierta" },
      select: {
        saldoInicial: true,
        movimientos: { select: { tipo: true, monto: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    // 10: facturas diarias últimos 30 días (agrupadas por día)
    prisma.factura.findMany({
      where: { empresaId, createdAt: { gte: mesAtras }, estado: "emitida" },
      select: { createdAt: true, total: true },
      orderBy: { createdAt: "desc" },
    }),
    // 11: productos sin venta en 7 días (estancados)
    prisma.producto.findMany({
      where: {
        empresaId,
        activo: true,
        deletedAt: null,
        stock: { gt: 0 },
        lineasFactura: { none: { factura: { createdAt: { gte: semanaAtras } } } },
      },
      select: { nombre: true, updatedAt: true },
      take: 10,
    }),
    // 12: clientes inactivos (con facturas viejas, sin recientes)
    prisma.cliente.findMany({
      where: {
        empresaId,
        activo: true,
        deletedAt: null,
        facturas: {
          some: { createdAt: { lt: mesAtras } },
          none: { createdAt: { gte: mesAtras } },
        },
      },
      select: {
        nombre: true,
        nombreFantasia: true,
        facturas: {
          select: { total: true, createdAt: true },
          orderBy: { createdAt: "desc" },
          take: 5,
        },
      },
      take: 15,
    }),
    // 13: producto names for topProductos resolution
    prisma.producto.findMany({
      where: { empresaId },
      select: { id: true, nombre: true },
    }),
    // 14: MAESTRO COMPLETO de productos (hasta 200 para el LLM)
    prisma.producto.findMany({
      where: { empresaId, deletedAt: null },
      select: {
        codigo: true, nombre: true, descripcion: true,
        precioVenta: true, precioCompra: true,
        stock: true, stockMinimo: true, unidad: true,
        activo: true, esPlato: true, esInsumo: true,
        categoria: { select: { nombre: true } },
      },
      orderBy: { nombre: "asc" },
      take: 200,
    }),
    // 15: total productos
    prisma.producto.count({ where: { empresaId, deletedAt: null } }),
    // 16: MAESTRO COMPLETO de clientes (hasta 100)
    prisma.cliente.findMany({
      where: { empresaId, deletedAt: null },
      select: {
        nombre: true, nombreFantasia: true, cuit: true,
        condicionIva: true, saldoCuentaCorriente: true,
        limiteCredito: true, activo: true,
      },
      orderBy: { nombre: "asc" },
      take: 100,
    }),
    // 17: total clientes
    prisma.cliente.count({ where: { empresaId, deletedAt: null } }),
    // 18: MAESTRO de proveedores (hasta 50)
    prisma.proveedor.findMany({
      where: { empresaId, deletedAt: null },
      select: { nombre: true, cuit: true, activo: true },
      orderBy: { nombre: "asc" },
      take: 50,
    }),
    // 19: total proveedores
    prisma.proveedor.count({ where: { empresaId, deletedAt: null } }),
    // 20: categorías con conteo
    prisma.categoria.findMany({
      where: { empresaId },
      select: { nombre: true, _count: { select: { productos: true } } },
      orderBy: { nombre: "asc" },
    }),
  ])

  // Extract with safe fallbacks
  const empresa = settled(results[0], { id: empresaId, nombre: "N/A", rubro: "comercio", cuit: "", condicionIva: "Responsable Inscripto" })
  const ventasHoyAgg = settled(results[1], { _sum: { total: null }, _count: { id: 0 } })
  const ventasSemanaAgg = settled(results[2], { _sum: { total: null }, _count: { id: 0 } })
  const ventasMesAgg = settled(results[3], { _sum: { total: null }, _count: { id: 0 } })
  const stockItems = settled(results[4] as PromiseSettledResult<Array<{ nombre: string; stock: number; stockMinimo: number; unidad: string }>>, [])
  const topProductosRaw = settled(results[5] as PromiseSettledResult<Array<{ productoId: number | null; _sum: { cantidad: number | null; total: number | null } }>>, [])
  const cuentasCobrar = settled(results[6] as PromiseSettledResult<Array<{ saldo: any; fechaVencimiento: Date; cliente: { nombre: string; nombreFantasia: string | null } }>>, [])
  const turnosHoy = settled(results[7] as PromiseSettledResult<number>, 0)
  const turnosManana = settled(results[8] as PromiseSettledResult<number>, 0)
  const cajaAbierta = settled(results[9] as PromiseSettledResult<{ saldoInicial: number; movimientos: Array<{ tipo: string; monto: number }> } | null>, null)
  const facturasRaw = settled(results[10] as PromiseSettledResult<Array<{ createdAt: Date; total: number }>>, [])
  const productosEstancadosRaw = settled(results[11] as PromiseSettledResult<Array<{ nombre: string; updatedAt: Date }>>, [])
  const clientesInactivosRaw = settled(results[12] as PromiseSettledResult<Array<{ nombre: string; nombreFantasia: string | null; facturas: Array<{ total: number; createdAt: Date }> }>>, [])
  const productosMap = settled(results[13] as PromiseSettledResult<Array<{ id: number; nombre: string }>>, [])
  const productosMaestro = settled(results[14] as PromiseSettledResult<Array<{
    codigo: string; nombre: string; descripcion: string | null;
    precioVenta: number; precioCompra: number;
    stock: number; stockMinimo: number; unidad: string;
    activo: boolean; esPlato: boolean; esInsumo: boolean;
    categoria: { nombre: string } | null;
  }>>, [])
  const totalProductos = settled(results[15] as PromiseSettledResult<number>, 0)
  const clientesMaestro = settled(results[16] as PromiseSettledResult<Array<{
    nombre: string; nombreFantasia: string | null; cuit: string | null;
    condicionIva: string; saldoCuentaCorriente: any; limiteCredito: any; activo: boolean;
  }>>, [])
  const totalClientes = settled(results[17] as PromiseSettledResult<number>, 0)
  const proveedoresMaestro = settled(results[18] as PromiseSettledResult<Array<{
    nombre: string; cuit: string | null; activo: boolean;
  }>>, [])
  const totalProveedores = settled(results[19] as PromiseSettledResult<number>, 0)
  const categoriasMaestro = settled(results[20] as PromiseSettledResult<Array<{
    nombre: string; _count: { productos: number };
  }>>, [])

  // Build product ID → name map
  const prodNames = new Map(productosMap.map(p => [p.id, p.nombre]))

  // Aggregate daily sales from raw facturas
  const ventasPorDia = new Map<string, { total: number; cantidad: number }>()
  for (const f of facturasRaw) {
    const key = f.createdAt.toISOString().slice(0, 10)
    const current = ventasPorDia.get(key) ?? { total: 0, cantidad: 0 }
    current.total += Number(f.total)
    current.cantidad += 1
    ventasPorDia.set(key, current)
  }

  // Filter stock crítico: only items where stock <= stockMinimo
  const stockCritico = stockItems
    .filter(p => p.stock <= p.stockMinimo)
    .map(p => ({
      nombre: p.nombre,
      stock: Number(p.stock),
      stockMinimo: Number(p.stockMinimo),
      unidad: p.unidad ?? "u",
    }))

  const totalMes = Number(ventasMesAgg._sum.total ?? 0)
  const cantidadMes = ventasMesAgg._count.id ?? 0

  const contexto: EmpresaContexto = {
    empresa: {
      id: empresa.id,
      nombre: empresa.nombre,
      rubro: empresa.rubro ?? "comercio",
      cuit: empresa.cuit,
      condicionIva: empresa.condicionIva,
    },
    snapshot: {
      ventasHoy: {
        total: Number(ventasHoyAgg._sum.total ?? 0),
        cantidad: ventasHoyAgg._count.id ?? 0,
      },
      ventasSemana: {
        total: Number(ventasSemanaAgg._sum.total ?? 0),
        cantidad: ventasSemanaAgg._count.id ?? 0,
      },
      ventasMes: { total: totalMes, cantidad: cantidadMes },
      ticketPromedio: cantidadMes > 0 ? Math.round(totalMes / cantidadMes) : 0,
      stockCritico,
      topProductos: topProductosRaw.map(p => ({
        nombre: prodNames.get(p.productoId!) ?? `Producto #${p.productoId}`,
        cantidad: Number(p._sum.cantidad ?? 0),
        total: Number(p._sum.total ?? 0),
      })),
      clientesDeudores: cuentasCobrar.map(c => {
        const diasVencido = Math.max(0, Math.floor((Date.now() - new Date(c.fechaVencimiento).getTime()) / 86400000))
        return {
          nombre: c.cliente.nombreFantasia ?? c.cliente.nombre,
          deuda: Number(c.saldo),
          diasVencido,
        }
      }),
      turnosPendientesHoy: turnosHoy,
      turnosPendientesManana: turnosManana,
      cajaAbierta: !!cajaAbierta,
      saldoCaja: cajaAbierta
        ? Number(cajaAbierta.saldoInicial) +
          cajaAbierta.movimientos.reduce(
            (sum, m) => sum + (m.tipo === "ingreso" ? Number(m.monto) : -Number(m.monto)),
            0
          )
        : 0,
    },
    maestros: {
      productos: productosMaestro.map(p => ({
        sku: p.codigo,
        nombre: p.nombre,
        descripcion: p.descripcion,
        precio: Number(p.precioVenta),
        precioCompra: Number(p.precioCompra),
        stock: Number(p.stock),
        stockMinimo: Number(p.stockMinimo),
        unidad: p.unidad ?? "u",
        categoria: p.categoria?.nombre ?? "Sin categoría",
        activo: p.activo,
        esPlato: p.esPlato,
        esInsumo: p.esInsumo,
      })),
      clientes: clientesMaestro.map(c => ({
        nombre: c.nombreFantasia ?? c.nombre,
        cuit: c.cuit,
        condicionIva: c.condicionIva,
        saldo: Number(c.saldoCuentaCorriente ?? 0),
        limiteCredito: Number(c.limiteCredito ?? 0),
        activo: c.activo,
      })),
      proveedores: proveedoresMaestro.map(p => ({
        nombre: p.nombre,
        cuit: p.cuit,
        activo: p.activo,
      })),
      categorias: categoriasMaestro.map(c => ({
        nombre: c.nombre,
        cantidadProductos: c._count.productos,
      })),
      totalProductos,
      totalClientes,
      totalProveedores,
    },
    historico: {
      ventasUltimos30Dias: Array.from(ventasPorDia.entries())
        .map(([fecha, data]) => ({ fecha, ...data }))
        .sort((a, b) => b.fecha.localeCompare(a.fecha)),
      productosEstancados: productosEstancadosRaw.map(p => ({
        nombre: p.nombre,
        diasSinVenta: Math.floor((Date.now() - p.updatedAt.getTime()) / 86400000),
      })),
      clientesInactivos: clientesInactivosRaw.map(c => {
        const ultimaVenta = c.facturas[0]
        const diasSinCompra = ultimaVenta
          ? Math.floor((Date.now() - ultimaVenta.createdAt.getTime()) / 86400000)
          : 999
        const promedioCompra = c.facturas.length > 0
          ? c.facturas.reduce((a, v) => a + Number(v.total), 0) / c.facturas.length
          : 0
        return {
          nombre: c.nombreFantasia ?? c.nombre,
          diasSinCompra,
          promedioCompra: Math.round(promedioCompra),
        }
      }),
    },
    config: {
      moneda: "ARS",
      timezone: "America/Argentina/Buenos_Aires",
    },
  }

  // Cache
  contextCache.set(empresaId, { data: contexto, ts: Date.now() })
  return contexto
}
