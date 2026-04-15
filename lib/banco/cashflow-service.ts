import { prisma } from "@/lib/prisma"

/* ═══════════════════════════════════════════════════════════════════════════
   FLUJO DE FONDOS PROYECTADO — Cash Flow Forecast
   Equivalente a SAP Cash Management + Tango Tablero Financiero
   ═══════════════════════════════════════════════════════════════════════════ */

// ─── Generar proyección desde fuentes reales ────────────────────────────────

export async function generarProyeccionFlujoCaja(empresaId: number, diasHorizonte: number = 90) {
  const hoy = new Date()
  const hasta = new Date()
  hasta.setDate(hasta.getDate() + diasHorizonte)

  // Limpiar proyección anterior no realizada
  await prisma.proyeccionFlujoCaja.deleteMany({
    where: { empresaId, realizado: false },
  })

  const proyecciones: Array<{
    fecha: Date
    tipo: string
    origenEntidad: string | null
    origenId: number | null
    concepto: string
    monto: number
    probabilidad: number
    empresaId: number
  }> = []

  // 1. Cobros previstos (CxC pendientes)
  const cxc = await prisma.cuentaCobrar.findMany({
    where: {
      empresaId,
      estado: { in: ["pendiente", "parcial"] },
      fechaVencimiento: { lte: hasta },
    },
  })
  for (const c of cxc) {
    proyecciones.push({
      fecha: c.fechaVencimiento,
      tipo: "cobro_previsto",
      origenEntidad: "cuenta_cobrar",
      origenId: c.id,
      concepto: `Cobro Factura #${c.facturaId ?? c.id}`,
      monto: c.saldo,
      probabilidad: c.fechaVencimiento < hoy ? 0.5 : 0.85,
      empresaId,
    })
  }

  // 2. Pagos previstos (CxP pendientes)
  const cxp = await prisma.cuentaPagar.findMany({
    where: {
      empresaId,
      estado: { in: ["pendiente", "parcial"] },
      fechaVencimiento: { lte: hasta },
    },
  })
  for (const p of cxp) {
    proyecciones.push({
      fecha: p.fechaVencimiento,
      tipo: "pago_previsto",
      origenEntidad: "cuenta_pagar",
      origenId: p.id,
      concepto: `Pago Compra #${p.compraId ?? p.id}`,
      monto: -p.saldo,
      probabilidad: 0.95,
      empresaId,
    })
  }

  // 3. Cheques diferidos a cobrar
  const chequesCobrar = await prisma.cheque.findMany({
    where: {
      empresaId,
      tipo: "tercero",
      estado: { in: ["en_cartera", "depositado"] },
      fechaCobro: { gte: hoy, lte: hasta },
    },
  })
  for (const ch of chequesCobrar) {
    proyecciones.push({
      fecha: ch.fechaCobro,
      tipo: "cheque_diferido_cobrar",
      origenEntidad: "cheque",
      origenId: ch.id,
      concepto: `Cheque tercero #${ch.numero}`,
      monto: ch.monto,
      probabilidad: 0.9,
      empresaId,
    })
  }

  // 4. Cheques propios emitidos (diferidos a pagar)
  const chequesPagar = await prisma.cheque.findMany({
    where: {
      empresaId,
      tipo: "propio",
      estado: { in: ["emitido"] },
      fechaCobro: { gte: hoy, lte: hasta },
    },
  })
  for (const ch of chequesPagar) {
    proyecciones.push({
      fecha: ch.fechaCobro,
      tipo: "cheque_diferido_pagar",
      origenEntidad: "cheque",
      origenId: ch.id,
      concepto: `Cheque propio #${ch.numero}`,
      monto: -ch.monto,
      probabilidad: 1.0,
      empresaId,
    })
  }

  // 5. Gastos recurrentes
  const gastos = await prisma.gastoRecurrente.findMany({
    where: { empresaId, activo: true },
  })
  for (const g of gastos) {
    const fechasGasto = calcularFechasRecurrentes(g.frecuencia, g.diaVencimiento, hoy, hasta)
    for (const fecha of fechasGasto) {
      proyecciones.push({
        fecha,
        tipo: "gasto_fijo",
        origenEntidad: "gasto_recurrente",
        origenId: g.id,
        concepto: g.concepto,
        monto: -g.monto,
        probabilidad: 1.0,
        empresaId,
      })
    }
  }

  // Insertar todo en batch
  if (proyecciones.length > 0) {
    await prisma.proyeccionFlujoCaja.createMany({ data: proyecciones })
  }

  return { totalProyecciones: proyecciones.length }
}

