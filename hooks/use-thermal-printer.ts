"use client"

/**
 * Hook cliente para impresión térmica directa vía API del ERP.
 * Backend: POST /api/impresion/imprimir-ticket → PrinterService (ESC/POS).
 * Si el agente/impresora no responde, el caller puede abrir el visor nativo.
 */

import { useCallback, useState } from "react"
import { getToken } from "@/lib/stores"

export interface ThermalPrintResult {
  success: boolean
  mensaje?: string
  error?: string
  /** true si se debe ofrecer window.print / visor fiscal como fallback */
  fallbackPrint?: boolean
}

export function useThermalPrinter() {
  const [isPrinting, setIsPrinting] = useState(false)
  const [isConnected, setIsConnected] = useState(true)
  const [lastError, setLastError] = useState<string | null>(null)

  const printTicket = useCallback(async (facturaId: number): Promise<ThermalPrintResult> => {
    if (!Number.isFinite(facturaId) || facturaId <= 0) {
      return { success: false, error: "facturaId inválido", fallbackPrint: true }
    }

    setIsPrinting(true)
    setLastError(null)

    try {
      const token = getToken()
      const res = await fetch("/api/impresion/imprimir-ticket", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ facturaId }),
      })

      const data = (await res.json().catch(() => ({}))) as {
        success?: boolean
        mensaje?: string
        error?: string
      }

      if (!res.ok || !data.success) {
        const error = data.error ?? `Error de impresión (${res.status})`
        setLastError(error)
        setIsConnected(false)
        return { success: false, error, fallbackPrint: true }
      }

      setIsConnected(true)
      return { success: true, mensaje: data.mensaje ?? "Ticket impreso" }
    } catch (e) {
      const error = e instanceof Error ? e.message : "Sin conexión con impresora"
      setLastError(error)
      setIsConnected(false)
      return { success: false, error, fallbackPrint: true }
    } finally {
      setIsPrinting(false)
    }
  }, [])

  return {
    isPrinting,
    isConnected,
    lastError,
    printTicket,
  }
}
