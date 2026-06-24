import type { CarrierAdapter, CotizacionInput, CotizacionResult, CrearEnvioInput, CrearEnvioResult, TrackingResult } from "./types"

export async function carrierFetch(
  url: string,
  init: RequestInit,
): Promise<Response> {
  return fetch(url, { ...init, signal: AbortSignal.timeout(30_000) })
}

export function tarifaEstimadaAR(input: CotizacionInput, factor: number): number {
  const base = 2500
  const porKg = 450 * input.pesoKg
  const porBulto = 300 * (input.bultos ?? 1)
  const distancia = Math.abs(Number(input.cpDestino.slice(0, 2)) - Number(input.cpOrigen.slice(0, 2))) * 120
  return Math.round((base + porKg + porBulto + distancia) * factor)
}

export function createSandboxCarrier(
  id: CarrierAdapter["id"],
  nombre: string,
  factor: number,
): CarrierAdapter {
  return {
    id,
    nombre,
    async testConnection() {
      return { ok: true, mensaje: `${nombre}: modo sandbox (sin API configurada)` }
    },
    async cotizar(input) {
      return {
        carrierId: id,
        carrierNombre: nombre,
        servicio: "Estándar",
        precio: tarifaEstimadaAR(input, factor),
        plazoEntregaDias: id === "correo_argentino" ? 5 : 3,
        moneda: "ARS",
      }
    },
    async crearEnvio(input) {
      const tracking = `${id.toUpperCase().slice(0, 3)}-${Date.now()}`
      return {
        ok: true,
        carrierId: id,
        tracking,
        etiquetaUrl: undefined,
        costo: tarifaEstimadaAR(
          { empresaId: input.empresaId, cpOrigen: "1000", cpDestino: input.destinatario.cp, pesoKg: input.pesoKg, bultos: input.bultos },
          factor,
        ),
      }
    },
    async consultarTracking(tracking) {
      return {
        carrierId: id,
        tracking,
        estado: "en_transito",
        descripcion: "Seguimiento sandbox",
      }
    },
  }
}