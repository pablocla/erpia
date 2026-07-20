import { prisma } from "@/lib/prisma"
import {
  generarAlertasInteligentes,
  generarMensajesWhatsApp,
  generarReporte,
  isIAEnabled,
} from "@/lib/ai"
import { crearAlertaIAConNotificacion } from "@/lib/ai/notificacion-ia-service"
import { getIANotificacionConfig } from "@/lib/ai/ia-notificacion-config"
import { evaluarReglas } from "@/lib/alertas/alertas-service"
import { isTrialExpired } from "@/lib/comercial/trial-guard"

export async function runIaDiaria(now = new Date()) {
  const esLunes = now.getDay() === 1
  const esDia1 = now.getDate() === 1

  const resultados: Array<{
    empresaId: number
    alertas: number
    mensajes: number
    reportes: string[]
    error?: string
  }> = []

  const empresas = await prisma.empresa.findMany({
    where: { deletedAt: null },
    select: { id: true, nombre: true },
  })

  for (const empresa of empresas) {
    const resultado: {
      empresaId: number
      alertas: number
      mensajes: number
      reportes: string[]
      error?: string
    } = {
      empresaId: empresa.id,
      alertas: 0,
      mensajes: 0,
      reportes: [],
    }

    try {
      if (!(await isIAEnabled(empresa.id))) {
        resultados.push(resultado)
        continue
      }

      const isExpired = await isTrialExpired(empresa.id)
      if (isExpired) {
        resultados.push({ ...resultado, error: "Trial expired" })
        continue
      }

      const iaConfig = await getIANotificacionConfig(empresa.id)
      const alertas = await generarAlertasInteligentes(empresa.id)

      if (alertas.alertas.length > 0) {
        for (const a of alertas.alertas) {
          await crearAlertaIAConNotificacion({
            empresaId: empresa.id,
            tipo: a.tipo,
            prioridad: a.prioridad as "alta" | "media" | "baja",
            titulo: a.titulo,
            descripcion: a.descripcion,
            accion: a.accion_sugerida,
            origen: "cron",
            agenteId: "alertas-stock",
          })
        }
        resultado.alertas = alertas.alertas.length
      }

      if (iaConfig.evaluarReglasEnCron) {
        const reglas = await evaluarReglas(empresa.id)
        resultado.alertas += reglas.filter((r) => r.disparada).length
      }

      const wa = await generarMensajesWhatsApp(empresa.id, "todos")
      if (wa.mensajes.length > 0) {
        await prisma.$transaction(
          wa.mensajes.map((m) =>
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

      if (esLunes) {
        const reporte = await generarReporte(empresa.id, "semana")
        if (reporte.resumen !== "No se pudo generar el reporte.") {
          await prisma.reporteIA.create({
            data: {
              empresaId: empresa.id,
              periodo: "semana",
              resumen: reporte.resumen,
              metricasClave: reporte.metricas_clave as object,
              insights: reporte.insights as object,
              recomendaciones: reporte.recomendaciones as object,
              alertasCriticas: reporte.alertas_criticas as object,
            },
          })
          resultado.reportes.push("semana")
        }
      }

      if (esDia1) {
        const reporte = await generarReporte(empresa.id, "mes")
        if (reporte.resumen !== "No se pudo generar el reporte.") {
          await prisma.reporteIA.create({
            data: {
              empresaId: empresa.id,
              periodo: "mes",
              resumen: reporte.resumen,
              metricasClave: reporte.metricas_clave as object,
              insights: reporte.insights as object,
              recomendaciones: reporte.recomendaciones as object,
              alertasCriticas: reporte.alertas_criticas as object,
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

  return {
    procesadas: resultados.length,
    esLunes,
    esDia1,
    resultados,
  }
}