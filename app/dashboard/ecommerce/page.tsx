"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { ExternalLink, ShoppingBag, RefreshCw, Save } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { PageShell, PageHeader, StatusBadge } from "@/components/layout"
import { PageSkeleton } from "@/components/layout/page-skeleton"
import { EmptyState } from "@/components/ui/empty-state"
import { useToast } from "@/hooks/use-toast"
import { authFetch } from "@/lib/stores"

type TiendaConfig = {
  slug: string
  nombreTienda: string
  logoUrl?: string | null
  colorPrimario?: string | null
  activa?: boolean
  mediosPago?: {
    mercadopago?: boolean
    transferencia?: boolean
    confirmarSinPago?: boolean
  }
  transferenciaCbu?: string | null
  transferenciaAlias?: string | null
  transferenciaTitular?: string | null
  textoEnvio?: string | null
  textoFooter?: string | null
}

export default function EcommerceAdminPage() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [config, setConfig] = useState<TiendaConfig | null>(null)
  const [error, setError] = useState("")

  const cargar = useCallback(async () => {
    setLoading(true)
    setError("")
    try {
      const res = await authFetch("/api/ecommerce/config")
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "No se pudo cargar la tienda")
      setConfig(data.config)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error de carga")
      setConfig(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void cargar()
  }, [cargar])

  const guardar = async () => {
    if (!config) return
    setSaving(true)
    try {
      const res = await authFetch("/api/ecommerce/config", {
        method: "PUT",
        body: JSON.stringify({
          slug: config.slug,
          nombreTienda: config.nombreTienda,
          activa: config.activa,
          mediosPago: config.mediosPago,
          transferenciaCbu: config.transferenciaCbu,
          transferenciaAlias: config.transferenciaAlias,
          transferenciaTitular: config.transferenciaTitular,
          textoEnvio: config.textoEnvio,
          textoFooter: config.textoFooter,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "No se pudo guardar")
      setConfig(data.config)
      toast({ title: "Tienda actualizada", description: "La configuración se guardó correctamente." })
    } catch (e) {
      toast({
        title: "Error al guardar",
        description: e instanceof Error ? e.message : "Reintentá",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <PageSkeleton kpis={2} tableRows={4} tableCols={2} />
  }

  if (error || !config) {
    return (
      <PageShell>
        <EmptyState
          icon={ShoppingBag}
          title="No se pudo cargar la tienda"
          description={error || "Revisá tu plan o reintentá en unos segundos."}
          actionLabel="Reintentar"
          onAction={() => void cargar()}
          secondaryActionLabel="Ver productos"
          onSecondaryAction={() => {
            window.location.href = "/dashboard/productos"
          }}
        />
      </PageShell>
    )
  }

  const publicUrl = config.slug ? `/tienda/${config.slug}` : null

  return (
    <PageShell className="max-w-3xl">
      <PageHeader
        variant="surface"
        title="Tu tienda online"
        description="Configurá el nombre, el link público y los medios de pago. Los productos salen del catálogo del ERP."
        badge={
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-medium text-primary">
            <ShoppingBag className="h-3.5 w-3.5" />
            Claver Tienda
          </span>
        }
        statusSlot={
          config.activa ? (
            <StatusBadge variant="success" label="Publicada" />
          ) : (
            <StatusBadge variant="warning" label="Borrador" />
          )
        }
        actions={
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={() => void cargar()} className="min-h-[40px]">
              <RefreshCw className="h-4 w-4 mr-2" />
              Actualizar
            </Button>
            {publicUrl && (
              <Button variant="outline" size="sm" asChild className="min-h-[40px]">
                <Link href={publicUrl} target="_blank" rel="noreferrer">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Ver tienda
                </Link>
              </Button>
            )}
            <Button size="sm" onClick={() => void guardar()} disabled={saving} className="min-h-[40px]">
              <Save className="h-4 w-4 mr-2" />
              {saving ? "Guardando…" : "Guardar"}
            </Button>
          </div>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Identidad</CardTitle>
          <CardDescription>Slug y nombre visibles en el link público.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nombreTienda">Nombre de la tienda</Label>
            <Input
              id="nombreTienda"
              className="min-h-[40px]"
              value={config.nombreTienda ?? ""}
              onChange={(e) => setConfig({ ...config, nombreTienda: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="slug">Slug del link</Label>
            <Input
              id="slug"
              className="min-h-[40px] font-mono"
              value={config.slug ?? ""}
              onChange={(e) =>
                setConfig({
                  ...config,
                  slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""),
                })
              }
            />
            {publicUrl && (
              <p className="text-xs text-muted-foreground">
                URL pública: <code className="text-foreground">{publicUrl}</code>
              </p>
            )}
          </div>
          <div className="flex items-center justify-between rounded-lg border px-3 py-2">
            <div>
              <p className="text-sm font-medium">Tienda activa</p>
              <p className="text-xs text-muted-foreground">Si está apagada, el link no vende.</p>
            </div>
            <Switch
              checked={Boolean(config.activa)}
              onCheckedChange={(v) => setConfig({ ...config, activa: v })}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Medios de pago</CardTitle>
          <CardDescription>Cómo cobra el cliente en el checkout.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {(
            [
              ["mercadopago", "Mercado Pago"],
              ["transferencia", "Transferencia"],
              ["confirmarSinPago", "Confirmar sin pago (reservar)"],
            ] as const
          ).map(([key, label]) => (
            <div key={key} className="flex items-center justify-between rounded-lg border px-3 py-2">
              <span className="text-sm">{label}</span>
              <Switch
                checked={Boolean(config.mediosPago?.[key])}
                onCheckedChange={(v) =>
                  setConfig({
                    ...config,
                    mediosPago: { ...config.mediosPago, [key]: v },
                  })
                }
              />
            </div>
          ))}
          {config.mediosPago?.transferencia && (
            <div className="grid gap-3 sm:grid-cols-3 pt-2">
              <div className="space-y-1">
                <Label>CBU / CVU</Label>
                <Input
                  className="min-h-[40px]"
                  value={config.transferenciaCbu ?? ""}
                  onChange={(e) => setConfig({ ...config, transferenciaCbu: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <Label>Alias</Label>
                <Input
                  className="min-h-[40px]"
                  value={config.transferenciaAlias ?? ""}
                  onChange={(e) => setConfig({ ...config, transferenciaAlias: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <Label>Titular</Label>
                <Input
                  className="min-h-[40px]"
                  value={config.transferenciaTitular ?? ""}
                  onChange={(e) => setConfig({ ...config, transferenciaTitular: e.target.value })}
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Textos</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1">
            <Label>Envío / retiro</Label>
            <Input
              className="min-h-[40px]"
              value={config.textoEnvio ?? ""}
              onChange={(e) => setConfig({ ...config, textoEnvio: e.target.value })}
              placeholder="Retiro en local · Envío a coordinar"
            />
          </div>
          <div className="space-y-1">
            <Label>Footer</Label>
            <Input
              className="min-h-[40px]"
              value={config.textoFooter ?? ""}
              onChange={(e) => setConfig({ ...config, textoFooter: e.target.value })}
              placeholder="Gracias por tu compra"
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-2">
        <Button asChild variant="outline" className="min-h-[40px]">
          <Link href="/dashboard/productos">Gestionar productos</Link>
        </Button>
        <Button onClick={() => void guardar()} disabled={saving} className="min-h-[40px]">
          {saving ? "Guardando…" : "Guardar cambios"}
        </Button>
      </div>
    </PageShell>
  )
}
