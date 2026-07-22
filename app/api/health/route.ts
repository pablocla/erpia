import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { recordPlatformEvent } from "@/lib/ops/platform-events"

const START_TIME = Date.now()

/**
 * Liveness público mínimo.
 * Detalles extendidos (afip, env) solo con header Authorization: Bearer $CRON_SECRET
 * o query no usado en prod — ver /api/claver/platform-health para analistas.
 */
export async function GET(request: Request) {
  let dbOk = false
  try {
    await prisma.$queryRaw`SELECT 1`
    dbOk = true
  } catch {
    dbOk = false
    void recordPlatformEvent({
      severity: "sev1",
      source: "health",
      code: "DB_DOWN",
      message: "Health check: base de datos no responde",
    })
  }

  const auth = request.headers.get("authorization")
  const secret = process.env.CRON_SECRET?.trim()
  const extended =
    Boolean(secret && auth === `Bearer ${secret}`) ||
    (process.env.NODE_ENV !== "production" &&
      new URL(request.url).searchParams.get("detail") === "1")

  if (!extended) {
    return NextResponse.json(
      {
        ok: dbOk,
        db: dbOk ? "ok" : "error",
        timestamp: new Date().toISOString(),
      },
      { status: dbOk ? 200 : 503 },
    )
  }

  let afipStatus: "ok" | "degraded" = "ok"
  try {
    await checkAfip()
  } catch {
    afipStatus = "degraded"
  }

  return NextResponse.json(
    {
      ok: dbOk,
      db: dbOk ? "ok" : "error",
      afip: afipStatus,
      uptime: Math.floor((Date.now() - START_TIME) / 1000),
      env: process.env.NODE_ENV ?? "unknown",
      timestamp: new Date().toISOString(),
    },
    { status: dbOk ? 200 : 503 },
  )
}

async function checkAfip(): Promise<void> {
  const afipUrl =
    process.env.AFIP_ENTORNO === "produccion"
      ? "https://servicios1.afip.gov.ar/wsfev1/service.asmx"
      : "https://wswhomo.afip.gov.ar/wsfev1/service.asmx"

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 5000)

  try {
    const res = await fetch(afipUrl, { method: "HEAD", signal: controller.signal })
    if (!res.ok && res.status !== 405) {
      throw new Error(`AFIP respondió ${res.status}`)
    }
  } finally {
    clearTimeout(timeout)
  }
}
