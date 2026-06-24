import { carrierFetch, createSandboxCarrier, tarifaEstimadaAR } from "./base"
import type { CarrierAdapter, CrearEnvioResult } from "./types"

const SANDBOX = createSandboxCarrier("correo_argentino", "Correo Argentino PAQ.AR", 0.95)

function apiBase(creds: Record<string, string>): string | null {
  return creds.apiUrl ?? process.env.CORREO_ARGENTINO_API_URL ?? "https://api.correoargentino.com.ar/micorreo/v1"
}

async function token(creds: Record<string, string>): Promise<string | null> {
  const apiKey = creds.apiKey ?? process.env.CORREO_ARGENTINO_API_KEY
  const userId = creds.userId ?? process.env.CORREO_ARGENTINO_USER_ID
  if (!apiKey) return null

  const res = await carrierFetch(`${apiBase(creds)}/token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ apiKey, userId }),
  })
  if (!res.ok) return apiKey
  const data = await res.json() as { token?: string; access_token?: string }
  return data.token ?? data.access_token ?? apiKey
}

export const correoArgentinoCarrier: CarrierAdapter = {
  id: "correo_argentino",
  nombre: "Correo Argentino PAQ.AR",

  async testConnection(creds) {
    const apiKey = creds.apiKey ?? process.env.CORREO_ARGENTINO_API_KEY
    if (!apiKey) return SANDBOX.testConnection(creds)
    try {
      const t = await token(creds)
      if (t) return { ok: true, mensaje: "PAQ.AR / Mi Correo conectado" }
      return { ok: false, mensaje: "No se pudo autenticar en PAQ.AR" }
    } catch (e) {
      return { ok: false, mensaje: e instanceof Error ? e.message : "Error de red" }
    }
  },

  async cotizar(input, creds) {
    const apiKey = creds.apiKey ?? process.env.CORREO_ARGENTINO_API_KEY
    if (!apiKey) return SANDBOX.cotizar(input, creds)

    try {
      const t = await token(creds)
      const res = await carrierFetch(`${apiBase(creds)}/rates`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${t}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          originPostalCode: input.cpOrigen,
          destinationPostalCode: input.cpDestino,
          weight: input.pesoKg,
          packages: input.bultos ?? 1,
        }),
      })
      if (!res.ok) return SANDBOX.cotizar(input, creds)
      const data = await res.json() as { price?: number; deliveryTime?: number; rates?: Array<{ price: number }> }
      const precio = data.price ?? data.rates?.[0]?.price ?? tarifaEstimadaAR(input, 0.95)
      return {
        carrierId: "correo_argentino",
        carrierNombre: "Correo Argentino",
        servicio: "PAQ.AR",
        precio,
        plazoEntregaDias: data.deliveryTime ?? 5,
        moneda: "ARS",
      }
    } catch {
      return SANDBOX.cotizar(input, creds)
    }
  },

  async crearEnvio(input, creds): Promise<CrearEnvioResult> {
    const apiKey = creds.apiKey ?? process.env.CORREO_ARGENTINO_API_KEY
    if (!apiKey) return SANDBOX.crearEnvio(input, creds)

    try {
      const t = await token(creds)
      const res = await carrierFetch(`${apiBase(creds)}/shippings`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${t}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          recipient: input.destinatario,
          weight: input.pesoKg,
          packages: input.bultos ?? 1,
          declaredValue: input.valorDeclarado,
        }),
      })
      if (!res.ok) return { ok: false, carrierId: "correo_argentino", error: await res.text() }
      const data = await res.json() as { trackingNumber?: string; labelUrl?: string; cost?: number }
      return {
        ok: true,
        carrierId: "correo_argentino",
        tracking: data.trackingNumber,
        etiquetaUrl: data.labelUrl,
        costo: data.cost,
      }
    } catch (e) {
      return { ok: false, carrierId: "correo_argentino", error: e instanceof Error ? e.message : "Error PAQ.AR" }
    }
  },

  async consultarTracking(tracking, creds) {
    const apiKey = creds.apiKey ?? process.env.CORREO_ARGENTINO_API_KEY
    if (!apiKey) return SANDBOX.consultarTracking(tracking, creds)
    try {
      const t = await token(creds)
      const res = await carrierFetch(`${apiBase(creds)}/tracking/${encodeURIComponent(tracking)}`, {
        headers: { Authorization: `Bearer ${t}` },
      })
      if (!res.ok) return null
      const data = await res.json() as { status?: string; description?: string }
      return {
        carrierId: "correo_argentino",
        tracking,
        estado: data.status ?? "en_transito",
        descripcion: data.description,
      }
    } catch {
      return null
    }
  },
}