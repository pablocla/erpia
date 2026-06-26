"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { FileText, Loader2, Printer } from "lucide-react"
import { authFetch } from "@/lib/stores"
import { useToast } from "@/hooks/use-toast"
import type { SalidaComprobante } from "@/lib/fiscal/emission-config"

interface FiscalOutputActionsProps {
  facturaId?: number
  salidaPreferida?: SalidaComprobante
  onPrintFallback?: () => void
  disabled?: boolean
  size?: "sm" | "default"
}

export function FiscalOutputActions({
  facturaId,
  salidaPreferida = "preguntar",
  onPrintFallback,
  disabled,
  size = "sm",
}: FiscalOutputActionsProps) {
  const { toast } = useToast()
  const [imprimiendo, setImprimiendo] = useState(false)
  const [abriendoPdf, setAbriendoPdf] = useState(false)

  const imprimirTermica = async () => {
    if (!facturaId) {
      onPrintFallback?.()
      return
    }
    setImprimiendo(true)
    try {
      const res = await authFetch("/api/impresion/imprimir-ticket", {
        method: "POST",
        body: JSON.stringify({ facturaId }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast({ variant: "destructive", title: "Impresión", description: data.error ?? "Error" })
        onPrintFallback?.()
        return
      }
      toast({ title: "Ticket enviado a impresora" })
    } catch {
      toast({ variant: "destructive", title: "Error de conexión" })
      onPrintFallback?.()
    } finally {
      setImprimiendo(false)
    }
  }

  const abrirPdf = () => {
    if (!facturaId) return
    setAbriendoPdf(true)
    const w = window.open(`/api/impresion/pdf?tipo=factura&id=${facturaId}`, "_blank")
    if (!w) {
      toast({ variant: "destructive", title: "Permití ventanas emergentes para el PDF" })
    }
    setAbriendoPdf(false)
  }

  const showThermal = salidaPreferida === "impresora" || salidaPreferida === "ambos" || salidaPreferida === "preguntar"
  const showPdf = salidaPreferida === "pdf" || salidaPreferida === "ambos" || salidaPreferida === "preguntar"

  return (
    <div className="flex flex-wrap gap-2">
      {showThermal && (
        <Button variant="outline" size={size} onClick={() => void imprimirTermica()} disabled={disabled || imprimiendo}>
          {imprimiendo ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Printer className="h-4 w-4 mr-2" />}
          Impresora
        </Button>
      )}
      {showPdf && facturaId && (
        <Button variant="outline" size={size} onClick={abrirPdf} disabled={disabled || abriendoPdf}>
          <FileText className="h-4 w-4 mr-2" />
          PDF
        </Button>
      )}
    </div>
  )
}