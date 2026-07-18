import { NextResponse } from "next/server"
import { verifyCronAuth } from "@/lib/scheduling/cron-auth"
import { runIaDiaria } from "@/lib/scheduling/jobs/ia-diaria"

export async function GET(request: Request) {
  const authError = verifyCronAuth(request)
  if (authError) return authError

  try {
    const result = await runIaDiaria()
    return NextResponse.json({
      success: true,
      fecha: new Date().toISOString(),
      ...result,
    })
  } catch (error) {
    console.error("[Cron IA Diaria] Error fatal:", error)
    return NextResponse.json({ error: "Error en cron IA diaria" }, { status: 500 })
  }
}