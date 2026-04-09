import { type NextRequest, NextResponse } from "next/server"
import { getAuthContext } from "@/lib/auth/empresa-guard"
import { logError } from "@/lib/monitoring/error-logger"
import { prisma } from "@/lib/prisma"

// ─── GET — List cuentas a pagar with aging ───────────────────────────────────

export async function GET(request: NextRequest) {
  try {
    const ctx = await getAuthContext(request)
    if (!ctx.ok) return ctx.response

    const { searchParams } = new URL(request.url)
    const estado = searchParams.get("estado")
    const proveedorId = searchParams.get("proveedorId")
    const skip = parseInt(searchParams.get("skip") ?? "0", 10)
    const take = Math.min(parseInt(searchParams.get("take") ?? "100", 10), 500)

    const where: Record<string, unknown> = { compra: { empresaId: ctx.auth.empresaId } }
    if (estado) where.estado = estado
    if (proveedorId) where.proveedorId = parseInt(proveedorId, 10)

    const [data, total] = await Promise.all([
      prisma.cuentaPagar.findMany({
        where,
        include: {
          compra: { select: { id: true, tipo: true, numero: true, puntoVenta: true } },
          proveedor: { select: { id: true, nombre: true, cuit: true } },
        },
        orderBy: { fechaVencimiento: "asc" },
        skip,
        take,
      }),
      prisma.cuentaPagar.count({ where }),
    ])

    // Calculate aging buckets
    const ahora = new Date()
    const pendientes = data.filter((cp: any) => cp.estado !== "pagada")
    const aging = { corriente: 0, bucket30: 0, bucket60: 0, bucket90: 0, bucket90plus: 0 }

    for (const cp of pendientes) {
      const saldo = Number((cp as any).saldo)
      const venc = new Date((cp as any).fechaVencimiento)
      const diasVencido = Math.floor((ahora.getTime() - venc.getTime()) / (1000 * 60 * 60 * 24))

      if (diasVencido <= 0) aging.corriente += saldo
      else if (diasVencido <= 30) aging.bucket30 += saldo
      else if (diasVencido <= 60) aging.bucket60 += saldo
      else if (diasVencido <= 90) aging.bucket90 += saldo
      else aging.bucket90plus += saldo
    }

    const totalPendiente = pendientes.reduce((s: number, cp: any) => s + Number(cp.saldo), 0)
    const totalVencido = pendientes
      .filter((cp: any) => new Date(cp.fechaVencimiento) < ahora)
      .reduce((s: number, cp: any) => s + Number(cp.saldo), 0)

    return NextResponse.json({
      data: data.map((cp: any) => ({
        ...cp,
        montoOriginal: Number(cp.montoOriginal),
        montoPagado: Number(cp.montoPagado),
        saldo: Number(cp.saldo),
        diasVencido: Math.floor((ahora.getTime() - new Date(cp.fechaVencimiento).getTime()) / (1000 * 60 * 60 * 24)),
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
    console.error("Error en GET cuentas-pagar:", error)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}
