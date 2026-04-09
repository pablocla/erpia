import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

const START_TIME = Date.now()

/**
 * B7 — Health check endpoint.
 * Usado por Railway/Docker para liveness probes y por el equipo de oncall.
 * No requiere autenticación.
 */
export async function GET() {
  const checks = await Promise.allSettled([checkDatabase(), checkAfip()])

  const dbStatus = checks[0].status === "fulfilled" ? "ok" : "error"
  const afipStatus = checks[1].status === "fulfilled" ? "ok" : "degraded"

  const status = dbStatus === "ok" ? 200 : 503

  return NextResponse.json(
    {
      db: dbStatus,
      afip: afipStatus,
      uptime: Math.floor((Date.now() - START_TIME) / 1000),
      env: process.env.NODE_ENV ?? "unknown",
      timestamp: new Date().toISOString(),
    },
    { status }
  )
}

async function checkDatabase(): Promise<void> {
  await prisma.$queryRaw`SELECT 1`
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
    // AFIP devuelve 200 o 405 (no acepta HEAD pero está reachable)
    if (!res.ok && res.status !== 405) {
      throw new Error(`AFIP respondió ${res.status}`)
    }
  } finally {
    clearTimeout(timeout)
  }
}
