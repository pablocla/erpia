"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Loader2, Receipt } from "lucide-react"
import { getAuthHeaders } from "@/lib/stores/auth-store"
import { useToast } from "@/hooks/use-toast"

interface OTFacturarButtonProps {
  otId: number
  estado: string
  disabled?: boolean
  onSuccess?: () => void
  className?: string
  size?: "default" | "sm" | "lg" | "icon"
}

export function OTFacturarButton({
  otId,
  estado,
  disabled,
  onSuccess,
  className,
  size = "sm",
}: OTFacturarButtonProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)

  const canBill =
    !["FACTURADA", "CANCELADO", "CANCELADA"].includes(estado) &&
    ["FINALIZADO", "LISTO", "ENTREGADO", "EN_PROCESO", "PRESUPUESTADO"].includes(estado)

  if (!canBill && estado !== "FACTURADA") return null

  const handleFacturar = async () => {
    if (estado === "FACTURADA") {
      toast({ title: "Ya facturada", description: "Esta OT ya tiene factura asociada" })
      return
    }

    setLoading(true)
    try {
      const res = await fetch(`/api/ot/${otId}/facturar`, {
        method: "POST",
        headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify({}),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error(data.error || "No se pudo facturar")
      }

      const caeOk = data.caeResult?.ok
      toast({
        title: data.yaFacturada ? "Factura existente" : "OT facturada",
        description: caeOk
          ? `Factura #${data.factura?.numero} con CAE`
          : `Factura #${data.factura?.numero} (pendiente CAE / contingencia)`,
      })
      onSuccess?.()
    } catch (err) {
      toast({
        title: "Error al facturar",
        description: err instanceof Error ? err.message : "Error desconocido",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button
      type="button"
      variant={estado === "FACTURADA" ? "outline" : "default"}
      size={size}
      className={className}
      disabled={disabled || loading || estado === "FACTURADA"}
      onClick={() => void handleFacturar()}
    >
      {loading ? (
        <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
      ) : (
        <Receipt className="mr-1 h-3.5 w-3.5" />
      )}
      {estado === "FACTURADA" ? "Facturada" : "Facturar"}
    </Button>
  )
}
