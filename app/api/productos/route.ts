import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getAuthContext, whereEmpresa } from "@/lib/auth/empresa-guard"
import { invalidateContextCache } from "@/lib/ai"
import { eventBus } from "@/lib/events/event-bus"
import type { ProductoCreadoPayload, StockActualizadoPayload } from "@/lib/events/types"
import "@/lib/producto/producto-event-handlers"

export async function GET(request: NextRequest) {
  try {
    const ctx = await getAuthContext(request)
    if (!ctx.ok) return ctx.response

    const { searchParams } = new URL(request.url)
    const search = searchParams.get("search") || ""
    const categoriaId = searchParams.get("categoriaId")
    const soloActivos = searchParams.get("soloActivos") !== "false"
    const bajoStock = searchParams.get("bajoStock") === "true"
    const esPlato = searchParams.get("esPlato")
    const esInsumo = searchParams.get("esInsumo")

    const where: Record<string, unknown> = { empresaId: ctx.auth.empresaId }

    if (soloActivos) where.activo = true
    if (categoriaId) where.categoriaId = parseInt(categoriaId)
    if (esPlato !== null) where.esPlato = esPlato === "true"
    if (esInsumo !== null) where.esInsumo = esInsumo === "true"

    if (search) {
      where.OR = [
        { nombre: { contains: search, mode: "insensitive" } },
        { codigo: { contains: search, mode: "insensitive" } },
        { descripcion: { contains: search, mode: "insensitive" } },
      ]
    }

    const productos = await prisma.producto.findMany({
      where,
      include: { categoria: true },
      orderBy: { nombre: "asc" },
    })

    const result = bajoStock ? productos.filter((p) => p.stock <= p.stockMinimo) : productos
    return NextResponse.json(result)
  } catch (error) {
    console.error("Error al obtener productos:", error)
    return NextResponse.json({ error: "Error al obtener productos" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const ctx = await getAuthContext(request)
    if (!ctx.ok) return ctx.response

    const body = await request.json()

    const {
      codigo,
      nombre,
      descripcion,
      precioVenta,
      precioCompra,
      porcentajeIva,
      stock,
      stockMinimo,
      unidad,
      categoriaId,
      esPlato,
      esInsumo,
    } = body

    if (!codigo || !nombre || precioVenta === undefined) {
      return NextResponse.json({ error: "Código, nombre y precio de venta son obligatorios" }, { status: 400 })
    }

    // Verificar código único dentro de la empresa
    const existente = await prisma.producto.findFirst({
      where: whereEmpresa(ctx.auth.empresaId, { codigo }),
    })
    if (existente) {
      return NextResponse.json({ error: "Ya existe un producto con ese código" }, { status: 409 })
    }

    const producto = await prisma.producto.create({
      data: {
        codigo,
        nombre,
        descripcion,
        precioVenta: parseFloat(precioVenta),
        precioCompra: parseFloat(precioCompra || 0),
        porcentajeIva: parseFloat(porcentajeIva || 21),
        stock: parseFloat(stock || 0),
        stockMinimo: parseFloat(stockMinimo || 0),
        unidad: unidad || "unidad",
        categoriaId: categoriaId ? parseInt(categoriaId) : null,
        esPlato: Boolean(esPlato),
        esInsumo: Boolean(esInsumo),
        empresaId: ctx.auth.empresaId,
      },
      include: { categoria: true },
    })

    // Registrar movimiento de stock inicial si > 0
    if (producto.stock > 0) {
      await prisma.movimientoStock.create({
        data: {
          productoId: producto.id,
          tipo: "entrada",
          cantidad: producto.stock,
          motivo: "Stock inicial",
        },
      })

      await eventBus.emit<StockActualizadoPayload>({
        type: "STOCK_ACTUALIZADO",
        payload: {
          productoId: producto.id,
          cantidadAnterior: 0,
          cantidadNueva: producto.stock,
          motivo: "Stock inicial",
        },
        timestamp: new Date(),
        userId: ctx.auth.userId,
        empresaId: ctx.auth.empresaId,
      })
    }

    await eventBus.emit<ProductoCreadoPayload>({
      type: "PRODUCTO_CREADO",
      payload: {
        productoId: producto.id,
        empresaId: ctx.auth.empresaId,
        codigo: producto.codigo,
        nombre: producto.nombre,
        activo: producto.activo,
        categoriaId: producto.categoriaId,
        precioVenta: producto.precioVenta,
        precioCompra: producto.precioCompra,
        porcentajeIva: producto.porcentajeIva,
        esPlato: producto.esPlato,
        esInsumo: producto.esInsumo,
        stock: producto.stock,
        stockMinimo: producto.stockMinimo,
      },
      timestamp: new Date(),
      userId: ctx.auth.userId,
      empresaId: ctx.auth.empresaId,
    })

    invalidateContextCache(ctx.auth.empresaId)
    return NextResponse.json(producto, { status: 201 })
  } catch (error) {
    console.error("Error al crear producto:", error)
    return NextResponse.json({ error: "Error al crear producto" }, { status: 500 })
  }
}
