import { carrierFetch, createSandboxCarrier, tarifaEstimadaAR } from "./base"
import type { CarrierAdapter, CotizacionInput, CrearEnvioInput, CrearEnvioResult } from "./types"

const SANDBOX = createSandboxCarrier("andreani", "Andreani", 1.15)

function apiBase(creds: Record<string, string>): string | null {
  return creds.apiUrl ?? process.env.ANDREANI_API_URL ?? null
}

async function authHeaders(creds: Record<string, string>): Promise<HeadersInit> {
  const usuario = creds.usuario ?? process.env.ANDREANI_USUARIO
  const password = creds.password ?? process.env.ANDREANI_PASSWORD
  if (!usuario || !password) return {}
  const token = Buffer.from(`${usuario}:${password}`).toString("base64")
  return { Authorization: `Basic ${token}`, Accept: "application/json", "Content-Type": "application/json" }
}

export const andreaniCarrier: CarrierAdapter = {
  id: "andreani",
  nombre: "Andreani",

  async testConnection(creds) {
    const base = apiBase(creds)
    if (!base) return SANDBOX.testConnection(creds)
    try {
      const res = await carrierFetch(`${base}/v2/estado`, { headers: await authHeaders(creds) })
      if (res.ok) return { ok: true, mensaje: "Andreani API conectada" }
      return { ok: false, mensaje: `Andreani respondió ${res.status}` }
    } catch (e) {
      return { ok: false, mensaje: e instanceof Error ? e.message : "Error de red" }
    }
  },

  async cotizar(input, creds) {
    const base = apiBase(creds)
    if (!base) return SANDBOX.cotizar(input, creds)

    try {
      const res = await carrierFetch(`${base}/v2/cotizaciones`, {
        method: "POST",
        headers: await authHeaders(creds),
        body: JSON.stringify({
          cpOrigen: input.cpOrigen,
          cpDestino: input.cpDestino,
          peso: input.pesoKg,
          bultos: input.bultos ?? 1,
          contrato: creds.contrato ?? process.env.ANDREANI_CONTRATO,
        }),
      })
      if (!res.ok) {
        return {
          carrierId: "andreani",
          carrierNombre: "Andreani",
          servicio: "Estándar",
          precio: tarifaEstimadaAR(input, 1.15),
          plazoEntregaDias: 3,
          moneda: "ARS",
        }
      }
      const data = await res.json() as { tarifa?: number; precio?: number; plazoEntrega?: number }
      return {
        carrierId: "andreani",
        carrierNombre: "Andreani",
        servicio: "Estándar",
        precio: data.tarifa ?? data.precio ?? tarifaEstimadaAR(input, 1.15),
        plazoEntregaDias: data.plazoEntrega ?? 3,
        moneda: "ARS",
      }
    } catch {
      return SANDBOX.cotizar(input, creds)
    }
  },

  async crearEnvio(input: CrearEnvioInput, creds): Promise<CrearEnvioResult> {
    const base = apiBase(creds)
    if (!base) return SANDBOX.crearEnvio(input, creds)

    try {
      const res = await carrierFetch(`${base}/v2/ordenes-de-envio`, {
        method: "POST",
        headers: await authHeaders(creds),
        body: JSON.stringify({
          contrato: creds.contrato ?? process.env.ANDREANI_CONTRATO,
          destinatario: input.destinatario,
          peso: input.pesoKg,
          bultos: input.bultos ?? 1,
          valorDeclarado: input.valorDeclarado,
        }),
      })
      if (!res.ok) return { ok: false, carrierId: "andreani", error: await res.text() }
      const data = await res.json() as { numeroDeEnvio?: string; tracking?: string; etiquetaUrl?: string; tarifa?: number }
      return {
        ok: true,
        carrierId: "andreani",
        tracking: data.numeroDeEnvio ?? data.tracking,
        etiquetaUrl: data.etiquetaUrl,
        costo: data.tarifa,
      }
    } catch (e) {
      return { ok: false, carrierId: "andreani", error: e instanceof Error ? e.message : "Error Andreani" }
    }
  },

  async consultarTracking(tracking, creds) {
    const base = apiBase(creds)
    if (!base) return SANDBOX.consultarTracking(tracking, creds)
    try {
      const res = await carrierFetch(`${base}/v2/tracking/${encodeURIComponent(tracking)}`, {
        headers: await authHeaders(creds),
      })
      if (!res.ok) return null
      const data = await res.json() as { estado?: string; descripcion?: string }
      return {
        carrierId: "andreani",
        tracking,
        estado: data.estado ?? "en_transito",
        descripcion: data.descripcion,
      }
    } catch {
      return null
    }
  },
}