import { type NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { ventasService } from "@/lib/ventas/ventas-service"
import { logError } from "@/lib/monitoring/error-logger"

const lineaSchema = z.object({
  productoId: z.number().int().positive(),
  cantidad: z.number().positive(),
})

const clienteSchema = z.object({
  nombre: z.string().min(2),
  email: z.string().email().optional().nullable(),
  telefono: z.string().optional().nullable(),
  direccion: z.string().optional().nullable(),
  direccionComplemento: z.string().optional().nullable(),
  codigoPostal: z.string().optional().nullable(),
  dni: z.string().optional().nullable(),
  cuit: z.string().optional().nullable(),
})

const checkoutSchema = z.object({
  empresaId: z.number().int().positive(),
  canalVentaId: z.number().int().positive().optional(),
  canalVentaCodigo: z.string().min(1).optional(),
  observaciones: z.string().optional(),
  fechaEntregaEst: z.string().date().optional(),
  autoConfirmar: z.boolean().optional(),
  cliente: clienteSchema,
  lineas: z.array(lineaSchema).min(1),
})

function cleanText(value?: string | null): string | null {
  if (!value) return null
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

function roundMoney(value: number): number {
  return Math.round(value * 100) / 100
}

function normalizeCanalVentaCodigo(value?: string | null): string | null {
  if (!value) return null
  const trimmed = value.trim()
  if (!trimmed) return null
  const normalized = trimmed.replace(/[^a-z0-9]/gi, "").toLowerCase()
  if (normalized === "ecommerce" || normalized === "ecom") return "ONLINE"
  return trimmed
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = checkoutSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ error: "Datos invalidos", detalles: parsed.error.errors }, { status: 400 })
    }

    const {
      empresaId,
      canalVentaId: canalVentaIdInput,
      canalVentaCodigo,
      observaciones,
      fechaEntregaEst,
      autoConfirmar,
      cliente,
      lineas,
    } = parsed.data

    const canalVentaCodigoResolved = normalizeCanalVentaCodigo(canalVentaCodigo)

    const empresa = await prisma.empresa.findUnique({ where: { id: empresaId } })
    if (!empresa) {
      return NextResponse.json({ error: "Empresa no encontrada" }, { status: 404 })
    }

    let canalVenta = null
    if (canalVentaIdInput) {
      canalVenta = await prisma.canalVenta.findUnique({ where: { id: canalVentaIdInput } })
      if (!canalVenta) {
        return NextResponse.json({ error: "Canal de venta no encontrado" }, { status: 404 })
      }
    }

    if (!canalVenta && canalVentaCodigoResolved) {
      canalVenta = await prisma.canalVenta.findFirst({
        where: {
          OR: [
            { codigo: { equals: canalVentaCodigoResolved, mode: "insensitive" } },
            { nombre: { equals: canalVentaCodigoResolved, mode: "insensitive" } },
          ],
        },
      })
    }

    const canalVentaId = canalVenta?.id ?? canalVentaIdInput ?? null

    const clienteData = {
      nombre: cliente.nombre,
      email: cleanText(cliente.email),
      telefono: cleanText(cliente.telefono),
      direccion: cleanText(cliente.direccion),
      direccionComplemento: cleanText(cliente.direccionComplemento),
      codigoPostal: cleanText(cliente.codigoPostal),
      dni: cleanText(cliente.dni),
      cuit: cleanText(cliente.cuit),
    }

    const lookupFilters: Array<Record<string, string>> = []
    if (clienteData.email) lookupFilters.push({ email: clienteData.email })
    if (clienteData.dni) lookupFilters.push({ dni: clienteData.dni })
    if (clienteData.cuit) lookupFilters.push({ cuit: clienteData.cuit })

    let clienteDb = null
    if (lookupFilters.length > 0) {
      clienteDb = await prisma.cliente.findFirst({
        where: { empresaId, OR: lookupFilters },
      })
    }

    if (!clienteDb) {
      clienteDb = await prisma.cliente.create({
        data: {
          nombre: clienteData.nombre,
          tipoPersona: clienteData.cuit ? "persona_juridica" : "persona_fisica",
          email: clienteData.email ?? null,
          telefono: clienteData.telefono ?? null,
          direccion: clienteData.direccion ?? null,
          direccionComplemento: clienteData.direccionComplemento ?? null,
          codigoPostal: clienteData.codigoPostal ?? null,
          dni: clienteData.dni ?? null,
          cuit: clienteData.cuit ?? null,
          canalVentaId,
          empresaId,
        },
      })
    } else {
      const updateData: Record<string, string | number | null> = {}
      if (clienteData.email) updateData.email = clienteData.email
      if (clienteData.telefono) updateData.telefono = clienteData.telefono
      if (clienteData.direccion) updateData.direccion = clienteData.direccion
      if (clienteData.direccionComplemento) updateData.direccionComplemento = clienteData.direccionComplemento
      if (clienteData.codigoPostal) updateData.codigoPostal = clienteData.codigoPostal
      if (clienteData.dni) updateData.dni = clienteData.dni
      if (clienteData.cuit) updateData.cuit = clienteData.cuit
      if (canalVentaId && !clienteDb.canalVentaId) updateData.canalVentaId = canalVentaId

      if (Object.keys(updateData).length > 0) {
        clienteDb = await prisma.cliente.update({
          where: { id: clienteDb.id },
          data: updateData,
        })
      }
    }

    const productIds = [...new Set(lineas.map((linea) => linea.productoId))]
    const productos = await prisma.producto.findMany({
      where: { empresaId, id: { in: productIds }, activo: true },
      select: { id: true, nombre: true, precioVenta: true, stock: true },
    })

    if (productos.length !== productIds.length) {
      return NextResponse.json({ error: "Productos no encontrados" }, { status: 404 })
    }

    const productoMap = new Map(productos.map((producto) => [producto.id, producto]))
    const insuficientes: Array<{ productoId: number; nombre: string; stock: number; solicitado: number }> = []

    for (const linea of lineas) {
      const producto = productoMap.get(linea.productoId)
      if (!producto) continue
      if (producto.stock < linea.cantidad) {
        insuficientes.push({
          productoId: producto.id,
          nombre: producto.nombre,
          stock: producto.stock,
          solicitado: linea.cantidad,
        })
      }
    }

    if (insuficientes.length > 0) {
      return NextResponse.json({ error: "Stock insuficiente", insuficientes }, { status: 409 })
    }

    const markupPct = canalVenta ? Number(canalVenta.markupPct) : 0

    const lineasPedido = lineas.map((linea) => {
      const producto = productoMap.get(linea.productoId)
      if (!producto) {
        return {
          productoId: linea.productoId,
          descripcion: "Producto",
          cantidad: linea.cantidad,
          precioUnitario: 0,
        }
      }

      const precioBase = Number(producto.precioVenta)
      const precioUnitario = roundMoney(precioBase * (1 + markupPct / 100))

      return {
        productoId: producto.id,
        descripcion: producto.nombre,
        cantidad: linea.cantidad,
        precioUnitario,
      }
    })

    const nota = observaciones ? `Ecommerce: ${observaciones}` : "Ecommerce"

    const pedido = await ventasService.crearPedidoVenta({
      clienteId: clienteDb.id,
      empresaId,
      canalVentaId: canalVentaId ?? undefined,
      fechaEntregaEst: fechaEntregaEst ? new Date(fechaEntregaEst) : undefined,
      observaciones: nota,
      lineas: lineasPedido,
    })

    let pedidoFinal = pedido
    if (autoConfirmar ?? true) {
      try {
        await ventasService.confirmarPedido(pedido.id, empresaId)
        pedidoFinal = { ...pedido, estado: "confirmado" }
      } catch (error: any) {
        const message = error?.message ?? "No se pudo confirmar el pedido"
        return NextResponse.json({ error: message, pedidoId: pedido.id, estado: pedido.estado }, { status: 409 })
      }
    }

    return NextResponse.json({ pedido: pedidoFinal }, { status: 201 })
  } catch (error) {
    logError("api/ecommerce/checkout:POST", error, request)
    return NextResponse.json({ error: "Error al crear pedido" }, { status: 500 })
  }
}