// ─── Obtener flujo de caja resumido por semana ──────────────────────────────

export async function obtenerFlujoPorSemana(empresaId: number, semanas: number = 12) {
  const hoy = new Date()
  const hasta = new Date()
  hasta.setDate(hasta.getDate() + semanas * 7)

  const proyecciones = await prisma.proyeccionFlujoCaja.findMany({
    where: {
      empresaId,
      fecha: { gte: hoy, lte: hasta },
    },
    orderBy: { fecha: "asc" },
  })

  // Agrupar por semana
  const semanaMap = new Map<string, { ingresos: number; egresos: number; neto: number }>()

  for (const p of proyecciones) {
    const weekStart = getWeekStart(new Date(p.fecha))
    const key = weekStart.toISOString().split("T")[0]

    const entry = semanaMap.get(key) ?? { ingresos: 0, egresos: 0, neto: 0 }
    const montoAjustado = p.monto * p.probabilidad

    if (montoAjustado >= 0) {
      entry.ingresos += montoAjustado
    } else {
      entry.egresos += Math.abs(montoAjustado)
    }
    entry.neto += montoAjustado
    semanaMap.set(key, entry)
  }

  // Calcular saldo acumulado
  let acumulado = 0
  const resultado = Array.from(semanaMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([semana, datos]) => {
      acumulado += datos.neto
      return {
        semana,
        ingresos: Math.round(datos.ingresos),
        egresos: Math.round(datos.egresos),
        neto: Math.round(datos.neto),
        acumulado: Math.round(acumulado),
      }
    })

  return resultado
}

// ─── Obtener resumen general ────────────────────────────────────────────────

export async function resumenFlujoCaja(empresaId: number) {
  const hoy = new Date()
  const en30d = new Date(); en30d.setDate(en30d.getDate() + 30)
  const en60d = new Date(); en60d.setDate(en60d.getDate() + 60)
  const en90d = new Date(); en90d.setDate(en90d.getDate() + 90)

  const [p30, p60, p90] = await Promise.all([
    sumaProyeccion(empresaId, hoy, en30d),
    sumaProyeccion(empresaId, hoy, en60d),
    sumaProyeccion(empresaId, hoy, en90d),
  ])

  return {
    proximos30: p30,
    proximos60: p60,
    proximos90: p90,
  }
}

// ─── Helpers ────────────────────────────────────────────────────────────────

async function sumaProyeccion(empresaId: number, desde: Date, hasta: Date) {
  const proyecciones = await prisma.proyeccionFlujoCaja.findMany({
    where: { empresaId, fecha: { gte: desde, lte: hasta }, realizado: false },
  })
  let ingresos = 0, egresos = 0
  for (const p of proyecciones) {
    const m = p.monto * p.probabilidad
    if (m >= 0) ingresos += m
    else egresos += Math.abs(m)
  }
  return {
    ingresos: Math.round(ingresos),
    egresos: Math.round(egresos),
    neto: Math.round(ingresos - egresos),
  }
}

function getWeekStart(date: Date): Date {
  const d = new Date(date)
  const day = d.getDay()
  d.setDate(d.getDate() - (day === 0 ? 6 : day - 1))
  return d
}

function calcularFechasRecurrentes(
  frecuencia: string,
  diaVencimiento: number,
  desde: Date,
  hasta: Date,
): Date[] {
  const fechas: Date[] = []
  const mesesIncremento = frecuencia === "mensual" ? 1
    : frecuencia === "bimestral" ? 2
    : frecuencia === "trimestral" ? 3
    : frecuencia === "anual" ? 12
    : 1

  const current = new Date(desde)
  current.setDate(diaVencimiento)
  if (current < desde) current.setMonth(current.getMonth() + 1)

  while (current <= hasta) {
    fechas.push(new Date(current))
    current.setMonth(current.getMonth() + mesesIncremento)
  }
  return fechas
}
