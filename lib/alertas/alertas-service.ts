/**
 * Motor de Alertas Configurables
 *
 * Permite al usuario crear reglas de alerta parametrizables:
 * condición → evaluación → notificación.
 * Complementa las AlertaIA generadas por agentes con reglas custom.
 */

import { prisma } from "@/lib/prisma"

export interface CrearReglaAlertaInput {
  empresaId: number
  nombre: string
  tipoRegla: string
  condicion: {
    campo?: string
    operador: "mayor" | "menor" | "igual" | "mayor_igual" | "menor_igual" | "diferente"
    valor: number | string
    entidad?: string
  }
  accion?: string
  destinatarioId?: number
  emailDestino?: string
  frecuenciaHoras?: number
}

export async function crearReglaAlerta(input: CrearReglaAlertaInput) {
  return prisma.reglaAlerta.create({
    data: {
      nombre: input.nombre,
      tipoRegla: input.tipoRegla,
      condicion: JSON.stringify(input.condicion),
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
  return prisma.reglaAlerta.update({
    where: { id: reglaId },
    data: { activo },
  })
}

export async function eliminarReglaAlerta(empresaId: number, reglaId: number) {
  const regla = await prisma.reglaAlerta.findFirst({
    where: { id: reglaId, empresaId },
  })
  if (!regla) throw new Error("Regla no encontrada")
  return prisma.reglaAlerta.delete({ where: { id: reglaId } })
}

/**
 * Evalúa todas las reglas activas de una empresa.
 * Diseñado para ejecutarse vía cron o manual.
 */
export async function evaluarReglas(empresaId: number) {
  const reglas = await prisma.reglaAlerta.findMany({
    where: { empresaId, activo: true },
  })

  const alertasGeneradas: { reglaId: number; nombre: string; disparada: boolean; mensaje: string }[] = []

  for (const regla of reglas) {
    const condicion = JSON.parse(regla.condicion)
    let disparada = false
    let mensaje = ""

    switch (regla.tipoRegla) {
      case "stock_bajo": {
        const productos = await prisma.producto.findMany({
          where: { empresaId, activo: true },
          select: { id: true, nombre: true, stock: true, stockMinimo: true },
        })
        const bajos = productos.filter(
          (p) => p.stockMinimo != null && p.stock < p.stockMinimo,
        )
        const umbral = Number(condicion.valor) || 0
        if (bajos.length > umbral) {
          disparada = true
          mensaje = `${bajos.length} productos bajo stock mínimo: ${bajos.slice(0, 3).map((p) => p.nombre).join(", ")}${bajos.length > 3 ? "..." : ""}`
        }
        break
      }

      case "cxc_vencida": {
        const diasVencida = Number(condicion.valor) || 30
        const fechaLimite = new Date()
        fechaLimite.setDate(fechaLimite.getDate() - diasVencida)
        const vencidas = await prisma.cuentaCobrar.count({
          where: {
            empresaId,
            estado: "pendiente",
            fechaVencimiento: { lt: fechaLimite },
          },
        })
        if (vencidas > 0) {
          disparada = true
          mensaje = `${vencidas} cuentas a cobrar vencidas hace más de ${diasVencida} días`
        }
        break
      }

      case "cxp_vencida": {
        const diasVencida = Number(condicion.valor) || 30
        const fechaLimite = new Date()
        fechaLimite.setDate(fechaLimite.getDate() - diasVencida)
        const vencidas = await prisma.cuentaPagar.count({
          where: {
            empresaId,
            estado: "pendiente",
            fechaVencimiento: { lt: fechaLimite },
          },
        })
        if (vencidas > 0) {
          disparada = true
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
        const umbral = Number(condicion.valor) || 100000
        if ((ventas._sum.total ?? 0) < umbral) {
          disparada = true
          mensaje = `Ventas de la última semana ($${Math.round(Number(ventas._sum.total ?? 0))}) por debajo del umbral de $${umbral}`
        }
        break
      }

      case "diferencia_caja": {
        const umbral = Number(condicion.valor) || 10000
        // Buscar última caja cerrada con diferencia
        const ultimaCaja = await prisma.caja.findFirst({
          where: { empresaId, estado: "cerrada" },
          orderBy: { fechaCierre: "desc" },
        })
        if (ultimaCaja) {
          const diferencia = Math.abs(Number(ultimaCaja.totalReal ?? 0) - Number(ultimaCaja.totalSistema ?? 0))
          if (diferencia > umbral) {
            disparada = true
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

    alertasGeneradas.push({
      reglaId: regla.id,
      nombre: regla.nombre,
      disparada,
      mensaje,
    })
  }

  return alertasGeneradas
}
