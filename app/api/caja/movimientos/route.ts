import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getAuthContext } from "@/lib/auth/empresa-guard"
import { z } from "zod"

const movimientoSchema = z.object({
  cajaId: z.number().int().positive(),
  tipo: z.enum(["ingreso", "egreso"]),
  concepto: z.string().min(1),
  monto: z.number().positive(),
  medioPago: z.enum(["efectivo", "tarjeta_debito", "tarjeta_credito", "transferencia", "cheque"]).default("efectivo"),
  referencia: z.string().optional(),
})

export async function GET(request: NextRequest) {
  try {
    const ctx = await getAuthContext(request)
    if (!ctx.ok) return ctx.response

    const { searchParams } = new URL(request.url)
    const cajaId = searchParams.get("cajaId")

    if (!cajaId) return NextResponse.json({ error: "cajaId requerido" }, { status: 400 })

    const cajaIdParsed = Number(cajaId)
    if (Number.isNaN(cajaIdParsed) || cajaIdParsed <= 0) {
      return NextResponse.json({ error: "cajaId inválido" }, { status: 400 })
    }

    const caja = await prisma.caja.findUnique({
      where: { id: cajaIdParsed },
      select: { id: true, empresaId: true },
    })

    if (!caja) return NextResponse.json({ error: "Caja no encontrada" }, { status: 404 })
    if (caja.empresaId !== ctx.auth.empresaId) {
      return NextResponse.json({ error: "Acceso denegado" }, { status: 403 })
    }

    const movimientos = await prisma.movimientoCaja.findMany({
      where: { cajaId: caja.id },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json(movimientos)
  } catch (error) {
    console.error("Error al obtener movimientos:", error)
    return NextResponse.json({ error: "Error al obtener movimientos" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const ctx = await getAuthContext(request)
    if (!ctx.ok) return ctx.response

    const body = await request.json()
    const validacion = movimientoSchema.safeParse(body)
    if (!validacion.success) {
      return NextResponse.json({ error: "Datos inválidos", detalles: validacion.error.errors }, { status: 400 })
    }
    const { cajaId, tipo, concepto, monto, medioPago, referencia } = validacion.data

    const caja = await prisma.caja.findUnique({
      where: { id: cajaId },
      select: { id: true, estado: true, empresaId: true },
    })
    if (!caja) return NextResponse.json({ error: "Caja no encontrada" }, { status: 404 })
    if (caja.empresaId !== ctx.auth.empresaId) {
      return NextResponse.json({ error: "Acceso denegado" }, { status: 403 })
    }
    if (caja.estado === "cerrada") {
      return NextResponse.json({ error: "No se pueden agregar movimientos a una caja cerrada" }, { status: 400 })
    }

    const movimiento = await prisma.movimientoCaja.create({
      data: { cajaId, tipo, concepto, monto, medioPago, referencia },
    })

    return NextResponse.json(movimiento, { status: 201 })
  } catch (error) {
    console.error("Error al registrar movimiento:", error)
    return NextResponse.json({ error: "Error al registrar movimiento" }, { status: 500 })
  }
}
