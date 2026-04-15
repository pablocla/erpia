import { type NextRequest, NextResponse } from "next/server"
import { getAuthContext, whereEmpresa } from "@/lib/auth/empresa-guard"
import { prisma } from "@/lib/prisma"

/**
 * GET    /api/compras/[id] — Full compra detail with lines, proveedor, OC, CP
 * PATCH  /api/compras/[id] — Update observaciones or estado
 * DELETE /api/compras/[id] — Anular compra (soft void)
 */

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const ctx = await getAuthContext(request)
    if (!ctx.ok) return ctx.response

    const { id } = await params

    const compra = await prisma.compra.findFirst({
      where: whereEmpresa(ctx.auth.empresaId, { id: parseInt(id) }),
      include: {
        proveedor: true,
        lineas: true,
        ordenCompra: { select: { id: true, numero: true, estado: true } },
        cuentasPagar: {
          select: { id: true, numeroCuota: true, montoOriginal: true, saldo: true, estado: true, fechaVencimiento: true },
          orderBy: { numeroCuota: "asc" },
        },
        recepciones: {
          select: { id: true, numero: true, estado: true, createdAt: true },
        },
      },
    })

    if (!compra) {
      return NextResponse.json({ error: "Compra no encontrada" }, { status: 404 })
    }

    const saldoPendienteCP = compra.cuentasPagar.reduce((s, cp) => s + Number(cp.saldo), 0)

    return NextResponse.json({
      ...compra,
      resumen: {
        saldoPendienteCP: Math.round(saldoPendienteCP * 100) / 100,
        netoPagado: Math.round((compra.total - saldoPendienteCP) * 100) / 100,
      },
    })
  } catch (error) {
    console.error("Error al obtener compra:", error)
    return NextResponse.json({ error: "Error al obtener compra" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const ctx = await getAuthContext(request)
    if (!ctx.ok) return ctx.response

    const { id } = await params
    const body = await request.json()

    const existing = await prisma.compra.findFirst({
      where: whereEmpresa(ctx.auth.empresaId, { id: parseInt(id) }),
    })
    if (!existing) return NextResponse.json({ error: "Compra no encontrada" }, { status: 404 })

    const data: Record<string, unknown> = {}
    if (body.observaciones !== undefined) data.observaciones = body.observaciones
    if (body.estadoVerificacionCAE !== undefined) data.estadoVerificacionCAE = body.estadoVerificacionCAE

    const compra = await prisma.compra.update({
      where: { id: existing.id },
      data,
      include: { proveedor: { select: { id: true, nombre: true } } },
    })

    return NextResponse.json(compra)
  } catch (error) {
    console.error("Error al actualizar compra:", error)
    return NextResponse.json({ error: "Error al actualizar compra" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const ctx = await getAuthContext(request)
    if (!ctx.ok) return ctx.response

    const { id } = await params

    const existing = await prisma.compra.findFirst({
      where: whereEmpresa(ctx.auth.empresaId, { id: parseInt(id) }),
      include: { cuentasPagar: true },
    })
    if (!existing) return NextResponse.json({ error: "Compra no encontrada" }, { status: 404 })

    // Check that no CP has been paid
    const cpPagadas = existing.cuentasPagar.filter((cp) => Number(cp.montoPagado) > 0)
    if (cpPagadas.length > 0) {
      return NextResponse.json({
        error: "No se puede anular: existen pagos aplicados a esta compra",
      }, { status: 400 })
    }

    await prisma.$transaction([
      // Cancel outstanding CP
      prisma.cuentaPagar.updateMany({
        where: { compraId: existing.id },
        data: { estado: "anulada", saldo: 0 },
      }),
      // Mark compra as anulada
      prisma.compra.update({
        where: { id: existing.id },
        data: { deletedAt: new Date() },
      }),
    ])

    return NextResponse.json({ success: true, message: "Compra anulada" })
  } catch (error) {
    console.error("Error al anular compra:", error)
    return NextResponse.json({ error: "Error al anular compra" }, { status: 500 })
  }
}
