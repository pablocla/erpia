import { prisma } from "@/lib/prisma"
import { persistSistemaLog } from "@/lib/ops/sistema-log"
import {
  avisarMorosoExpensa,
  listarMorososExpensas,
} from "@/lib/consorcios/consorcios-morosos-service"

export type ConsorciosAlertasSummary = {
  morososAvisados: number
  morososOmitidos: number
  liquidacionesPendientes: number
}

/** Período YYYY-MM del mes anterior al actual */
export function periodoLiquidacionPendiente(ref = new Date()): string {
  const d = new Date(ref.getFullYear(), ref.getMonth() - 1, 1)
  const month = String(d.getMonth() + 1).padStart(2, "0")
  return `${d.getFullYear()}-${month}`
}

export function debeCorrerAlertaLiquidacion(ref = new Date()): boolean {
  const day = ref.getDate()
  return day >= 1 && day <= 5
}

async function yaNotificadoMoroso(expensaId: number, desde: Date): Promise<boolean> {
  const prev = await prisma.sistemaLog.findFirst({
    where: {
      categoria: "consorcio.moroso_expensa",
      createdAt: { gte: desde },
      mensaje: { contains: String(expensaId) },
    },
  })
  return Boolean(prev)
}

async function yaNotificadoLiquidacion(
  empresaId: number,
  consorcioId: number,
  periodo: string,
): Promise<boolean> {
  const prev = await prisma.sistemaLog.findFirst({
    where: {
      empresaId,
      categoria: "consorcio.liquidacion_pendiente",
      mensaje: { contains: `${consorcioId}:${periodo}` },
    },
  })
  return Boolean(prev)
}

/** Semanal: avisa por WA a inquilinos con expensa vencida pendiente */
export async function runMorosoExpensaAlertas(): Promise<{
  avisados: number
  omitidos: number
}> {
  const hace7d = new Date(Date.now() - 7 * 86_400_000)
  const empresas = await prisma.consorcio.findMany({
    distinct: ["empresaId"],
    select: { empresaId: true },
  })

  let avisados = 0
  let omitidos = 0

  for (const { empresaId } of empresas) {
    const morosos = await listarMorososExpensas(empresaId)
    for (const m of morosos) {
      if (m.diasMora <= 0 || !m.residenteTelefono) {
        omitidos++
        continue
      }
      if (await yaNotificadoMoroso(m.expensaId, hace7d)) {
        omitidos++
        continue
      }

      const result = await avisarMorosoExpensa(empresaId, m.expensaId)
      if (result.ok) {
        avisados++
        await persistSistemaLog({
          empresaId,
          severidad: "info",
          categoria: "consorcios",
          contexto: "consorcio.moroso_expensa",
          mensaje: `WA moroso expensa ${m.expensaId} UF ${m.unidadNumero} ${m.periodo}`,
          metadata: {
            expensaId: m.expensaId,
            consorcioId: m.consorcioId,
            diasMora: m.diasMora,
          },
        })
      } else {
        omitidos++
      }
    }
  }

  return { avisados, omitidos }
}

/** Día 1–5: alerta admin si hay gastos sin liquidar del período anterior */
export async function runLiquidacionPendienteAlertas(ref = new Date()): Promise<{
  alertas: number
  skipped: boolean
}> {
  if (!debeCorrerAlertaLiquidacion(ref)) {
    return { alertas: 0, skipped: true }
  }

  const periodo = periodoLiquidacionPendiente(ref)
  const consorcios = await prisma.consorcio.findMany({
    select: { id: true, nombre: true, empresaId: true },
  })

  let alertas = 0

  for (const c of consorcios) {
    const gastos = await prisma.consorcioGasto.count({
      where: { consorcioId: c.id, periodo },
    })
    if (gastos === 0) continue

    const expensas = await prisma.consorcioExpensa.count({
      where: {
        periodo,
        unidad: { consorcioId: c.id },
      },
    })
    if (expensas > 0) continue
    if (await yaNotificadoLiquidacion(c.empresaId, c.id, periodo)) continue

    await persistSistemaLog({
      empresaId: c.empresaId,
      severidad: "warn",
      categoria: "consorcios",
      contexto: "consorcio.liquidacion_pendiente",
      mensaje: `Liquidación pendiente ${c.id}:${periodo} — ${c.nombre}`,
      metadata: {
        consorcioId: c.id,
        periodo,
        href: "/dashboard/nicho/consorcios",
        accion: "liquidar_expensas",
      },
    })
    alertas++
  }

  return { alertas, skipped: false }
}

export async function runConsorciosAlertas(ref = new Date()): Promise<ConsorciosAlertasSummary> {
  const [morosos, liq] = await Promise.all([
    runMorosoExpensaAlertas(),
    runLiquidacionPendienteAlertas(ref),
  ])
  return {
    morososAvisados: morosos.avisados,
    morososOmitidos: morosos.omitidos,
    liquidacionesPendientes: liq.alertas,
  }
}