import { prisma } from "@/lib/prisma"

/* ═══════════════════════════════════════════════════════════════════════════
   KPI DASHBOARD EJECUTIVO — Tablero de Control en Tiempo Real
   Equivalente a SAP Analytics Cloud + Tango Tablero de Control
   ═══════════════════════════════════════════════════════════════════════════ */

interface KPIResult {
  codigo: string
  nombre: string
  valor: number
  unidad: string
  meta: number | null
  nivel: "verde" | "amarillo" | "rojo"
  tendencia: "subiendo" | "bajando" | "estable"
}

// ─── Calcular KPIs en tiempo real ───────────────────────────────────────────

export async function calcularKPIs(empresaId: number): Promise<KPIResult[]> {
  const hoy = new Date()
  const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1)
  const inicioDia = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate())
  const hace30d = new Date(); hace30d.setDate(hace30d.getDate() - 30)
  const hace60d = new Date(); hace60d.setDate(hace60d.getDate() - 60)

  const kpis: KPIResult[] = []

  // 1. Ventas del día
  const ventasDia = await prisma.factura.aggregate({
    where: { empresaId, createdAt: { gte: inicioDia }, estado: { not: "anulada" } },
    _sum: { total: true },
    _count: true,
  })
  kpis.push({
    codigo: "VENTA_DIA",
    nombre: "Ventas del día",
    valor: ventasDia._sum.total ?? 0,
    unidad: "ARS",
    meta: null,
    nivel: "verde",
    tendencia: "estable",
  })

  // 2. Ventas del mes
  const ventasMes = await prisma.factura.aggregate({
    where: { empresaId, createdAt: { gte: inicioMes }, estado: { not: "anulada" } },
    _sum: { total: true },
    _count: true,
  })
  kpis.push({
    codigo: "VENTA_MES",
    nombre: "Ventas del mes",
    valor: ventasMes._sum.total ?? 0,
    unidad: "ARS",
    meta: null,
    nivel: "verde",
    tendencia: "estable",
  })

  // 3. Ticket promedio
  const ticketPromedio =
    ventasMes._count > 0 ? (ventasMes._sum.total ?? 0) / ventasMes._count : 0
  kpis.push({
    codigo: "TICKET_PROMEDIO",
    nombre: "Ticket promedio",
    valor: Math.round(ticketPromedio),
    unidad: "ARS",
    meta: null,
    nivel: "verde",
    tendencia: "estable",
  })

  // 4. DSO (Days Sales Outstanding)
  const cxcPendientes = await prisma.cuentaCobrar.aggregate({
    where: { empresaId, estado: { in: ["pendiente", "parcial"] } },
    _sum: { saldo: true },
  })
  const ventasDiarias30d = await prisma.factura.aggregate({
    where: { empresaId, createdAt: { gte: hace30d }, estado: { not: "anulada" } },
    _sum: { total: true },
  })
  const ventaDiaria = (ventasDiarias30d._sum.total ?? 1) / 30
  const dso = ventaDiaria > 0 ? Math.round((cxcPendientes._sum.saldo ?? 0) / ventaDiaria) : 0
  kpis.push({
    codigo: "DSO",
    nombre: "Días promedio de cobro",
    valor: dso,
    unidad: "días",
    meta: 30,
    nivel: dso > 60 ? "rojo" : dso > 30 ? "amarillo" : "verde",
    tendencia: "estable",
  })

  // 5. DPO (Days Payable Outstanding)
  const cxpPendientes = await prisma.cuentaPagar.aggregate({
    where: { empresaId, estado: { in: ["pendiente", "parcial"] } },
    _sum: { saldo: true },
  })
  const compras30d = await prisma.compra.aggregate({
    where: { empresaId, createdAt: { gte: hace30d } },
    _sum: { total: true },
  })
  const compraDiaria = (compras30d._sum.total ?? 1) / 30
  const dpo = compraDiaria > 0 ? Math.round((cxpPendientes._sum.saldo ?? 0) / compraDiaria) : 0
  kpis.push({
    codigo: "DPO",
    nombre: "Días promedio de pago",
    valor: dpo,
    unidad: "días",
    meta: null,
    nivel: "verde",
    tendencia: "estable",
  })

  // 6. Índice de morosidad (% CxC vencida)
  const cxcVencidas = await prisma.cuentaCobrar.aggregate({
    where: {
      empresaId,
      estado: { in: ["pendiente", "parcial"] },
      fechaVencimiento: { lt: hoy },
    },
    _sum: { saldo: true },
  })
  const totalCxC = cxcPendientes._sum.saldo ?? 0
  const morosidad = totalCxC > 0 ? Math.round(((cxcVencidas._sum.saldo ?? 0) / totalCxC) * 100) : 0
  kpis.push({
    codigo: "MOROSIDAD",
    nombre: "Índice de morosidad",
    valor: morosidad,
    unidad: "%",
    meta: 10,
    nivel: morosidad > 30 ? "rojo" : morosidad > 15 ? "amarillo" : "verde",
    tendencia: "estable",
  })

  // 7. Productos bajo stock mínimo
  const productosBajoMinimo = await prisma.producto.count({
    where: {
      empresaId,
      activo: true,
      stockMinimo: { not: null },
      stock: { lt: prisma.producto.fields.stockMinimo as unknown as number },
    },
  })
  // Fallback: query all
  const allProds = await prisma.producto.findMany({
    where: { empresaId, activo: true },
    select: { stock: true, stockMinimo: true },
  })
  const bajoMinimo = allProds.filter((p) => p.stockMinimo != null && p.stock < p.stockMinimo).length
  kpis.push({
    codigo: "STOCK_BAJO_MINIMO",
    nombre: "Productos bajo stock mínimo",
    valor: bajoMinimo,
    unidad: "productos",
    meta: 0,
    nivel: bajoMinimo > 10 ? "rojo" : bajoMinimo > 3 ? "amarillo" : "verde",
    tendencia: "estable",
  })

  // 8. Cantidad de facturas del día
  kpis.push({
    codigo: "FACTURAS_DIA",
    nombre: "Facturas emitidas hoy",
    valor: ventasDia._count,
    unidad: "facturas",
    meta: null,
    nivel: "verde",
    tendencia: "estable",
  })

  // 9. CxC total pendiente
  kpis.push({
    codigo: "CXC_TOTAL",
    nombre: "Cuentas a cobrar pendientes",
    valor: Math.round(cxcPendientes._sum.saldo ?? 0),
    unidad: "ARS",
    meta: null,
    nivel: "verde",
    tendencia: "estable",
  })

  // 10. CxP total pendiente
  kpis.push({
    codigo: "CXP_TOTAL",
    nombre: "Cuentas a pagar pendientes",
    valor: Math.round(cxpPendientes._sum.saldo ?? 0),
    unidad: "ARS",
    meta: null,
    nivel: "verde",
    tendencia: "estable",
  })

  // Calcular tendencias comparando con período anterior
  await calcularTendencias(empresaId, kpis, hace30d, hace60d)

  return kpis
}

