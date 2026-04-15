import { type NextRequest, NextResponse } from "next/server"
import { getAuthContext } from "@/lib/auth/empresa-guard"
import { prisma } from "@/lib/prisma"

/**
 * GET    /api/notas-debito/[id] — Full ND detail with lines, factura
 * DELETE /api/notas-debito/[id] — Anular ND
 */

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const ctx = await getAuthContext(request)
    if (!ctx.ok) return ctx.response

    const { id } = await params

    const nd = await prisma.notaDebito.findFirst({
      where: { id: parseInt(id), empresaId: ctx.auth.empresaId },
      include: {
        factura: { select: { id: true, tipo: true, numero: true, puntoVenta: true, total: true } },
        cliente: { select: { id: true, nombre: true, cuit: true } },
        proveedor: { select: { id: true, nombre: true, cuit: true } },
        lineas: true,
      },
    })

    if (!nd) {
      return NextResponse.json({ error: "Nota de débito no encontrada" }, { status: 404 })
    }

    return NextResponse.json(nd)
  } catch (error) {
    console.error("Error al obtener ND:", error)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const ctx = await getAuthContext(request)
    if (!ctx.ok) return ctx.response

    const { id } = await params

    const nd = await prisma.notaDebito.findFirst({
      where: { id: parseInt(id), empresaId: ctx.auth.empresaId },
    })
    if (!nd) return NextResponse.json({ error: "ND no encontrada" }, { status: 404 })
    if (nd.estado === "anulada") return NextResponse.json({ error: "ND ya anulada" }, { status: 400 })

    await prisma.notaDebito.update({
      where: { id: nd.id },
      data: { estado: "anulada" },
    })

    return NextResponse.json({ success: true, message: "Nota de débito anulada" })
  } catch (error) {
    console.error("Error al anular ND:", error)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}
