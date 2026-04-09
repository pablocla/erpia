/**
 * AI Analyzers — Domain-specific analysis functions backed by LLM
 *
 * Each analyzer:
 * 1. Fetches real data from Prisma
 * 2. Sanitizes PII (removes passwords, certificates, etc.)
 * 3. Builds a prompt with structured data
 * 4. Calls aiService with appropriate tier
 * 5. Parses JSON response into typed result
 */

import { prisma } from "@/lib/prisma"
import { aiService } from "./ai-service"
import {
  promptAlertasInteligentes,
  promptClasificarProducto,
  promptAnalisisCobranza,
  promptPrediccionCompras,
  promptReporteNatural,
  promptDeteccionAnomalias,
  promptOnboardingConversacional,
  promptGenerarPresupuesto,
} from "./prompts"

// ─── TYPES ────────────────────────────────────────────────────────────────────

export interface Alerta {
  tipo: string
  prioridad: "alta" | "media" | "baja"
  titulo: string
  detalle: string
  accionSugerida: string
  impactoEstimado: string
}

export interface AlertasResult {
  alertas: Alerta[]
  resumenEjecutivo: string
  indicadores: {
    ventasDiarias: number
    tendencia: "subiendo" | "estable" | "bajando"
    ticketPromedio: number
    clientesActivos: number
  }
}

export interface ClasificacionProducto {
  nombre_normalizado: string
  categoria_sugerida: string
  alicuota_iva: number
  razon_iva: string
  unidad_medida: string
  es_servicio: boolean
  codigo_sugerido: string
  posibles_duplicados: string[]
  tags: string[]
}

export interface CobranzaPriorizada {
  prioridad: Array<{
    clienteId: number
    clienteNombre: string
    montoTotal: number
    diasVencido: number
    riesgo: string
    probabilidadCobro: number
    mensajeWhatsApp: string
    estrategiaRecomendada: string
  }>
  resumen: {
    totalVencido: number
    estimadoRecuperable: number
    clientesCriticos: number
    accionInmediata: string
  }
}

export interface ReposicionSugerida {
  reposiciones: Array<{
    productoId: number
    productoNombre: string
    stockActual: number
    consumoSemanal: number
    diasCobertura: number
    cantidadSugerida: number
    urgencia: "inmediata" | "esta_semana" | "proxima_semana"
    razon: string
  }>
  alertasEstacionales: string[]
  resumen: string
}

export interface ReporteNatural {
  respuesta: string
  graficos_sugeridos: Array<{ tipo: string; titulo: string; datos: string }>
  insight_adicional: string
  accion_sugerida: string
}

// ─── ALERTAS INTELIGENTES ────────────────────────────────────────────────────

export async function analizarAlertasInteligentes(empresaId: number, rubro: string): Promise<AlertasResult | null> {
  const hace30Dias = new Date()
  hace30Dias.setDate(hace30Dias.getDate() - 30)
  const hace15Dias = new Date()
  hace15Dias.setDate(hace15Dias.getDate() - 15)

  const [ventas, stockCritico, cuentasVencidas, clientesConVentas] = await Promise.all([
    // Ventas de los últimos 30 días (resumen por día)
    prisma.factura.findMany({
      where: { empresaId, createdAt: { gte: hace30Dias }, estado: "emitida", deletedAt: null },
      select: { id: true, total: true, createdAt: true, clienteId: true },
      orderBy: { createdAt: "desc" },
      take: 500,
    }),

    // Stock bajo mínimo
    prisma.producto.findMany({
      where: {
        empresaId, activo: true, deletedAt: null,
        stockActual: { lte: prisma.producto.fields.stockMinimo ? undefined : 0 },
      },
      select: { id: true, nombre: true, stockActual: true, stockMinimo: true, precio: true },
      take: 50,
    }).catch(() => []),

    // Cuentas a cobrar vencidas
    prisma.cuentaCobrar.findMany({
      where: { estado: { not: "pagada" }, fechaVencimiento: { lt: new Date() } },
      select: { id: true, montoOriginal: true, saldo: true, fechaVencimiento: true, clienteId: true },
      take: 50,
    }).catch(() => []),

    // Clientes que compraron hace más de 15 días (potencialmente inactivos)
    prisma.factura.groupBy({
      by: ["clienteId"],
      where: { empresaId, estado: "emitida", deletedAt: null },
      _max: { createdAt: true },
      _count: true,
    }).catch(() => []),
  ])

  // Filter genuinely inactive clients
  const clientesInactivos = Array.isArray(clientesConVentas)
    ? clientesConVentas.filter(c =>
        c._max.createdAt && new Date(c._max.createdAt) < hace15Dias && c._count > 2
      )
    : []

  const prompt = promptAlertasInteligentes(rubro, {
    ventasUltimos30Dias: ventas.map(v => ({ fecha: v.createdAt, total: Number(v.total), clienteId: v.clienteId })),
    stockCritico: stockCritico.map(p => ({ nombre: p.nombre, actual: p.stockActual, minimo: p.stockMinimo })),
    cuentasCobrarVencidas: cuentasVencidas.map(c => ({
      monto: Number(c.montoOriginal), saldo: Number(c.saldo), vencimiento: c.fechaVencimiento, clienteId: c.clienteId,
    })),
    clientesInactivos: clientesInactivos.map(c => ({
      clienteId: c.clienteId, ultimaCompra: c._max.createdAt, comprasHistoricas: c._count,
    })),
  })

  const result = await aiService.chatJson<AlertasResult>(
    [{ role: "user", content: prompt }],
    "batch"
  )

  return result.data
}

