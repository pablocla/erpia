"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Loader2, Save } from "lucide-react"
import { authFetch } from "@/lib/stores"
import { useToast } from "@/hooks/use-toast"
import type { FiscalEmissionConfig, SalidaComprobante } from "@/lib/fiscal/emission-config"

function Toggle({
  value,
  onChange,
  disabled,
}: {
  value: boolean
  onChange: (v: boolean) => void
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={value}
      disabled={disabled}
      onClick={() => onChange(!value)}
      className={`relative inline-flex h-6 w-11 shrink-0 rounded-full border transition-colors ${
        value ? "bg-primary border-primary" : "bg-muted border-border"
      } ${disabled ? "opacity-50" : ""}`}
    >
      <span
        className={`pointer-events-none block h-5 w-5 rounded-full bg-background shadow transition-transform mt-0.5 ${
          value ? "translate-x-5" : "translate-x-0.5"
        }`}
      />
    </button>
  )
}

interface FiscalEmisionConfigPanelProps {
  puedeEditar?: boolean
}

export function FiscalEmisionConfigPanel({ puedeEditar = true }: FiscalEmisionConfigPanelProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [config, setConfig] = useState<FiscalEmissionConfig | null>(null)

  useEffect(() => {
    authFetch("/api/config/fiscal-emision")
      .then((r) => r.json())
      .then((data) => setConfig(data))
      .catch(() => setConfig(null))
      .finally(() => setLoading(false))
  }, [])

  const guardar = async () => {
    if (!config) return
    setSaving(true)
    try {
      const res = await authFetch("/api/config/fiscal-emision", {
        method: "PATCH",
        body: JSON.stringify(config),
      })
      if (!res.ok) throw new Error("Error al guardar")
      toast({ title: "Configuración de emisión guardada" })
    } catch {
      toast({ variant: "destructive", title: "No se pudo guardar" })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 flex justify-center">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    )
  }

  if (!config) return null

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Salida del comprobante</CardTitle>
          <CardDescription>PDF, impresora Hasar/Epson o ambos — por empresa</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Canal principal</Label>
            <Select
              value={config.salida}
              onValueChange={(v) => setConfig({ ...config, salida: v as SalidaComprobante })}
              disabled={!puedeEditar}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="preguntar">Preguntar al cajero</SelectItem>
                <SelectItem value="impresora">Solo impresora térmica</SelectItem>
                <SelectItem value="pdf">Solo PDF</SelectItem>
                <SelectItem value="ambos">Impresora + PDF</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Marca preferida</Label>
            <Select
              value={config.marcaImpresora}
              onValueChange={(v) =>
                setConfig({
                  ...config,
                  marcaImpresora: v as FiscalEmissionConfig["marcaImpresora"],
                })
              }
              disabled={!puedeEditar}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ninguna">Sin impresora</SelectItem>
                <SelectItem value="hasar">Hasar</SelectItem>
                <SelectItem value="epson">Epson TM</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Ticket fiscal</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[
            { key: "imprimirAuto" as const, label: "Imprimir automáticamente al emitir" },
            { key: "incluirQrTicket" as const, label: "Incluir QR AFIP en ticket térmico" },
            { key: "incluirLogo" as const, label: "Mostrar logo de la empresa (PDF)" },
          ].map(({ key, label }) => (
            <div key={key} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50">
              <span className="text-sm">{label}</span>
              <Toggle
                value={config[key]}
                onChange={(v) => setConfig({ ...config, [key]: v })}
                disabled={!puedeEditar}
              />
            </div>
          ))}
        </CardContent>
      </Card>

      {puedeEditar && (
        <Button size="sm" onClick={() => void guardar()} disabled={saving}>
          {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
          Guardar emisión fiscal
        </Button>
      )}
    </div>
  )
}