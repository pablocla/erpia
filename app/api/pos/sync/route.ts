import { NextRequest, NextResponse } from "next/server"
import { getAuthContext } from "@/lib/auth/empresa-guard"
import { prisma } from "@/lib/prisma"
import { emitFacturaEmitidaLegacy } from "@/lib/events/emit-domain-event"
import { z } from "zod"

const lineaSchema = z.object({
  productoId: z.number().int().positive().optional(),
  descripcion: z.string().min(1),
  cantidad: z.number().positive(),
  precioUnitario: z.number().nonnegative(),
  porcentajeIva: z.number().min(0).max(105).optional().default(21),
  descuento: z.number().min(0).max(100).optional().default(0),
})

const pagoSchema = z.object({
  medio: z.string().min(1),
  monto: z.number().positive(),
  numeroVale: z.string().optional(),
})

const offlinePedidoSchema = z.object({
  idLocal: z.string().min(1),
  clienteId: z.number().int().positive().optional(),
  mesaId: z.number().int().positive().optional(),
  tipoFactura: z.enum(["A", "B", "C", "ticket"]).optional().default("ticket"),
  lineas: z.array(lineaSchema).min(1),
  pagos: z.array(pagoSchema).min(1).optional(),
  descuentoGlobal: z.number().min(0).max(100).optional().default(0),
  propina: z.number().min(0).optional().default(0),
  observaciones: z.string().optional(),
  total: z.number().optional(),
  fechaLocal: z.string().optional(),
})

function calcLinea(
  precioUnitario: number,
  cantidad: number,
  porcentajeIva: number,
  descuento: number,
) {
  const base = precioUnitario * cantidad * (1 - descuento / 100)
  const neto = parseFloat((base / (1 + porcentajeIva / 100)).toFixed(2))
  const iva = parseFloat((base - neto).toFixed(2))
  const total = parseFloat(base.toFixed(2))
  return { neto, iva, total }
}

/**
 * POST /api/pos/sync
 * Sincroniza cola de ventas offline (IndexedDB → servidor) como tickets POS.
 */
