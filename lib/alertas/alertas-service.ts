/**
 * Motor de Alertas Configurables
 *
 * Permite al usuario crear reglas de alerta parametrizables:
 * condición → evaluación → notificación.
 * Complementa las AlertaIA generadas por agentes con reglas custom.
 */

import { prisma } from "@/lib/prisma"
import { crearAlertaIAConNotificacion, enviarNotificacionTelegram } from "@/lib/ai/notificacion-ia-service"
import { getIANotificacionConfig } from "@/lib/ai/ia-notificacion-config"
import { encolarWhatsAppDesdeRegla } from "./whatsapp-regla-dispatcher"

export interface CrearReglaAlertaInput {
  empresaId: number
  nombre: string
  tipoRegla: string
  condicion: {
    campo?: string
    operador: "mayor" | "menor" | "igual" | "mayor_igual" | "menor_igual" | "diferente"
    valor: number | string
    entidad?: string
    telefonoDestino?: string
  }
  accion?: string
  destinatarioId?: number
  emailDestino?: string
  telefonoDestino?: string
  frecuenciaHoras?: number
}

export async function crearReglaAlerta(input: CrearReglaAlertaInput) {
  const condicion = {
    ...input.condicion,
    ...(input.telefonoDestino ? { telefonoDestino: input.telefonoDestino } : {}),
  }
  return prisma.reglaAlerta.create({
    data: {
      nombre: input.nombre,
      tipoRegla: input.tipoRegla,
      condicion: JSON.stringify(condicion),
      accion: input.accion ?? "notificacion",
      destinatarioId: input.destinatarioId,
      emailDestino: input.emailDestino,
      frecuenciaHoras: input.frecuenciaHoras ?? 24,
      empresaId: input.empresaId,
    },
  })
}

export async function listarReglasAlerta(empresaId: number) {
  return prisma.reglaAlerta.findMany({
    where: { empresaId },
    orderBy: { createdAt: "desc" },
  })
}

export async function toggleReglaAlerta(empresaId: number, reglaId: number, activo: boolean) {
  const regla = await prisma.reglaAlerta.findFirst({ where: { id: reglaId, empresaId } })
  if (!regla) throw new Error("Regla no encontrada")
  return prisma.reglaAlerta.update({
    where: { id: reglaId },
    data: { activo },
  })
}

export async function eliminarReglaAlerta(empresaId: number, reglaId: number) {
  const regla = await prisma.reglaAlerta.findFirst({ where: { id: reglaId, empresaId } })
  if (!regla) throw new Error("Regla no encontrada")
  return prisma.reglaAlerta.delete({ where: { id: reglaId } })
}

/**
 * Evalúa todas las reglas activas de una empresa.
 * Diseñado para ejecutarse vía cron o manual.
 */
