import { type NextRequest, NextResponse } from "next/server"
import { getAuthContext } from "@/lib/auth/empresa-guard"
import prisma from "@/lib/prisma"
import { registrarAsientoCompra } from "@/lib/contabilidad/factura-hooks"
import { eventBus } from "@/lib/events/event-bus"
import type { CompraRegistradaPayload } from "@/lib/events/types"
import { comprasService } from "@/lib/compras/compras-service"
import "@/lib/stock/stock-service"
import "@/lib/cc-cp/cuentas-service"
import { z } from "zod"

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

export async function POST(request: NextRequest) {
  try {
    const ctx = await getAuthContext(request)
    if (!ctx.ok) return ctx.response

    const body = await request.json()
    const validacion = compraSchema.safeParse(body)
    if (!validacion.success) {
      return NextResponse.json({ error: "Datos inválidos", detalles: validacion.error.errors }, { status: 400 })
    }

    const {
      proveedorId, tipo, puntoVenta, numero, fecha, items, observaciones,
      monedaOrigen, tipoCambio, caeProveedor, ordenCompraId,
    } = validacion.data

    // ── 3-way matching (OC vs Recepción vs Factura) ──────────────────────
    if (ordenCompraId) {
      const matchResult = await comprasService.threeWayMatch(ordenCompraId, items)
      if (!matchResult.ok) {
        return NextResponse.json(
          { error: "3-way match fallido", discrepancias: matchResult.discrepancias },
          { status: 400 },
        )
      }
    }

    // ── WSCDC: verify supplier CAE (optional) ────────────────────────────
    let estadoVerificacionCAE: string = "no_verificado"
    if (caeProveedor) {
      try {
        const { constatar } = await import("@/lib/afip/wscdc-client")
        // Attempt verification – non-blocking (log only)
        const wscdcResult = await constatar(
          { token: "", sign: "" }, // Auth tokens injected by middleware in production
          process.env.CUIT_EMPRESA ?? "",
          {
            cuitEmisor: (await prisma.proveedor.findUnique({ where: { id: proveedorId }, select: { cuit: true } }))?.cuit ?? "",
            ptoVta: parseInt(puntoVenta, 10),
            cbeTipo: tipo === "A" ? 1 : tipo === "B" ? 6 : 11,
            cbeNro: parseInt(numero, 10),
            cbeFch: fecha.replace(/-/g, "").substring(0, 8),
            cae: caeProveedor,
          },
        )
        estadoVerificacionCAE = wscdcResult.resultado === "A" ? "aprobado" : "rechazado"
      } catch (err) {
        console.error("WSCDC verification failed (non-blocking):", err)
        estadoVerificacionCAE = "error"
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

    const compra = await prisma.compra.create({
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
        empresaId: ctx.auth.empresaId,
        lineas: {
          create: items.map((item) => ({
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

    await registrarAsientoCompra(compra)

    // Emit domain event → stock increment, CP generation
    await eventBus.emit<CompraRegistradaPayload>({
      type: "COMPRA_REGISTRADA",
      payload: {
        compraId: compra.id,
        proveedorId: compra.proveedorId,
        total: compra.total,
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
}
