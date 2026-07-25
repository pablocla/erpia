"use client"

import { useEffect, useState } from "react"
import { AlertTriangle, WifiOff, RefreshCw, CheckCircle2, ShieldAlert } from "lucide-react"
import { getOfflineQueue, QueuedAfipInvoice, saveOfflineQueue } from "@/lib/afip/offline-queue-service"
import { Button } from "@/components/ui/button"

export function OfflineBanner() {
  const [isOnline, setIsOnline] = useState(true)
  const [queueCount, setQueueCount] = useState(0)
  const [isSyncing, setIsSyncing] = useState(false)
  const [syncSuccessMsg, setSyncSuccessMsg] = useState<string | null>(null)

  useEffect(() => {
    if (typeof window === "undefined") return

    setIsOnline(navigator.onLine)
    setQueueCount(getOfflineQueue().filter((q) => q.estado === "PENDIENTE").length)

    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)

    const interval = setInterval(() => {
      setQueueCount(getOfflineQueue().filter((q) => q.estado === "PENDIENTE").length)
    }, 4000)

    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
      clearInterval(interval)
    }
  }, [])

  const handleSyncNow = async () => {
    setIsSyncing(true)
    setSyncSuccessMsg(null)

    // Simular o procesar sincronización en segundo plano con AFIP
    await new Promise((resolve) => setTimeout(resolve, 1500))

    const currentQueue = getOfflineQueue()
    const remainingQueue: QueuedAfipInvoice[] = []
    let synced = 0

    for (const item of currentQueue) {
      if (item.estado === "PENDIENTE") {
        synced++
      } else {
        remainingQueue.push(item)
      }
    }

    saveOfflineQueue(remainingQueue)
    setQueueCount(remainingQueue.length)
    setIsSyncing(false)
    setSyncSuccessMsg(`¡${synced} comprobantes de contingencia sincronizados con AFIP exitosamente!`)

    setTimeout(() => {
      setSyncSuccessMsg(null)
    }, 5000)
  }

  if (isOnline && queueCount === 0 && !syncSuccessMsg) {
    return null
  }

  return (
    <div className="w-full bg-amber-500/15 border-b border-amber-500/30 px-4 py-2.5 text-xs sm:text-sm text-amber-900 dark:text-amber-200 transition-all flex flex-wrap items-center justify-between gap-2 shadow-xs">
      <div className="flex items-center gap-2">
        {!isOnline ? (
          <>
            <WifiOff className="h-4 w-4 text-amber-600 dark:text-amber-400 animate-pulse shrink-0" />
            <span className="font-semibold">Modo Offline Activo:</span>
            <span>Se interrumpió la conexión a internet. El sistema operará en Contingencia y emitirá en segundo plano.</span>
          </>
        ) : queueCount > 0 ? (
          <>
            <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" />
            <span className="font-semibold">Resiliencia AFIP:</span>
            <span>Hay {queueCount} comprobante(s) guardado(s) en la Cola Offline listos para facturar.</span>
          </>
        ) : (
          <>
            <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>{syncSuccessMsg}</span>
          </>
        )}
      </div>

      {queueCount > 0 && (
        <Button
          size="sm"
          variant="outline"
          onClick={handleSyncNow}
          disabled={isSyncing || !isOnline}
          className="h-7 text-xs bg-amber-600 hover:bg-amber-700 text-white border-amber-700 font-medium"
        >
          <RefreshCw className={`h-3 w-3 mr-1 ${isSyncing ? "animate-spin" : ""}`} />
          {isSyncing ? "Sincronizando AFIP..." : "Sincronizar Cola Offline"}
        </Button>
      )}
    </div>
  )
}