export async function evaluarReglas(empresaId: number) {
  const [reglas, iaConfig] = await Promise.all([
    prisma.reglaAlerta.findMany({ where: { empresaId, activo: true } }),
    getIANotificacionConfig(empresaId),
  ])

  const alertasGeneradas: {
    reglaId: number
    nombre: string
    disparada: boolean
    mensaje: string
    alertaId?: number
    notificados?: number
    whatsappEncolados?: number
    telegramEnviados?: number
  }[] = []

  const ahora = Date.now()

  for (const regla of reglas) {
    // Respetar frecuencia configurada
    if (regla.frecuenciaHoras > 0 && regla.ultimoChequeo) {
      const msDesdeUltimo = ahora - regla.ultimoChequeo.getTime()
      if (msDesdeUltimo < regla.frecuenciaHoras * 3_600_000) continue
    }

    const condicion = JSON.parse(regla.condicion)
    let disparada = false
    let mensaje = ""
    let prioridad: "alta" | "media" | "baja" = "media"
    let tipo = "general"
    let diasVencidaCtx: number | undefined

    switch (regla.tipoRegla) {
      case "stock_bajo": {
        const productos = await prisma.producto.findMany({
          where: { empresaId, activo: true },
          select: { id: true, nombre: true, stock: true, stockMinimo: true },
        })
        const bajos = productos.filter(
          (p) => p.stockMinimo != null && p.stock < p.stockMinimo,
        )
        const umbral = Number(condicion.valor) ?? iaConfig.umbrales.stockCriticoProductos
        if (bajos.length > umbral) {
          disparada = true
          tipo = "stock_critico"
          prioridad = bajos.length > 5 ? "alta" : "media"
          mensaje = `${bajos.length} productos bajo stock mínimo: ${bajos.slice(0, 3).map((p) => p.nombre).join(", ")}${bajos.length > 3 ? "..." : ""}`
        }
        break
      }

      case "cxc_vencida": {
        const diasVencida = Number(condicion.valor) || iaConfig.umbrales.diasCxcVencida
        diasVencidaCtx = diasVencida
        const fechaLimite = new Date()
        fechaLimite.setDate(fechaLimite.getDate() - diasVencida)
        const vencidas = await prisma.cuentaCobrar.count({
          where: {
            cliente: { empresaId },
            estado: "pendiente",
            fechaVencimiento: { lt: fechaLimite },
          },
        })
        if (vencidas > 0) {
          disparada = true
          tipo = "cobranza_urgente"
          prioridad = "alta"
          mensaje = `${vencidas} cuentas a cobrar vencidas hace más de ${diasVencida} días`
        }
        break
      }

      case "cxp_vencida": {
        const diasVencida = Number(condicion.valor) || iaConfig.umbrales.diasCxpVencida
        const fechaLimite = new Date()
        fechaLimite.setDate(fechaLimite.getDate() - diasVencida)
        const vencidas = await prisma.cuentaPagar.count({
          where: {
            proveedor: { empresaId },
            estado: "pendiente",
            fechaVencimiento: { lt: fechaLimite },
          },
        })
        if (vencidas > 0) {
          disparada = true
          tipo = "general"
          prioridad = "media"
          mensaje = `${vencidas} cuentas a pagar vencidas hace más de ${diasVencida} días`
        }
        break
      }

      case "venta_baja": {
        const diasAtras = 7
        const desde = new Date()
        desde.setDate(desde.getDate() - diasAtras)
        const ventas = await prisma.factura.aggregate({
          where: { empresaId, createdAt: { gte: desde } },
          _sum: { total: true },
        })
        const umbral = Number(condicion.valor) || iaConfig.umbrales.ventaSemanalMinima
        if (Number(ventas._sum.total ?? 0) < umbral) {
          disparada = true
          tipo = "demanda_cayendo"
          prioridad = "media"
          mensaje = `Ventas de la última semana ($${Math.round(Number(ventas._sum.total ?? 0))}) por debajo del umbral de $${umbral}`
        }
        break
      }

      case "diferencia_caja": {
        const umbral = Number(condicion.valor) || iaConfig.umbrales.diferenciaCajaMaxima
        // Buscar última caja cerrada con diferencia
        const ultimaCaja = await prisma.caja.findFirst({
          where: { empresaId, estado: "cerrada" },
          orderBy: { updatedAt: "desc" },
        })
        if (ultimaCaja) {
          const diferencia = Math.abs(Number(ultimaCaja.diferencia ?? 0))
          if (diferencia > umbral) {
            disparada = true
            tipo = "caja"
            prioridad = "alta"
            mensaje = `Diferencia de caja: $${Math.round(diferencia)} (umbral: $${umbral})`
          }
        }
        break
      }

      default:
        mensaje = "Tipo de regla no evaluable automáticamente"
    }

    await prisma.reglaAlerta.update({
      where: { id: regla.id },
      data: { ultimoChequeo: new Date(), ultimoResultado: disparada },
    })

    let alertaId: number | undefined
    let notificados = 0
    let whatsappEncolados = 0
    let telegramEnviados = 0

    if (disparada && mensaje) {
      const notificarInApp = !["webhook"].includes(regla.accion)

      if (notificarInApp) {
        const { alerta, notificados: n } = await crearAlertaIAConNotificacion({
          empresaId,
          tipo,
          prioridad,
          titulo: regla.nombre,
          descripcion: mensaje,
          accion: `Revisar regla "${regla.nombre}" en Alertas configurables`,
          origen: "regla",
          reglaId: regla.id,
          reglaDestinatarioId: regla.destinatarioId,
          emailDestinoRegla: regla.emailDestino,
          notificar: regla.accion !== "webhook",
          datosExtra: { reglaNombre: regla.nombre, tipoRegla: regla.tipoRegla },
        })
        alertaId = alerta.id
        notificados = n
      }

      if (regla.accion === "whatsapp") {
        whatsappEncolados = await encolarWhatsAppDesdeRegla(
          empresaId,
          regla,
          { titulo: regla.nombre, mensaje, prioridad, diasVencida: diasVencidaCtx },
        )
      }

      if (regla.accion === "telegram") {
        telegramEnviados = await enviarNotificacionTelegram(
          empresaId,
          regla.nombre,
          mensaje,
          `Revisar regla "${regla.nombre}"`,
          { prioridad, destinatarioId: regla.destinatarioId },
        )
      }
    }

    alertasGeneradas.push({
      reglaId: regla.id,
      nombre: regla.nombre,
      disparada,
      mensaje,
      alertaId,
      notificados,
      whatsappEncolados,
      telegramEnviados,
    })
  }

  return alertasGeneradas
}
