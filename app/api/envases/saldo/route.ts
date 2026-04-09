import { type NextRequest, NextResponse } from "next/server"
import { getAuthContext } from "@/lib/auth/middleware"
import { prisma } from "@/lib/prisma"

// ─── SALDO DE ENVASES POR CLIENTE ─────────────────────────────────────────────
// GET ?clienteId=N  → saldo de envases de un cliente específico por tipo
// GET               → ranking de todos los clientes con saldo pendiente > 0
//
// saldo = entregados - retornados (cantidad de envases que el cliente tiene)
// Un saldo positivo indica que el cliente tiene envases en su poder que debe devolver.

export async function GET(request: NextRequest) {
  try {
    const db = prisma as any
    const ctx = await getAuthContext(request)
    if (!ctx) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const clienteId = searchParams.get("clienteId") ? Number(searchParams.get("clienteId")) : undefined

    const where: any = { empresaId: ctx.empresaId }
    if (clienteId) where.clienteId = clienteId

    // Agrupar por cliente + tipoEnvase + tipo de movimiento
    const grouped = await db.movimientoEnvase.groupBy({
      by: ["clienteId", "tipoEnvaseId", "tipo"],
      where: { ...where, clienteId: { not: null } },
      _sum: { cantidad: true },
    })

    // Calcular saldo neto por cliente + tipoEnvase
    const saldoMap: Record<string, { clienteId: number; tipoEnvaseId: number; saldo: number }> = {}
    for (const g of grouped) {
      const key = `${g.clienteId}_${g.tipoEnvaseId}`
      if (!saldoMap[key]) saldoMap[key] = { clienteId: g.clienteId!, tipoEnvaseId: g.tipoEnvaseId, saldo: 0 }
      const cant = g._sum.cantidad ?? 0
      if (g.tipo === "entrega") saldoMap[key].saldo += cant
      else if (g.tipo === "retorno") saldoMap[key].saldo -= cant
      // ajuste: no suma ni resta automáticamente (correcciones manuales)
    }

    // Filtrar saldos > 0 (tienen envases pendientes de retorno)
    const saldosPositivos = Object.values(saldoMap).filter((s) => s.saldo > 0)

    if (saldosPositivos.length === 0) return NextResponse.json([])

    // Enriquecer con datos de cliente y tipo de envase
    const clienteIds = [...new Set(saldosPositivos.map((s) => s.clienteId))]
    const tipoIds = [...new Set(saldosPositivos.map((s) => s.tipoEnvaseId))]

    const [clientes, tipos] = await Promise.all([
      db.cliente.findMany({
        where: { id: { in: clienteIds } },
        select: { id: true, nombre: true, cuit: true, telefono: true },
      }),
      db.tipoEnvase.findMany({
        where: { id: { in: tipoIds } },
        select: { id: true, nombre: true, unidadMedida: true, valorDeposito: true },
      }),
    ])

    const clienteMap = Object.fromEntries(clientes.map((c: any) => [c.id, c]))
    const tipoMap = Object.fromEntries(tipos.map((t: any) => [t.id, t]))

    const result = saldosPositivos.map((s) => ({
      clienteId: s.clienteId,
      cliente: clienteMap[s.clienteId] ?? null,
      tipoEnvaseId: s.tipoEnvaseId,
      tipoEnvase: tipoMap[s.tipoEnvaseId] ?? null,
      saldo: s.saldo,
      valorDeposito:
        tipoMap[s.tipoEnvaseId] ? Number(tipoMap[s.tipoEnvaseId].valorDeposito) * s.saldo : 0,
    }))

    // Ordenar por valor de depósito pendiente descendente
    result.sort((a, b) => b.valorDeposito - a.valorDeposito)

    return NextResponse.json(result)
  } catch (error) {
    console.error("Error al calcular saldo de envases:", error)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}
