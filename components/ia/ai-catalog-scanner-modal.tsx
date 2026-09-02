"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Sparkles,
  Loader2,
  CheckCircle2,
  PackagePlus,
  ArrowRight,
  AlertCircle,
  FileText,
} from "lucide-react"
import { authFetch } from "@/lib/stores/auth-store"
import { useToast } from "@/hooks/use-toast"

interface ProductoEscaneado {
  codigo?: string
  nombre: string
  categoria?: string
  costo: number
  precioSugerido: number
  margenPorcentaje: number
  stockInicial: number
}

export function AiCatalogScannerModal({
  open,
  onOpenChange,
  onImportSuccess,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onImportSuccess?: () => void
}) {
  const [texto, setTexto] = useState("")
  const [margen, setMargen] = useState("40")
  const [loading, setLoading] = useState(false)
  const [importing, setImporting] = useState(false)
  const [productos, setProductos] = useState<ProductoEscaneado[]>([])
  const [proveedor, setProveedor] = useState("")
  const [sugerencias, setSugerencias] = useState<string[]>([])
  const { toast } = useToast()

  const handleEscanear = async () => {
    if (!texto.trim() || texto.length < 5) {
      toast({
        title: "Texto muy corto",
        description: "Pegá el detalle de tu factura, remito o lista de precios.",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    try {
      const res = await authFetch("/api/ia/scanner-catalogo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          texto,
          margen: parseFloat(margen) || 40,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Error analizando el texto")

      setProductos(data.productos || [])
      setProveedor(data.proveedorDetectado || "Proveedor General")
      setSugerencias(data.sugerenciasIa || [])

      toast({
        title: `¡${data.productos?.length || 0} productos detectados!`,
        description: "Revisá los precios sugeridos antes de guardar.",
      })
    } catch (err) {
      toast({
        title: "Error al escanear",
        description: err instanceof Error ? err.message : "No se pudo procesar.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleImportar = async () => {
    if (productos.length === 0) return

    setImporting(true)
    try {
      const res = await authFetch("/api/ia/scanner-catalogo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "importar",
          productos,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Error al importar")

      toast({
        title: "¡Catálogo actualizado!",
        description: `Se crearon ${data.creados} productos en tu inventario.`,
      })

      onOpenChange(false)
      setTexto("")
      setProductos([])
      if (onImportSuccess) onImportSuccess()
    } catch (err) {
      toast({
        title: "Error importando",
        description: err instanceof Error ? err.message : "Revisá los datos.",
        variant: "destructive",
      })
    } finally {
      setImporting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <div className="flex items-center gap-2 text-primary">
            <Sparkles className="h-5 w-5" />
            <DialogTitle>Carga Inteligente de Catálogo con IA</DialogTitle>
          </div>
          <DialogDescription>
            Pegá el texto de una factura de compra, lista de WhatsApp o remito de distribuidora. La IA armará tu catálogo en segundos.
          </DialogDescription>
        </DialogHeader>

        {productos.length === 0 ? (
          <div className="space-y-4 py-2 flex-1 overflow-y-auto">
            <div className="space-y-1.5">
              <Label>Texto de la factura / lista de precios</Label>
              <Textarea
                placeholder="Ejemplo:
12 Coca Cola 2.25L Retornable $15.600
6 Galletitas Oreo 118g $4.200
24 Alfajor Guaymallen Chocolate $7.200..."
                rows={7}
                value={texto}
                onChange={(e) => setTexto(e.target.value)}
                className="font-mono text-xs"
              />
            </div>

            <div className="flex items-center gap-4">
              <div className="w-1/2 space-y-1.5">
                <Label>Margen de ganancia sugerido (%)</Label>
                <Input
                  type="number"
                  value={margen}
                  onChange={(e) => setMargen(e.target.value)}
                  placeholder="40"
                />
              </div>
              <div className="w-1/2 text-xs text-muted-foreground pt-5">
                Calcula automáticamente el precio de venta sobre el costo.
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-3 py-2 flex-1 overflow-y-auto">
            <div className="flex items-center justify-between">
              <Badge variant="outline" className="text-xs">
                Proveedor: {proveedor}
              </Badge>
              <span className="text-xs font-medium text-emerald-600">
                {productos.length} productos listos para cargar
              </span>
            </div>

            <div className="border rounded-lg max-h-[300px] overflow-y-auto divide-y text-xs">
              {productos.map((p, idx) => (
                <div key={idx} className="p-2.5 flex items-center justify-between gap-2 hover:bg-muted/40">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold truncate">{p.nombre}</p>
                    <p className="text-[11px] text-muted-foreground">
                      Costo: ${p.costo.toLocaleString("es-AR")} | Margen: {p.margenPorcentaje}%
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="font-bold text-emerald-600 block">
                      ${p.precioSugerido.toLocaleString("es-AR")}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      Stock: {p.stockInicial} u.
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {sugerencias.length > 0 && (
              <div className="rounded-md bg-amber-50 dark:bg-amber-950/40 p-2 text-xs text-amber-800 dark:text-amber-300 flex items-start gap-2">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{sugerencias[0]}</span>
              </div>
            )}
          </div>
        )}

        <DialogFooter className="gap-2 sm:gap-0">
          {productos.length === 0 ? (
            <Button
              onClick={handleEscanear}
              disabled={loading || !texto.trim()}
              className="w-full sm:w-auto"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Analizando con IA...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Escanear Productos
                </>
              )}
            </Button>
          ) : (
            <div className="flex w-full items-center justify-between gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setProductos([])}
                disabled={importing}
              >
                Volver a editar
              </Button>
              <Button
                onClick={handleImportar}
                disabled={importing}
                className="bg-emerald-600 hover:bg-emerald-500 text-white"
              >
                {importing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  <>
                    <PackagePlus className="mr-2 h-4 w-4" />
                    Cargar {productos.length} Productos al Inventario
                  </>
                )}
              </Button>
            </div>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
