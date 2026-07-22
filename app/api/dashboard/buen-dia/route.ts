import { type NextRequest, NextResponse } from "next/server"
import { getAuthContext, whereEmpresa } from "@/lib/auth/empresa-guard"
import { prisma } from "@/lib/prisma"

/**
 * GET /api/dashboard/buen-dia
 * KPIs livianos multi-tenant para el home "Buen día".
 */
export async function GET(request: NextRequest) {
  const auth = await getAuthContext(request)
  if (!auth.ok) return auth.response

  const empresaId = auth.auth.empresaId
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  try {
    const db = prisma as any

    const ventasHoyCount = await db.factura.count({
      where: {
        ...whereEmpresa(empresaId),
        createdAt: { gte: today },
        deletedAt: null,
        estado: { not: "anulada" },
      },
    }).catch(() => 0)

    const ventasHoySuma = await db.factura.aggregate({
      where: {
        ...whereEmpresa(empresaId),
        createdAt: { gte: today },
        deletedAt: null,
        estado: { not: "anulada" },
      },
      _sum: { total: true },
    }).catch(() => ({ _sum: { total: 0 } }))

    const stockBajo = await db.producto.count({
      where: {
        ...whereEmpresa(empresaId),
        activo: true,
        deletedAt: null,
        stock: { lte: 5 },
      },
    }).catch(() => 0)

    const cajaAbierta = await db.caja.findFirst({
      where: { ...whereEmpresa(empresaId), estado: "abierta" },
      select: { id: true },
    }).catch(() => null)

    const deudaCc = await db.cuentaCobrar.aggregate({
      where: {
        saldo: { gt: 0 },
        estado: { notIn: ["pagada", "anulada"] },
        fechaVencimiento: { lt: today },
        cliente: { empresaId },
      },
      _sum: { saldo: true },
      _count: { id: true },
    }).catch(() => ({ _sum: { saldo: 0 }, _count: { id: 0 } }))

    const fiadoClientes = await db.cliente.aggregate({
      where: {
        ...whereEmpresa(empresaId),
        deletedAt: null,
        activo: true,
        saldoCuentaCorriente: { gt: 0 },
      },
      _sum: { saldoCuentaCorriente: true },
      _count: { id: true },
    }).catch(() => ({ _sum: { saldoCuentaCorriente: 0 }, _count: { id: 0 } }))

    const turnosHoy = await db.turno.count({
      where: {
        ...whereEmpresa(empresaId),
        fecha: { gte: today, lt: tomorrow },
        estado: { notIn: ["cancelado", "no_asistio"] },
      },
    }).catch(() => 0)

    const mesasAbiertas = await db.mesa.count({
      where: {
        estado: { in: ["ocupada", "cuenta_pedida"] },
        salon: { empresaId },
      },
    }).catch(() => 0)

    const cxcVencido = Number(deudaCc._sum.saldo ?? 0)
    const morosos = deudaCc._count.id
    const deudaFiado = Number(fiadoClientes._sum.saldoCuentaCorriente ?? 0)
    const clientesDeuda = fiadoClientes._count.id

    // Preferir fiado CC si hay saldo; si no, CxC vencida
    const deudaTotal = deudaFiado > 0 ? deudaFiado : cxcVencido
    const clientesConDeuda = deudaFiado > 0 ? clientesDeuda : morosos

    return NextResponse.json({
      ventas_hoy: Number(ventasHoySuma._sum.total ?? 0),
      tickets_hoy: ventasHoyCount,
      stock_bajo: stockBajo,
      estado_caja: cajaAbierta ? "Abierta" : "Cerrada",
      deuda_total: deudaTotal,
      clientes_deuda: clientesConDeuda,
      fiados_hoy: null as number | null, // sin ledger diario de fiado en schema
      cxc_vencido: cxcVencido,
      morosos,
      turnos_hoy: turnosHoy,
      mesas_abiertas: mesasAbiertas,
    })
  } catch (err) {
    console.error("BuenDia API Error:", err)
    return NextResponse.json({ error: "Error calculando métricas" }, { status: 500 })
  }
}
