/**
 * POST /api/pos/venta
 *
 * Endpoint atómico de venta POS. En una sola transacción Prisma:
 *  1. Valida que haya caja abierta
 *  2. Crea Factura + LineaFactura
 *  3. Ajusta stock de cada producto (MovimientoStock)
 *  4. Registra MovimientoCaja por cada medio de pago
 *  5. Si viene mesaId → cierra la Comanda y libera la Mesa
 *
 * Si tipoFactura = "ticket" se omite la emisión a AFIP y se guarda
 * con estado "pendiente_cae" para reimprimir luego (útil offline).
 */
import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getAuthContext } from "@/lib/auth/empresa-guard"
import { onFacturaEmitida } from "@/lib/contabilidad/factura-hooks"
import { resolverPreciosLineas } from "@/lib/precios/resolver-precios-lineas"
import { solicitarCaeFactura } from "@/lib/afip/solicitar-cae-factura"
import { obtenerEstadoAfipPos } from "@/lib/pos/pos-afip-status"
import { letraDesdeTipoCbte, resolverTipoCbtePos } from "@/lib/pos/pos-tipo-factura"
import { z } from "zod"

// ──────────────────────────────────────────────────────────────
// Schemas
// ──────────────────────────────────────────────────────────────

const lineaSchema = z.object({
  productoId: z.number().int().positive().optional(),
  descripcion: z.string().min(1),
  cantidad: z.number().positive(),
  precioUnitario: z.number().nonnegative().optional(),
  porcentajeIva: z.number().min(0).max(105).default(21),
  descuento: z.number().min(0).max(100).default(0),
})

const pagoSchema = z.object({
  medio: z.enum([
    "efectivo",
    "tarjeta_debito",
    "tarjeta_credito",
    "transferencia",
    "cheque",
    "qr",
    "cuenta_corriente",
  ]),
  monto: z.number().positive(),
})

const ventaPosSchema = z.object({
  clienteId: z.number().int().positive().optional(),
  mesaId: z.number().int().positive().optional(),
  /** "A" | "B" | "C" | "ticket" (sin CAE) */
  tipoFactura: z.enum(["A", "B", "C", "ticket"]).default("B"),
  puntoVenta: z.number().int().positive().default(1),
  lineas: z.array(lineaSchema).min(1),
  /** Array de pagos — permite split payment */
  pagos: z.array(pagoSchema).min(1),
  descuentoGlobal: z.number().min(0).max(100).default(0),
  /** Si true (default), resuelve precio desde listas del cliente/empresa */
  usarListaPrecios: z.boolean().default(true),
  observaciones: z.string().optional(),
})

// ──────────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────────

export function calcularLinea(
  precioUnitario: number,
  cantidad: number,
  porcentajeIva: number,
  descuento: number,
): { neto: number; iva: number; total: number } {
  const baseConDescuento = precioUnitario * cantidad * (1 - descuento / 100)
  const neto = parseFloat((baseConDescuento / (1 + porcentajeIva / 100)).toFixed(2))
  const iva = parseFloat((baseConDescuento - neto).toFixed(2))
  const total = parseFloat(baseConDescuento.toFixed(2))
  return { neto, iva, total }
}

export function tipoCbteDesde(tipo: string): number {
  return { A: 1, B: 6, C: 11, ticket: 6 }[tipo] ?? 6
}

