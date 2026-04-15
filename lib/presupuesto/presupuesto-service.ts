import { prisma } from "@/lib/prisma"

/* ═══════════════════════════════════════════════════════════════════════════
   CONTROL PRESUPUESTARIO — Presupuesto vs Ejecutado vs Comprometido
   Equivalente a SAP FI-CO Budget Control + Tango Presupuestos
   ═══════════════════════════════════════════════════════════════════════════ */

// ─── Crear presupuesto ──────────────────────────────────────────────────────

export async function crearPresupuesto(params: {
  empresaId: number
  nombre: string
  ejercicio: number
  tipo?: string
}) {
  return prisma.presupuestoGasto.create({
    data: {
      nombre: params.nombre,
      ejercicio: params.ejercicio,
      tipo: params.tipo ?? "anual",
      estado: "borrador",
      empresaId: params.empresaId,
    },
  })
}

// ─── Agregar línea presupuestaria ───────────────────────────────────────────

export async function agregarLineaPresupuesto(params: {
  presupuestoId: number
  cuentaContableId?: number
  centroCostoId?: number
  mes: number
  montoPresupuestado: number
  observaciones?: string
}) {
  const linea = await prisma.lineaPresupuestoGasto.create({
    data: {
      presupuestoId: params.presupuestoId,
      cuentaContableId: params.cuentaContableId,
      centroCostoId: params.centroCostoId,
      mes: params.mes,
      montoPresupuestado: params.montoPresupuestado,
      observaciones: params.observaciones,
    },
  })

  // Recalcular total
  await recalcularTotal(params.presupuestoId)
  return linea
}

// ─── Registrar ejecución (cuando se contabiliza un gasto) ───────────────────

export async function registrarEjecucion(params: {
  empresaId: number
  cuentaContableId: number
  centroCostoId?: number
  mes: number
  ejercicio: number
  monto: number
}) {
  // Buscar línea presupuestaria que coincida
  const presupuesto = await prisma.presupuestoGasto.findFirst({
    where: {
      empresaId: params.empresaId,
      ejercicio: params.ejercicio,
      estado: { in: ["aprobado", "vigente"] },
    },
  })

  if (!presupuesto) return { excedido: false, sinPresupuesto: true }

  const where: Record<string, unknown> = {
    presupuestoId: presupuesto.id,
    mes: params.mes,
    cuentaContableId: params.cuentaContableId,
  }
  if (params.centroCostoId) where.centroCostoId = params.centroCostoId

  const linea = await prisma.lineaPresupuestoGasto.findFirst({ where })
  if (!linea) return { excedido: false, sinLineaPresupuestaria: true }

  const nuevoEjecutado = linea.montoEjecutado + params.monto
  const totalUsado = nuevoEjecutado + linea.montoComprometido
  const excedido = totalUsado > linea.montoPresupuestado
  const porcentaje = linea.montoPresupuestado > 0
    ? Math.round((totalUsado / linea.montoPresupuestado) * 100)
    : 0

  await prisma.lineaPresupuestoGasto.update({
    where: { id: linea.id },
    data: { montoEjecutado: nuevoEjecutado },
  })

  return {
    excedido,
    porcentaje,
    disponible: Math.max(0, linea.montoPresupuestado - totalUsado),
    alertaNivel: porcentaje >= 100 ? "rojo" : porcentaje >= 80 ? "amarillo" : "verde",
  }
}

// ─── Registrar compromiso (al aprobar OC) ──────────────────────────────────

export async function registrarCompromiso(params: {
  empresaId: number
  cuentaContableId: number
  centroCostoId?: number
  mes: number
  ejercicio: number
  monto: number
}) {
  const presupuesto = await prisma.presupuestoGasto.findFirst({
    where: {
      empresaId: params.empresaId,
      ejercicio: params.ejercicio,
      estado: { in: ["aprobado", "vigente"] },
    },
  })
  if (!presupuesto) return null

  const linea = await prisma.lineaPresupuestoGasto.findFirst({
    where: {
      presupuestoId: presupuesto.id,
      mes: params.mes,
      cuentaContableId: params.cuentaContableId,
    },
  })
  if (!linea) return null

  await prisma.lineaPresupuestoGasto.update({
    where: { id: linea.id },
    data: { montoComprometido: { increment: params.monto } },
  })

  return { comprometidoTotal: linea.montoComprometido + params.monto }
}

// ─── Reporte presupuesto vs real ────────────────────────────────────────────

export async function reportePresupuestoVsReal(empresaId: number, ejercicio: number) {
  const presupuesto = await prisma.presupuestoGasto.findFirst({
    where: { empresaId, ejercicio, estado: { in: ["aprobado", "vigente"] } },
    include: { lineas: { orderBy: { mes: "asc" } } },
  })

  if (!presupuesto) return null

  const resumen = presupuesto.lineas.map((l) => {
    const totalUsado = l.montoEjecutado + l.montoComprometido
    const desvio = totalUsado - l.montoPresupuestado
    const porcentaje = l.montoPresupuestado > 0
      ? Math.round((totalUsado / l.montoPresupuestado) * 100)
      : 0

    return {
      id: l.id,
      mes: l.mes,
      cuentaContableId: l.cuentaContableId,
      centroCostoId: l.centroCostoId,
      presupuestado: l.montoPresupuestado,
      ejecutado: l.montoEjecutado,
      comprometido: l.montoComprometido,
      totalUsado,
      disponible: Math.max(0, l.montoPresupuestado - totalUsado),
      desvio,
      porcentaje,
      nivel: porcentaje >= 100 ? "rojo" : porcentaje >= 80 ? "amarillo" : "verde",
    }
  })

  const totales = {
    presupuestado: resumen.reduce((s, r) => s + r.presupuestado, 0),
    ejecutado: resumen.reduce((s, r) => s + r.ejecutado, 0),
    comprometido: resumen.reduce((s, r) => s + r.comprometido, 0),
    disponible: resumen.reduce((s, r) => s + r.disponible, 0),
  }

  return { presupuesto, lineas: resumen, totales }
}

// ─── Helper: recalcular total ───────────────────────────────────────────────

async function recalcularTotal(presupuestoId: number) {
  const lineas = await prisma.lineaPresupuestoGasto.findMany({
    where: { presupuestoId },
  })
  const total = lineas.reduce((s, l) => s + l.montoPresupuestado, 0)
  await prisma.presupuestoGasto.update({
    where: { id: presupuestoId },
    data: { montoTotal: total },
  })
}
