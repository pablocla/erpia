import { type NextRequest, NextResponse } from "next/server"
import { withAuthAndTenant, whereEmpresa } from "@/lib/auth/empresa-guard"
import { prisma } from "@/lib/prisma"
import { registrarAsientoCompra } from "@/lib/contabilidad/factura-hooks"
import { eventBus } from "@/lib/events/event-bus"
import type { CompraRegistradaPayload } from "@/lib/events/types"
import { comprasService } from "@/lib/compras/compras-service"
import { assertProveedorEmpresa } from "@/lib/auth/tenant-validate"
import "@/lib/stock/stock-service"
import "@/lib/cc-cp/cuentas-service"
import { z } from "zod"

// ─── GET — List compras (facturas de compra) ──────────────────────────────────

export const GET = withAuthAndTenant(async (request: NextRequest, auth) => {
  try {
    const params = request.nextUrl.searchParams
    const proveedorId = params.get("proveedorId")
    const tipo = params.get("tipo")
    const desde = params.get("desde")
    const hasta = params.get("hasta")
    const page = Math.max(1, Number(params.get("page") || 1))
    const limit = Math.min(100, Math.max(1, Number(params.get("limit") || 50)))
    const skip = (page - 1) * limit

    const where: Record<string, unknown> = whereEmpresa(auth.empresaId)
    if (proveedorId) where.proveedorId = Number(proveedorId)
    if (tipo) where.tipo = tipo
    if (desde || hasta) {
      where.fecha = {}
      if (desde) (where.fecha as Record<string, unknown>).gte = new Date(desde)
      if (hasta) (where.fecha as Record<string, unknown>).lte = new Date(hasta)
    }

    const [compras, total] = await Promise.all([
      prisma.compra.findMany({
        where,
        include: {
          proveedor: { select: { id: true, nombre: true, cuit: true } },
          lineas: true,
        },
        orderBy: { fecha: "desc" },
        skip,
        take: limit,
      }),
      prisma.compra.count({ where }),
    ])

    return NextResponse.json({
      success: true,
      compras,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    })
  } catch (error) {
    console.error("Error en GET compras:", error)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
})

const itemCompraSchema = z.object({
  descripcion: z.string().min(1),
  cantidad: z.number().positive(),
  precioUnitario: z.number().positive(),
  porcentajeIva: z.number().min(0).max(100),
  productoId: z.number().int().positive().optional(),
})

const compraSchema = z.object({
  proveedorId: z.number().int().positive(),
  tipo: z.enum(["A", "B", "C"]),
  puntoVenta: z.string().min(1),
  numero: z.string().min(1),
  fecha: z.string().datetime({ offset: true }).or(z.string().date()),
  items: z.array(itemCompraSchema).min(1),
  observaciones: z.string().optional(),
  // RG 5616: moneda y tipo de cambio
  monedaOrigen: z.string().default("PES"),
  tipoCambio: z.number().positive().default(1),
  // CAE del proveedor para WSCDC verification
  caeProveedor: z.string().optional(),
  // OC for 3-way matching
  ordenCompraId: z.number().int().positive().optional(),
})

export const POST = withAuthAndTenant(async (request: NextRequest, auth) => {
  try {
    const body = await request.json()
    const validacion = compraSchema.safeParse(body)
    if (!validacion.success) {
      return NextResponse.json({ error: "Datos inválidos", detalles: validacion.error.errors }, { status: 400 })
    }

    const {
      proveedorId, tipo, puntoVenta, numero, fecha, items, observaciones,
      monedaOrigen, tipoCambio, caeProveedor, ordenCompraId,
    } = validacion.data

    await assertProveedorEmpresa(proveedorId, auth.empresaId)

    // ── 3-way matching (OC vs Recepción vs Factura) ──────────────────────
    if (ordenCompraId) {
      const matchResult = await comprasService.threeWayMatch(ordenCompraId, auth.empresaId, items)
      if (!matchResult.ok) {
        return NextResponse.json(
          { error: "3-way match fallido", discrepancias: matchResult.discrepancias },
          { status: 400 },
        )
      }
    }

    let subtotal = 0
    let totalIva = 0

    for (const item of items) {
      const itemSubtotal = item.cantidad * item.precioUnitario
      const itemIva = itemSubtotal * (item.porcentajeIva / 100)
      subtotal += itemSubtotal
      totalIva += itemIva
    }

    const total = subtotal + totalIva

    // ── WSCDC: verify supplier CAE (optional) ────────────────────────────
    let estadoVerificacionCAE: string = "no_verificado"
    if (caeProveedor) {
      try {
        const { WSCDCClient } = await import("@/lib/afip/wscdc-client")
        const client = new WSCDCClient("homologacion")
        // Attempt verification – non-blocking (log only)
        const wscdcResult = await client.constatar(
          { token: "", sign: "", expirationTime: new Date(), service: "wscdc" }, // Auth tokens injected by middleware in production
          process.env.CUIT_EMPRESA ?? "",
          {
            cuitEmisor: (await prisma.proveedor.findFirst({
              where: { id: proveedorId, empresaId: auth.empresaId },
              select: { cuit: true },
            }))?.cuit ?? "",
            puntoVenta: parseInt(puntoVenta, 10),
            tipoCbte: tipo === "A" ? 1 : tipo === "B" ? 6 : 11,
            numeroCbte: parseInt(numero, 10),
            fechaEmision: fecha.replace(/-/g, "").substring(0, 8),
            codAutorizacion: caeProveedor,
            importeTotal: total,
            docTipoReceptor: 80,
            docNroReceptor: process.env.CUIT_EMPRESA ?? "",
          },
        )
        estadoVerificacionCAE = wscdcResult.resultado === "A" ? "aprobado" : "rechazado"
      } catch (err) {
        console.error("WSCDC verification failed (non-blocking):", err)
        estadoVerificacionCAE = "error"
      }
    }



    const compra = await prisma.$transaction(async (tx) => {
      const nuevaCompra = await tx.compra.create({
        data: {
          proveedorId,
          tipo,
          puntoVenta,
          numero,
          fecha: new Date(fecha),
          subtotal,
          iva: totalIva,
          total,
          observaciones,
          monedaOrigen,
          tipoCambio,
          caeProveedor: caeProveedor ?? null,
          estadoVerificacionCAE,
          ordenCompraId: ordenCompraId ?? null,
          empresaId: auth.empresaId,
          lineas: {
            create: items.map((item: any) => ({
              descripcion: item.descripcion,
              cantidad: item.cantidad,
              precioUnitario: item.precioUnitario,
              porcentajeIva: item.porcentajeIva,
              subtotal: item.cantidad * item.precioUnitario,
              iva: item.cantidad * item.precioUnitario * (item.porcentajeIva / 100),
              total: item.cantidad * item.precioUnitario * (1 + item.porcentajeIva / 100),
              productoId: item.productoId ?? null,
            })),
          },
        },
        include: {
          proveedor: true,
          lineas: true,
        },
      })

      await registrarAsientoCompra(nuevaCompra, tx)

      return nuevaCompra
    })

    // Emit domain event → stock increment, CP generation
    // Event bus no debe ser transaccional porque emite hacia un bus de mensajería (lógica async/side effect)
    await eventBus.emit<CompraRegistradaPayload>({
      type: "COMPRA_REGISTRADA",
      payload: {
        compraId: compra.id,
        proveedorId: compra.proveedorId,
        total: Number(compra.total),
        condicionPagoId: null,
        depositoId: null,
      },
      timestamp: new Date(),
    })

    return NextResponse.json(compra, { status: 201 })
  } catch (error) {
    console.error("Error al registrar compra:", error)
    return NextResponse.json({ error: "Error al registrar compra" }, { status: 500 })
  }
})
