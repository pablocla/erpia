import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { generarAlertasInteligentes, generarMensajesWhatsApp, generarReporte } from "@/lib/ai"

/**
 * GET /api/cron/ia-diaria — Daily AI job
 * Called by Vercel/Railway cron at 06:00 AM ART.
 * Protected by CRON_SECRET header.
 *
 * For each active empresa:
 * 1. Generate and persist smart alerts
 * 2. Generate and persist WhatsApp messages (pending approval)
 * 3. Weekly report on Mondays, monthly report on day 1
 */
export async function GET(request: Request) {
  // Verify cron secret
  const authHeader = request.headers.get("authorization")
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  const ahora = new Date()
  const esLunes = ahora.getDay() === 1
  const esDia1 = ahora.getDate() === 1

  const resultados: Array<{ empresaId: number; alertas: number; mensajes: number; reportes: string[]; error?: string }> = []

  try {
    // Get all active empresas
    const empresas = await prisma.empresa.findMany({
      where: { deletedAt: null },
      select: { id: true, nombre: true },
    })

    for (const empresa of empresas) {
      const resultado: typeof resultados[0] = {
        empresaId: empresa.id,
        alertas: 0,
        mensajes: 0,
        reportes: [],
      }

      try {
        // 1. Generate alerts
        const alertas = await generarAlertasInteligentes(empresa.id)
        if (alertas.alertas.length > 0) {
          await prisma.$transaction(
            alertas.alertas.map(a =>
              prisma.alertaIA.create({
                data: {
                  empresaId: empresa.id,
                  tipo: a.tipo,
                  prioridad: a.prioridad,
                  titulo: a.titulo,
                  descripcion: a.descripcion,
                  accion: a.accion_sugerida ?? null,
                  datos: a.datos ?? undefined,
                },
              })
            )
          )
          resultado.alertas = alertas.alertas.length
        }

        // 2. Generate WhatsApp messages
        const wa = await generarMensajesWhatsApp(empresa.id, "todos")
        if (wa.mensajes.length > 0) {
          await prisma.$transaction(
            wa.mensajes.map(m =>
              prisma.mensajePendienteWhatsApp.create({
                data: {
                  empresaId: empresa.id,
                  destinatario: m.destinatario,
                  telefono: m.telefono,
                  mensaje: m.mensaje,
                  tipo: m.tipo,
                  prioridad: m.prioridad,
                  estado: "pendiente",
                },
              })
            )
          )
          resultado.mensajes = wa.mensajes.length
        }

        // 3. Weekly report on Mondays
        if (esLunes) {
          const reporte = await generarReporte(empresa.id, "semana")
          if (reporte.resumen !== "No se pudo generar el reporte.") {
            await prisma.reporteIA.create({
              data: {
                empresaId: empresa.id,
                periodo: "semana",
                resumen: reporte.resumen,
                metricasClave: reporte.metricas_clave as any,
                insights: reporte.insights as any,
                recomendaciones: reporte.recomendaciones as any,
                alertasCriticas: reporte.alertas_criticas as any,
              },
            })
            resultado.reportes.push("semana")
          }
        }

        // 4. Monthly report on day 1
        if (esDia1) {
          const reporte = await generarReporte(empresa.id, "mes")
          if (reporte.resumen !== "No se pudo generar el reporte.") {
            await prisma.reporteIA.create({
              data: {
                empresaId: empresa.id,
                periodo: "mes",
                resumen: reporte.resumen,
                metricasClave: reporte.metricas_clave as any,
                insights: reporte.insights as any,
                recomendaciones: reporte.recomendaciones as any,
                alertasCriticas: reporte.alertas_criticas as any,
              },
            })
            resultado.reportes.push("mes")
          }
        }
      } catch (err) {
        resultado.error = (err as Error).message
        console.error(`[Cron IA] Error empresa ${empresa.id}:`, err)
      }

      resultados.push(resultado)
    }

    return NextResponse.json({
      success: true,
      procesadas: resultados.length,
      fecha: ahora.toISOString(),
      esLunes,
      esDia1,
      resultados,
    })
  } catch (error) {
    console.error("[Cron IA Diaria] Error fatal:", error)
    return NextResponse.json({ error: "Error en cron IA diaria" }, { status: 500 })
  }
}
