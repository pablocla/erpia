import { prisma } from "@/lib/prisma"
import { IVAService } from "@/lib/impuestos/iva-service"
import { obtenerDeclaracion } from "@/lib/impuestos/declaracion-jurada-service"

export type ChecklistItem = {
  id: string
  label: string
  ok: boolean
  severidad: "critico" | "advertencia" | "info"
  detalle: string
  valor?: number | string
}

export type PrePresentacionResult = {
  mes: number
  anio: number
  periodo: string
  listo: boolean
  items: ChecklistItem[]
  resumen: { ok: number; total: number; criticos: number }
}

function rangoPeriodo(mes: number, anio: number) {
  const desde = new Date(anio, mes - 1, 1)
  const hasta = new Date(anio, mes, 0, 23, 59, 59, 999)
  return { desde, hasta }
}

export class PrePresentacionService {
  async evaluar(empresaId: number, mes: number, anio: number): Promise<PrePresentacionResult> {
    const { desde, hasta } = rangoPeriodo(mes, anio)
    const items: ChecklistItem[] = []

    const [
      facturasSinAuth,
      totalFacturas,
      totalCompras,
      totalCobros,
      totalPagos,
      chequesCartera,
      asientosPeriodo,
      periodoFiscal,
      declaracionIVA,
    ] = await Promise.all([
      prisma.factura.count({
        where: {
          empresaId,
          deletedAt: null,
          createdAt: { gte: desde, lte: hasta },
          estado: "emitida",
          cae: null,
          caea: null,
        },
      }),
      prisma.factura.count({
        where: {
          empresaId,
          deletedAt: null,
          createdAt: { gte: desde, lte: hasta },
          estado: "emitida",
        },
      }),
      prisma.compra.count({
        where: { empresaId, fecha: { gte: desde, lte: hasta } },
      }),
      prisma.recibo.count({
        where: {
          fecha: { gte: desde, lte: hasta },
          cliente: { empresaId },
        },
      }),
      prisma.ordenPago.count({
        where: {
          fecha: { gte: desde, lte: hasta },
          proveedor: { empresaId },
        },
      }),
      prisma.cheque.count({
        where: {
          estado: "cartera",
          tipoCheque: "tercero",
          OR: [
            { cliente: { empresaId } },
            { recibo: { cliente: { empresaId } } },
          ],
        },
      }),
      prisma.asientoContable.findMany({
        where: {
          empresaId,
          deletedAt: null,
          fecha: { gte: desde, lte: hasta },
        },
        include: { movimientos: true },
      }),
      prisma.periodoFiscal.findUnique({
        where: { empresaId_mes_anio: { empresaId, mes, anio } },
      }),
      obtenerDeclaracion(empresaId, "IVA", mes, anio),
    ])

    items.push({
      id: "facturas_cae",
      label: "Facturas del mes con CAE/CAEA",
      ok: facturasSinAuth === 0,
      severidad: "critico",
      detalle:
        facturasSinAuth === 0
          ? `${totalFacturas} facturas emitidas con autorización fiscal`
          : `${facturasSinAuth} factura(s) sin CAE/CAEA de ${totalFacturas} emitidas`,
      valor: facturasSinAuth,
    })

    items.push({
      id: "compras_registradas",
      label: "Compras del período registradas",
      ok: totalCompras > 0 || totalFacturas === 0,
      severidad: "advertencia",
      detalle: `${totalCompras} compra(s) en el período`,
      valor: totalCompras,
    })

    items.push({
      id: "cobros_mes",
      label: "Cobranzas del mes registradas",
      ok: true,
      severidad: "info",
      detalle: `${totalCobros} recibo(s) en el período`,
      valor: totalCobros,
    })

    items.push({
      id: "pagos_mes",
      label: "Pagos del mes registrados",
      ok: true,
      severidad: "info",
      detalle: `${totalPagos} orden(es) de pago en el período`,
      valor: totalPagos,
    })

    items.push({
      id: "cheques_cartera",
      label: "Cheques en cartera documentados",
      ok: chequesCartera === 0,
      severidad: "advertencia",
      detalle:
        chequesCartera === 0
          ? "Sin cheques pendientes de depósito"
          : `${chequesCartera} cheque(s) en cartera sin depositar`,
      valor: chequesCartera,
    })

    const descuadrados = asientosPeriodo.filter((a) => {
      const debe = a.movimientos.reduce((s, m) => s + Number(m.debe), 0)
      const haber = a.movimientos.reduce((s, m) => s + Number(m.haber), 0)
      return Math.abs(debe - haber) > 0.01
    })

    items.push({
      id: "asientos_cuadran",
      label: "Asientos contables cuadran (debe = haber)",
      ok: descuadrados.length === 0,
      severidad: "critico",
      detalle:
        descuadrados.length === 0
          ? `${asientosPeriodo.length} asiento(s) verificados`
          : `${descuadrados.length} asiento(s) descuadrado(s)`,
      valor: descuadrados.length,
    })

    const estadoPeriodo = periodoFiscal?.estado ?? "abierto"
    items.push({
      id: "periodo_abierto",
      label: "Período contable abierto para ajustes",
      ok: estadoPeriodo === "abierto",
      severidad: estadoPeriodo === "bloqueado" ? "critico" : "info",
      detalle: `Estado del período: ${estadoPeriodo}`,
      valor: estadoPeriodo,
    })

    let ivaCuadra = false
    let ivaDetalle = "Liquidación IVA no persistida"
    if (declaracionIVA) {
      const ivaService = new IVAService()
      const reporte = await ivaService.calcularIVAPeriodo(mes, anio, empresaId)
      const diff = Math.abs(Number(declaracionIVA.montoTotal) - reporte.saldo)
      ivaCuadra = diff < 0.02
      ivaDetalle = ivaCuadra
        ? `Liquidación persistida coincide (saldo $${reporte.saldo.toFixed(2)})`
        : `Diferencia $${diff.toFixed(2)} entre liquidación persistida y cálculo actual`
    }

    items.push({
      id: "liquidacion_iva",
      label: "Posición IVA = liquidación persistida",
      ok: declaracionIVA !== null && ivaCuadra,
      severidad: "critico",
      detalle: ivaDetalle,
      valor: declaracionIVA ? Number(declaracionIVA.montoTotal) : undefined,
    })

    const criticos = items.filter((i) => !i.ok && i.severidad === "critico").length
    const ok = items.filter((i) => i.ok).length

    return {
      mes,
      anio,
      periodo: `${String(mes).padStart(2, "0")}/${anio}`,
      listo: criticos === 0,
      items,
      resumen: { ok, total: items.length, criticos },
    }
  }
}

export const prePresentacionService = new PrePresentacionService()