import { carrierFetch, createSandboxCarrier, tarifaEstimadaAR } from "./base"
import type { CarrierAdapter, CrearEnvioResult } from "./types"

const SANDBOX = createSandboxCarrier("oca", "OCA ePak", 1.08)

function apiBase(creds: Record<string, string>): string | null {
  return creds.apiUrl ?? process.env.OCA_API_URL ?? null
}

export const ocaCarrier: CarrierAdapter = {
  id: "oca",
  nombre: "OCA ePak",

  async testConnection(creds) {
    const base = apiBase(creds)
    if (!base) return SANDBOX.testConnection(creds)
    try {
      const res = await carrierFetch(`${base}/epak/ping`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          usuario: creds.usuario ?? process.env.OCA_USUARIO,
          password: creds.password ?? process.env.OCA_PASSWORD,
        }),
      })
      if (res.ok) return { ok: true, mensaje: "OCA ePak conectada" }
      return { ok: false, mensaje: `OCA respondió ${res.status}` }
    } catch (e) {
      return { ok: false, mensaje: e instanceof Error ? e.message : "Error de red" }
    }
  },

  async cotizar(input, creds) {
    const base = apiBase(creds)
    if (!base) return SANDBOX.cotizar(input, creds)

    try {
      const res = await carrierFetch(`${base}/epak/cotizar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          usuario: creds.usuario,
          password: creds.password,
          cpOrigen: input.cpOrigen,
          cpDestino: input.cpDestino,
          peso: input.pesoKg,
          volumen: input.bultos ?? 1,
        }),
      })
      if (!res.ok) return SANDBOX.cotizar(input, creds)
      const data = await res.json() as { precio?: number; dias?: number }
      return {
        carrierId: "oca",
        carrierNombre: "OCA ePak",
        servicio: "ePak",
        precio: data.precio ?? tarifaEstimadaAR(input, 1.08),
        plazoEntregaDias: data.dias ?? 4,
        moneda: "ARS",
      }
    } catch {
      return SANDBOX.cotizar(input, creds)
    }
  },

  async crearEnvio(input, creds): Promise<CrearEnvioResult> {
    const base = apiBase(creds)
    if (!base) return SANDBOX.crearEnvio(input, creds)

    try {
      const res = await carrierFetch(`${base}/epak/crear-envio`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          usuario: creds.usuario,
          password: creds.password,
          destinatario: input.destinatario,
          peso: input.pesoKg,
          bultos: input.bultos ?? 1,
        }),
      })
      if (!res.ok) return { ok: false, carrierId: "oca", error: await res.text() }
      const data = await res.json() as { numeroEnvio?: string; etiquetaPDF?: string; costo?: number }
      return {
        ok: true,
        carrierId: "oca",
        tracking: data.numeroEnvio,
        etiquetaUrl: data.etiquetaPDF,
        costo: data.costo,
      }
    } catch (e) {
      return { ok: false, carrierId: "oca", error: e instanceof Error ? e.message : "Error OCA" }
    }
  },

  async consultarTracking(tracking, creds) {
    const base = apiBase(creds)
    if (!base) return SANDBOX.consultarTracking(tracking, creds)
    try {
      const res = await carrierFetch(`${base}/epak/tracking/${encodeURIComponent(tracking)}`, {
        headers: { "Content-Type": "application/json" },
      })
      if (!res.ok) return null
      const data = await res.json() as { estado?: string; detalle?: string }
      return {
        carrierId: "oca",
        tracking,
        estado: data.estado ?? "en_transito",
        descripcion: data.detalle,
      }
    } catch {
      return null
    }
  },
}