export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthContext(request)
    if (!auth.ok) return auth.response

    const body = await request.json()
    const { pedidosOffline } = body

    if (!Array.isArray(pedidosOffline)) {
      return NextResponse.json(
        { error: "El payload debe contener un arreglo de pedidosOffline" },
        { status: 400 },
      )
    }

    const empresaId = auth.auth.empresaId

    const caja = await prisma.caja.findFirst({
      where: { empresaId, estado: "abierta" },
      orderBy: { createdAt: "desc" },
    })

    if (!caja) {
      return NextResponse.json(
        { error: "No hay caja abierta. Abrí la caja antes de sincronizar ventas offline." },
        { status: 400 },
      )
    }

    const consumidorFinal = await prisma.cliente.findFirst({
      where: {
        empresaId,
        nombre: { contains: "consumidor", mode: "insensitive" },
      },
    })

    const resultados: Array<{
      idLocal: string
      success: boolean
      serverId?: number
      error?: string
    }> = []

    for (const raw of pedidosOffline) {
      const parsed = offlinePedidoSchema.safeParse(raw)
      if (!parsed.success) {
        resultados.push({
          idLocal: String((raw as { idLocal?: string })?.idLocal ?? "?"),
          success: false,
          error: "Payload offline inválido",
        })
        continue
      }

      const pedido = parsed.data
      const clienteId = pedido.clienteId ?? consumidorFinal?.id

      if (!clienteId) {
        resultados.push({
          idLocal: pedido.idLocal,
          success: false,
          error: "Sin cliente (creá Consumidor Final o enviá clienteId)",
        })
        continue
      }

      try {
        const lineasCalc = pedido.lineas.map((l) => {
          const ivaPct = l.porcentajeIva ?? 21
          const desc = (l.descuento ?? 0) + (pedido.descuentoGlobal ?? 0)
          const { neto, iva, total } = calcLinea(
            l.precioUnitario,
            l.cantidad,
            ivaPct,
            Math.min(100, desc),
          )
          return { ...l, ivaPct, neto, iva, total }
        })

        let subtotal = lineasCalc.reduce((s, l) => s + l.neto, 0)
        let ivaTotal = lineasCalc.reduce((s, l) => s + l.iva, 0)
        const propina = pedido.propina ?? 0
        const totalVenta =
          pedido.total ??
          parseFloat((subtotal + ivaTotal + propina).toFixed(2))

        const pagos =
          pedido.pagos && pedido.pagos.length > 0
            ? pedido.pagos
            : [{ medio: "efectivo", monto: totalVenta }]

        const factura = await prisma.$transaction(async (tx) => {
          const ultima = await tx.factura.findFirst({
            where: { empresaId, estado: "ticket", puntoVenta: 1 },
            orderBy: { numero: "desc" },
          })
          const siguienteNumero = (ultima?.numero ?? 0) + 1

          const fac = await tx.factura.create({
            data: {
              empresaId,
              clienteId,
              tipo: "TK",
              tipoCbte: 6,
              numero: siguienteNumero,
              puntoVenta: 1,
              subtotal: parseFloat(subtotal.toFixed(2)),
              iva: parseFloat(ivaTotal.toFixed(2)),
              total: totalVenta,
              estado: "ticket",
              observaciones:
                pedido.observaciones ??
                `Sincronizado offline (${pedido.idLocal})${
                  pedido.fechaLocal ? ` · local ${pedido.fechaLocal}` : ""
                }`,
              ...(propina > 0 ? { netoNoGravado: propina } : {}),
              lineas: {
                create: [
                  ...lineasCalc.map((l) => ({
                    productoId: l.productoId,
                    descripcion: l.descripcion,
                    cantidad: l.cantidad,
                    precioUnitario: l.precioUnitario,
                    porcentajeIva: l.ivaPct,
                    descuento: l.descuento ?? 0,
                    subtotal: l.neto,
                    iva: l.iva,
                    total: l.total,
                  })),
                  ...(propina > 0
                    ? [
                        {
                          descripcion: "Propina",
                          cantidad: 1,
                          precioUnitario: propina,
                          porcentajeIva: 0,
                          descuento: 0,
                          subtotal: propina,
                          iva: 0,
                          total: propina,
                        },
                      ]
                    : []),
                ],
              },
            },
          })

          for (const l of lineasCalc) {
            if (!l.productoId) continue
            const producto = await tx.producto.findFirst({
              where: { id: l.productoId, empresaId },
              select: { stock: true },
            })
            if (!producto) continue
            await tx.producto.update({
              where: { id: l.productoId },
              data: { stock: producto.stock - l.cantidad },
            })
            await tx.movimientoStock.create({
              data: {
                empresaId,
                productoId: l.productoId,
                tipo: "salida",
                cantidad: l.cantidad,
                motivo: `POS offline ${pedido.idLocal} FAC-TK-${siguienteNumero}`,
              },
            })
          }

          for (const p of pagos) {
            if (p.medio === "vale") continue
            await tx.movimientoCaja.create({
              data: {
                cajaId: caja.id,
                tipo: "ingreso",
                concepto: `Venta offline #${siguienteNumero}`,
                monto: p.monto,
                medioPago: p.medio === "cuenta_corriente" ? "transferencia" : p.medio,
                referencia: `OFF-${pedido.idLocal}`,
              },
            })
          }

          if (pedido.mesaId) {
            const mesa = await tx.mesa.findFirst({
              where: { id: pedido.mesaId, salon: { empresaId } },
            })
            if (mesa) {
              await tx.comanda.updateMany({
                where: { mesaId: pedido.mesaId, estado: { not: "cerrada" } },
                data: { estado: "cerrada" },
              })
              await tx.mesa.update({
                where: { id: pedido.mesaId },
                data: { estado: "libre" },
              })
            }
          }

          return fac
        })

        void emitFacturaEmitidaLegacy(factura.id, empresaId, {
          total: Number(factura.total),
        })

        resultados.push({
          idLocal: pedido.idLocal,
          success: true,
          serverId: factura.id,
        })
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Error"
        resultados.push({ idLocal: pedido.idLocal, success: false, error: message })
      }
    }

    return NextResponse.json({
      success: true,
      resultados,
      sincronizados: resultados.filter((r) => r.success).length,
      fallidos: resultados.filter((r) => !r.success).length,
    })
  } catch (error) {
    console.error("Error en POS sync:", error)
    return NextResponse.json({ error: "Error interno de sincronización" }, { status: 500 })
  }
}