// ─── CLASIFICAR PRODUCTO ─────────────────────────────────────────────────────

export async function clasificarProducto(descripcion: string, empresaId: number): Promise<ClasificacionProducto | null> {
  const categorias = await prisma.categoria.findMany({
    where: { empresaId, deletedAt: null },
    select: { nombre: true },
  })

  const prompt = promptClasificarProducto(descripcion, categorias.map(c => c.nombre))

  const result = await aiService.chatJson<ClasificacionProducto>(
    [{ role: "user", content: prompt }],
    "realtime" // Fast: needs to respond while user types
  )

  return result.data
}

// ─── ANÁLISIS DE COBRANZA ────────────────────────────────────────────────────

export async function analizarCobranza(empresaId: number): Promise<CobranzaPriorizada | null> {
  const cuentas = await prisma.cuentaCobrar.findMany({
    where: {
      estado: { not: "pagada" },
      fechaVencimiento: { lt: new Date() },
    },
    include: {
      cliente: { select: { id: true, nombre: true, telefono: true, email: true, saldoCuentaCorriente: true } },
    },
    orderBy: { fechaVencimiento: "asc" },
    take: 100,
  })

  if (cuentas.length === 0) return null

  const dataSanitized = cuentas.map(c => ({
    clienteId: c.clienteId,
    clienteNombre: c.cliente.nombre,
    monto: Number(c.montoOriginal),
    saldo: Number(c.saldo),
    vencimiento: c.fechaVencimiento,
    saldoCC: Number(c.cliente.saldoCuentaCorriente),
  }))

  const prompt = promptAnalisisCobranza(dataSanitized)

  const result = await aiService.chatJson<CobranzaPriorizada>(
    [{ role: "user", content: prompt }],
    "batch"
  )

  return result.data
}

// ─── PREDICCIÓN DE COMPRAS ───────────────────────────────────────────────────

export async function predecirCompras(empresaId: number): Promise<ReposicionSugerida | null> {
  const hace8Semanas = new Date()
  hace8Semanas.setDate(hace8Semanas.getDate() - 56)

  const [productos, ventasRecientes] = await Promise.all([
    prisma.producto.findMany({
      where: { empresaId, activo: true, deletedAt: null },
      select: { id: true, nombre: true, stockActual: true, stockMinimo: true, precio: true },
      take: 200,
    }),
    prisma.lineaFactura.findMany({
      where: {
        factura: { empresaId, estado: "emitida", createdAt: { gte: hace8Semanas } },
      },
      select: { productoId: true, cantidad: true, factura: { select: { createdAt: true } } },
      take: 2000,
    }),
  ])

  if (productos.length === 0) return null

  // Aggregate sales by product per week
  const ventasPorProducto: Record<number, number> = {}
  for (const venta of ventasRecientes) {
    if (venta.productoId) {
      ventasPorProducto[venta.productoId] = (ventasPorProducto[venta.productoId] || 0) + venta.cantidad
    }
  }

  const productosConVentas = productos.map(p => ({
    id: p.id,
    nombre: p.nombre,
    stockActual: p.stockActual,
    stockMinimo: p.stockMinimo,
    ventasTotal8Semanas: ventasPorProducto[p.id] || 0,
    consumoSemanal: Math.round(((ventasPorProducto[p.id] || 0) / 8) * 10) / 10,
  }))

  const prompt = promptPrediccionCompras(
    productosConVentas,
    [{ periodo: "8 semanas", resumenPorProducto: ventasPorProducto }]
  )

  const result = await aiService.chatJson<ReposicionSugerida>(
    [{ role: "user", content: prompt }],
    "batch"
  )

  return result.data
}

// ─── REPORTE EN LENGUAJE NATURAL ─────────────────────────────────────────────

