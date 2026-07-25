/**
 * Offline Queue Service para resiliencia ante caídas de AFIP o de conexión a internet.
 * Guarda comprobantes en localStorage / IndexedDB cuando AFIP no responde o el usuario activa Contingencia,
 * permitiendo sincronizar en segundo plano.
 */

export interface QueuedAfipInvoice {
  id: string
  timestamp: string
  tipoComprobante: "FACTURA_A" | "FACTURA_B" | "FACTURA_C" | "REMITO" | "CONTINGENCIA"
  clienteNombre: string
  clienteCuit: string
  items: Array<{ descripcion: string; cantidad: number; precioUnitario: number }>
  total: number
  motivoOffline: string
  estado: "PENDIENTE" | "EN PROCESO" | "EMITIDO_OK" | "ERROR"
  errorMsg?: string
}

const STORAGE_KEY = "erp_afip_offline_queue_v1"

export function getOfflineQueue(): QueuedAfipInvoice[] {
  if (typeof window === "undefined") return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function saveOfflineQueue(queue: QueuedAfipInvoice[]): void {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(queue))
  } catch (err) {
    console.error("Error al guardar la cola offline de AFIP", err)
  }
}

export function enqueueAfipInvoice(invoice: Omit<QueuedAfipInvoice, "id" | "timestamp" | "estado">): QueuedAfipInvoice {
  const queue = getOfflineQueue()
  const newItem: QueuedAfipInvoice = {
    ...invoice,
    id: `OFFLINE-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    timestamp: new Date().toISOString(),
    estado: "PENDIENTE",
  }
  queue.push(newItem)
  saveOfflineQueue(queue)
  return newItem
}

export function removeQueuedInvoice(id: string): void {
  const queue = getOfflineQueue().filter((item) => item.id !== id)
  saveOfflineQueue(queue)
}

export function markQueuedStatus(id: string, estado: QueuedAfipInvoice["estado"], errorMsg?: string): void {
  const queue = getOfflineQueue().map((item) => {
    if (item.id === id) {
      return { ...item, estado, errorMsg }
    }
    return item
  })
  saveOfflineQueue(queue)
}
