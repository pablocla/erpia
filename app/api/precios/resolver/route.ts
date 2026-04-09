import { type NextRequest, NextResponse } from "next/server"
import { verificarToken } from "@/lib/auth/middleware"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    const db = prisma as any
    const usuario = await verificarToken(request)
    if (!usuario) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const productoId = Number(searchParams.get("productoId"))
    const clienteId = Number(searchParams.get("clienteId"))

    if (!productoId || Number.isNaN(productoId)) {
      return NextResponse.json({ error: "productoId es obligatorio" }, { status: 400 })
    }

    const producto = await db.producto.findUnique({
      where: { id: productoId },
      select: { id: true, precioVenta: true, nombre: true },
    })

    if (!producto) return NextResponse.json({ error: "Producto no encontrado" }, { status: 404 })

    if (!clienteId || Number.isNaN(clienteId)) {
      return NextResponse.json({
        productoId,
        precio: Number(producto.precioVenta),
        origen: "precio_base",
      })
    }

    const cliente = await db.cliente.findUnique({
      where: { id: clienteId },
      select: { id: true, listaPrecioId: true },
    })

    if (!cliente?.listaPrecioId) {
      return NextResponse.json({
        productoId,
        precio: Number(producto.precioVenta),
        origen: "precio_base",
      })
    }

    const itemLista = await db.itemListaPrecio.findUnique({
      where: {
        listaPrecioId_productoId: {
          listaPrecioId: cliente.listaPrecioId,
          productoId,
        },
      },
      include: {
        listaPrecio: {
          select: { id: true, nombre: true },
        },
      },
    })

    if (!itemLista) {
      return NextResponse.json({
        productoId,
        precio: Number(producto.precioVenta),
        origen: "precio_base",
      })
    }

    return NextResponse.json({
      productoId,
      precio: Number(itemLista.precio),
      origen: "lista_precio",
      listaPrecio: itemLista.listaPrecio,
      descuento: Number(itemLista.descuento),
    })
  } catch (error) {
    console.error("Error al resolver precio:", error)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}
