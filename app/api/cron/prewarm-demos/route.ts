import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { provisionIndustryDemo } from "@/lib/comercial/industry-demo-service"
import { requireCronAuth } from "@/lib/auth/cron-guard"
import { recordPlatformEvent } from "@/lib/ops/platform-events"

export const maxDuration = 60
export const dynamic = "force-dynamic"

const TARGET_PREWARMED_COUNT = 3
const CRITICAL_INDUSTRIES = ["almacen", "kiosco", "pos", "servicios"]

export async function GET(request: NextRequest) {
  const denied = requireCronAuth(request)
  if (denied) {
    void recordPlatformEvent({
      severity: "sev2",
      source: "cron",
      code: "CRON_UNAUTHORIZED",
      message: "Intento no autorizado a /api/cron/prewarm-demos",
    })
    return denied
  }

  const results: Record<string, { target: number; current: number; generated: number }> = {}
  let totalGenerations = 0

  for (const industryId of CRITICAL_INDUSTRIES) {
    const count = await prisma.empresa.count({
      where: {
        isPrewarmedDemo: true,
        prewarmedIndustryId: industryId,
      },
    })

    let generated = 0
    if (count < TARGET_PREWARMED_COUNT) {
      const needed = TARGET_PREWARMED_COUNT - count
      // Crear hasta `needed` empresas pre-calentadas, pero para evitar timeout de Vercel (60s)
      // s�lo generaremos 1 o 2 demos por llamada al cron (la pr�xima llamada crear� m�s).
      const toGenerate = Math.min(needed, 2)

      for (let i = 0; i < toGenerate; i++) {
        // En serverless, queremos asegurar de no exceder los 60s
        if (totalGenerations >= 2) break

        const demoHash = crypto.randomUUID().split("-")[0]
        const fakeCuit = `20-${demoHash}-0`
        const demoEmail = `prewarm-${demoHash}@claver.com.ar`

        const empresa = await prisma.empresa.create({
          data: {
            nombre: `[PRE-WARM] Demo ${demoHash}`,
            razonSocial: `Empresa Pre-calentada SRL (${demoHash})`,
            cuit: fakeCuit,
            direccion: "Av. Corrientes 1234, CABA",
            telefono: "011-4567-8900",
            email: demoEmail,
            puntoVenta: 1,
            entorno: "homologacion",
            rubro: "otro", // ser� sobreescrito por provisionIndustryDemo
            isPrewarmedDemo: true,
            prewarmedIndustryId: industryId,
          },
        })

        await provisionIndustryDemo(empresa.id, industryId)
        generated++
        totalGenerations++
      }
    }

    results[industryId] = {
      target: TARGET_PREWARMED_COUNT,
      current: count,
      generated,
    }
  }

  return NextResponse.json({
    success: true,
    totalGenerations,
    results,
  })
}

