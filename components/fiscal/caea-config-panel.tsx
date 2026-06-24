"use client"

import { useCallback, useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { authFetch } from "@/lib/stores"
import { Loader2, Settings2 } from "lucide-react"
import type { CaeaConfig, CaeaModoEmision } from "@/lib/afip/caea-config"


interface CaeaConfigPanelProps {
  puedeEditar: boolean
}

export function CaeaConfigPanel({ puedeEditar }: CaeaConfigPanelProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [config, setConfig] = useState<CaeaConfig | null>(null)
  const [modos, setModos] = useState<Array<{ value: CaeaModoEmision; label: string }>>([])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await authFetch("/api/config/caea")
      if (res.ok) {
        const data = await res.json()
        setConfig(data.config)
        setModos(data.modosDisponibles ?? [])
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  async function guardar() {
    if (!config) return
    setSaving(true)
    try {
      const res = await authFetch("/api/config/caea", {
        method: "PUT",
        body: JSON.stringify(config),
      })
      const data = await res.json()
      if (!res.ok) {
        toast({ title: "Error", description: data.error, variant: "destructive" })
        return
      }
      setConfig(data.config)
      toast({ title: "Parametrización CAEA guardada" })
    } finally {
      setSaving(false)
    }
  }

  if (loading || !config) {
    return (
      <Card>
        <CardContent className="py-8 flex justify-center">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-violet-200/60 dark:border-violet-900/40">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Settings2 className="h-4 w-4 text-violet-600" />
          Parametrización CAEA
        </CardTitle>
        <CardDescription>
          Definí cuándo el POS y las ventas usan CAEA en lugar de CAE online.
          La guía operativa está en <code className="text-xs">docs/fiscal/CAEA-GUIA.md</code>.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <Label>Habilitar CAEA</Label>
            <p className="text-xs text-muted-foreground">Permite emitir con código anticipado en contingencia</p>
          </div>
          <Switch
            checked={config.habilitado}
            onCheckedChange={(v) => setConfig((c) => c && { ...c, habilitado: v })}
            disabled={!puedeEditar}
          />
        </div>

        <div className="space-y-1.5">
          <Label>Modo de emisión</Label>
          <Select
            value={String(config.modoEmision)}
            onValueChange={(v) =>
              setConfig((c) => c && { ...c, modoEmision: Number(v) as CaeaModoEmision })
            }
            disabled={!puedeEditar || !config.habilitado}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {modos.map((m) => (
                <SelectItem key={m.value} value={String(m.value)}>
                  {m.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center justify-between gap-4">
          <div>
            <Label>Informar automáticamente</Label>
            <p className="text-xs text-muted-foreground">
              Al recuperar conexión, el cron sync-afip informa comprobantes CAEA a AFIP
            </p>
          </div>
          <Switch
            checked={config.autoInformar}
            onCheckedChange={(v) => setConfig((c) => c && { ...c, autoInformar: v })}
            disabled={!puedeEditar || !config.habilitado}
          />
        </div>

        <div className="flex items-center justify-between gap-4">
          <div>
            <Label>Solicitar CAEA automáticamente</Label>
            <p className="text-xs text-muted-foreground">
              Al inicio de cada quincena (requiere cron activo)
            </p>
          </div>
          <Switch
            checked={config.autoSolicitar}
            onCheckedChange={(v) => setConfig((c) => c && { ...c, autoSolicitar: v })}
            disabled={!puedeEditar || !config.habilitado}
          />
        </div>

        <Button size="sm" onClick={() => void guardar()} disabled={!puedeEditar || saving}>
          {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
          Guardar parametrización
        </Button>
      </CardContent>
    </Card>
  )
}