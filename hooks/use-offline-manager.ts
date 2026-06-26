import { useState, useEffect, useCallback } from "react"
import { get, set, keys, del } from "idb-keyval"
import { authFetch } from "@/lib/stores"

export interface OfflineSale {
  idLocal: string
  clienteId: number
  lineas: any[]
  total: number
  estado: string
  condicionPagoId?: number
  observaciones?: string
  fecha: number
}

export function useOfflineManager() {
  const [isOnline, setIsOnline] = useState(true)
  const [offlineQueue, setOfflineQueue] = useState<OfflineSale[]>([])
  const [isSyncing, setIsSyncing] = useState(false)

  // Initialize online status & load queue
  useEffect(() => {
    setIsOnline(navigator.onLine)
    
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)
    
    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)
    
    loadQueue()
    
    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
    }
  }, [])

  // Auto-sync when coming online
  useEffect(() => {
    if (isOnline && offlineQueue.length > 0) {
      syncQueue()
    }
  }, [isOnline, offlineQueue.length])

  const loadQueue = async () => {
    try {
      const allKeys = await keys()
      const saleKeys = allKeys.filter(k => typeof k === "string" && k.startsWith("offline_sale_"))
      
      const sales: OfflineSale[] = []
      for (const key of saleKeys) {
        const sale = await get(key)
        if (sale) sales.push(sale)
      }
      
      setOfflineQueue(sales.sort((a, b) => a.fecha - b.fecha))
    } catch (e) {
      console.error("Error loading offline queue", e)
    }
  }

  const addToQueue = async (sale: Omit<OfflineSale, "idLocal" | "fecha">) => {
    const idLocal = crypto.randomUUID()
    const fullSale: OfflineSale = {
      ...sale,
      idLocal,
      fecha: Date.now()
    }
    
    await set(`offline_sale_${idLocal}`, fullSale)
    await loadQueue()
    
    return idLocal
  }

  const syncQueue = useCallback(async () => {
    if (isSyncing || offlineQueue.length === 0 || !isOnline) return
    
    setIsSyncing(true)
    try {
      const res = await authFetch("/api/pos/sync", {
        method: "POST",
        body: JSON.stringify({ pedidosOffline: offlineQueue })
      })
      
      if (res.ok) {
        const data = await res.json()
        if (data.success && data.resultados) {
          // Remove successfully synced sales
          for (const result of data.resultados) {
            if (result.success) {
              await del(`offline_sale_${result.idLocal}`)
            } else {
              console.error("Sale sync failed:", result.error)
            }
          }
        }
        await loadQueue()
      }
    } catch (e) {
      console.error("Sync error:", e)
    } finally {
      setIsSyncing(false)
    }
  }, [isSyncing, offlineQueue, isOnline])

  return {
    isOnline,
    offlineQueue,
    isSyncing,
    addToQueue,
    syncQueue
  }
}
