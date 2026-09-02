import { NextResponse } from "next/server"
import { buildOfficePresence } from "@/lib/agent-city/presence-from-erp"
import type { OfficePresence } from "@/types/agent-city"

export const dynamic = "force-dynamic"

const empty = (): OfficePresence => ({
  live: false,
  source: "demo",
  generatedAt: new Date().toISOString(),
  metrics: {
    facturasHoy: 0,
    facturasPendientes: 0,
    ticketsAbiertos: 0,
    pedidosAbiertos: 0,
    cxVencidas: 0,
    dbOk: false,
  },
  desks: [],
  events: [],
})

export async function GET() {
  try {
    const presence = await buildOfficePresence()
    return NextResponse.json(presence, {
      headers: { "Cache-Control": "no-store" },
    })
  } catch (error) {
    console.warn("[agent-city/presence] ERP snapshot failed, office stays demo:", error)
    return NextResponse.json(empty(), { status: 200 })
  }
}
