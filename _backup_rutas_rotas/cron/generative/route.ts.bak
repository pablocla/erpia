import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { runForEmpresa } from "@/lib/generative/orchestrator"

// Endpoint para ser invocado por cron jobs (ej: Vercel Cron, GitHub Actions)
export async function GET(request: Request) {
  // 1. Validar un token de seguridad básico para evitar abusos externos
  const authHeader = request.headers.get("authorization")
  if (authHeader !== `Bearer ${process.env.CRON_SECRET || "dev-cron-secret"}`) {
    return new NextResponse("Unauthorized", { status: 401 })
  }

  try {
    // 2. Buscar todas las suscripciones activas que empiecen con "gen."
    const activas = await prisma.suscripcionModulo.findMany({
      where: {
        activo: true,
        sku: { startsWith: "gen." }
      },
      include: {
        empresa: {
          select: { id: true, nombre: true, email: true }
        }
      }
    })

    // 3. Orquestador base (mock)
    const procesados = []
    const fallidos = []

    for (const sub of activas) {
      try {
        const result = await runForEmpresa(sub.empresa.id, sub.sku)
        
        if (result.ok) {
          console.log(`[Generative Cron] Éxito: ${sub.sku} para empresa ${sub.empresa.nombre}`)
          procesados.push({ empresa: sub.empresa.nombre, sku: sub.sku, status: "success" })
        } else {
          console.warn(`[Generative Cron] Fallo controlado: ${sub.sku} para empresa ${sub.empresa.nombre}. Motivo: ${result.error}`)
          fallidos.push({ empresa: sub.empresa.nombre, sku: sub.sku, error: result.error })
        }

      } catch (err) {
        console.error(`Error procesando ${sub.sku} para ${sub.empresa.id}:`, err)
        fallidos.push({ empresa: sub.empresa.nombre, sku: sub.sku, error: String(err) })
      }
    }

    return NextResponse.json({
      ok: true,
      timestamp: new Date().toISOString(),
      resumen: {
        total: activas.length,
        procesados: procesados.length,
        fallidos: fallidos.length
      },
      detalles: { procesados, fallidos }
    })
  } catch (error) {
    console.error("[Generative Cron] Failed:", error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}
