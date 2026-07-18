/**
 * Facturación Recurrente Service
 *
 * Genera facturas automáticamente para suscripciones, alquileres, membresías.
 * Diseñado para ejecutarse vía cron diario. Mirror de GastoRecurrente (egresos)
 * pero para ingresos de venta.
 *
 * Cadena alineada (auditoría comercial):
 *   Factura → emitFacturaEmitida (asiento) → CuentaCobrar forzada → cobrable por WA/recibo
 */

import { prisma } from "@/lib/prisma"

export interface CrearFacturaRecurrenteInput {
  empresaId: number
  clienteId: number
  concepto: string
  montoNeto: number
  alicuotaIva?: number
  frecuencia?: string
  diaEmision?: number
  tipoCbte?: number
  fechaFin?: Date
}

export async function crearFacturaRecurrente(input: CrearFacturaRecurrenteInput) {
  const diaEmision = input.diaEmision ?? 1
  const ahora = new Date()
  let proximaEmision = new Date(ahora.getFullYear(), ahora.getMonth(), diaEmision)
  if (proximaEmision <= ahora) {
    proximaEmision.setMonth(proximaEmision.getMonth() + 1)
  }

  return prisma.facturaRecurrente.create({
    data: {
      concepto: input.concepto,
      montoNeto: input.montoNeto,
      alicuotaIva: input.alicuotaIva ?? 21,
      frecuencia: input.frecuencia ?? "mensual",
      diaEmision,
      proximaEmision,
      tipoCbte: input.tipoCbte ?? 6,
      fechaFin: input.fechaFin,
      clienteId: input.clienteId,
      empresaId: input.empresaId,
    },
  })
}

export async function listarFacturasRecurrentes(empresaId: number) {
  return prisma.facturaRecurrente.findMany({
    where: { empresaId },
    orderBy: { proximaEmision: "asc" },
  })
}

/**
 * Procesa todas las facturas recurrentes cuya próxima emisión es hoy o anterior.
 * Pensado para ejecutarse desde un cron diario.
 * Retorna array de facturas generadas.
 */
