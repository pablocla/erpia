import { type NextRequest, NextResponse } from "next/server"
import { getAuthContext, whereEmpresa } from "@/lib/auth/empresa-guard"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { onNCEmitida } from "@/lib/contabilidad/factura-hooks"
import { eventBus } from "@/lib/events/event-bus"
import type { NCEmitidaPayload } from "@/lib/events/types"
// Ensure event handlers are registered
import "@/lib/stock/stock-service"
import "@/lib/cc-cp/cuentas-service"

const ncSchema = z.object({
  facturaId: z.number().int().positive(),
  motivo: z.string().min(1),
  /// Optional: partial NC — if absent, NC is for the full invoice amount
  items: z
    .array(
      z.object({
        descripcion: z.string(),
        cantidad: z.number().positive(),
        precioUnitario: z.number().positive(),
        porcentajeIva: z.number().min(0).max(100),
      }),
    )
    .optional(),
})

// ─── GET — List credit notes ──────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  try {
    const ctx = await getAuthContext(request)
    if (!ctx.ok) return ctx.response

    const { searchParams } = new URL(request.url)
    const facturaId = searchParams.get("facturaId")
    const clienteId = searchParams.get("clienteId")
    const skip = parseInt(searchParams.get("skip") ?? "0", 10)
    const take = Math.min(parseInt(searchParams.get("take") ?? "50", 10), 200)

    const where: any = { empresaId: ctx.auth.empresaId }
    if (facturaId) where.facturaId = parseInt(facturaId, 10)
    if (clienteId) where.clienteId = parseInt(clienteId, 10)

    const [data, total] = await Promise.all([
      prisma.notaCredito.findMany({
        where,
        include: {
          factura: { select: { tipo: true, numero: true, puntoVenta: true } },
          cliente: { select: { id: true, nombre: true, cuit: true } },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take,
      }),
      prisma.notaCredito.count({ where }),
    ])

    return NextResponse.json({ data, total, skip, take })
  } catch (error) {
    console.error("Error en GET notas-credito:", error)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}

// ─── POST — Emit credit note ─────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const ctx = await getAuthContext(request)
    if (!ctx.ok) return ctx.response

    const body = await request.json()
    const validacion = ncSchema.safeParse(body)
    if (!validacion.success) {
      return NextResponse.json({ error: "Datos inválidos", detalles: validacion.error.errors }, { status: 400 })
    }

    const { facturaId, motivo, items: itemsOverride } = validacion.data

    // Validate original invoice
    const factura = await prisma.factura.findUnique({
      where: { id: facturaId },
      include: { lineas: true, cliente: true, empresa: true },
    })

    if (!factura) {
      return NextResponse.json({ error: "Factura no encontrada" }, { status: 404 })
    }

    if (factura.estado === "anulada") {
      return NextResponse.json({ error: "No se puede emitir NC sobre factura anulada" }, { status: 400 })
    }

    // Determine NC type based on original invoice type
    const tipoCbteMap: Record<string, number> = { A: 3, B: 8, C: 13 }
    const tipoCbte = tipoCbteMap[factura.tipo] ?? 8

    // Calculate totals — use override items (partial NC) or full invoice
    let subtotal: number
    let iva: number

    if (itemsOverride && itemsOverride.length > 0) {
      subtotal = 0
      iva = 0
      for (const item of itemsOverride) {
        const lineaSub = item.cantidad * item.precioUnitario
        subtotal += lineaSub
        iva += (lineaSub * item.porcentajeIva) / 100
      }
    } else {
      subtotal = factura.subtotal
      iva = factura.iva
    }

    const total = Math.round((subtotal + iva) * 100) / 100

    // Check NC doesn't exceed remaining invoice balance
    const existingNCs = await prisma.notaCredito.aggregate({
      where: { facturaId, estado: { not: "anulada" } },
      _sum: { total: true },
    })
    const totalNCPrevias = existingNCs._sum.total ?? 0
    if (totalNCPrevias + total > factura.total) {
      return NextResponse.json(
        { error: `El total de NC ($${totalNCPrevias + total}) excede el total de la factura ($${factura.total})` },
        { status: 400 },
      )
    }

    // Get next NC number
    const ultimaNC = await prisma.notaCredito.findFirst({
      where: { tipoCbte, puntoVenta: factura.puntoVenta },
      orderBy: { numero: "desc" },
    })
    const nuevoNumero = (ultimaNC?.numero ?? 0) + 1

    const nc = await prisma.notaCredito.create({
      data: {
        tipo: factura.tipo,
        tipoCbte,
        numero: nuevoNumero,
        puntoVenta: factura.puntoVenta,
        motivo,
        subtotal,
        iva,
        total,
        estado: "emitida",
        facturaId: factura.id,
        clienteId: factura.clienteId,
        empresaId: ctx.auth.empresaId,
      },
    })

    // Trigger accounting hook
    await onNCEmitida(nc.id)

    // Emit event for stock reentry + CC adjustment
    await eventBus.emit<NCEmitidaPayload>({
      type: "NC_EMITIDA",
      payload: {
        notaCreditoId: nc.id,
        facturaId: factura.id,
        clienteId: factura.clienteId,
        total: nc.total,
        motivo,
      },
      timestamp: new Date(),
    })

    return NextResponse.json(
      {
        id: nc.id,
        tipo: nc.tipo,
        numero: nc.numero,
        puntoVenta: nc.puntoVenta,
        total: nc.total,
        estado: nc.estado,
      },
      { status: 201 },
    )
  } catch (error) {
    console.error("Error al emitir nota de crédito:", error)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}
