import { NextResponse } from "next/server"
import { checkEcommerceStockSLA } from "@/lib/ecommerce/stock-alerts-sla"

export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  // En un entorno real, validar Authorization o un secret para cron.
  const authHeader = request.headers.get("authorization")
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  try {
    const result = await checkEcommerceStockSLA()
    return NextResponse.json(result)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
