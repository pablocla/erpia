import { type NextRequest, NextResponse } from "next/server"
import { verifyCronAuth } from "@/lib/scheduling/cron-auth"
import { runRecordatoriosTurnos } from "@/lib/scheduling/jobs/recordatorios"

export async function POST(request: NextRequest) {
  const authError = verifyCronAuth(request)
  if (authError) return authError

  try {
    const result = await runRecordatoriosTurnos()
    return NextResponse.json({ success: true, ...result })
  } catch (error) {
    console.error("Error al generar recordatorios:", error)
    return NextResponse.json({ error: "Error al generar recordatorios" }, { status: 500 })
  }
}