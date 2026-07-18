import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { logError } from "@/lib/monitoring/error-logger"
import { getOpoConfig } from "@/lib/opo/opo-config-service"
import { resolveErpAdapter } from "@/lib/legacy-bridge/adapter-registry"

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

    const config = await getOpoConfig(empresaId)
    const adapter = resolveErpAdapter(config)

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

    const inputParams: Record<string, unknown> = {
      page,
      limit,
      search,
    }
    if (!Number.isNaN(categoriaId)) inputParams.categoriaId = categoriaId
    if (soloConStock) inputParams.soloConStock = true

    // Fetch via Legacy Bridge (OPO)
    const result = await adapter.query(empresaId, {
      entity: "Product",
      action: "read",
      params: inputParams
    }, config)

    // Map OPO generic Product fields back to what the E-commerce Frontend expects
    const mappedProducts = result.data.map((p: any) => ({
      id: Number(p.id) || 0,
      codigo: p.sku || "",
      nombre: p.name || "",
      descripcion: p.description || null,
      precioVenta: Number(p.unitPrice) || 0,
      stock: Number(p.stock) || 0,
      unidad: p.unit || "UN",
      categoria: p.category ? { id: 0, nombre: p.category } : null
    }))

    const markupPct = canalVenta ? Number(canalVenta.markupPct) : 0
    const aplicarMarkup = markupPct !== 0
    const productosConPrecio = mappedProducts.map((producto) => ({
      ...producto,
      precioFinal: aplicarMarkup
        ? roundMoney(producto.precioVenta * (1 + markupPct / 100))
        : producto.precioVenta,
    }))

    return NextResponse.json({ productos: productosConPrecio, total: result.count, page, limit })
  } catch (error) {
    logError("api/ecommerce/catalogo:GET", error, request)
    return NextResponse.json({ error: "Error al cargar catalogo" }, { status: 500 })
  }
}
