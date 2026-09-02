/**
 * Servicio de Dominio para Ferreterías, Corralones y Materiales de Construcción
 * Dominios: Venta Fraccionada (metro, kg, m²), Calculadora de Cortes con Mermas y Presupuestos de Obra con Seña.
 */

import { prisma } from "@/lib/prisma"
import { OTService } from "@/lib/ot/ot-service"

export interface ItemPresupuestoObra {
  productoId?: number
  codigo?: string
  nombre: string
  unidad: "unidad" | "metro" | "kg" | "m2" | "bolsa" | "barra"
  cantidad: number
  precioUnitario: number
  descuentoPorcentaje?: number
}

export interface PresupuestoObraInput {
  clienteId: number
  nombreObra?: string
  direccionEntrega?: string
  validezDias?: number
  observaciones?: string
  senaAbonada?: number
  items: ItemPresupuestoObra[]
}

export class FerreteriaService {
  /**
   * Calcula cortes de barras/perfiles con cálculo de merma y desperdicio
   */
  calcularCortePerfiles(params: {
    largoBarraMetros: number // ej. 6 metros
    cortesRequeridosMetros: number[] // ej. [2.4, 2.4, 1.2]
    precioPorBarra: number
    anchoHojaCorteMm?: number // 3mm por corte de disco
  }) {
    const { largoBarraMetros, cortesRequeridosMetros, precioPorBarra, anchoHojaCorteMm = 3 } = params
    const perdidaPorCorteM = anchoHojaCorteMm / 1000

    let barrasNecesarias = 1
    let remanenteBarraActual = largoBarraMetros
    const distribucionCortes: { barraNum: number; cortes: number[]; sobrante: number }[] = [
      { barraNum: 1, cortes: [], sobrante: largoBarraMetros },
    ]

    for (const corte of cortesRequeridosMetros) {
      const corteConPerdida = corte + perdidaPorCorteM
      let colocado = false

      for (const b of distribucionCortes) {
        if (b.sobrante >= corteConPerdida) {
          b.cortes.push(corte)
          b.sobrante -= corteConPerdida
          colocado = true
          break
        }
      }

      if (!colocado) {
        barrasNecesarias++
        const nuevaBarra = {
          barraNum: barrasNecesarias,
          cortes: [corte],
          sobrante: largoBarraMetros - corteConPerdida,
        }
        distribucionCortes.push(nuevaBarra)
      }
    }

    const totalMetrosCortados = cortesRequeridosMetros.reduce((sum, c) => sum + c, 0)
    const totalMetrosComprados = barrasNecesarias * largoBarraMetros
    const desperdicioMetros = Math.max(0, totalMetrosComprados - totalMetrosCortados)
    const costoTotal = barrasNecesarias * precioPorBarra

    return {
      barrasNecesarias,
      totalMetrosComprados,
      totalMetrosCortados,
      desperdicioMetros: Number(desperdicioMetros.toFixed(2)),
      desperdicioPorcentaje: Math.round((desperdicioMetros / totalMetrosComprados) * 100),
      costoTotal,
      distribucionCortes,
    }
  }

  /**
   * Genera un presupuesto de obra con validez y cálculo de seña
   */
  private otService = new OTService()

  async crearPresupuestoObra(empresaId: number, input: PresupuestoObraInput) {
    const subtotal = input.items.reduce((acc, it) => {
      const desc = it.descuentoPorcentaje ? (1 - it.descuentoPorcentaje / 100) : 1
      return acc + (it.cantidad * it.precioUnitario * desc)
    }, 0)

    const fechaVencimiento = new Date()
    fechaVencimiento.setDate(fechaVencimiento.getDate() + (input.validezDias || 15))

    const titulo = input.nombreObra ? `Obra: ${input.nombreObra}` : "Presupuesto de Materiales"

    return await this.otService.crearOrden(empresaId, {
      clienteId: input.clienteId,
      titulo,
      descripcion: input.observaciones || `Entrega en: ${input.direccionEntrega || "Mostrador"}`,
      estado: "PRESUPUESTADO",
      fechaPrometida: fechaVencimiento,
      metadata: {
        vertical: "ferreteria_corralon",
        nombreObra: input.nombreObra,
        direccionEntrega: input.direccionEntrega,
        senaAbonada: input.senaAbonada || 0,
        subtotal,
      },
      items: input.items.map((it) => ({
        productoId: it.productoId,
        descripcion: `${it.nombre} [${it.unidad}]`,
        cantidad: it.cantidad,
        precioUnitario: it.precioUnitario,
        tipo: "REPUESTO",
      })),
    })
  }
}
