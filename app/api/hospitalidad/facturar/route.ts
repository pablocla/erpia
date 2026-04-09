import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { FacturaService } from "@/lib/afip/factura-service"
import { getAuthContext, whereEmpresa } from "@/lib/auth/empresa-guard"
import type { FacturaPayload } from "@/lib/types"

const facturarSchema = z.object({
  comandaId: z.number().int().positive(),
  clienteId: z.number().int().positive(),
  puntoVenta: z.number().int().positive().optional(),
  tipoCbte: z.number().int().positive().optional(),
})

export async function POST(request: NextRequest) {
  try {
    const ctx = await getAuthContext(request)
    if (!ctx.ok) return ctx.response

    const body = await request.json()
    const parsed = facturarSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: "Datos inválidos", detalles: parsed.error.flatten() }, { status: 400 })
    }

    const { comandaId, clienteId, puntoVenta, tipoCbte } = parsed.data

    const [empresa, cliente, comanda] = await Promise.all([
      prisma.empresa.findUnique({ where: { id: ctx.auth.empresaId } }),
      prisma.cliente.findFirst({ where: whereEmpresa(ctx.auth.empresaId, { id: clienteId }) }),
      (prisma as any).comanda.findFirst({
        where: { id: comandaId, mesa: { salon: { empresaId: ctx.auth.empresaId } } },
        include: { lineas: { include: { producto: true } }, mesa: true },
      }),
    ])

    if (!empresa) return NextResponse.json({ error: "Empresa no encontrada" }, { status: 404 })
    if (!cliente) return NextResponse.json({ error: "Cliente no encontrado" }, { status: 404 })
    if (!comanda) return NextResponse.json({ error: "Comanda no encontrada" }, { status: 404 })

    if (comanda.estado === "cerrada") {
      return NextResponse.json({ error: "La comanda ya está cerrada" }, { status: 409 })
    }

    if (comanda.facturaId) {
      return NextResponse.json({ error: "La comanda ya está facturada" }, { status: 409 })
    }

    if (comanda.lineas.length === 0) {
      return NextResponse.json({ error: "La comanda no tiene ítems" }, { status: 400 })
    }

    const items = comanda.lineas.map((linea: {
      nombre: string
      cantidad: number
      precio: number
      productoId?: number | null
      producto?: { porcentajeIva?: number | null } | null
    }) => ({
      descripcion: linea.nombre,
      cantidad: Number(linea.cantidad),
      precioUnitario: Number(linea.precio),
      iva: linea.producto?.porcentajeIva ?? 21,
      productoId: linea.productoId ?? undefined,
    }))

    const total = items.reduce(
      (acc: number, item: { cantidad: number; precioUnitario: number; iva: number }) => {
      const subtotal = item.cantidad * item.precioUnitario
      const iva = (subtotal * item.iva) / 100
      return acc + subtotal + iva
      },
      0,
    )

    const payload: FacturaPayload = {
      cuit: empresa.cuit,
      puntoVenta: puntoVenta ?? empresa.puntoVenta,
      tipoCbte: tipoCbte ?? 6,
      cliente: {
        nombre: cliente.nombre,
        cuit: cliente.cuit ?? undefined,
        dni: cliente.dni ?? undefined,
        condicionIva: cliente.condicionIva,
      },
      items,
      total,
    }

    const entorno = process.env.AFIP_ENTORNO === "produccion" ? "produccion" : "homologacion"
    const facturaService = new FacturaService(entorno)
    const resultado = await facturaService.emitirFactura(payload)

    if (!resultado.success || !resultado.facturaId) {
      return NextResponse.json({ error: resultado.error || "Error al emitir factura" }, { status: 400 })
    }

    await prisma.$transaction([
      (prisma as any).comanda.update({
        where: { id: comanda.id },
        data: { estado: "cerrada", facturaId: resultado.facturaId },
      }),
      prisma.mesa.update({ where: { id: comanda.mesaId }, data: { estado: "libre" } }),
    ])

    return NextResponse.json({
      success: true,
      facturaId: resultado.facturaId,
      cae: resultado.cae,
      numero: resultado.numero,
      fechaCAE: resultado.fechaCAE,
      vencimientoCAE: resultado.vencimientoCAE,
      qrBase64: resultado.qrBase64,
    })
  } catch (error) {
    console.error("Error al facturar comanda:", error)
    return NextResponse.json({ error: "Error al facturar comanda" }, { status: 500 })
  }
}
