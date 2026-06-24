import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { procesarOrdenProvision } from "@/lib/provisioning/provisioning-service"

export async function GET(request: NextRequest) {
  // Aquí idealmente validaríamos getClaverAnalystContext(request)
  const db = prisma as any
  const searchParams = request.nextUrl.searchParams
  const estado = searchParams.get("estado")
  
  const where = estado ? { estado } : {}
  const orders = await db.ordenProvision.findMany({
    where,
    orderBy: { createdAt: "desc" },
  })
  
  return NextResponse.json(orders)
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    const db = prisma as any
    
    // 1. Crear la orden pendiente
    const orden = await db.ordenProvision.create({
      data: {
        contactoEmail: data.contactoEmail,
        contactoNombre: data.contactoNombre,
        razonSocial: data.razonSocial,
        cuit: data.cuit,
        planHosting: data.planHosting,
        skus: data.skus || [],
        analistaAsignado: data.analistaAsignado || null,
        estado: "pendiente",
      },
    })
    
    // 2. Disparar el proceso de provisión sincrónicamente (o asincrónicamente si es lento)
    // Para no bloquear la UI más de la cuenta, lo hacemos aquí, pero en producción 
    // real lo encolaríamos en un Job o devolveríamos rápido y lo procesaríamos de fondo.
    const result = await procesarOrdenProvision(orden.id)
    
    return NextResponse.json({ 
      success: true, 
      ordenId: orden.id, 
      empresaId: result.empresaId 
    })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 })
  }
}
