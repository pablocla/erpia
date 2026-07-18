import { NextResponse } from "next/server"
import { verifyCronAuth } from "@/lib/scheduling/cron-auth"
import { runAllVirtualWorkers } from "@/lib/automation/virtual-worker-runner"

export async function GET(request: Request) {
  const authError = verifyCronAuth(request)
  if (authError) return authError

  try {
    const result = await runAllVirtualWorkers()
    return NextResponse.json({ success: true, ...result })
  } catch (error) {
    console.error("[Cron Virtual Workers] Error:", error)
    return NextResponse.json({ error: "Error en cron virtual workers" }, { status: 500 })
  }
}