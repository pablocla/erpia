import { NextResponse } from "next/server"
import { runAllVirtualWorkers } from "@/lib/automation/virtual-worker-runner"

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization")
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  try {
    const result = await runAllVirtualWorkers()
    return NextResponse.json({ success: true, ...result })
  } catch (error) {
    console.error("[Cron Virtual Workers] Error:", error)
    return NextResponse.json({ error: "Error en cron virtual workers" }, { status: 500 })
  }
}