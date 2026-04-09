import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { verificarToken } from "@/lib/auth/middleware"
import { z } from "zod"
import { getTipoComprobante } from "@/lib/afip/tipos-comprobante"

const patchSchema = z.object({
  descripcion: z.string().optional(),
  activo: z.boolean().optional(),
  tipoCbteAfip: z.number().int().positive().optional(),
})

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const usuario = await verificarToken(request)
  if (!usuario) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const { id } = await params
  const item = await prisma.serie.findUnique({
    where: { id: Number(id) },
    include: {
      puntoVenta: true,
      facturas: { orderBy: { createdAt: "desc" }, take: 10, select: { id: true, tipo: true, numero: true, total: true, createdAt: true } },
    },
  })

  if (!item) return NextResponse.json({ error: "No encontrado" }, { status: 404 })
  return NextResponse.json(item)
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const usuario = await verificarToken(request)
  if (!usuario) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const { id } = await params
  const body = await request.json()
  const parsed = patchSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos", detalles: parsed.error.errors }, { status: 400 })
  }

  const data: Record<string, unknown> = { ...parsed.data }

  if (parsed.data.tipoCbteAfip !== undefined) {
    const tipoCbte = getTipoComprobante(parsed.data.tipoCbteAfip)
    if (!tipoCbte) {
      return NextResponse.json({ error: `Tipo ${parsed.data.tipoCbteAfip} no reconocido` }, { status: 400 })
    }
    data.letraComprobante  = tipoCbte.letra
    data.nombreComprobante = tipoCbte.nombre
  }

  const updated = await prisma.serie.update({ where: { id: Number(id) }, data })
  return NextResponse.json(updated)
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const usuario = await verificarToken(request)
  if (!usuario) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const { id } = await params
  // No eliminar si tiene facturas — sólo desactivar
  const facturas = await prisma.factura.count({ where: { serieId: Number(id) } })
  if (facturas > 0) {
    await prisma.serie.update({ where: { id: Number(id) }, data: { activo: false } })
    return NextResponse.json({ mensaje: "Serie desactivada (tiene facturas emitidas)" })
  }

  await prisma.serie.delete({ where: { id: Number(id) } })
  return NextResponse.json({ mensaje: "Eliminada" })
}