export async function procesarFacturasRecurrentes(empresaId: number) {
  const hoy = new Date()
  hoy.setHours(23, 59, 59, 999)

  const pendientes = await prisma.facturaRecurrente.findMany({
    where: {
      empresaId,
      activo: true,
      proximaEmision: { lte: hoy },
    },
  })

  const resultados: {
    facturaRecurrenteId: number
    concepto: string
    monto: number
    clienteId: number
    facturaId?: number
    numero?: number
    afipOk?: boolean
    cae?: string
    afipError?: string
    cuentaCobrarIds?: number[]
  }[] = []

  for (const fr of pendientes) {
    // Verificar fecha fin
    if (fr.fechaFin && new Date(fr.fechaFin) < hoy) {
      await prisma.facturaRecurrente.update({
        where: { id: fr.id },
        data: { activo: false },
      })
      continue
    }

    // Prevención de doble facturación en el mismo mes calendario
    const startOfMonth = new Date(hoy.getFullYear(), hoy.getMonth(), 1)
    const existing = await prisma.factura.findFirst({
      where: {
        empresaId,
        clienteId: fr.clienteId,
        createdAt: { gte: startOfMonth },
        lineas: { some: { descripcion: fr.concepto } },
      },
    })

    if (existing) {
      console.warn(`[FacturaRecurrente] Previniendo emisión doble: fr.id=${fr.id} ya emitido en FAC #${existing.numero}`)
      // Actualizar próxima emisión y saltear
      const proxima = new Date(fr.proximaEmision)
      switch (fr.frecuencia) {
        case "mensual": proxima.setMonth(proxima.getMonth() + 1); break
        case "bimestral": proxima.setMonth(proxima.getMonth() + 2); break
        case "trimestral": proxima.setMonth(proxima.getMonth() + 3); break
        case "semestral": proxima.setMonth(proxima.getMonth() + 6); break
        case "anual": proxima.setFullYear(proxima.getFullYear() + 1); break
      }
      await prisma.facturaRecurrente.update({
        where: { id: fr.id },
        data: { proximaEmision: proxima },
      })
      continue
    }

    // Idempotencia: no re-emitir el mismo día (doble cron / reintento)
    if (fr.ultimaEmision) {
      const u = new Date(fr.ultimaEmision)
      const sameDay =
        u.getFullYear() === hoy.getFullYear() &&
        u.getMonth() === hoy.getMonth() &&
        u.getDate() === hoy.getDate()
      if (sameDay) continue
    }

    const montoNeto = Number(fr.montoNeto)
    const iva = montoNeto * (fr.alicuotaIva / 100)
    const total = montoNeto + iva

    const [cliente, empresa] = await Promise.all([
      prisma.cliente.findUnique({ where: { id: fr.clienteId } }),
      prisma.empresa.findUnique({ where: { id: empresaId }, select: { puntoVenta: true } }),
    ])

    const puntoVenta = empresa?.puntoVenta ?? 1
    const ultimaFactura = await prisma.factura.findFirst({
      where: { empresaId, tipoCbte: fr.tipoCbte, puntoVenta },
      orderBy: { numero: "desc" },
    })
    const numero = (ultimaFactura?.numero ?? 0) + 1
    const letraMap: Record<number, string> = { 1: "A", 6: "B", 11: "C" }

    const factura = await prisma.factura.create({
      data: {
        tipo: letraMap[fr.tipoCbte] ?? "B",
        tipoCbte: fr.tipoCbte,
        numero,
        puntoVenta,
        subtotal: montoNeto,
        iva,
        total,
        estado: "pendiente_cae",
        empresaId,
        clienteId: fr.clienteId,
        condicionIvaReceptor: cliente?.condicionIva,
        lineas: {
          create: [
            {
              descripcion: fr.concepto,
              cantidad: 1,
              precioUnitario: montoNeto,
              porcentajeIva: fr.alicuotaIva,
              subtotal: montoNeto,
              iva,
              total,
            },
          ],
        },
      },
    })

    // AFIP puede fallar: la factura y la CC deben quedar igual (cobrables / reintento CAE)
    let afip: { ok: boolean; cae?: string; error?: string } = { ok: false }
    try {
      const { solicitarCaeFactura } = await import("@/lib/afip/solicitar-cae-factura")
      afip = await solicitarCaeFactura(factura.id)
    } catch (err) {
      afip = {
        ok: false,
        error: err instanceof Error ? err.message : "Error AFIP al emitir",
      }
    }

    // Evento de dominio unificado (asiento + handlers)
    try {
      const { emitFacturaEmitida } = await import("@/lib/events/emit-domain-event")
      await emitFacturaEmitida({
        facturaId: factura.id,
        empresaId,
        clienteId: fr.clienteId,
        total,
        condicionPagoId: null,
        depositoId: null,
      })
    } catch (err) {
      console.warn("[FacturaRecurrente] emitFacturaEmitida:", err)
    }

    // Contado no genera CC por defecto: forzar una CC cobrable (servicio recurrente)
    let cuentaCobrarIds: number[] = []
    try {
      const { cuentasService } = await import("@/lib/cc-cp/cuentas-service")
      cuentaCobrarIds = await cuentasService.generarCCPorFactura(factura.id, {
        forzarCuenta: true,
        diasVencimiento: 0,
      })
    } catch (err) {
      console.warn("[FacturaRecurrente] generarCCPorFactura:", err)
    }

    resultados.push({
      facturaRecurrenteId: fr.id,
      concepto: fr.concepto,
      monto: total,
      clienteId: fr.clienteId,
      facturaId: factura.id,
      numero: factura.numero,
      afipOk: afip.ok,
      cae: afip.cae,
      afipError: afip.error,
      cuentaCobrarIds,
    })

    // Calcular próxima emisión
    const proxima = new Date(fr.proximaEmision)
    switch (fr.frecuencia) {
      case "mensual":
        proxima.setMonth(proxima.getMonth() + 1)
        break
      case "bimestral":
        proxima.setMonth(proxima.getMonth() + 2)
        break
      case "trimestral":
        proxima.setMonth(proxima.getMonth() + 3)
        break
      case "semestral":
        proxima.setMonth(proxima.getMonth() + 6)
        break
      case "anual":
        proxima.setFullYear(proxima.getFullYear() + 1)
        break
    }

    await prisma.facturaRecurrente.update({
      where: { id: fr.id },
      data: {
        proximaEmision: proxima,
        ultimaEmision: new Date(),
        facturasEmitidas: { increment: 1 },
      },
    })
  }

  return { procesadas: resultados.length, facturas: resultados }
}

export async function toggleFacturaRecurrente(empresaId: number, id: number, activo: boolean) {
  return prisma.facturaRecurrente.update({
    where: { id },
    data: { activo },
  })
}
