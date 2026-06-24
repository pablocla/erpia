"use client"

import { useCallback, useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { authFetch } from "@/lib/stores"
import { cn } from "@/lib/utils"
import { CloudOff, Loader2, RefreshCw, Shield, Upload } from "lucide-react"

interface CaeaState {
  caeaVigente: string | null
  vigente: boolean
  periodo: string | null
  quincena: number | null
  vigDesde: string | null
  vigHasta: string | null
  topeInformar: string | null
  diasParaVencer: number | null
}

interface CaeaPanelProps {
  puedeEditar: boolean
  puntoVentaDefault?: number
}

export function CaeaPanel({ puedeEditar, puntoVentaDefault = 1 }: CaeaPanelProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [action, setAction] = useState<"solicitar" | "informar" | null>(null)
  const [caea, setCaea] = useState<CaeaState | null>(null)
  const [puntoVenta, setPuntoVenta] = useState(String(puntoVentaDefault))

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await authFetch("/api/afip/caea")
      if (res.ok) setCaea(await res.json())
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  async function solicitar() {
    setAction("solicitar")
    try {
      const res = await authFetch("/api/afip/caea", {
        method: "POST",
        body: JSON.stringify({ puntoVenta: Number(puntoVenta) || 1 }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast({ title: "Error al solicitar CAEA", description: data.error, variant: "destructive" })
        return
      }
      toast({ title: "CAEA solicitado", description: `Vigente hasta ${data.vigHasta ?? "—"}` })
      await load()
    } finally {
      setAction(null)
    }
  }

  async function informar() {
    setAction("informar")
    try {
      const res = await authFetch("/api/afip/caea", {
        method: "PUT",
        body: JSON.stringify({ puntoVenta: Number(puntoVenta) || 1 }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast({ title: "Error al informar comprobantes", description: data.error, variant: "destructive" })
        return
      }
      toast({
        title: "Comprobantes informados",
        description: `${data.informados ?? 0} comprobante(s) registrados en AFIP`,
      })
      await load()
    } finally {
      setAction(null)
    }
  }

  return (
    <Card className="border-violet-200/60 dark:border-violet-900/40">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-2">
          <div>
            <CardTitle className="text-sm flex items-center gap-2">
              <CloudOff className="h-4 w-4 text-violet-600" />
              CAEA — Contingencia offline
            </CardTitle>
            <CardDescription className="mt-1">
              RG 5782: emití sin conexión y informá a AFIP al recuperar internet
            </CardDescription>
          </div>
          <Button variant="ghost" size="icon" onClick={() => void load()} disabled={loading}>
            <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label>Punto de venta</Label>
            <Input
              type="number"
              min={1}
              value={puntoVenta}
              onChange={(e) => setPuntoVenta(e.target.value)}
              disabled={!puedeEditar}
            />
          </div>
          <div className="flex items-end">
            {caea?.vigente ? (
              <Badge className="bg-emerald-600 hover:bg-emerald-600 gap-1 h-9 px-3">
                <Shield className="h-3.5 w-3.5" />
                CAEA vigente
              </Badge>
            ) : (
              <Badge variant="secondary" className="h-9 px-3">
                Sin CAEA activo
              </Badge>
            )}
          </div>
        </div>

        {caea?.caeaVigente && (
          <div className="rounded-lg bg-muted/60 p-3 text-xs space-y-1 font-mono">
            <p>
              <span className="text-muted-foreground">Código:</span> {caea.caeaVigente}
            </p>
            <p>
              <span className="text-muted-foreground">Período:</span> {caea.periodo} · Q{caea.quincena}
            </p>
            {caea.diasParaVencer != null && (
              <p className={cn(caea.diasParaVencer <= 3 && "text-amber-600 font-medium")}>
                Vence en {caea.diasParaVencer} día(s)
              </p>
            )}
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            className="gap-2"
            onClick={() => void solicitar()}
            disabled={!puedeEditar || action !== null}
          >
            {action === "solicitar" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Shield className="h-4 w-4" />
            )}
            Solicitar CAEA
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="gap-2"
            onClick={() => void informar()}
            disabled={!puedeEditar || action !== null}
          >
            {action === "informar" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Upload className="h-4 w-4" />
            )}
            Informar comprobantes offline
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}