import { type NextRequest, NextResponse } from "next/server"
import { getAuthContext } from "@/lib/auth/empresa-guard"
import { logError } from "@/lib/monitoring/error-logger"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

// ─── GET — List cuentas a cobrar with aging ──────────────────────────────────

export async function GET(request: NextRequest) {
  try {
    const ctx = await getAuthContext(request)
    if (!ctx.ok) return ctx.response

    const { searchParams } = new URL(request.url)
    const estado = searchParams.get("estado")
    const clienteId = searchParams.get("clienteId")
    const skip = parseInt(searchParams.get("skip") ?? "0", 10)
    const take = Math.min(parseInt(searchParams.get("take") ?? "100", 10), 500)

    const where: Record<string, unknown> = { factura: { empresaId: ctx.auth.empresaId } }
    if (estado) where.estado = estado
    if (clienteId) where.clienteId = parseInt(clienteId, 10)

    const [data, total] = await Promise.all([
      prisma.cuentaCobrar.findMany({
        where,
        include: {
          factura: { select: { id: true, tipo: true, numero: true, puntoVenta: true } },
          cliente: { select: { id: true, nombre: true, cuit: true } },
        },
        orderBy: { fechaVencimiento: "asc" },
        skip,
        take,
      }),
      prisma.cuentaCobrar.count({ where }),
    ])

    // Calculate aging buckets
    const ahora = new Date()
    const pendientes = data.filter((cc: any) => cc.estado !== "pagada")
    const aging = { corriente: 0, bucket30: 0, bucket60: 0, bucket90: 0, bucket90plus: 0 }

    for (const cc of pendientes) {
      const saldo = Number((cc as any).saldo)
      const venc = new Date((cc as any).fechaVencimiento)
      const diasVencido = Math.floor((ahora.getTime() - venc.getTime()) / (1000 * 60 * 60 * 24))

      if (diasVencido <= 0) aging.corriente += saldo
      else if (diasVencido <= 30) aging.bucket30 += saldo
      else if (diasVencido <= 60) aging.bucket60 += saldo
      else if (diasVencido <= 90) aging.bucket90 += saldo
      else aging.bucket90plus += saldo
    }

    const totalPendiente = pendientes.reduce((s: number, cc: any) => s + Number(cc.saldo), 0)
    const totalVencido = pendientes
      .filter((cc: any) => new Date(cc.fechaVencimiento) < ahora)
      .reduce((s: number, cc: any) => s + Number(cc.saldo), 0)

    return NextResponse.json({
      data: data.map((cc: any) => ({
        ...cc,
        montoOriginal: Number(cc.montoOriginal),
        montoPagado: Number(cc.montoPagado),
        saldo: Number(cc.saldo),
        diasVencido: Math.floor((ahora.getTime() - new Date(cc.fechaVencimiento).getTime()) / (1000 * 60 * 60 * 24)),
      })),
      total,
      skip,
      take,
      resumen: {
        totalPendiente: Math.round(totalPendiente * 100) / 100,
        totalVencido: Math.round(totalVencido * 100) / 100,
        aging,
        cuentas: pendientes.length,
      },
    })
  } catch (error) {
    console.error("Error en GET cuentas-cobrar:", error)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}
