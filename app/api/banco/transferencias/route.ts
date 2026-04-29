import { NextRequest, NextResponse } from "next/server"
import { getAuthContext, whereEmpresa } from "@/lib/auth/empresa-guard"
import { transferenciasService } from "@/lib/banco/transferencias-service"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

// ─── GET — List bank transfers ───────────────────────────────────────────────

export async function GET(request: NextRequest) {
  try {
    const ctx = await getAuthContext(request)
    if (!ctx.ok) return ctx.response

    const params = request.nextUrl.searchParams
    const cuentaId = params.get("cuentaId")
    const desde = params.get("desde")
    const hasta = params.get("hasta")
    const page = Math.max(1, Number(params.get("page") || 1))
    const limit = Math.min(100, Math.max(1, Number(params.get("limit") || 50)))
    const skip = (page - 1) * limit

    const where: Record<string, unknown> = {
      OR: [
        { cuentaOrigen: whereEmpresa(ctx.auth.empresaId) },
        { cuentaDestino: whereEmpresa(ctx.auth.empresaId) },
      ],
    }
    if (cuentaId) {
      where.OR = [
        { cuentaOrigenId: Number(cuentaId) },
        { cuentaDestinoId: Number(cuentaId) },
      ]
    }
    if (desde || hasta) {
      where.fecha = {}
      if (desde) (where.fecha as Record<string, unknown>).gte = new Date(desde)
      if (hasta) (where.fecha as Record<string, unknown>).lte = new Date(hasta)
    }

    const movimientos = await prisma.movimientoBancario.findMany({
      where: {
        cuentaBancaria: whereEmpresa(ctx.auth.empresaId),
        tipo: { contains: "transf", mode: "insensitive" },
      },
      include: {
        cuentaBancaria: { select: { id: true, numeroCuenta: true, banco: { select: { nombre: true } } } },
      },
      orderBy: { fecha: "desc" },
      skip,
      take: limit,
    })

    return NextResponse.json({ success: true, transferencias: movimientos })
  } catch (error) {
    console.error("Error en GET transferencias:", error)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}

const transferSchema = z.object({
  cuentaOrigenId: z.number().int().positive(),
  cuentaDestinoId: z.number().int().positive(),
  importe: z.number().positive(),
  fecha: z.string().optional(),
  descripcion: z.string().optional(),
  referencia: z.string().optional(),
})

export async function POST(request: NextRequest) {
  try {
    const ctx = await getAuthContext(request)
    if (!ctx.ok) return ctx.response

    const body = await request.json()
    const validacion = transferSchema.safeParse(body)
    if (!validacion.success) {
      return NextResponse.json({ error: "Datos inválidos", detalles: validacion.error.errors }, { status: 400 })
    }

    const { cuentaOrigenId, cuentaDestinoId, importe, fecha, descripcion, referencia } = validacion.data

    const result = await transferenciasService.transferir({
      empresaId: ctx.auth.empresaId,
      cuentaOrigenId,
      cuentaDestinoId,
      importe,
      fecha: fecha ? new Date(fecha) : undefined,
      descripcion,
      referencia,
    })

    return NextResponse.json(result, { status: 201 })
  } catch (error: any) {
    const message = error?.message ?? "Error interno"
    const status = message.includes("no encontrada") || message.includes("empresa") || message.includes("iguales") ? 400 : 500
    return NextResponse.json({ error: message }, { status })
  }
}
