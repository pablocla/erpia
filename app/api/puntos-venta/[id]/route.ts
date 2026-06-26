import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getAuthContext } from "@/lib/auth/empresa-guard"
import { z } from "zod"

const patchSchema = z.object({
  nombre: z.string().min(1).optional(),
  descripcion: z.string().optional(),
  tipo: z.enum(["electronico", "manual", "web", "factura_credito"]).optional(),
  activo: z.boolean().optional(),
  esDefault: z.boolean().optional(),
})

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await getAuthContext(request)
  if (!ctx.ok) return ctx.response

  const { id } = await params
  const pvId = Number(id)
  if (isNaN(pvId)) return NextResponse.json({ error: "ID inválido" }, { status: 400 })

  // ── TENANT ISOLATION ──
  const item = await prisma.puntoVentaConfig.findFirst({
    where: { id: pvId, empresaId: ctx.auth.empresaId },
    include: {
      empresa: { select: { id: true, razonSocial: true, cuit: true } },
      series: {
        orderBy: { tipoCbteAfip: "asc" },
        select: { id: true, codigo: true, tipoCbteAfip: true, letraComprobante: true, nombreComprobante: true, ultimoNumero: true, activo: true },
      },
    },
  })

  if (!item) return NextResponse.json({ error: "No encontrado" }, { status: 404 })
  return NextResponse.json(item)
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await getAuthContext(request)
  if (!ctx.ok) return ctx.response

  const { id } = await params
  const pvId = Number(id)
  if (isNaN(pvId)) return NextResponse.json({ error: "ID inválido" }, { status: 400 })

  const body = await request.json()
  const parsed = patchSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos", detalles: parsed.error.errors }, { status: 400 })
  }

  // ── TENANT ISOLATION ──
  const existing = await prisma.puntoVentaConfig.findFirst({
    where: { id: pvId, empresaId: ctx.auth.empresaId },
    select: { id: true, empresaId: true },
  })
  if (!existing) return NextResponse.json({ error: "No encontrado" }, { status: 404 })

  if (parsed.data.esDefault) {
    await prisma.puntoVentaConfig.updateMany({
      where: { empresaId: ctx.auth.empresaId, esDefault: true, id: { not: existing.id } },
      data: { esDefault: false },
    })
  }

  const updated = await prisma.puntoVentaConfig.update({
    where: { id: existing.id },
    data: parsed.data,
  })
  return NextResponse.json(updated)
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await getAuthContext(request)
  if (!ctx.ok) return ctx.response

  const { id } = await params
  const pvId = Number(id)
  if (isNaN(pvId)) return NextResponse.json({ error: "ID inválido" }, { status: 400 })

  // ── TENANT ISOLATION ──
  const existing = await prisma.puntoVentaConfig.findFirst({
    where: { id: pvId, empresaId: ctx.auth.empresaId },
    select: { id: true },
  })
  if (!existing) return NextResponse.json({ error: "No encontrado" }, { status: 404 })

  // No eliminar físicamente si tiene series asociadas — sólo desactivar
  const series = await prisma.serie.count({ where: { puntoVentaId: existing.id } })
  if (series > 0) {
    await prisma.puntoVentaConfig.update({ where: { id: existing.id }, data: { activo: false } })
    return NextResponse.json({ mensaje: "Punto de venta desactivado (tiene series asociadas)" })
  }

  await prisma.puntoVentaConfig.delete({ where: { id: existing.id } })
  return NextResponse.json({ mensaje: "Eliminado" })
}
