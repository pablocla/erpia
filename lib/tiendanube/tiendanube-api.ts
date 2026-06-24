import { obtenerCredencialesIntegracion } from "@/lib/integrations/credentials"

const API = "https://api.tiendanube.com/v1"

export class TiendaNubeApiError extends Error {
  constructor(message: string, public status: number) {
    super(message)
    this.name = "TiendaNubeApiError"
  }
}

function tnHeaders(token: string): HeadersInit {
  const appName = process.env.TN_APP_NAME ?? "Claverp ERP"
  const contact = process.env.TN_CONTACT_EMAIL ?? "soporte@claverp.com"
  return {
    Authentication: `bearer ${token}`,
    "User-Agent": `${appName} (${contact})`,
    Accept: "application/json",
  }
}

async function ensureCredentials(empresaId: number) {
  const { credenciales } = await obtenerCredencialesIntegracion(empresaId, "tienda_nube")
  const token = credenciales.accessToken
  const storeId = credenciales.storeId
  if (!token || !storeId) {
    throw new TiendaNubeApiError("TIENDA_NUBE_NO_CONFIGURADO", 401)
  }
  return { token, storeId }
}

export async function tnFetch<T>(
  empresaId: number,
  path: string,
  init?: RequestInit,
): Promise<T> {
  const { token, storeId } = await ensureCredentials(empresaId)
  const res = await fetch(`${API}/${storeId}${path}`, {
    ...init,
    headers: {
      ...tnHeaders(token),
      ...(init?.headers ?? {}),
    },
  })

  if (!res.ok) {
    const body = await res.text()
    throw new TiendaNubeApiError(body || res.statusText, res.status)
  }

  if (res.status === 204) return undefined as T
  return res.json() as Promise<T>
}

export interface TNProduct {
  id: number
  name: { es?: string }
  variants: Array<{
    id: number
    sku?: string | null
    stock?: number | null
    price?: string | number | null
  }>
  published: boolean
}

export interface TNOrder {
  id: number
  number: number
  status: string
  total: string
  customer?: { name?: string; email?: string }
  products: Array<{
    product_id: number
    variant_id: number
    name: string
    quantity: number
    price: string
    sku?: string | null
  }>
  created_at: string
}