export async function responderPregunta(pregunta: string, empresaId: number): Promise<ReporteNatural | null> {
  const ahora = new Date()
  const hace30Dias = new Date()
  hace30Dias.setDate(ahora.getDate() - 30)
  const hace60Dias = new Date()
  hace60Dias.setDate(ahora.getDate() - 60)

  const [ventasMes, ventasMesAnterior, topProductos, topClientes] = await Promise.all([
    prisma.factura.aggregate({
      where: { empresaId, estado: "emitida", createdAt: { gte: hace30Dias }, deletedAt: null },
      _sum: { total: true },
      _count: true,
      _avg: { total: true },
    }),
    prisma.factura.aggregate({
      where: { empresaId, estado: "emitida", createdAt: { gte: hace60Dias, lt: hace30Dias }, deletedAt: null },
      _sum: { total: true },
      _count: true,
    }),
    prisma.lineaFactura.groupBy({
      by: ["productoId"],
      where: { factura: { empresaId, estado: "emitida", createdAt: { gte: hace30Dias } } },
      _sum: { total: true, cantidad: true },
      orderBy: { _sum: { total: "desc" } },
      take: 10,
    }),
    prisma.factura.groupBy({
      by: ["clienteId"],
      where: { empresaId, estado: "emitida", createdAt: { gte: hace30Dias }, deletedAt: null },
      _sum: { total: true },
      _count: true,
      orderBy: { _sum: { total: "desc" } },
      take: 10,
    }),
  ])

  const datos = {
    periodo: "últimos 30 días",
    ventasMes: {
      total: ventasMes._sum.total,
      cantidadFacturas: ventasMes._count,
      ticketPromedio: ventasMes._avg.total,
    },
    ventasMesAnterior: {
      total: ventasMesAnterior._sum.total,
      cantidadFacturas: ventasMesAnterior._count,
    },
    topProductos: topProductos.slice(0, 5),
    topClientes: topClientes.slice(0, 5),
  }

  const prompt = promptReporteNatural(pregunta, datos)

  const result = await aiService.chatJson<ReporteNatural>(
    [{ role: "user", content: prompt }],
    "batch"
  )

  return result.data
}

// ─── DETECCIÓN DE ANOMALÍAS ──────────────────────────────────────────────────

export async function detectarAnomalias(empresaId: number): Promise<unknown | null> {
  const hace7Dias = new Date()
  hace7Dias.setDate(hace7Dias.getDate() - 7)

  const operaciones = await prisma.factura.findMany({
    where: { empresaId, createdAt: { gte: hace7Dias }, deletedAt: null },
    select: {
      id: true, total: true, subtotal: true, iva: true, createdAt: true, estado: true,
      createdBy: true, tipo: true,
      lineas: { select: { descripcion: true, cantidad: true, precioUnitario: true, descuento: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 200,
  })

  if (operaciones.length < 5) return null

  const prompt = promptDeteccionAnomalias(
    operaciones.map(o => ({
      id: o.id,
      total: o.total,
      fecha: o.createdAt,
      estado: o.estado,
      usuario: o.createdBy,
      tipo: o.tipo,
      lineas: o.lineas.map(l => ({
        producto: l.descripcion,
        cantidad: l.cantidad,
        precio: l.precioUnitario,
        descuento: l.descuento,
      })),
    }))
  )

  const result = await aiService.chatJson(
    [{ role: "user", content: prompt }],
    "nightly"
  )

  return result.data
}

// ─── ONBOARDING CONVERSACIONAL ───────────────────────────────────────────────

export async function procesarOnboardingConversacional(mensaje: string): Promise<{
  rubro_detectado: string
  confianza: number
  datos_extraidos: Record<string, unknown>
  preguntasSiguientes: string[]
  respuesta: string
} | null> {
  const prompt = promptOnboardingConversacional(mensaje)

  const result = await aiService.chatJson(
    [{ role: "user", content: prompt }],
    "realtime"
  )

  return result.data as any
}

// ─── GENERAR PRESUPUESTO POR TEXTO ──────────────────────────────────────────

export async function generarPresupuestoPorTexto(texto: string, empresaId: number) {
  const productos = await prisma.producto.findMany({
    where: { empresaId, activo: true, deletedAt: null },
    select: { id: true, nombre: true, codigo: true, precio: true },
    take: 500,
  })

  const prompt = promptGenerarPresupuesto(
    texto,
    productos.map(p => ({ id: p.id, nombre: p.nombre, codigo: p.codigo, precio: p.precio }))
  )

  const result = await aiService.chatJson(
    [{ role: "user", content: prompt }],
    "batch"
  )

  return result.data
}
