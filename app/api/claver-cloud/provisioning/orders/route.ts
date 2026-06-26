import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getClaverAnalystContext } from "@/lib/auth/claver-analyst"
import { procesarOrdenProvision } from "@/lib/provisioning/provisioning-service"

export async function GET(request: NextRequest) {
  const ctx = await getClaverAnalystContext(request)
  if (!ctx.ok) return ctx.response

  const db = prisma as any
  const estado = request.nextUrl.searchParams.get("estado")

  const where = estado ? { estado } : {}
  const orders = await db.ordenProvision.findMany({
    where,
    orderBy: { createdAt: "desc" },
  })

  return NextResponse.json(orders)
}

export async function POST(request: NextRequest) {
  const ctx = await getClaverAnalystContext(request)
  if (!ctx.ok) return ctx.response

  try {
    const data = await request.json()
    const db = prisma as any

    const orden = await db.ordenProvision.create({
      data: {
        contactoEmail: data.contactoEmail,
        contactoNombre: data.contactoNombre,
        razonSocial: data.razonSocial,
        cuit: data.cuit,
        planHosting: data.planHosting,
        skus: data.skus || [],
        analistaAsignado: data.analistaAsignado || ctx.auth.email,
        estado: "pendiente",
      },
    })

    const result = await procesarOrdenProvision(orden.id)

    return NextResponse.json({
      success: true,
      ordenId: orden.id,
      empresaId: result.empresaId,
    })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 })
  }
}