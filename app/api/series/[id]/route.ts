import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getAuthContext } from "@/lib/auth/empresa-guard"
import { z } from "zod"
import { getTipoComprobante } from "@/lib/afip/tipos-comprobante"

const patchSchema = z.object({
  descripcion: z.string().optional(),
  activo: z.boolean().optional(),
  tipoCbteAfip: z.number().int().positive().optional(),
})

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await getAuthContext(request)
  if (!ctx.ok) return ctx.response

  const { id } = await params
  const serieId = Number(id)
  if (isNaN(serieId)) return NextResponse.json({ error: "ID inválido" }, { status: 400 })

  // ── TENANT ISOLATION: series belong to empresa via puntoVenta ──
  const item = await prisma.serie.findFirst({
    where: { id: serieId, puntoVenta: { empresaId: ctx.auth.empresaId } },
    include: {
      puntoVenta: true,
      facturas: { orderBy: { createdAt: "desc" }, take: 10, select: { id: true, tipo: true, numero: true, total: true, createdAt: true } },
    },
  })

  if (!item) return NextResponse.json({ error: "No encontrado" }, { status: 404 })
  return NextResponse.json(item)
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await getAuthContext(request)
  if (!ctx.ok) return ctx.response

  const { id } = await params
  const serieId = Number(id)
  if (isNaN(serieId)) return NextResponse.json({ error: "ID inválido" }, { status: 400 })

  const body = await request.json()
  const parsed = patchSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos", detalles: parsed.error.errors }, { status: 400 })
  }

  // ── TENANT ISOLATION ──
  const existing = await prisma.serie.findFirst({
    where: { id: serieId, puntoVenta: { empresaId: ctx.auth.empresaId } },
    select: { id: true },
  })
  if (!existing) return NextResponse.json({ error: "No encontrado" }, { status: 404 })

  const data: Record<string, unknown> = { ...parsed.data }

  if (parsed.data.tipoCbteAfip !== undefined) {
    const tipoCbte = getTipoComprobante(parsed.data.tipoCbteAfip)
    if (!tipoCbte) {
      return NextResponse.json({ error: `Tipo ${parsed.data.tipoCbteAfip} no reconocido` }, { status: 400 })
    }
    data.letraComprobante  = tipoCbte.letra
    data.nombreComprobante = tipoCbte.nombre
  }

  const updated = await prisma.serie.update({ where: { id: existing.id }, data })
  return NextResponse.json(updated)
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await getAuthContext(request)
  if (!ctx.ok) return ctx.response

  const { id } = await params
  const serieId = Number(id)
  if (isNaN(serieId)) return NextResponse.json({ error: "ID inválido" }, { status: 400 })

  // ── TENANT ISOLATION ──
  const existing = await prisma.serie.findFirst({
    where: { id: serieId, puntoVenta: { empresaId: ctx.auth.empresaId } },
    select: { id: true },
  })
  if (!existing) return NextResponse.json({ error: "No encontrado" }, { status: 404 })

  // No eliminar si tiene facturas — sólo desactivar
  const facturas = await prisma.factura.count({ where: { serieId: existing.id } })
  if (facturas > 0) {
    await prisma.serie.update({ where: { id: existing.id }, data: { activo: false } })
    return NextResponse.json({ mensaje: "Serie desactivada (tiene facturas emitidas)" })
  }

  await prisma.serie.delete({ where: { id: existing.id } })
  return NextResponse.json({ mensaje: "Eliminada" })
}
