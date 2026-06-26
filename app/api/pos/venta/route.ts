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
import {
  validarFiadoPos,
  incrementarDeudaCliente,
  enviarNotificacionFiado,
} from "@/lib/fiado/fiado-service"
import { canUseSku } from "@/lib/platform/entitlements"
import { assertClienteEmpresa } from "@/lib/auth/tenant-validate"
import { descontarStockCombo } from "@/lib/pos/pos-catalogo-grupos"
import { registrarVentaStockCero } from "@/lib/almacen-rosario/stock-cero-service"
import { buscarValeActivo, aplicarCobroVale } from "@/lib/almacen-rosario/vale-dinero-service"
import { RETAIL_EXTENSION_SKUS } from "@/lib/almacen-rosario/retail-skus"
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
    "vale",
  ]),
  monto: z.number().positive(),
  numeroVale: z.string().min(1).optional(),
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
  /** Propina opcional (gastronomía) — se suma al total sin IVA adicional */
  propina: z.number().min(0).default(0),
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

    let cliente: { condicionIva: string | null; esGranEmpresa: boolean | null; cuit: string | null; dni: string | null }
    try {
      cliente = await assertClienteEmpresa(facturaClienteId, empresaId)
    } catch {
      return NextResponse.json({ error: "Cliente no encontrado en esta empresa" }, { status: 400 })
    }

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

    const propina = data.propina ?? 0
    const totalVenta = parseFloat((subtotal + totalIva + propina).toFixed(2))
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

    const pagosVale = data.pagos.filter((p) => p.medio === "vale")
    if (pagosVale.length > 0) {
      const valeAcceso = await canUseSku(empresaId, "pos.vale_dinero")
      if (!valeAcceso.ok) {
        return NextResponse.json({ error: "Vale de dinero no activo en esta empresa" }, { status: 403 })
      }
      for (const p of pagosVale) {
        if (!p.numeroVale?.trim()) {
          return NextResponse.json({ error: "Ingresá el número del vale para cobrar" }, { status: 400 })
        }
        try {
          const vale = await buscarValeActivo(empresaId, p.numeroVale)
          if (!vale) {
            return NextResponse.json({ error: `Vale ${p.numeroVale} no encontrado` }, { status: 400 })
          }
          if (p.monto > vale.saldoRestante + 0.01) {
            return NextResponse.json(
              {
                error: `El vale ${vale.numero} solo tiene $${vale.saldoRestante.toLocaleString("es-AR")} disponibles`,
                disponible: vale.saldoRestante,
              },
              { status: 400 },
            )
          }
        } catch (e) {
          return NextResponse.json(
            { error: e instanceof Error ? e.message : "Vale inválido" },
            { status: 400 },
          )
        }
      }
    }

    const pagoCtaCtePre = data.pagos.find((p) => p.medio === "cuenta_corriente")
    if (pagoCtaCtePre) {
      if (!facturaClienteId) {
        return NextResponse.json(
          { error: "Seleccioná un cliente para vender a fiado (cuenta corriente)" },
          { status: 400 },
        )
      }
      const validacion = await validarFiadoPos(empresaId, facturaClienteId, pagoCtaCtePre.monto)
      if (!validacion.ok) {
        return NextResponse.json(
          {
            error: validacion.error,
            deudaActual: validacion.deudaActual,
            limite: validacion.limite,
            disponible: validacion.disponible,
          },
          { status: 400 },
        )
      }
    }

    // ── 5. Transacción atómica ───────────────────────────────
    let saldoNuevoFiado: number | undefined
    let cuentaCobrarFiadoId: number | undefined

    const stockCeroActivo = (await canUseSku(empresaId, "pos.stock_cero_alert")).ok
    const eventosStockCero: Array<{
      productoId: number
      productoNombre: string
      cantidad: number
      stockAntes: number
    }> = []

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
          ...(propina > 0 ? { netoNoGravado: parseFloat(propina.toFixed(2)) } : {}),
          lineas: {
            create: [
              ...lineasCalculadas.map((l) => ({
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
              ...(propina > 0
                ? [{
                    descripcion: "Propina",
                    cantidad: 1,
                    precioUnitario: propina,
                    porcentajeIva: 0,
                    descuento: 0,
                    subtotal: propina,
                    iva: 0,
                    total: propina,
                  }]
                : []),
            ],
          },
        },
        include: { lineas: true },
      })

      // 5b. Ajustar stock (combo BOM o producto directo)
      for (const l of lineasCalculadas) {
        if (!l.productoId) continue
        const descontadoCombo = await descontarStockCombo(
          tx,
          empresaId,
          l.productoId,
          l.cantidad,
        )
        if (descontadoCombo) continue

        const producto = await tx.producto.findFirst({
          where: { id: l.productoId, empresaId },
          select: { stock: true, nombre: true },
        })
        if (!producto) {
          throw new Error(`Producto ${l.productoId} no pertenece a esta empresa`)
        }
        const stockAntes = producto.stock
        const stockNuevo = stockAntes - l.cantidad
        if (stockNuevo < 0 && !stockCeroActivo) {
          throw new Error(`Stock insuficiente para el producto ${producto.nombre}. Stock actual: ${producto.stock}, requerido: ${l.cantidad}`)
        }
        await tx.producto.update({
          where: { id: l.productoId },
          data: { stock: stockNuevo },
        })
        if (stockCeroActivo && stockAntes <= 0) {
          eventosStockCero.push({
            productoId: l.productoId,
            productoNombre: producto.nombre,
            cantidad: l.cantidad,
            stockAntes,
          })
        }
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

      // 5c. MovimientoCaja por cada medio de pago (vale no ingresa efectivo)
      for (const pago of data.pagos) {
        if (pago.medio === "vale") continue
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

      // 5c2. Cobro de vales de dinero
      for (const pago of pagosVale) {
        if (!pago.numeroVale) continue
        await aplicarCobroVale(
          {
            empresaId,
            numero: pago.numeroVale,
            monto: pago.monto,
            facturaId: factura.id,
            referencia: `FAC-${data.tipoFactura}-${siguienteNumero}`,
          },
          tx as unknown as Parameters<typeof aplicarCobroVale>[1],
        )
      }

      // 5d. Si hay mesa → cerrar comanda y liberar mesa
      if (data.mesaId) {
        const mesa = await tx.mesa.findFirst({
          where: { id: data.mesaId, salon: { empresaId } },
        })
        if (!mesa) {
          throw new Error("Mesa no encontrada en esta empresa")
        }
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
        const cc = await tx.cuentaCobrar.create({
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
        cuentaCobrarFiadoId = cc.id
        saldoNuevoFiado = await incrementarDeudaCliente(tx, clienteId, pagoCtaCte.monto)
      }

      return factura
    })

    for (const ev of eventosStockCero) {
      void registrarVentaStockCero({ empresaId, ...ev, facturaId: result.id })
    }

    // ── 6. Asiento contable (fuera de la tx atómica para no bloquearla) ───
    void onFacturaEmitida(result.id, empresaId)

    let cae: string | undefined
    let qrBase64: string | undefined
    let vencimientoCAE: string | undefined
    let afipError: string | undefined
    let estadoFinal = result.estado
    let modalidadAuth: string = "CAE"

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

    const facturaFinal = await prisma.factura.findUnique({
      where: { id: result.id },
      select: { modalidadAuth: true, tipoCbte: true, estado: true },
    })
    if (facturaFinal?.modalidadAuth) modalidadAuth = facturaFinal.modalidadAuth
    if (facturaFinal?.estado) estadoFinal = facturaFinal.estado

    const tipoCbteResp = facturaFinal?.tipoCbte ?? tipoCbteFinal
    const esFce = !esTicket && [201, 206, 211].includes(tipoCbteResp)
    const esExportacion = !esTicket && [19, 20, 21].includes(tipoCbteResp)

    const numeroCompleto = esTicket
      ? `TK-${String(result.puntoVenta).padStart(5, "0")}-${String(result.numero).padStart(8, "0")}`
      : `${result.tipo}-${String(result.puntoVenta).padStart(5, "0")}-${String(result.numero).padStart(8, "0")}`

    if (pagoCtaCtePre && saldoNuevoFiado !== undefined && facturaClienteId) {
      void enviarNotificacionFiado({
        empresaId,
        clienteId: facturaClienteId,
        facturaId: result.id,
        cuentaCobrarId: cuentaCobrarFiadoId,
        numeroCompleto,
        lineas: lineasCalculadas.map((l) => ({
          descripcion: l.descripcion,
          cantidad: l.cantidad,
          total: l.total,
        })),
        totalVenta,
        saldoNuevo: saldoNuevoFiado,
      }).catch((err) => console.error("[Fiado] Error notificación:", err))
    }

    return NextResponse.json(
      {
        ok: true,
        facturaId: result.id,
        tipo: result.tipo,
        tipoCbte: tipoCbteResp,
        esFce,
        esExportacion,
        modalidadAuth,
        pendienteCae: estadoFinal === "pendiente_cae",
        numero: result.numero,
        puntoVenta: result.puntoVenta,
        numeroCompleto,
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

    const [caja, afip, ventasHoy, fiadoAcceso, envasesAcceso, valesAcceso, ...retailAccesos] = await Promise.all([
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
      canUseSku(empresaId, "pos.fiado_barrio"),
      canUseSku(empresaId, "pos.envases_gaseosas"),
      canUseSku(empresaId, "pos.vale_dinero"),
      ...RETAIL_EXTENSION_SKUS.map((sku) => canUseSku(empresaId, sku)),
    ])

    const retailActivo = Object.fromEntries(
      RETAIL_EXTENSION_SKUS.map((sku, i) => [sku, retailAccesos[i]?.ok ?? false]),
    )

    return NextResponse.json({
      cajaAbierta: !!caja,
      cajaId: caja?.id ?? null,
      turno: caja?.turno ?? null,
      saldoInicial: caja?.saldoInicial ?? 0,
      ultimosMovimientos: caja?.movimientos ?? [],
      ventasHoy,
      afip,
      fiadoActivo: fiadoAcceso.ok,
      envasesActivo: envasesAcceso.ok,
      valesActivo: valesAcceso.ok,
      retailActivo,
    })
  } catch (error) {
    console.error("Error al obtener estado POS:", error)
    return NextResponse.json({ error: "Error al obtener estado" }, { status: 500 })
  }
}
