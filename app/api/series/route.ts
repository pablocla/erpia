import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { verificarToken } from "@/lib/auth/middleware"
import { z } from "zod"
import { getTipoComprobante } from "@/lib/afip/tipos-comprobante"

const crearSchema = z.object({
  codigo: z.string().min(1).max(20),
  descripcion: z.string().optional(),
  tipoCbteAfip: z.number().int().positive(),
  puntoVentaId: z.number().int().positive(),
  activo: z.boolean().default(true),
})

export async function GET(request: NextRequest) {
  const usuario = await verificarToken(request)
  if (!usuario) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const puntoVentaId = searchParams.get("puntoVentaId")
  const soloActivos = searchParams.get("activo") !== "false"

  const items = await prisma.serie.findMany({
    where: {
      ...(puntoVentaId ? { puntoVentaId: Number(puntoVentaId) } : {}),
      ...(soloActivos ? { activo: true } : {}),
    },
    include: {
      puntoVenta: { select: { id: true, numero: true, nombre: true, tipo: true } },
    },
    orderBy: [{ puntoVentaId: "asc" }, { tipoCbteAfip: "asc" }],
  })

  return NextResponse.json(items)
}

export async function POST(request: NextRequest) {
  const usuario = await verificarToken(request)
  if (!usuario) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const body = await request.json()
  const parsed = crearSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos", detalles: parsed.error.errors }, { status: 400 })
  }

  const tipoCbte = getTipoComprobante(parsed.data.tipoCbteAfip)
  if (!tipoCbte) {
    return NextResponse.json(
      { error: `Tipo de comprobante AFIP ${parsed.data.tipoCbteAfip} no reconocido. Consultá GET /api/afip/tipos-comprobante` },
      { status: 400 },
    )
  }

  const nueva = await prisma.serie.create({
    data: {
      ...parsed.data,
      letraComprobante: tipoCbte.letra,
      nombreComprobante: tipoCbte.nombre,
    },
    include: {
      puntoVenta: { select: { id: true, numero: true, nombre: true } },
    },
  })

  return NextResponse.json(nueva, { status: 201 })
}
