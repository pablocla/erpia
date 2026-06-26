"use client"

import { useState } from "react"
import { useProductEntitlements } from "@/hooks/use-product-entitlements"
import { getAuthHeaders } from "@/lib/stores/auth-store"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { Package, RefreshCw } from "lucide-react"

export function ProductControlPanel() {
  const { productos, packs, isLoading, refresh } = useProductEntitlements()
  const { toast } = useToast()
  const [busy, setBusy] = useState<string | null>(null)

  async function toggleSku(sku: string, activo: boolean) {
    setBusy(sku)
    try {
      const res = await fetch("/api/platform/productos", {
        method: "PATCH",
        headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify({ tipo: "sku", sku, activo }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? "Error")
      await refresh()
      window.dispatchEvent(new Event("productos-updated"))
      toast({
        title: activo ? "Producto activado" : "Producto desactivado",
        description: sku,
      })
    } catch (e) {
      toast({
        variant: "destructive",
        title: "No se pudo cambiar",
        description: e instanceof Error ? e.message : "Error",
      })
    } finally {
      setBusy(null)
    }
  }

  async function togglePack(packId: string, activo: boolean) {
    setBusy(packId)
    try {
      const res = await fetch("/api/platform/productos", {
        method: "PATCH",
        headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify({ tipo: "pack", packId, activo }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? "Error")
      await refresh()
      window.dispatchEvent(new Event("productos-updated"))
      toast({ title: activo ? "Pack activado" : "Pack desactivado", description: packId })
    } catch (e) {
      toast({
        variant: "destructive",
        title: "Pack",
        description: e instanceof Error ? e.message : "Error",
      })
    } finally {
      setBusy(null)
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground text-sm">Cargando productos…</CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Package className="h-5 w-5" />
            Productos horizontales
          </h2>
          <p className="text-sm text-muted-foreground">
            Activá o desactivá todo el producto: POS, fiado, cobranzas y nav se sincronizan solos.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => void refresh()}>
          <RefreshCw className="h-4 w-4 mr-1" />
          Actualizar
        </Button>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {packs.map((pack) => (
          <Card key={pack.id} className="border-primary/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center justify-between gap-2">
                <span>{pack.nombre}</span>
                <Switch
                  checked={pack.todoActivo}
                  disabled={busy === pack.id}
                  onCheckedChange={(v) => void togglePack(pack.id, v)}
                />
              </CardTitle>
              <p className="text-xs text-muted-foreground">{pack.lema}</p>
            </CardHeader>
            <CardContent className="text-[11px] text-muted-foreground">{pack.skus.join(" + ")}</CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardContent className="divide-y p-0">
          {productos.map((p) => (
            <div key={p.sku} className="flex items-center gap-3 px-4 py-3">
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm">{p.nombre}</p>
                <p className="text-xs text-muted-foreground truncate">{p.lema}</p>
                {!p.dependenciasOk && p.dependeDe.length > 0 && (
                  <p className="text-[10px] text-amber-600 mt-0.5">
                    Requiere: {p.dependeDe.join(", ")}
                  </p>
                )}
              </div>
              <Badge variant="outline" className="text-[10px] shrink-0">
                {p.tier}
              </Badge>
              <Switch
                checked={p.activo}
                disabled={busy === p.sku || (!p.activo && !p.dependenciasOk)}
                onCheckedChange={(v) => void toggleSku(p.sku, v)}
              />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}