import { get, set } from "idb-keyval"

export interface VentaPOSOfflineItem {
  idLocal: string
  fechaLocal: string
  payload: {
    clienteId?: number
    mesaId?: number
    tipoFactura?: "A" | "B" | "C" | "ticket"
    puntoVenta?: number
    lineas: Array<{
      productoId?: number
      descripcion: string
      cantidad: number
      precioUnitario?: number
      porcentajeIva?: number
      descuento?: number
    }>
    pagos: Array<{
      medio: "efectivo" | "tarjeta_debito" | "tarjeta_credito" | "transferencia" | "cheque" | "qr" | "cuenta_corriente" | "vale"
      monto: number
      numeroVale?: string
    }>
    descuentoGlobal?: number
    propina?: number
    observaciones?: string
  }
}

const OFFLINE_POS_KEY = "claver_pos_offline_sales_queue"

/**
 * Guarda una venta localmente en IndexedDB cuando falla la red o el POS está offline.
 */
export async function guardarVentaOffline(
  payload: VentaPOSOfflineItem["payload"]
): Promise<VentaPOSOfflineItem> {
  const item: VentaPOSOfflineItem = {
    idLocal: crypto.randomUUID(),
    fechaLocal: new Date().toISOString(),
    payload,
  }

  const queue = (await get<VentaPOSOfflineItem[]>(OFFLINE_POS_KEY)) || []
  queue.push(item)
  await set(OFFLINE_POS_KEY, queue)

  return item
}

/**
 * Obtiene la lista de ventas pendientes guardadas offline.
 */
export async function obtenerVentasOfflinePendientes(): Promise<VentaPOSOfflineItem[]> {
  const queue = await get<VentaPOSOfflineItem[]>(OFFLINE_POS_KEY)
  return queue || []
}

/**
 * Elimina una venta ya sincronizada de IndexedDB.
 */
export async function eliminarVentaOffline(idLocal: string): Promise<void> {
  const queue = (await get<VentaPOSOfflineItem[]>(OFFLINE_POS_KEY)) || []
  const filtrada = queue.filter((q) => q.idLocal !== idLocal)
  await set(OFFLINE_POS_KEY, filtrada)
}

/**
 * Sincroniza todas las ventas encoladas offline con el servidor cuando vuelve la red.
 */
export async function sincronizarVentasOffline(
  fetcher: (url: string, init?: RequestInit) => Promise<Response>
): Promise<{ exitosas: number; fallidas: number }> {
  const queue = await obtenerVentasOfflinePendientes()
  if (!queue.length) return { exitosas: 0, fallidas: 0 }

  let exitosas = 0
  let fallidas = 0

  for (const item of queue) {
    try {
      const res = await fetcher("/api/pos/venta", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item.payload),
      })

      if (res.ok) {
        await eliminarVentaOffline(item.idLocal)
        exitosas++
      } else {
        fallidas++
      }
    } catch (err) {
      console.error("[POS Offline Queue] Error al procesar venta offline:", err)
      fallidas++
      break // Si sigue fallando la red, pausamos la cola
    }
  }

  return { exitosas, fallidas }
}
