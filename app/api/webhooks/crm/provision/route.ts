import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { procesarOrdenProvision } from "@/lib/provisioning/provisioning-service"

/**
 * Endpoint para recibir webhooks desde un CRM (ej. HubSpot, Salesforce).
 * Payload esperado:
 * {
 *   "contactoEmail": "cliente@empresa.com",
 *   "contactoNombre": "Juan Perez",
 *   "razonSocial": "Empresa S.A.",
 *   "cuit": "30-12345678-9",
 *   "planHosting": "Pro",
 *   "skus": ["channel.mercadopago", "ops.morning_commander"],
 *   "analistaAsignado": "soporte@claver.cloud" // opcional
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Validar un token de autorización en headers (API_KEY)
    const authHeader = request.headers.get("authorization")
    const expectedToken = process.env.CLAVER_WEBHOOK_SECRET || "dev-secret-token"
    
    if (!authHeader || authHeader !== `Bearer ${expectedToken}`) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const data = await request.json()
    const db = prisma as any
    
    // 2. Registrar la orden pendiente
    const orden = await db.ordenProvision.create({
      data: {
        contactoEmail: data.contactoEmail,
        contactoNombre: data.contactoNombre,
        razonSocial: data.razonSocial,
        cuit: data.cuit,
        planHosting: data.planHosting || "Starter",
        skus: data.skus || [],
        analistaAsignado: data.analistaAsignado || null,
        estado: "pendiente",
      },
    })
    
    // 3. Responder rápido al CRM (202 Accepted) y procesar en segundo plano
    // (Simulado con setTimeout o Promise.resolve().then)
    Promise.resolve().then(() => procesarOrdenProvision(orden.id).catch(console.error))
    
    return NextResponse.json({ 
      success: true, 
      message: "Provisión encolada", 
      ordenId: orden.id 
    }, { status: 202 })
    
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 })
  }
}
