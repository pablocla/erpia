import { NextRequest, NextResponse } from "next/server"
import { withAuthAndTenant } from "@/lib/auth/api-guard"
import { prisma } from "@/lib/prisma"

/**
 * POST /api/productos/importar
 * Recibe un array de productos desde un CSV y los upsert-ea en la base de datos.
 */
export const POST = withAuthAndTenant(async (req: NextRequest, auth) => {
  try {
    const body = await req.json()
    
    if (!Array.isArray(body.productos) || body.productos.length === 0) {
      return NextResponse.json({ error: "No se enviaron productos válidos para importar" }, { status: 400 })
    }

    const { empresaId } = auth
    let insertados = 0
    let actualizados = 0

    await prisma.$transaction(async (tx) => {
      for (const prod of body.productos) {
        if (!prod.codigo || !prod.nombre) continue

        const precioVenta = parseFloat(prod.precioVenta) || 0
        const precioCompra = parseFloat(prod.precioCompra) || 0
        const stock = parseFloat(prod.stock) || 0
        const porcentajeIva = parseFloat(prod.porcentajeIva) || 21

        const data = {
          nombre: prod.nombre,
          precioVenta,
          precioCompra,
          stock,
          porcentajeIva,
          empresaId,
        }

        // Buscar producto existente por código y empresa
        const existente = await tx.producto.findFirst({
          where: { codigo: prod.codigo, empresaId }
        })

        if (existente) {
          await tx.producto.update({
            where: { id: existente.id },
            data
          })
          actualizados++
        } else {
          await tx.producto.create({
            data: {
              codigo: prod.codigo,
              ...data
            }
          })
          insertados++
        }
      }
    })

    return NextResponse.json({ success: true, insertados, actualizados })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Error al importar productos" }, { status: 400 })
  }
})
