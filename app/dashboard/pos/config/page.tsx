"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useToast } from "@/hooks/use-toast"
import {
  ArrowLeft,
  Save,
  Search,
  Trash2,
  Settings,
  Plus,
  RefreshCw,
} from "lucide-react"

interface Producto {
  id: number
  nombre: string
  codigo: string
  precioVenta: number
  stock: number
}

interface PosPluSlot {
  productoId: number
  nombre: string
  color: string
  etiqueta: string | null
  orden: number
  codigo: string
  precioVenta: number
}

const PLU_COLORS = [
  "bg-blue-500",
  "bg-emerald-500",
  "bg-amber-500",
  "bg-violet-500",
  "bg-rose-500",
  "bg-cyan-500",
  "bg-orange-500",
  "bg-teal-500",
]

const COLOR_NAMES: Record<string, string> = {
  "bg-blue-500": "Azul",
  "bg-emerald-500": "Verde",
  "bg-amber-500": "Amarillo",
  "bg-violet-500": "Violeta",
  "bg-rose-500": "Rosa",
  "bg-cyan-500": "Celeste",
  "bg-orange-500": "Naranja",
  "bg-teal-500": "Teal",
}

export default function PosConfigPage() {
  const router = useRouter()
  const { toast } = useToast()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")

  const [productos, setProductos] = useState<Producto[]>([])
  const [slots, setSlots] = useState<(PosPluSlot | null)[]>(Array(24).fill(null))
  const [selectedProduct, setSelectedProduct] = useState<Producto | null>(null)
  const [activeEditingIndex, setActiveEditingIndex] = useState<number | null>(null)

  const authHeaders = useCallback((): HeadersInit => {
    const t = typeof window !== "undefined" ? localStorage.getItem("token") : ""
    return t ? { Authorization: `Bearer ${t}` } : {}
  }, [])

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      // 1. Load active products
      const resProd = await fetch("/api/productos?soloActivos=true", { headers: authHeaders() })
      if (!resProd.ok) throw new Error("Error al cargar productos")
      const productsData = await resProd.json()
      setProductos(Array.isArray(productsData) ? productsData : [])

      // 2. Load configured PLUs
      const resPlu = await fetch("/api/pos/plu", { headers: authHeaders() })
      if (!resPlu.ok) throw new Error("Error al cargar PLU")
      const pluData = await resPlu.json()
      
      const newSlots = Array(24).fill(null)
      if (pluData.items && Array.isArray(pluData.items)) {
        pluData.items.forEach((item: any) => {
          if (item.orden >= 0 && item.orden < 24) {
            newSlots[item.orden] = {
              productoId: item.productoId,
              nombre: item.nombre,
              color: item.color || "bg-blue-500",
              etiqueta: item.etiqueta || null,
              orden: item.orden,
              codigo: item.codigo || "",
              precioVenta: item.precioVenta || 0,
            }
          }
        })
      }
      setSlots(newSlots)
    } catch (e: any) {
      toast({
        variant: "destructive",
        title: "Error al cargar datos",
        description: e.message || "Por favor, reintentá.",
      })
    } finally {
      setLoading(false)
    }
  }, [authHeaders, toast])

  useEffect(() => {
    loadData()
  }, [loadData])

  const selectSlot = (index: number) => {
    if (selectedProduct) {
      // Assign selected product to this slot
      const nextSlots = [...slots]
      nextSlots[index] = {
        productoId: selectedProduct.id,
        nombre: selectedProduct.nombre,
        color: PLU_COLORS[index % PLU_COLORS.length],
        etiqueta: null,
        orden: index,
        codigo: selectedProduct.codigo,
        precioVenta: selectedProduct.precioVenta,
      }
      setSlots(nextSlots)
      setSelectedProduct(null)
      toast({
        title: "Asignado",
        description: `Producto asignado al botón #${index + 1}`,
      })
    } else {
      // Edit slot options
      if (slots[index]) {
        setActiveEditingIndex(index)
      }
    }
  }

  const clearSlot = (index: number) => {
    const nextSlots = [...slots]
    nextSlots[index] = null
    setSlots(nextSlots)
    if (activeEditingIndex === index) {
      setActiveEditingIndex(null)
    }
    toast({
      title: "Limpiado",
      description: `Botón #${index + 1} liberado`,
    })
  }

  const updateSlotColor = (index: number, color: string) => {
    const nextSlots = [...slots]
    const slot = nextSlots[index]
    if (slot) {
      slot.color = color
      setSlots(nextSlots)
    }
  }

  const updateSlotEtiqueta = (index: number, label: string) => {
    const nextSlots = [...slots]
    const slot = nextSlots[index]
    if (slot) {
      slot.etiqueta = label || null
      setSlots(nextSlots)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    const items = slots
      .filter((s): s is PosPluSlot => s !== null)
      .map((s, idx) => ({
        productoId: s.productoId,
        orden: s.orden,
        color: s.color,
        etiqueta: s.etiqueta,
      }))

    try {
      const res = await fetch("/api/pos/plu", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...authHeaders(),
        },
        body: JSON.stringify({ items }),
      })

      if (!res.ok) {
        const json = await res.json()
        throw new Error(json.error || "No se pudo guardar la configuración")
      }

      toast({
        title: "¡Configuración Guardada!",
        description: "El panel de acceso rápido del POS fue actualizado.",
      })
      router.push("/dashboard/pos")
    } catch (e: any) {
      toast({
        variant: "destructive",
        title: "Error al guardar",
        description: e.message || "Por favor, reintentá.",
      })
    } finally {
      setSaving(false)
    }
  }

  const filteredProducts = productos.filter(
    (p) =>
      p.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.codigo.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-muted-foreground">
        <RefreshCw className="h-8 w-8 animate-spin mb-2 text-primary" />
        <p className="text-sm">Cargando grilla rápida PLU...</p>
      </div>
    )
  }

  return (
    <div className="space-y-4 max-w-6xl mx-auto p-2">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => router.push("/dashboard/pos")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-xl font-bold flex items-center gap-2">
              <Settings className="h-5 w-5 text-primary animate-spin-slow" />
              Configurar Botones Rápidos (PLU)
            </h1>
            <p className="text-xs text-muted-foreground">
              Personalizá los 24 botones de acceso rápido de tu Punto de Venta.
            </p>
          </div>
        </div>
        <Button onClick={handleSave} disabled={saving} className="bg-primary hover:bg-primary/95 text-primary-foreground font-semibold">
          {saving ? <RefreshCw className="h-4 w-4 mr-1.5 animate-spin" /> : <Save className="h-4 w-4 mr-1.5" />}
          Guardar Configuración
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        {/* Left column: Products catalog */}
        <Card className="md:col-span-4 border-primary/10 shadow-md">
          <CardHeader className="p-3 border-b">
            <CardTitle className="text-sm font-bold">1. Elegí un producto</CardTitle>
            <CardDescription className="text-xs">
              Hacé clic en un producto de la lista, luego elegí un botón de la grilla para asignarlo.
            </CardDescription>
            <div className="relative mt-2">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre o SKU..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-9 pl-8 text-xs"
              />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[400px]">
              <div className="p-2 space-y-1">
                {filteredProducts.map((p) => {
                  const isSelected = selectedProduct?.id === p.id
                  return (
                    <button
                      key={p.id}
                      onClick={() => setSelectedProduct(isSelected ? null : p)}
                      className={`w-full text-left p-2 rounded-lg text-xs transition-all border flex flex-col ${
                        isSelected
                          ? "bg-primary/10 border-primary text-primary font-semibold"
                          : "hover:bg-muted border-transparent"
                      }`}
                    >
                      <div className="flex justify-between w-full">
                        <span className="font-bold truncate max-w-[180px]">{p.nombre}</span>
                        <span className="font-semibold text-muted-foreground">${p.precioVenta.toFixed(2)}</span>
                      </div>
                      <span className="text-[10px] text-muted-foreground mt-0.5">SKU: {p.codigo}</span>
                    </button>
                  )
                })}
                {filteredProducts.length === 0 && (
                  <p className="text-xs text-muted-foreground text-center py-8">
                    No se encontraron productos activos.
                  </p>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Right column: 24 PLU Grid */}
        <Card className="md:col-span-8 border-primary/10 shadow-md">
          <CardHeader className="p-3 border-b flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-sm font-bold">2. Grilla de Acceso Rápido (24 botones)</CardTitle>
              <CardDescription className="text-xs">
                Asigná, reordená o cambiá el color y etiqueta de los accesos.
              </CardDescription>
            </div>
            {selectedProduct && (
              <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 animate-pulse border-amber-200">
                Ubicando: {selectedProduct.nombre}
              </Badge>
            )}
          </CardHeader>
          <CardContent className="p-4">
            <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-2">
              {slots.map((slot, index) => {
                const isAssigned = slot !== null
                return (
                  <div
                    key={index}
                    onClick={() => selectSlot(index)}
                    className={`h-20 rounded-xl border flex flex-col justify-between p-2 cursor-pointer transition-all ${
                      isAssigned
                        ? `${slot.color} text-white font-semibold shadow-xs hover:opacity-90`
                        : "border-dashed border-muted hover:border-primary/40 hover:bg-primary/5 flex items-center justify-center text-muted-foreground"
                    }`}
                  >
                    {isAssigned ? (
                      <>
                        <div className="flex justify-between items-start w-full">
                          <span className="text-[9px] bg-black/20 text-white/95 px-1 py-0.2 rounded font-mono">
                            {index + 1}
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              clearSlot(index)
                            }}
                            className="p-0.5 hover:bg-white/20 rounded text-white"
                            title="Remover"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                        <p className="text-[10px] text-left leading-tight line-clamp-2 w-full">
                          {slot.etiqueta ?? slot.nombre}
                        </p>
                        <p className="text-[10px] text-right font-bold w-full">
                          ${slot.precioVenta.toFixed(0)}
                        </p>
                      </>
                    ) : (
                      <span className="text-xs flex flex-col items-center gap-1">
                        <Plus className="h-4 w-4" />
                        Slot {index + 1}
                      </span>
                    )}
                  </div>
                )
              })}
            </div>

            {/* Editing Drawer Panel */}
            {activeEditingIndex !== null && slots[activeEditingIndex] && (
              <div className="mt-4 p-4 border rounded-xl bg-muted/20 space-y-3 animate-in fade-in slide-in-from-bottom-2">
                <div className="flex justify-between items-center pb-2 border-b">
                  <h3 className="text-sm font-bold">
                    Editar Botón #{activeEditingIndex + 1}: {slots[activeEditingIndex]?.nombre}
                  </h3>
                  <Button variant="ghost" size="sm" onClick={() => setActiveEditingIndex(null)}>
                    Cerrar
                  </Button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Etiqueta personalizada (máx. 24 caracteres)</Label>
                    <Input
                      maxLength={24}
                      value={slots[activeEditingIndex]?.etiqueta ?? ""}
                      onChange={(e) => updateSlotEtiqueta(activeEditingIndex, e.target.value)}
                      placeholder={slots[activeEditingIndex]?.nombre}
                      className="h-9 text-xs"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Color del botón</Label>
                    <div className="flex flex-wrap gap-1.5">
                      {PLU_COLORS.map((color) => (
                        <button
                          key={color}
                          onClick={() => updateSlotColor(activeEditingIndex, color)}
                          className={`w-6 h-6 rounded-full border ${color} transition-all ${
                            slots[activeEditingIndex]?.color === color ? "ring-2 ring-primary ring-offset-2 scale-110" : ""
                          }`}
                          title={COLOR_NAMES[color]}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
