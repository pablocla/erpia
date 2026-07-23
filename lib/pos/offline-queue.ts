/**
 * Cola de ventas POS offline-first (IndexedDB vía idb-keyval).
 * Persiste tickets sin CAE cuando no hay red y sincroniza al recuperar conexión.
 */

import { get, set, keys, del } from "idb-keyval"

export const OFFLINE_SALE_PREFIX = "offline_sale_"
/** Legacy localStorage key usada por versiones previas del POS */
export const LEGACY_LS_QUEUE_KEY = "claverp:offline:queue"

export interface OfflineVentaPayload {
  idLocal: string
  fechaLocal: string
  clienteId?: number
  mesaId?: number
  tipoFactura: "ticket" | "A" | "B" | "C"
  lineas: Array<{
    productoId?: number
    descripcion: string
    cantidad: number
    precioUnitario: number
    porcentajeIva?: number
    descuento?: number
  }>
  pagos: Array<{
    medio: string
    monto: number
    numeroVale?: string
  }>
  descuentoGlobal?: number
  propina?: number
  observaciones?: string
  total?: number
}

function saleKey(idLocal: string) {
  return `${OFFLINE_SALE_PREFIX}${idLocal}`
}

export async function listOfflineVentas(): Promise<OfflineVentaPayload[]> {
  if (typeof window === "undefined") return []

  try {
    await migrateLegacyLocalStorageQueue()
  } catch {
    /* ignore migration errors */
  }

  try {
    const allKeys = await keys()
    const saleKeys = allKeys.filter(
      (k): k is string => typeof k === "string" && k.startsWith(OFFLINE_SALE_PREFIX),
    )
    const sales: OfflineVentaPayload[] = []
    for (const key of saleKeys) {
      const sale = await get<OfflineVentaPayload>(key)
      if (sale?.idLocal) sales.push(sale)
    }
    return sales.sort(
      (a, b) => Date.parse(a.fechaLocal) - Date.parse(b.fechaLocal),
    )
  } catch (e) {
    console.error("[POS Offline] Error listando cola:", e)
    return []
  }
}

export async function enqueueOfflineVenta(
  payload: Omit<OfflineVentaPayload, "idLocal" | "fechaLocal"> & {
    idLocal?: string
    fechaLocal?: string
  },
): Promise<OfflineVentaPayload> {
  const full: OfflineVentaPayload = {
    ...payload,
    idLocal: payload.idLocal ?? crypto.randomUUID(),
    fechaLocal: payload.fechaLocal ?? new Date().toISOString(),
    tipoFactura: "ticket",
  }
  await set(saleKey(full.idLocal), full)
  return full
}

export async function removeOfflineVenta(idLocal: string): Promise<void> {
  await del(saleKey(idLocal))
}

/** Migra cola legacy de localStorage → IndexedDB (una vez). */
export async function migrateLegacyLocalStorageQueue(): Promise<number> {
  if (typeof window === "undefined") return 0
  const raw = localStorage.getItem(LEGACY_LS_QUEUE_KEY)
  if (!raw) return 0

  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    localStorage.removeItem(LEGACY_LS_QUEUE_KEY)
    return 0
  }

  if (!Array.isArray(parsed) || parsed.length === 0) {
    localStorage.removeItem(LEGACY_LS_QUEUE_KEY)
    return 0
  }

  let migrated = 0
  for (const item of parsed) {
    if (!item || typeof item !== "object") continue
    const row = item as Record<string, unknown>
    const idLocal = String(row.idLocal ?? crypto.randomUUID())
    await set(saleKey(idLocal), {
      idLocal,
      fechaLocal:
        typeof row.createdAt === "string"
          ? row.createdAt
          : new Date().toISOString(),
      clienteId: typeof row.clienteId === "number" ? row.clienteId : undefined,
      mesaId: typeof row.mesaId === "number" ? row.mesaId : undefined,
      tipoFactura: "ticket",
      lineas: Array.isArray(row.lineas) ? row.lineas : [],
      pagos: Array.isArray(row.pagos) ? row.pagos : [],
      descuentoGlobal: Number(row.descuentoGlobal ?? 0),
      propina: Number(row.propina ?? 0),
      observaciones: "Migrado de cola offline localStorage",
    } satisfies OfflineVentaPayload)
    migrated++
  }

  localStorage.removeItem(LEGACY_LS_QUEUE_KEY)
  return migrated
}
