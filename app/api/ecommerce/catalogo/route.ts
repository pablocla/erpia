import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { logError } from "@/lib/monitoring/error-logger"

function normalizeCanalVentaCodigo(value?: string | null): string | null {
  if (!value) return null
  const trimmed = value.trim()
  if (!trimmed) return null
  const normalized = trimmed.replace(/[^a-z0-9]/gi, "").toLowerCase()
  if (normalized === "ecommerce" || normalized === "ecom") return "ONLINE"
  return trimmed
}

function roundMoney(value: number): number {
  return Math.round(value * 100) / 100
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const empresaIdRaw = searchParams.get("empresaId")
    const empresaId = empresaIdRaw ? Number(empresaIdRaw) : Number.NaN
    if (!empresaIdRaw || Number.isNaN(empresaId)) {
      return NextResponse.json({ error: "empresaId requerido" }, { status: 400 })
    }

    const search = searchParams.get("search")?.trim() || ""
    const categoriaIdRaw = searchParams.get("categoriaId")
    const categoriaId = categoriaIdRaw ? Number(categoriaIdRaw) : Number.NaN
    const canalVentaIdRaw = searchParams.get("canalVentaId")
    const canalVentaId = canalVentaIdRaw ? Number(canalVentaIdRaw) : Number.NaN
    const canalVentaCodigo = normalizeCanalVentaCodigo(searchParams.get("canalVentaCodigo"))
    const soloConStock = searchParams.get("soloConStock") !== "false"
    const page = Math.max(Number.parseInt(searchParams.get("page") ?? "1", 10), 1)
    const limit = Math.min(Math.max(Number.parseInt(searchParams.get("limit") ?? "24", 10), 1), 100)

    const canalVenta = !Number.isNaN(canalVentaId)
      ? await prisma.canalVenta.findUnique({ where: { id: canalVentaId } })
      : canalVentaCodigo
        ? await prisma.canalVenta.findFirst({
            where: {
              OR: [
                { codigo: { equals: canalVentaCodigo, mode: "insensitive" } },
                { nombre: { equals: canalVentaCodigo, mode: "insensitive" } },
              ],
            },
          })
        : null

    const where: Record<string, unknown> = {
      empresaId,
      activo: true,
    }

    if (search) {
      where.OR = [
        { nombre: { contains: search, mode: "insensitive" } },
        { codigo: { contains: search, mode: "insensitive" } },
        { descripcion: { contains: search, mode: "insensitive" } },
      ]
    }

    if (!Number.isNaN(categoriaId)) {
      where.categoriaId = categoriaId
    }

    if (soloConStock) {
      where.stock = { gt: 0 }
    }

    const [productos, total] = await Promise.all([
      prisma.producto.findMany({
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
        orderBy: { nombre: "asc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.producto.count({ where }),
    ])

    const markupPct = canalVenta ? Number(canalVenta.markupPct) : 0
    const aplicarMarkup = markupPct !== 0
    const productosConPrecio = productos.map((producto) => ({
      ...producto,
      precioFinal: aplicarMarkup
        ? roundMoney(producto.precioVenta * (1 + markupPct / 100))
        : producto.precioVenta,
    }))

    return NextResponse.json({ productos: productosConPrecio, total, page, limit })
  } catch (error) {
    logError("api/ecommerce/catalogo:GET", error, request)
    return NextResponse.json({ error: "Error al cargar catalogo" }, { status: 500 })
  }
}
