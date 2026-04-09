import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

/**
 * GET /api/portal/catalogo
 * Devuelve productos activos con stock > 0 para el portal B2B.
 * Reutiliza la misma lógica de /api/ecommerce/catalogo.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const empresaId = parseInt(searchParams.get("empresaId") || "1")
    const soloConStock = searchParams.get("soloConStock") === "true"
    const search = searchParams.get("search") || ""

    if (isNaN(empresaId) || empresaId < 1) {
      return NextResponse.json({ error: "empresaId inválido" }, { status: 400 })
    }

    const where: Record<string, unknown> = {
      empresaId,
      activo: true,
      deletedAt: null,
    }

    if (soloConStock) where.stock = { gt: 0 }

    if (search.trim()) {
      where.OR = [
        { nombre: { contains: search, mode: "insensitive" } },
        { codigo: { contains: search, mode: "insensitive" } },
        { descripcion: { contains: search, mode: "insensitive" } },
        { categoria: { nombre: { contains: search, mode: "insensitive" } } },
      ]
    }

    const productos = await prisma.producto.findMany({
      where,
      select: {
        id: true,
        codigo: true,
        nombre: true,
        descripcion: true,
        precioVenta: true,
        stock: true,
        unidad: true,
        categoria: { select: { id: true, nombre: true } },
      },
      orderBy: [{ categoria: { nombre: "asc" } }, { nombre: "asc" }],
      take: 200,
    })

    return NextResponse.json({ productos })
  } catch (error) {
    console.error("portal/catalogo:", error)
    return NextResponse.json({ error: "Error al obtener catálogo" }, { status: 500 })
  }
}
