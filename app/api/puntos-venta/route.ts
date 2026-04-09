import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getAuthContext } from "@/lib/auth/empresa-guard"
import { z } from "zod"

const crearSchema = z.object({
  numero: z.number().int().min(1).max(9999),
  nombre: z.string().min(1),
  descripcion: z.string().optional(),
  tipo: z.enum(["electronico", "manual", "web", "factura_credito"]).default("electronico"),
  activo: z.boolean().default(true),
  esDefault: z.boolean().default(false),
  empresaId: z.number().int().positive(),
})

export async function GET(request: NextRequest) {
  const ctx = await getAuthContext(request)
  if (!ctx.ok) return ctx.response

  const { searchParams } = new URL(request.url)
  const soloActivos = searchParams.get("activo") !== "false"

  const items = await prisma.puntoVentaConfig.findMany({
    where: {
      empresaId: ctx.auth.empresaId,
      ...(soloActivos ? { activo: true } : {}),
    },
    include: {
      empresa: { select: { id: true, razonSocial: true, cuit: true } },
      series: { where: { activo: true }, select: { id: true, codigo: true, tipoCbteAfip: true, nombreComprobante: true, ultimoNumero: true } },
    },
    orderBy: [{ empresaId: "asc" }, { numero: "asc" }],
  })

  return NextResponse.json(items)
}

export async function POST(request: NextRequest) {
  const ctx = await getAuthContext(request)
  if (!ctx.ok) return ctx.response

  const body = await request.json()
  const parsed = crearSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos", detalles: parsed.error.errors }, { status: 400 })
  }

  const { esDefault, ...data } = parsed.data

  // Si se marca como default, quitar default a los demás del mismo empresa
  if (esDefault) {
    await prisma.puntoVentaConfig.updateMany({
      where: { empresaId: data.empresaId, esDefault: true },
      data: { esDefault: false },
    })
  }

  const nuevo = await prisma.puntoVentaConfig.create({ data: { ...data, esDefault } })
  return NextResponse.json(nuevo, { status: 201 })
}