// ──────────────────────────────────────────────────────────────
// POST handler
// ──────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const ctx = await getAuthContext(request)
    if (!ctx.ok) return ctx.response

    const body = await request.json()
    const parsed = ventaPosSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Datos inválidos", detalles: parsed.error.flatten() },
        { status: 400 },
      )
    }

    const data = parsed.data
    const { empresaId } = ctx.auth

    // ── 1. Caja abierta ──────────────────────────────────────
    const caja = await prisma.caja.findFirst({
      where: { empresaId, estado: "abierta" },
    })
    if (!caja) {
      return NextResponse.json(
        { error: "No hay caja abierta. Abrí la caja antes de facturar." },
        { status: 400 },
      )
    }

    // ── 2. Cliente fallback (consumidor final) ───────────────
    let clienteId = data.clienteId
    if (!clienteId) {
      const consumidorFinal = await prisma.cliente.findFirst({
        where: { empresaId, nombre: { contains: "consumidor", mode: "insensitive" } },
      })
      if (consumidorFinal) clienteId = consumidorFinal.id
    }

    if (!clienteId) {
      return NextResponse.json(
        { error: "No se encontró un cliente válido para la venta POS. Verifique el cliente o cree un cliente Consumidor Final." },
        { status: 400 },
      )
    }

    const facturaClienteId = clienteId

    const cliente = await prisma.cliente.findUnique({
      where: { id: facturaClienteId },
      select: { condicionIva: true, esGranEmpresa: true, cuit: true, dni: true },
    })

    // ── 3. Siguiente número de factura ───────────────────────
    const esTicket = data.tipoFactura === "ticket"
    let tipoCbteFinal = tipoCbteDesde(data.tipoFactura)

    // ── 4. Resolver precios desde listas (si aplica) ─────────
    const lineasConPrecio = data.usarListaPrecios
      ? await resolverPreciosLineas(
          data.lineas.map((l) => ({
            productoId: l.productoId,
            cantidad: l.cantidad,
            precioUnitario: l.precioUnitario,
          })),
          { empresaId, clienteId, forzarLista: true }
        )
      : data.lineas.map((l) => ({
          productoId: l.productoId,
          cantidad: l.cantidad,
          precioUnitario: l.precioUnitario ?? 0,
        }))

    const lineaSinPrecio = lineasConPrecio.find((l) => l.precioUnitario <= 0)
    if (lineaSinPrecio) {
      return NextResponse.json(
        { error: "No se pudo resolver el precio de un ítem. Verificá producto y listas de precio." },
        { status: 400 },
      )
    }

    // ── 5. Calcular totales ──────────────────────────────────
    let subtotal = 0
    let totalIva = 0
    const lineasCalculadas = data.lineas.map((l, i) => {
      const precioUnitario = lineasConPrecio[i].precioUnitario
      const { neto, iva, total } = calcularLinea(
        precioUnitario,
        l.cantidad,
        l.porcentajeIva,
        l.descuento + data.descuentoGlobal,
      )
      subtotal += neto
      totalIva += iva
      return { ...l, precioUnitario, neto, iva, total }
    })

    const totalVenta = parseFloat((subtotal + totalIva).toFixed(2))
    const totalPagado = data.pagos.reduce((s, p) => s + p.monto, 0)
    const vuelto = parseFloat(Math.max(0, totalPagado - totalVenta).toFixed(2))

    if (!esTicket) {
      tipoCbteFinal = await resolverTipoCbtePos(
        empresaId,
        tipoCbteDesde(data.tipoFactura),
        totalVenta,
        cliente,
      )
    }

    const letraFactura = esTicket ? "TK" : letraDesdeTipoCbte(tipoCbteFinal)

    // ── 5. Transacción atómica ───────────────────────────────
    const result = await prisma.$transaction(async (tx) => {
      const ultimaFactura = await tx.factura.findFirst({
        where: {
          empresaId,
          ...(esTicket
            ? { estado: "ticket", puntoVenta: data.puntoVenta }
            : { tipoCbte: tipoCbteFinal, puntoVenta: data.puntoVenta }),
        },
        orderBy: { numero: "desc" },
      })
      const siguienteNumero = (ultimaFactura?.numero ?? 0) + 1

      // 5a. Crear Factura
      const factura = await tx.factura.create({
        data: {
          empresaId,
          clienteId: facturaClienteId,
          tipo: letraFactura,
          tipoCbte: esTicket ? tipoCbteDesde("B") : tipoCbteFinal,
          numero: siguienteNumero,
          puntoVenta: data.puntoVenta,
          subtotal: parseFloat(subtotal.toFixed(2)),
          iva: parseFloat(totalIva.toFixed(2)),
          total: totalVenta,
          estado: esTicket ? "ticket" : "pendiente_cae",
          condicionIvaReceptor: cliente?.condicionIva ?? undefined,
          observaciones: data.observaciones,
          lineas: {
            create: lineasCalculadas.map((l) => ({
              productoId: l.productoId,
              descripcion: l.descripcion,
              cantidad: l.cantidad,
              precioUnitario: l.precioUnitario,
              porcentajeIva: l.porcentajeIva,
              descuento: l.descuento,
              subtotal: l.neto,
              iva: l.iva,
              total: l.total,
            })),
          },
        },
        include: { lineas: true },
      })

      // 5b. Ajustar stock
      for (const l of lineasCalculadas) {
        if (!l.productoId) continue
        const producto = await tx.producto.findUnique({
          where: { id: l.productoId },
          select: { stock: true, nombre: true },
        })
        if (!producto) continue
        const stockNuevo = producto.stock - l.cantidad
        if (stockNuevo < 0) {
          throw new Error(`Stock insuficiente para el producto ${producto.nombre}. Stock actual: ${producto.stock}, requerido: ${l.cantidad}`)
        }
        await tx.producto.update({
          where: { id: l.productoId },
          data: { stock: stockNuevo },
        })
        await tx.movimientoStock.create({
          data: {
            empresaId,
            productoId: l.productoId,
            tipo: "salida",
            cantidad: l.cantidad,
            motivo: `Venta POS Factura ${data.tipoFactura}-${String(data.puntoVenta).padStart(5, "0")}-${String(siguienteNumero).padStart(8, "0")}`,
          },
        })
      }

      // 5c. MovimientoCaja por cada medio de pago
      for (const pago of data.pagos) {
        await tx.movimientoCaja.create({
          data: {
            cajaId: caja.id,
            tipo: "ingreso",
            concepto: `Venta POS #${siguienteNumero}`,
            monto: pago.monto,
            medioPago: pago.medio === "cuenta_corriente" ? "transferencia" : pago.medio,
            referencia: `FAC-${data.tipoFactura}-${siguienteNumero}`,
          },
        })
      }

      // 5d. Si hay mesa → cerrar comanda y liberar mesa
      if (data.mesaId) {
        const comanda = await tx.comanda.findFirst({
          where: { mesaId: data.mesaId, estado: { not: "cerrada" } },
        })
        if (comanda) {
          await tx.comanda.update({
            where: { id: comanda.id },
            data: { estado: "cerrada" },
          })
        }
        await tx.mesa.update({
          where: { id: data.mesaId },
          data: { estado: "libre" },
        })
      }

      // 5e. Si pago con cuenta corriente → registrar en CuentaCobrar
      const pagoCtaCte = data.pagos.find((p) => p.medio === "cuenta_corriente")
      if (pagoCtaCte && clienteId) {
        await tx.cuentaCobrar.create({
          data: {
            clienteId,
            facturaId: factura.id,
            montoOriginal: pagoCtaCte.monto,
            montoPagado: 0,
            saldo: pagoCtaCte.monto,
            fechaEmision: new Date(),
            fechaVencimiento: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            estado: "pendiente",
            observaciones: `Venta POS FAC-${data.tipoFactura}-${siguienteNumero}`,
          },
        })
      }

      return factura
    })

    // ── 6. Asiento contable (fuera de la tx atómica para no bloquearla) ───
    void onFacturaEmitida(result.id, empresaId)

    let cae: string | undefined
    let qrBase64: string | undefined
    let vencimientoCAE: string | undefined
    let afipError: string | undefined
    let estadoFinal = result.estado

    if (!esTicket) {
      const afip = await solicitarCaeFactura(result.id)
      if (afip.ok) {
        cae = afip.cae
        qrBase64 = afip.qrBase64
        vencimientoCAE = afip.vencimientoCAE
        estadoFinal = "emitida"
      } else {
        afipError = afip.error
        estadoFinal = "pendiente_cae"
      }
    }

    const esFce = !esTicket && [201, 206, 211].includes(tipoCbteFinal)

    return NextResponse.json(
      {
        ok: true,
        facturaId: result.id,
        tipo: result.tipo,
        tipoCbte: tipoCbteFinal,
        esFce,
        numero: result.numero,
        puntoVenta: result.puntoVenta,
        numeroCompleto: esTicket
          ? `TK-${String(result.puntoVenta).padStart(5, "0")}-${String(result.numero).padStart(8, "0")}`
          : `${result.tipo}-${String(result.puntoVenta).padStart(5, "0")}-${String(result.numero).padStart(8, "0")}`,
        total: totalVenta,
        totalPagado,
        vuelto,
        estado: estadoFinal,
        cae,
        qrBase64,
        vencimientoCAE,
        afipError,
        lineas: lineasCalculadas.length,
      },
      { status: 201 },
    )
  } catch (error: any) {
    console.error("Error en venta POS:", error)
    return NextResponse.json(
      { error: error?.message ?? "Error interno al procesar la venta" },
      { status: 500 },
    )
  }
}

// ──────────────────────────────────────────────────────────────
// GET /api/pos/venta — estado de la caja activa para el POS
// ──────────────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  try {
    const ctx = await getAuthContext(request)
    if (!ctx.ok) return ctx.response

    const empresaId = ctx.auth.empresaId

    const [caja, afip, ventasHoy] = await Promise.all([
      prisma.caja.findFirst({
        where: { empresaId, estado: "abierta" },
        include: {
          movimientos: {
            orderBy: { createdAt: "desc" },
            take: 5,
          },
        },
      }),
      obtenerEstadoAfipPos(empresaId),
      prisma.factura.count({
        where: {
          empresaId,
          createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
        },
      }),
    ])

    return NextResponse.json({
      cajaAbierta: !!caja,
      cajaId: caja?.id ?? null,
      turno: caja?.turno ?? null,
      saldoInicial: caja?.saldoInicial ?? 0,
      ultimosMovimientos: caja?.movimientos ?? [],
      ventasHoy,
      afip,
    })
  } catch (error) {
    console.error("Error al obtener estado POS:", error)
    return NextResponse.json({ error: "Error al obtener estado" }, { status: 500 })
  }
}
