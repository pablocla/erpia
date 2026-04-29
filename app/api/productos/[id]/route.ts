import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getAuthContext, whereEmpresa } from "@/lib/auth/empresa-guard"
import { invalidateContextCache } from "@/lib/ai"
import { eventBus } from "@/lib/events/event-bus"
import type {
  ProductoActualizadoPayload,
  ProductoEliminadoPayload,
} from "@/lib/events/types"
import { stockService } from "@/lib/stock/stock-service"
import "@/lib/producto/producto-event-handlers"

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const ctx = await getAuthContext(request)
    if (!ctx.ok) return ctx.response

    const { id } = await params
    const producto = await prisma.producto.findFirst({
      where: whereEmpresa(ctx.auth.empresaId, { id: parseInt(id) }),
      include: {
        categoria: true,
        movimientosStock: {
          orderBy: { createdAt: "desc" },
          take: 20,
        },
      },
    })

    if (!producto) {
      return NextResponse.json({ error: "Producto no encontrado" }, { status: 404 })
    }

    return NextResponse.json(producto)
  } catch (error) {
    console.error("Error al obtener producto:", error)
    return NextResponse.json({ error: "Error al obtener producto" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const ctx = await getAuthContext(request)
    if (!ctx.ok) return ctx.response

    const body = await request.json()
    const { id: rawId } = await params
    const id = parseInt(rawId)

    // Verify product belongs to this empresa
    const existing = await prisma.producto.findFirst({ where: whereEmpresa(ctx.auth.empresaId, { id }) })
    if (!existing) return NextResponse.json({ error: "Producto no encontrado" }, { status: 404 })

    const {
      codigo,
      nombre,
      descripcion,
      precioVenta,
      precioCompra,
      porcentajeIva,
      stockMinimo,
      unidad,
      categoriaId,
      activo,
      esPlato,
      esInsumo,
    } = body

    // Verificar código único dentro de la empresa (excluyendo el propio)
    if (codigo) {
      const existente = await prisma.producto.findFirst({
        where: whereEmpresa(ctx.auth.empresaId, { codigo, NOT: { id } }),
      })
      if (existente) {
        return NextResponse.json({ error: "Ya existe un producto con ese código" }, { status: 409 })
      }
    }

    const updateData: Record<string, unknown> = {
      ...(codigo && { codigo }),
      ...(nombre && { nombre }),
      ...(descripcion !== undefined && { descripcion }),
      ...(precioVenta !== undefined && { precioVenta: parseFloat(precioVenta) }),
      ...(precioCompra !== undefined && { precioCompra: parseFloat(precioCompra) }),
      ...(porcentajeIva !== undefined && { porcentajeIva: parseFloat(porcentajeIva) }),
      ...(stockMinimo !== undefined && { stockMinimo: parseFloat(stockMinimo) }),
      ...(unidad && { unidad }),
      ...(categoriaId !== undefined && { categoriaId: categoriaId ? parseInt(categoriaId) : null }),
      ...(activo !== undefined && { activo }),
      ...(esPlato !== undefined && { esPlato: Boolean(esPlato) }),
      ...(esInsumo !== undefined && { esInsumo: Boolean(esInsumo) }),
    }

    const producto = await prisma.producto.update({
      where: { id },
      data: updateData,
      include: { categoria: true },
    })

    await eventBus.emit<ProductoActualizadoPayload>({
      type: "PRODUCTO_ACTUALIZADO",
      payload: {
        productoId: producto.id,
        empresaId: ctx.auth.empresaId,
        cambios: updateData,
      },
      timestamp: new Date(),
      userId: ctx.auth.userId,
      empresaId: ctx.auth.empresaId,
    })

    invalidateContextCache(ctx.auth.empresaId)
    return NextResponse.json(producto)
  } catch (error) {
    console.error("Error al actualizar producto:", error)
    return NextResponse.json({ error: "Error al actualizar producto" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  // Ajuste de stock manual
  try {
    const ctx = await getAuthContext(request)
    if (!ctx.ok) return ctx.response

    const { cantidad, tipo, motivo } = await request.json()
    const { id: rawId } = await params
    const id = parseInt(rawId)

    const producto = await prisma.producto.findFirst({ where: whereEmpresa(ctx.auth.empresaId, { id }) })
    if (!producto) return NextResponse.json({ error: "Producto no encontrado" }, { status: 404 })

    const cantidadAjuste =
      tipo === "entrada"
        ? parseFloat(cantidad)
        : tipo === "salida"
        ? -parseFloat(cantidad)
        : parseFloat(cantidad) - producto.stock // ajuste directo a stock absoluto

    const nuevoStock = producto.stock + cantidadAjuste

    if (nuevoStock < 0) {
      return NextResponse.json({ error: "Stock insuficiente" }, { status: 400 })
    }

    await stockService.ajustarStockManual(id, cantidadAjuste, motivo || "Ajuste manual")

    const productoActualizado = await prisma.producto.findUnique({
      where: { id },
      include: { categoria: true },
    })

    if (!productoActualizado) {
      return NextResponse.json({ error: "Producto no encontrado tras ajuste" }, { status: 404 })
    }

    invalidateContextCache(ctx.auth.empresaId)
    return NextResponse.json(productoActualizado)
  } catch (error) {
    console.error("Error al ajustar stock:", error)
    return NextResponse.json({ error: "Error al ajustar stock" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const ctx = await getAuthContext(request)
    if (!ctx.ok) return ctx.response

    const { id: rawId } = await params
    const id = parseInt(rawId)

    const producto = await prisma.producto.findFirst({
      where: whereEmpresa(ctx.auth.empresaId, { id }),
    })

    if (!producto) {
      return NextResponse.json({ error: "Producto no encontrado" }, { status: 404 })
    }

    await prisma.producto.delete({
      where: { id },
    })

    await eventBus.emit<ProductoEliminadoPayload>({
      type: "PRODUCTO_ELIMINADO",
      payload: {
        productoId: id,
        empresaId: ctx.auth.empresaId,
        codigo: producto.codigo,
        nombre: producto.nombre,
      },
      timestamp: new Date(),
      userId: ctx.auth.userId,
      empresaId: ctx.auth.empresaId,
    })

    invalidateContextCache(ctx.auth.empresaId)
    return NextResponse.json({ message: "Producto eliminado correctamente" })
  } catch (error) {
    console.error("Error al eliminar producto:", error)
    return NextResponse.json({ error: "Error al eliminar producto" }, { status: 500 })
  }
}
