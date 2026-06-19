"use client"

import { useCallback, useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { authFetch } from "@/lib/stores"
import { Save } from "lucide-react"

interface MipymeConfig {
  moduloActivo: boolean
  umbralMipyme: number
  cbuFce: string | null
  tipoTransferenciaFce: "SCA" | "ADC"
  cbuConfigurado: boolean
}

export function MipymeFceConfig({ puedeEditar }: { puedeEditar: boolean }) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [config, setConfig] = useState<MipymeConfig | null>(null)
  const [cbu, setCbu] = useState("")
  const [tipoTransferencia, setTipoTransferencia] = useState<"SCA" | "ADC">("SCA")

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await authFetch("/api/config/fiscal-mipyme")
      if (res.ok) {
        const data = (await res.json()) as MipymeConfig
        setConfig(data)
        setCbu(data.cbuFce ?? "")
        setTipoTransferencia(data.tipoTransferenciaFce)
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  async function handleSave() {
    setSaving(true)
    try {
      const res = await authFetch("/api/config/fiscal-mipyme", {
        method: "PUT",
        body: JSON.stringify({
          cbuFce: cbu.trim() || null,
          tipoTransferenciaFce: tipoTransferencia,
        }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error ?? "Error al guardar")
      }
      toast({ title: "FCE MiPyME guardado", description: "CBU y tipo de transferencia actualizados." })
      void load()
    } catch (err) {
      toast({
        title: "No se pudo guardar",
        description: err instanceof Error ? err.message : "Error desconocido",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 text-sm text-muted-foreground text-center">
          Cargando configuración FCE MiPyME…
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2 flex-wrap">
          <CardTitle className="text-sm">FCE MiPyME (Ley 27.440)</CardTitle>
          <Badge variant={config?.moduloActivo ? "default" : "secondary"}>
            {config?.moduloActivo ? "Módulo activo" : "Módulo inactivo"}
          </Badge>
          {config?.cbuConfigurado && <Badge variant="outline">CBU OK</Badge>}
        </div>
        <CardDescription>
          Factura de Crédito Electrónica para ventas a Gran Empresa desde $
          {config?.umbralMipyme.toLocaleString("es-AR")} (umbral configurable).
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 max-w-lg">
        <div className="space-y-1.5">
          <Label>CBU emisor (22 dígitos)</Label>
          <Input
            placeholder="0000003100010000000000"
            value={cbu}
            onChange={(e) => setCbu(e.target.value)}
            disabled={!puedeEditar}
            maxLength={22}
          />
          <p className="text-xs text-muted-foreground">
            Obligatorio para emitir tipos 201–213. El cliente debe tener &quot;Es Gran Empresa&quot; activo.
          </p>
        </div>
        <div className="space-y-1.5">
          <Label>Tipo de transferencia</Label>
          <Select
            value={tipoTransferencia}
            onValueChange={(v) => setTipoTransferencia(v as "SCA" | "ADC")}
            disabled={!puedeEditar}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="SCA">SCA — Sistema de Circulación Abierta</SelectItem>
              <SelectItem value="ADC">ADC — Agente de Depósito Colectivo</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {puedeEditar && (
          <Button onClick={handleSave} disabled={saving} size="sm">
            <Save className="mr-2 h-4 w-4" />
            {saving ? "Guardando…" : "Guardar FCE MiPyME"}
          </Button>
        )}
      </CardContent>
    </Card>
  )
}