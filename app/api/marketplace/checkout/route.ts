import { NextRequest, NextResponse } from "next/server"
import { getAuthContext } from "@/lib/auth/empresa-guard"
import { prisma } from "@/lib/prisma"
import { resolveSku } from "@/lib/marketplace/catalog-resolver"
import { provisionOrden } from "@/lib/marketplace/provision-service"

export async function POST(request: NextRequest) {
  const auth = getAuthContext(request)
  if (!auth.ok) return auth.response

  try {
    const { items, origen = "dashboard", bundleId } = await request.json()
    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "Items inválidos" }, { status: 400 })
    }

    const normalized = items.map((item: { sku: string; cantidad?: number; precio?: number }) => {
      const resolved = resolveSku(item.sku)
      if (!resolved) throw new Error(`SKU no encontrado: ${item.sku}`)
      return {
        sku: item.sku,
        cantidad: item.cantidad ?? 1,
        precio: item.precio ?? resolved.precioArs,
        nombre: resolved.nombre,
      }
    })

    const totalArs = normalized.reduce((acc, item) => acc + item.precio * item.cantidad, 0)

    const orden = await prisma.marketplaceOrden.create({
      data: {
        empresaId: auth.auth.empresaId,
        estado: "paid",
        items: normalized,
        totalArs,
        origen: bundleId ? `${origen}:bundle:${bundleId}` : origen,
      },
    })

    const provisionResults = await provisionOrden(auth.auth.empresaId, orden.id)

    return NextResponse.json({
      success: true,
      ordenId: orden.id,
      totalArs,
      provisionResults,
      message: "Orden pagada y provisión iniciada",
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error interno"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}