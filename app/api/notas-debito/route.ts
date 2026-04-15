import { type NextRequest, NextResponse } from "next/server"
import { getAuthContext } from "@/lib/auth/empresa-guard"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const lineaSchema = z.object({
  descripcion: z.string().min(1),
  cantidad: z.number().positive(),
  precioUnitario: z.number().min(0),
  porcentajeIva: z.number().min(0),
  productoId: z.number().int().positive().optional().nullable(),
})

const notaDebitoSchema = z.object({
  tipo: z.enum(["A", "B", "C"]),
  tipoCbte: z.number().int(),
  numero: z.number().int().positive(),
  puntoVenta: z.number().int().positive(),
  motivo: z.string().min(1),
  facturaId: z.number().int().positive().optional().nullable(),
  clienteId: z.number().int().positive().optional().nullable(),
  proveedorId: z.number().int().positive().optional().nullable(),
  monedaOrigen: z.string().default("PES"),
  tipoCambio: z.number().positive().default(1),
  lineas: z.array(lineaSchema).min(1, "Al menos una línea es obligatoria"),
})

export async function GET(request: NextRequest) {
  try {
    const ctx = await getAuthContext(request)
    if (!ctx.ok) return ctx.response

    const { searchParams } = new URL(request.url)
    const clienteId = searchParams.get("clienteId")
    const proveedorId = searchParams.get("proveedorId")
    const estado = searchParams.get("estado")
    const skip = parseInt(searchParams.get("skip") ?? "0", 10)
    const take = Math.min(parseInt(searchParams.get("take") ?? "50", 10), 200)

    const where: Record<string, unknown> = { empresaId: ctx.auth.empresaId }
    if (clienteId) where.clienteId = parseInt(clienteId, 10)
    if (proveedorId) where.proveedorId = parseInt(proveedorId, 10)
    if (estado) where.estado = estado

    const [data, total] = await Promise.all([
      prisma.notaDebito.findMany({
        where,
        include: {
          cliente: { select: { id: true, nombre: true, cuit: true } },
          proveedor: { select: { id: true, razonSocial: true, cuit: true } },
          factura: { select: { id: true, tipo: true, numero: true, puntoVenta: true } },
          lineas: true,
        },
        skip,
        take,
        orderBy: { createdAt: "desc" },
      }),
      prisma.notaDebito.count({ where }),
    ])

    return NextResponse.json({ data, total, skip, take })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const ctx = await getAuthContext(request)
    if (!ctx.ok) return ctx.response

    const body = await request.json()
    const parsed = notaDebitoSchema.parse(body)

    // Calculate totals from lines
    const lineasCalc = parsed.lineas.map((l) => {
      const subtotal = l.cantidad * l.precioUnitario
      const iva = subtotal * l.porcentajeIva / 100
      return { ...l, subtotal, iva, total: subtotal + iva }
    })

    const subtotal = lineasCalc.reduce((s, l) => s + l.subtotal, 0)
    const iva = lineasCalc.reduce((s, l) => s + l.iva, 0)
    const total = lineasCalc.reduce((s, l) => s + l.total, 0)

    const nd = await prisma.notaDebito.create({
      data: {
        tipo: parsed.tipo,
        tipoCbte: parsed.tipoCbte,
        numero: parsed.numero,
        puntoVenta: parsed.puntoVenta,
        motivo: parsed.motivo,
        subtotal,
        iva,
        total,
        monedaOrigen: parsed.monedaOrigen,
        tipoCambio: parsed.tipoCambio,
        estado: "emitida",
        empresaId: ctx.auth.empresaId,
        facturaId: parsed.facturaId ?? undefined,
        clienteId: parsed.clienteId ?? undefined,
        proveedorId: parsed.proveedorId ?? undefined,
        lineas: {
          create: lineasCalc.map((l) => ({
            descripcion: l.descripcion,
            cantidad: l.cantidad,
            precioUnitario: l.precioUnitario,
            porcentajeIva: l.porcentajeIva,
            subtotal: l.subtotal,
            iva: l.iva,
            total: l.total,
            productoId: l.productoId ?? undefined,
          })),
        },
      },
      include: { lineas: true },
    })

    return NextResponse.json(nd, { status: 201 })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Datos inválidos", details: error.errors }, { status: 400 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
