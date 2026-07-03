import { NextRequest, NextResponse } from "next/server"
import { withAuthAndTenant } from "@/lib/auth/api-guard"
import { prisma } from "@/lib/prisma"

/**
 * POST /api/ventas/[id]/anular
 * Anula una venta (Factura) y devuelve el stock a los productos correspondientes.
 * Operación envuelta en transacción para garantizar atomicidad.
 */
export const POST = withAuthAndTenant(async (
  req: NextRequest,
  auth,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params
  const facturaId = parseInt(id)

  if (isNaN(facturaId)) {
    return NextResponse.json({ error: "ID inválido" }, { status: 400 })
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      // 1. Verificar existencia y estado
      const factura = await tx.factura.findUnique({
        where: { id: facturaId, empresaId: auth.empresaId },
        include: { lineas: true }
      })

      if (!factura) {
        throw new Error("Venta no encontrada")
      }

      if (factura.estado === "anulada") {
        throw new Error("La venta ya se encuentra anulada")
      }

      if (factura.cae) {
        // En un caso real con AFIP, se debería generar una Nota de Crédito.
        // Por simplicidad del quick-win, permitimos anular pero dejamos un warning.
        console.warn(`Anulando factura con CAE: ${factura.cae}. Se recomienda emitir Nota de Crédito.`)
      }

      // 2. Marcar como anulada
      const facturaAnulada = await tx.factura.update({
        where: { id: facturaId },
        data: { estado: "anulada" }
      })

      // 3. Devolver stock
      const ref = `Anul. FAC-${factura.tipo}-${String(factura.puntoVenta).padStart(5, "0")}-${String(factura.numero).padStart(8, "0")}`
      
      for (const linea of factura.lineas) {
        if (!linea.productoId) continue

        // Aumentar stock del producto
        await tx.producto.update({
          where: { id: linea.productoId },
          data: { stock: { increment: linea.cantidad } }
        })

        // Registrar el movimiento de stock
        await tx.movimientoStock.create({
          data: {
            empresaId: auth.empresaId,
            productoId: linea.productoId,
            tipo: "entrada",
            cantidad: linea.cantidad,
            motivo: ref,
          }
        })
      }

      return facturaAnulada
    })

    return NextResponse.json({ success: true, factura: result })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Error al anular la venta" }, { status: 400 })
  }
})
