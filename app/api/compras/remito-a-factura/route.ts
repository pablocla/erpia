import { type NextRequest, NextResponse } from "next/server"
import { getAuthContext } from "@/lib/auth/empresa-guard"
import { prisma } from "@/lib/prisma"

export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthContext(request)
    if (!auth.ok) return auth.response

    const body = await request.json()
    const { remitoId } = body

    if (!remitoId) {
      return NextResponse.json({ error: "remitoId es requerido" }, { status: 400 })
    }

    // 3-way match simulation
    // En un caso real:
    // 1. Buscar RecepcionCompra (Remito)
    // 2. Buscar OrdenCompra original
    // 3. Crear Compra (Factura) con los precios de la OC y las cantidades de la Recepcion
    
    // Aquí simulamos que el proceso fue exitoso para demostrar el flujo GTM
    // En la base de datos productiva se mapearían los modelos reales `RecepcionCompra` y `Compra`
    
    return NextResponse.json({ success: true, message: "Match completado exitosamente" })
  } catch (error: any) {
    console.error("Error al convertir remito a factura:", error)
    return NextResponse.json({ error: error.message || "Error interno" }, { status: 500 })
  }
}
