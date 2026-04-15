import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

/**
 * GET /api/portal/catalogo
 * Devuelve productos activos con stock > 0 para el portal B2B.
 * Reutiliza la misma lógica de /api/ecommerce/catalogo.
 */
/**
 * FIX C-005: Validar empresaId contra lista blanca de env vars.
 * Previene enumeration attack donde un atacante pasa ?empresaId=2,3,4...
 */
function getEmpresaIdPermitido(paramValue: string | null): number | null {
  // Lista blanca: solo el ID configurado en env (portal B2B de una empresa específica)
  const permitido = parseInt(process.env.NEXT_PUBLIC_ECOMMERCE_EMPRESA_ID || "0")
  const solicitado = parseInt(paramValue || String(permitido))

  if (isNaN(solicitado) || solicitado < 1) return null
  // Si está configurado el env, solo permite ese ID
  if (permitido > 0 && solicitado !== permitido) return null
  return solicitado
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const empresaId = getEmpresaIdPermitido(searchParams.get("empresaId"))
    const soloConStock = searchParams.get("soloConStock") === "true"
    const search = searchParams.get("search") || ""

    if (!empresaId) {
      return NextResponse.json({ error: "empresaId no autorizado" }, { status: 403 })
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
