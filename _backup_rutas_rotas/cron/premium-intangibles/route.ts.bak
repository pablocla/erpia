import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { crearAlertaIAConNotificacion } from "@/lib/ai/notificacion-ia-service"
import { analizarRiesgoPosHoy } from "@/lib/marketplace/guardian-pos-service"
import { conciliarLiquidacionPagos } from "@/lib/marketplace/liquidacion-pagos-service"
import { generarPropuestasReposicion } from "@/lib/marketplace/reponedor-jit-service"
import { auditarPercepcionesRecuperables } from "@/lib/marketplace/recuperador-fiscal-service"
import { procesarPedidosAutomaticosProveedores } from "@/lib/marketplace/pedido-automatico-service"


const SKUS_PREMIUM = [
  "intang.guardian_pos",
  "intang.liquidacion_pagos",
  "intang.reponedor_jit",
  "intang.recuperador_fiscal",
] as const

/**
 * GET /api/cron/premium-intangibles — reportes diarios Premium ERP 7.
 * Guardian POS + liquidación MP + JIT urgente + percepciones recuperables.
 */
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization")
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  const ahora = new Date()
  const resultados: Array<{
    empresaId: number
    alertas: number
    servicios: string[]
    error?: string
  }> = []

  try {
    const empresas = await prisma.empresa.findMany({
      where: {
        deletedAt: null,
        suscripciones: {
          some: {
            sku: { in: [...SKUS_PREMIUM] },
            activo: true,
          },
        },
      },
      select: { id: true },
    })

    for (const empresa of empresas) {
      const resultado = { empresaId: empresa.id, alertas: 0, servicios: [] as string[] }

      try {
        const activos = await prisma.suscripcionModulo.findMany({
          where: { empresaId: empresa.id, activo: true, sku: { in: [...SKUS_PREMIUM] } },
          select: { sku: true },
        })
        const skus = new Set(activos.map((s) => s.sku))

        if (skus.has("intang.guardian_pos")) {
          const guardian = await analizarRiesgoPosHoy(empresa.id)
          resultado.servicios.push("guardian_pos")
          if (guardian.nivel === "alto" || guardian.nivel === "medio") {
            await crearAlertaIAConNotificacion({
              empresaId: empresa.id,
              tipo: "fraude_pos",
              prioridad: guardian.nivel === "alto" ? "alta" : "media",
              titulo: `Guardián POS: riesgo ${guardian.nivel.toUpperCase()}`,
              descripcion: guardian.alertas.join(" · ") || `Score ${guardian.score}`,
              accion: "Revisar ventas anuladas y egresos de caja en POS",
              origen: "cron",
              agenteId: "guardian-pos",
            })
            resultado.alertas++
          }
        }

        if (skus.has("intang.liquidacion_pagos")) {
          const liq = await conciliarLiquidacionPagos(empresa.id)
          resultado.servicios.push("liquidacion_pagos")
          if (liq.alerta) {
            await crearAlertaIAConNotificacion({
              empresaId: empresa.id,
              tipo: "liquidacion_pagos",
              prioridad: Math.abs(liq.diferencia) > 2000 ? "alta" : "media",
              titulo: "Diferencia en liquidación MP/tarjetas",
              descripcion: `POS $${liq.ventasQrTarjeta.toLocaleString("es-AR")} vs MP $${liq.liquidadoMp.toLocaleString("es-AR")} — diff $${liq.diferencia.toLocaleString("es-AR")}`,
              accion: "Conciliar movimientos de caja con transacciones MercadoPago",
              origen: "cron",
              agenteId: "liquidacion-pagos",
            })
            resultado.alertas++
          }
        }

        if (skus.has("intang.reponedor_jit")) {
          // Generar propuestas e identificar quiebres
          const propuestas = await generarPropuestasReposicion(empresa.id)
          const urgentes = propuestas.filter((p) => p.urgencia === "alta")
          resultado.servicios.push("reponedor_jit")
          
          // Ejecutar generación automática de pedidos de compra y encolar WhatsApp a proveedores
          try {
            await procesarPedidosAutomaticosProveedores(empresa.id)
          } catch (autoErr) {
            console.error(`[Cron Premium] Error al autogenerar pedidos para empresa ${empresa.id}:`, autoErr)
          }

          if (urgentes.length >= 5) {
            await crearAlertaIAConNotificacion({
              empresaId: empresa.id,
              tipo: "reposicion_jit",
              prioridad: "media",
              titulo: `${urgentes.length} productos con quiebre inminente`,
              descripcion: urgentes
                .slice(0, 5)
                .map((p) => `${p.nombre} (${p.diasCobertura}d cobertura)`)
                .join(" · "),
              accion: "Revisar propuestas de compra JIT en Premium ERP 7",
              origen: "cron",
              agenteId: "reponedor-jit",
            })
            resultado.alertas++
          }
        }

        if (skus.has("intang.recuperador_fiscal")) {
          const fiscal = await auditarPercepcionesRecuperables(empresa.id)
          resultado.servicios.push("recuperador_fiscal")
          if (fiscal.alerta) {
            await crearAlertaIAConNotificacion({
              empresaId: empresa.id,
              tipo: "recuperacion_fiscal",
              prioridad: fiscal.montoRecuperableEstimado > 20000 ? "alta" : "media",
              titulo: "Percepciones recuperables detectadas",
              descripcion: `$${fiscal.montoRecuperableEstimado.toLocaleString("es-AR")} en ${fiscal.comprasSinDetalle} compra(s) sin detalle tributario`,
              accion: "Completar tributos en compras y verificar crédito fiscal",
              origen: "cron",
              agenteId: "recuperador-fiscal",
            })
            resultado.alertas++
          }
        }
      } catch (err) {
        resultado.error = (err as Error).message
        console.error(`[Cron Premium] Error empresa ${empresa.id}:`, err)
      }

      resultados.push(resultado)
    }

    return NextResponse.json({
      success: true,
      fecha: ahora.toISOString(),
      empresas: resultados.length,
      resultados,
    })
  } catch (error) {
    console.error("[Cron Premium Intangibles] Error fatal:", error)
    return NextResponse.json({ error: "Error en cron premium" }, { status: 500 })
  }
}