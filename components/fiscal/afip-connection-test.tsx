"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { authFetch } from "@/lib/stores"
import { cn } from "@/lib/utils"
import { Loader2, Wifi, WifiOff } from "lucide-react"

interface AfipConnectionTestProps {
  cuit: string
  disabled?: boolean
  className?: string
}

export function AfipConnectionTest({ cuit, disabled, className }: AfipConnectionTestProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [lastOk, setLastOk] = useState<boolean | null>(null)

  async function probar() {
    const cuitLimpio = cuit.replace(/\D/g, "")
    if (cuitLimpio.length !== 11) {
      toast({ title: "CUIT requerido", description: "Completá el CUIT de la empresa primero", variant: "destructive" })
      return
    }

    setLoading(true)
    try {
      const res = await authFetch("/api/afip/test-conexion", {
        method: "POST",
        body: JSON.stringify({ cuit: cuitLimpio }),
      })
      const data = await res.json()
      setLastOk(data.success === true)
      if (data.success) {
        toast({
          title: "Conexión AFIP OK",
          description: `Entorno ${data.entorno} · token válido`,
        })
      } else {
        toast({
          title: "Falló la conexión",
          description: data.error ?? "Revisá certificados y CUIT",
          variant: "destructive",
        })
      }
    } catch {
      setLastOk(false)
      toast({ title: "Error de red", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className={cn("gap-2", className)}
      onClick={() => void probar()}
      disabled={disabled || loading}
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : lastOk === true ? (
        <Wifi className="h-4 w-4 text-emerald-600" />
      ) : lastOk === false ? (
        <WifiOff className="h-4 w-4 text-red-500" />
      ) : (
        <Wifi className="h-4 w-4" />
      )}
      Probar conexión AFIP
    </Button>
  )
}