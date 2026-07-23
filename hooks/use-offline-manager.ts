"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { authFetch } from "@/lib/stores"
import {
  enqueueOfflineVenta,
  listOfflineVentas,
  removeOfflineVenta,
  type OfflineVentaPayload,
} from "@/lib/pos/offline-queue"

export type OfflineSale = OfflineVentaPayload

export function useOfflineManager() {
  const [isOnline, setIsOnline] = useState(true)
  const [offlineQueue, setOfflineQueue] = useState<OfflineSale[]>([])
  const [isSyncing, setIsSyncing] = useState(false)
  const syncingRef = useRef(false)

  const loadQueue = useCallback(async () => {
    try {
      const sales = await listOfflineVentas()
      setOfflineQueue(sales)
    } catch (e) {
      console.error("[POS Offline] Error loading queue", e)
    }
  }, [])

  useEffect(() => {
    if (typeof window === "undefined") return
    setIsOnline(navigator.onLine)

    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)
    void loadQueue()

    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
    }
  }, [loadQueue])

  const addToQueue = useCallback(
    async (
      sale: Omit<OfflineSale, "idLocal" | "fechaLocal"> & {
        idLocal?: string
        fechaLocal?: string
      },
    ) => {
      const full = await enqueueOfflineVenta(sale)
      await loadQueue()
      return full.idLocal
    },
    [loadQueue],
  )

  const syncQueue = useCallback(async () => {
    if (syncingRef.current || !navigator.onLine) return
    const current = await listOfflineVentas()
    if (current.length === 0) {
      setOfflineQueue([])
      return
    }

    syncingRef.current = true
    setIsSyncing(true)
    try {
      const res = await authFetch("/api/pos/sync", {
        method: "POST",
        body: JSON.stringify({ pedidosOffline: current }),
      })

      if (res.ok) {
        const data = await res.json()
        if (data.success && Array.isArray(data.resultados)) {
          for (const result of data.resultados) {
            if (result.success && result.idLocal) {
              await removeOfflineVenta(result.idLocal)
            } else {
              console.error("[POS Offline] Sale sync failed:", result.error)
            }
          }
        }
      }
      await loadQueue()
    } catch (e) {
      console.error("[POS Offline] Sync error:", e)
    } finally {
      syncingRef.current = false
      setIsSyncing(false)
    }
  }, [loadQueue])

  // Auto-sync when coming online
  useEffect(() => {
    if (isOnline && offlineQueue.length > 0) {
      void syncQueue()
    }
  }, [isOnline, offlineQueue.length, syncQueue])

  return {
    isOnline,
    offlineQueue,
    isSyncing,
    offlineCount: offlineQueue.length,
    addToQueue,
    syncQueue,
    reloadQueue: loadQueue,
  }
}
