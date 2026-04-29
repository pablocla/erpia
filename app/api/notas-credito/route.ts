import { type NextRequest, NextResponse } from "next/server"
import { getAuthContext } from "@/lib/auth/empresa-guard"
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
        descripcion: z.string().optional(),
        cantidad: z.number().positive(),
        precioUnitario: z.number().positive().optional(),
        porcentajeIva: z.number().min(0).max(100).optional(),
        productoId: z.number().int().positive().optional(),
        lineaFacturaId: z.number().int().positive().optional(),
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
      where: { id: facturaId, empresaId: ctx.auth.empresaId },
      include: { lineas: true, cliente: true },
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

    const items: Array<{
      descripcion: string
      cantidad: number
      precioUnitario: number
      porcentajeIva: number
      productoId?: number
      lineaFacturaId?: number
    }> = []

    if (itemsOverride && itemsOverride.length > 0) {
      for (const item of itemsOverride) {
        const originalLinea = item.lineaFacturaId
          ? factura.lineas.find((linea) => linea.id === item.lineaFacturaId)
          : undefined

        if (item.lineaFacturaId && !originalLinea) {
          return NextResponse.json(
            { error: `Línea de factura ${item.lineaFacturaId} no encontrada en la factura` },
            { status: 400 },
          )
        }

        const precioUnitario = item.precioUnitario ?? Number(originalLinea?.precioUnitario ?? NaN)
        const porcentajeIva = item.porcentajeIva ?? Number(originalLinea?.porcentajeIva ?? NaN)

        if (Number.isNaN(precioUnitario) || Number.isNaN(porcentajeIva)) {
          return NextResponse.json(
            {
              error:
                "Cada línea de NC debe contener precioUnitario y porcentajeIva o referenciar una línea de factura existente",
            },
            { status: 400 },
          )
        }

        if (originalLinea && item.cantidad > Number(originalLinea.cantidad)) {
          return NextResponse.json(
            {
              error: `La cantidad de la línea de NC (${item.cantidad}) no puede superar la cantidad de la factura (${originalLinea.cantidad})`,
            },
            { status: 400 },
          )
        }

        items.push({
          descripcion: item.descripcion ?? originalLinea?.descripcion ?? "Item NC",
          cantidad: item.cantidad,
          precioUnitario,
          porcentajeIva,
          productoId: item.productoId ?? originalLinea?.productoId,
          lineaFacturaId: item.lineaFacturaId,
        })
      }
    } else {
      for (const linea of factura.lineas) {
        items.push({
          descripcion: linea.descripcion,
          cantidad: Number(linea.cantidad),
          precioUnitario: Number(linea.precioUnitario),
          porcentajeIva: Number(linea.porcentajeIva),
          productoId: linea.productoId,
          lineaFacturaId: linea.id,
        })
      }
    }

    let subtotal = 0
    let iva = 0

    for (const item of items) {
      const lineaSub = item.cantidad * item.precioUnitario
      subtotal += lineaSub
      iva += (lineaSub * item.porcentajeIva) / 100
    }

    const total = Math.round((subtotal + iva) * 100) / 100

    // Check NC doesn't exceed remaining invoice balance
    const existingNCs = await prisma.notaCredito.aggregate({
      where: { facturaId, estado: { not: "anulada" }, empresaId: ctx.auth.empresaId },
      _sum: { total: true },
    })
    const totalNCPrevias = Number(existingNCs._sum.total ?? 0)
    const facturaTotal = Number(factura.total)
    if (totalNCPrevias + total > facturaTotal) {
      return NextResponse.json(
        { error: `El total de NC ($${totalNCPrevias + total}) excede el total de la factura ($${facturaTotal})` },
        { status: 400 },
      )
    }

    // Get next NC number
    const ultimaNC = await prisma.notaCredito.findFirst({
      where: { tipoCbte, puntoVenta: factura.puntoVenta, empresaId: ctx.auth.empresaId },
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
        lineas: {
          create: items.map((item) => ({
            descripcion: item.descripcion,
            cantidad: item.cantidad,
            precioUnitario: item.precioUnitario,
            porcentajeIva: item.porcentajeIva,
            subtotal: item.cantidad * item.precioUnitario,
            iva: (item.cantidad * item.precioUnitario * item.porcentajeIva) / 100,
            total: item.cantidad * item.precioUnitario * (1 + item.porcentajeIva / 100),
            productoId: item.productoId ?? undefined,
            lineaFacturaId: item.lineaFacturaId ?? undefined,
          })),
        },
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
