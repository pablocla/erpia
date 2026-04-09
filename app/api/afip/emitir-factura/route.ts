import { type NextRequest, NextResponse } from "next/server"
import { FacturaService } from "@/lib/afip/factura-service"
import { z } from "zod"
import { verificarToken } from "@/lib/auth/middleware"
import { prisma } from "@/lib/prisma"
import type { FacturaPayload } from "@/lib/types"

const facturaAfipSchema = z.object({
  cuit: z.string().regex(/^\d{11}$/, "CUIT debe tener 11 dígitos"),
  puntoVenta: z.number().min(1).max(9999),
  tipoCbte: z.number().int().positive(),
  cliente: z.object({
    nombre: z.string().min(1),
    cuit: z.string().optional(),
    dni: z.string().optional(),
    condicionIva: z.string(),
  }),
  items: z
    .array(
      z.object({
        descripcion: z.string().min(1),
        cantidad: z.number().positive(),
        precioUnitario: z.number().positive(),
        iva: z.number().min(0).max(100),
      }),
    )
    .min(1),
  total: z.number().positive(),
})

const facturaPosSchema = z.object({
  clienteId: z.number().int().positive(),
  puntoVenta: z.number().min(1).max(9999).optional(),
  tipoCbte: z.number().int().positive().optional(),
  tesCodigo: z.string().optional(),
  remitoId: z.number().int().positive().optional(),
  items: z
    .array(
      z.object({
        descripcion: z.string().min(1),
        cantidad: z.number().positive(),
        precioUnitario: z.number().positive(),
        iva: z.number().min(0).max(100),
        productoId: z.number().int().positive().optional(),
      }),
    )
    .min(1),
  total: z.number().positive().optional(),
})

const payloadUnionSchema = z.union([facturaAfipSchema, facturaPosSchema])

function normalizarDocumento(cliente: { cuit?: string; dni?: string }) {
  const cuit = (cliente.cuit || "").replace(/\D/g, "")
  const dni = (cliente.dni || "").replace(/\D/g, "")
  return { cuit, dni }
}

function validarDatosAfip(payload: FacturaPayload): string | null {
  const cuitEmisor = (payload.cuit || "").replace(/\D/g, "")
  if (cuitEmisor.length !== 11) return "CUIT emisor inválido para AFIP"

  const { cuit, dni } = normalizarDocumento(payload.cliente)
  if (!payload.cliente.condicionIva) return "Condición IVA del cliente es obligatoria"
  if (!cuit && !dni) return "El cliente debe tener CUIT o DNI para emitir comprobante"
  if (cuit && cuit.length !== 11) return "El CUIT del cliente debe tener 11 dígitos"
  if (!cuit && dni && (dni.length < 7 || dni.length > 8)) return "El DNI del cliente es inválido"

  // Factura A requiere CUIT receptor
  if (payload.tipoCbte === 1 && cuit.length !== 11) {
    return "Factura A requiere CUIT válido del cliente"
  }

  return null
}

async function normalizarPayload(body: unknown, empresaId: number): Promise<FacturaPayload | null> {
  const validacion = payloadUnionSchema.safeParse(body)
  if (!validacion.success) return null

  const data = validacion.data

  if ("clienteId" in data) {
    const [empresa, cliente] = await Promise.all([
      prisma.empresa.findUnique({ where: { id: empresaId }, select: { cuit: true, puntoVenta: true } }),
      prisma.cliente.findUnique({
        where: { id: data.clienteId },
        select: { nombre: true, cuit: true, dni: true, condicionIva: true },
      }),
    ])

    if (!empresa || !cliente) return null

    const payload: FacturaPayload = {
      cuit: empresa.cuit,
      puntoVenta: data.puntoVenta ?? empresa.puntoVenta,
      tipoCbte: data.tipoCbte ?? 6,
      cliente: {
        nombre: cliente.nombre,
        cuit: cliente.cuit ?? undefined,
        dni: cliente.dni ?? undefined,
        condicionIva: cliente.condicionIva,
      },
      items: data.items,
      remitoId: data.remitoId,
      total:
        data.total ??
        data.items.reduce((acc, item) => {
          const subtotal = item.cantidad * item.precioUnitario
          const iva = (subtotal * item.iva) / 100
          return acc + subtotal + iva
        }, 0),
    }
    return payload
  }

  return data
}

export async function POST(request: NextRequest) {
  try {
    const usuario = await verificarToken(request)
    if (!usuario) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

    const body = await request.json()

    const payload = await normalizarPayload(body, usuario.empresaId)
    if (!payload) {
      const validacion = payloadUnionSchema.safeParse(body)
      return NextResponse.json(
        { error: "Datos inválidos", detalles: validacion.success ? [] : validacion.error.errors },
        { status: 400 },
      )
    }

    const errorAfip = validarDatosAfip(payload)
    if (errorAfip) {
      return NextResponse.json({ error: errorAfip }, { status: 400 })
    }

    // Determinar el entorno (homologación o producción)
    const entorno = process.env.AFIP_ENTORNO === "produccion" ? "produccion" : "homologacion"

    // Emitir la factura
    const facturaService = new FacturaService(entorno)
    const resultado = await facturaService.emitirFactura(payload)

    if (!resultado.success) {
      return NextResponse.json({ error: resultado.error }, { status: 400 })
    }

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
    console.error("Error en endpoint emitir-factura:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
