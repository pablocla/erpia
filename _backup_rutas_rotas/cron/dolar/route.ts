import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// CRON Diario para actualizar el tipo de cambio USD/ARS
// Endpoint: GET /api/cron/dolar
export async function GET() {
  try {
    // 1. Obtener la cotización del día desde una API pública (ej. DolarAPI)
    const res = await fetch("https://dolarapi.com/v1/dolares/oficial")
    if (!res.ok) throw new Error("Error obteniendo cotización")
    
    const data = await res.json()
    const tipoCambioActual = data.venta // Cotización de venta BNA

    // 2. Buscar todos los productos que tengan costo en USD y actualizar su precio base
    // En la vida real, se actualiza solo para las empresas que opten por sincronización automática
    const productosEnUsd = await prisma.producto.findMany({
      where: { monedaCosto: "USD" }
    })

    let actualizados = 0
    for (const p of productosEnUsd) {
      if (p.costoLandedUsd) {
        // precio de venta ARS = Costo Landed USD * Tipo de Cambio * Margen Ficticio
        const margen = 1.30 // 30%
        const nuevoPrecioVenta = Number(p.costoLandedUsd) * tipoCambioActual * margen
        
        await prisma.producto.update({
          where: { id: p.id },
          data: { precioVenta: nuevoPrecioVenta }
        })
        actualizados++
      }
    }

    return NextResponse.json({ ok: true, tipoCambio: tipoCambioActual, productosActualizados: actualizados })
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
  }
}