// ─── Guardar snapshot diario ────────────────────────────────────────────────

export async function guardarSnapshotDiario(empresaId: number) {
  const kpis = await calcularKPIs(empresaId)
  const hoy = new Date()
  hoy.setHours(0, 0, 0, 0)

  for (const kpi of kpis) {
    // Buscar o crear definición
    let def = await prisma.kPIDefinicion.findUnique({
      where: { empresaId_codigo: { empresaId, codigo: kpi.codigo } },
    })

    if (!def) {
      def = await prisma.kPIDefinicion.create({
        data: {
          codigo: kpi.codigo,
          nombre: kpi.nombre,
          categoria: categoriaDeKPI(kpi.codigo),
          unidad: kpi.unidad,
          metaValor: kpi.meta,
          empresaId,
        },
      })
    }

    // Upsert snapshot del día
    const existing = await prisma.kPISnapshot.findFirst({
      where: { kpiId: def.id, fecha: hoy },
    })

    if (existing) {
      await prisma.kPISnapshot.update({
        where: { id: existing.id },
        data: { valor: kpi.valor },
      })
    } else {
      await prisma.kPISnapshot.create({
        data: { kpiId: def.id, valor: kpi.valor, fecha: hoy },
      })
    }
  }

  return { guardados: kpis.length }
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function categoriaDeKPI(codigo: string): string {
  if (codigo.startsWith("VENTA") || codigo === "TICKET_PROMEDIO" || codigo === "FACTURAS_DIA") return "ventas"
  if (codigo.startsWith("CXC") || codigo.startsWith("CXP") || codigo === "DSO" || codigo === "DPO" || codigo === "MOROSIDAD") return "finanzas"
  if (codigo.startsWith("STOCK")) return "stock"
  return "general"
}

async function calcularTendencias(
  empresaId: number,
  kpis: KPIResult[],
  _hace30d: Date,
  _hace60d: Date,
) {
  // Tendencia basada en snapshots previos (últimos 7 días vs 7 anteriores)
  const hace7d = new Date(); hace7d.setDate(hace7d.getDate() - 7)
  const hace14d = new Date(); hace14d.setDate(hace14d.getDate() - 14)

  const definiciones = await prisma.kPIDefinicion.findMany({
    where: { empresaId },
    include: {
      snapshots: {
        where: { fecha: { gte: hace14d } },
        orderBy: { fecha: "asc" },
      },
    },
  })

  for (const def of definiciones) {
    const kpi = kpis.find((k) => k.codigo === def.codigo)
    if (!kpi || def.snapshots.length < 2) continue

    const recientes = def.snapshots.filter((s) => new Date(s.fecha) >= hace7d)
    const anteriores = def.snapshots.filter((s) => new Date(s.fecha) < hace7d)

    if (recientes.length > 0 && anteriores.length > 0) {
      const promReciente = recientes.reduce((s, r) => s + r.valor, 0) / recientes.length
      const promAnterior = anteriores.reduce((s, r) => s + r.valor, 0) / anteriores.length
      const cambio = promAnterior > 0 ? ((promReciente - promAnterior) / promAnterior) * 100 : 0

      kpi.tendencia = cambio > 5 ? "subiendo" : cambio < -5 ? "bajando" : "estable"
    }
  }
}
