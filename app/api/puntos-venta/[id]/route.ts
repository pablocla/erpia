import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { verificarToken } from "@/lib/auth/middleware"
import { z } from "zod"

const patchSchema = z.object({
  nombre: z.string().min(1).optional(),
  descripcion: z.string().optional(),
  tipo: z.enum(["electronico", "manual", "web", "factura_credito"]).optional(),
  activo: z.boolean().optional(),
  esDefault: z.boolean().optional(),
})

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const usuario = await verificarToken(request)
  if (!usuario) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const { id } = await params
  const item = await prisma.puntoVentaConfig.findUnique({
    where: { id: Number(id) },
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
  const usuario = await verificarToken(request)
  if (!usuario) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const { id } = await params
  const body = await request.json()
  const parsed = patchSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos", detalles: parsed.error.errors }, { status: 400 })
  }

  const existing = await prisma.puntoVentaConfig.findUnique({ where: { id: Number(id) } })
  if (!existing) return NextResponse.json({ error: "No encontrado" }, { status: 404 })

  if (parsed.data.esDefault) {
    await prisma.puntoVentaConfig.updateMany({
      where: { empresaId: existing.empresaId, esDefault: true, id: { not: Number(id) } },
      data: { esDefault: false },
    })
  }

  const updated = await prisma.puntoVentaConfig.update({
    where: { id: Number(id) },
    data: parsed.data,
  })
  return NextResponse.json(updated)
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const usuario = await verificarToken(request)
  if (!usuario) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const { id } = await params
  // No eliminar físicamente si tiene series asociadas — sólo desactivar
  const series = await prisma.serie.count({ where: { puntoVentaId: Number(id) } })
  if (series > 0) {
    await prisma.puntoVentaConfig.update({ where: { id: Number(id) }, data: { activo: false } })
    return NextResponse.json({ mensaje: "Punto de venta desactivado (tiene series asociadas)" })
  }

  await prisma.puntoVentaConfig.delete({ where: { id: Number(id) } })
  return NextResponse.json({ mensaje: "Eliminado" })
}
