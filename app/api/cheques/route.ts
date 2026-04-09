import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getAuthContext } from "@/lib/auth/empresa-guard"
import { z } from "zod"

const chequeSchema = z.object({
  numero: z.string().min(1),
  tipoCheque: z.enum(["propio", "tercero"]).default("tercero"),
  monto: z.number().positive(),
  fechaEmision: z.string(),
  fechaVencimiento: z.string(),
  cuitBancoLibrador: z.string().optional(),
  estado: z.enum(["cartera", "depositado", "endosado", "rechazado", "debitado", "anulado"]).default("cartera"),
  observaciones: z.string().optional(),
  clienteId: z.number().int().positive().optional().nullable(),
  proveedorId: z.number().int().positive().optional().nullable(),
  cuentaDepositoId: z.number().int().positive().optional().nullable(),
  cuentaEmisorId: z.number().int().positive().optional().nullable(),
})

const patchSchema = z.object({
  estado: z.enum(["cartera", "depositado", "endosado", "rechazado", "debitado", "anulado"]).optional(),
  observaciones: z.string().optional(),
  cuentaDepositoId: z.number().int().positive().optional().nullable(),
})

/**
 * GET /api/cheques
 * Lista cheques con filtros de estado y tipo.
 *
 * POST /api/cheques
 * Crea un nuevo cheque (propio o de tercero recibido).
 */
export async function GET(request: NextRequest) {
  try {
    const ctx = await getAuthContext(request)
    if (!ctx.ok) return ctx.response

    const { searchParams } = new URL(request.url)
    const estado = searchParams.get("estado") || ""
    const tipo = searchParams.get("tipo") || ""
    const search = searchParams.get("search") || ""
    const vencimientoProximo = searchParams.get("vencimientoProximo") === "true"

    const where: Record<string, unknown> = {}

    if (estado) where.estado = estado
    if (tipo) where.tipoCheque = tipo

    if (vencimientoProximo) {
      const hoy = new Date()
      const en7dias = new Date(hoy.getTime() + 7 * 24 * 60 * 60 * 1000)
      where.fechaVencimiento = { lte: en7dias, gte: hoy }
      where.estado = { in: ["cartera", "depositado"] }
    }

    if (search.trim()) {
      where.OR = [
        { numero: { contains: search, mode: "insensitive" } },
        { cliente: { nombre: { contains: search, mode: "insensitive" } } },
        { proveedor: { nombre: { contains: search, mode: "insensitive" } } },
        { observaciones: { contains: search, mode: "insensitive" } },
      ]
    }

    // Filter by empresa through cliente or proveedor
    where.OR = [
      { cliente: { empresaId: ctx.auth.empresaId } },
      { proveedor: { empresaId: ctx.auth.empresaId } },
      { cuentaDeposito: { empresaId: ctx.auth.empresaId } },
      { cuentaEmisor: { empresaId: ctx.auth.empresaId } },
    ]

    const cheques = await prisma.cheque.findMany({
      where,
      include: {
        cliente: { select: { id: true, nombre: true } },
        proveedor: { select: { id: true, nombre: true } },
        cuentaDeposito: { select: { id: true, banco: true, numeroCuenta: true } },
        cuentaEmisor: { select: { id: true, banco: true, numeroCuenta: true } },
      },
      orderBy: { fechaVencimiento: "asc" },
      take: 200,
    })

    // Stats
    const totalCartera = cheques
      .filter((c) => c.estado === "cartera" && c.tipoCheque === "tercero")
      .reduce((s, c) => s + Number(c.monto), 0)
    const totalEmitidos = cheques
      .filter((c) => c.estado === "cartera" && c.tipoCheque === "propio")
      .reduce((s, c) => s + Number(c.monto), 0)
    const proximosVencer = cheques.filter((c) => {
      const dias = (new Date(c.fechaVencimiento).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      return dias <= 7 && dias >= 0 && ["cartera", "depositado"].includes(c.estado)
    }).length

    return NextResponse.json({
      cheques: cheques.map((c) => ({ ...c, monto: Number(c.monto) })),
      stats: { totalCartera, totalEmitidos, proximosVencer },
    })
  } catch (error) {
    console.error("cheques GET:", error)
    return NextResponse.json({ error: "Error al obtener cheques" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const ctx = await getAuthContext(request)
    if (!ctx.ok) return ctx.response

    const body = await request.json()
    const parsed = chequeSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: "Datos inválidos", detalles: parsed.error.flatten() }, { status: 400 })
    }

    const cheque = await prisma.cheque.create({
      data: {
        numero: parsed.data.numero,
        tipoCheque: parsed.data.tipoCheque,
        monto: parsed.data.monto,
        fechaEmision: new Date(parsed.data.fechaEmision),
        fechaVencimiento: new Date(parsed.data.fechaVencimiento),
        cuitBancoLibrador: parsed.data.cuitBancoLibrador,
        estado: parsed.data.estado,
        observaciones: parsed.data.observaciones,
        clienteId: parsed.data.clienteId ?? null,
        proveedorId: parsed.data.proveedorId ?? null,
        cuentaDepositoId: parsed.data.cuentaDepositoId ?? null,
        cuentaEmisorId: parsed.data.cuentaEmisorId ?? null,
      },
    })

    return NextResponse.json({ ...cheque, monto: Number(cheque.monto) }, { status: 201 })
  } catch (error) {
    console.error("cheques POST:", error)
    return NextResponse.json({ error: "Error al crear cheque" }, { status: 500 })
  }
}
