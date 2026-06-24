/**
 * Shipping Orchestrator — capa unificada de logística multi-carrier.
 * No es un microservicio aparte: vive en el monolito y se expone vía Centro de Conexiones + API logística.
 */

import { prisma } from "@/lib/prisma"
import { obtenerCredencialesIntegracion } from "@/lib/integrations/credentials"
import { getCarrier, listCarriers, CARRIER_IDS } from "./carriers/registry"
import type { CarrierId, CotizacionInput, CotizacionResult, CrearEnvioInput } from "./carriers/types"

export async function cotizarMultiCarrier(
  input: CotizacionInput,
  carriers?: CarrierId[],
): Promise<CotizacionResult[]> {
  const ids = carriers ?? CARRIER_IDS
  const resultados: CotizacionResult[] = []

  for (const id of ids) {
    const adapter = getCarrier(id)
    if (!adapter) continue
    const { credenciales } = await obtenerCredencialesIntegracion(input.empresaId, id)
    const cot = await adapter.cotizar(input, credenciales)
    if (cot) resultados.push(cot)
  }

  return resultados.sort((a, b) => a.precio - b.precio)
}

export async function crearEnvioCarrier(
  carrierId: CarrierId,
  input: CrearEnvioInput,
) {
  const adapter = getCarrier(carrierId)
  if (!adapter) throw new Error("Carrier no soportado")

  const { credenciales } = await obtenerCredencialesIntegracion(input.empresaId, carrierId)
  const result = await adapter.crearEnvio(input, credenciales)
  if (!result.ok) return result

  const numero = `ENV-${carrierId.toUpperCase().slice(0, 3)}-${Date.now()}`
  const envio = await prisma.envio.create({
    data: {
      empresaId: input.empresaId,
      numero,
      direccionDestino: input.destinatario.direccion,
      pesoKg: input.pesoKg,
      bultos: input.bultos ?? 1,
      observaciones: input.observaciones,
      pedidoVentaId: input.pedidoVentaId ?? null,
      remitoId: input.remitoId ?? null,
      carrierIntegracionId: carrierId,
      trackingExterno: result.tracking ?? null,
      etiquetaUrl: result.etiquetaUrl ?? null,
      costoEnvio: result.costo ?? null,
      estado: result.tracking ? "en_transito" : "pendiente",
      fechaEmbarque: result.tracking ? new Date() : null,
    },
  })

  const conexion = await prisma.conexionIntegracion.findUnique({
    where: { empresaId_integracionId: { empresaId: input.empresaId, integracionId: carrierId } },
  })
  if (conexion) {
    await prisma.integracionSyncLog.create({
      data: {
        conexionId: conexion.id,
        direccion: "outbound",
        entidad: "envio",
        estado: "ok",
        registrosOk: 1,
        registrosError: 0,
        mensaje: `Envío ${result.tracking ?? numero} — pedido ${input.pedidoVentaId ?? "—"}`,
      },
    })
    await prisma.conexionIntegracion.update({
      where: { id: conexion.id },
      data: { ultimaSyncAt: new Date() },
    })
  }

  return { ...result, envioId: envio.id, numero: envio.numero }
}

export async function sincronizarTrackingEmpresa(empresaId: number) {
  const envios = await prisma.envio.findMany({
    where: {
      empresaId,
      carrierIntegracionId: { in: CARRIER_IDS },
      trackingExterno: { not: null },
      estado: { in: ["pendiente", "en_transito"] },
    },
    take: 50,
  })

  let actualizados = 0
  for (const env of envios) {
    const carrierId = env.carrierIntegracionId as CarrierId
    const adapter = getCarrier(carrierId)
    if (!adapter || !env.trackingExterno) continue

    const { credenciales } = await obtenerCredencialesIntegracion(empresaId, carrierId)
    const track = await adapter.consultarTracking(env.trackingExterno, credenciales)
    if (!track) continue

    const estadoMap: Record<string, string> = {
      entregado: "entregado",
      delivered: "entregado",
      en_transito: "en_transito",
      in_transit: "en_transito",
      devuelto: "devuelto",
      returned: "devuelto",
    }
    const nuevoEstado = estadoMap[track.estado.toLowerCase()] ?? env.estado
    if (nuevoEstado !== env.estado) {
      await prisma.envio.update({
        where: { id: env.id },
        data: {
          estado: nuevoEstado,
          fechaEntrega: nuevoEstado === "entregado" ? new Date() : undefined,
        },
      })
      actualizados++
    }
  }

  return { actualizados, total: envios.length }
}

export async function resumenCarriersEmpresa(empresaId: number) {
  const carriers = listCarriers()
  const resumen = []
  for (const c of carriers) {
    const { credenciales, row } = await obtenerCredencialesIntegracion(empresaId, c.id)
    const test = await c.testConnection(credenciales)
    resumen.push({
      id: c.id,
      nombre: c.nombre,
      conectado: test.ok,
      mensaje: test.mensaje,
      ultimaSyncAt: row?.ultimaSyncAt?.toISOString() ?? null,
    })
  }
  return resumen
}