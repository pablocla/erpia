"use client"

import { useState, useEffect } from "react"
import { Topbar } from "@/components/topbar"
import { MotionPage } from "@/components/ui/motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Tv, Sliders, Play, Pause, RefreshCw, Eye, EyeOff, Save } from "lucide-react"

interface CarteleraItem {
  id: number
  nombre: string
  precio: number
  categoria: string
  disponible: boolean
  imagenUrl: string
}

const INITIAL_ITEMS: CarteleraItem[] = [
  { id: 1, nombre: "Asado de Tira Premium (kg)", precio: 12500, categoria: "Carnes", disponible: true, imagenUrl: "https://images.unsplash.com/photo-1544025162-d76694265947?w=300" },
  { id: 2, nombre: "Vacio de Ternera (kg)", precio: 14900, categoria: "Carnes", disponible: true, imagenUrl: "https://images.unsplash.com/photo-1558030006-450675393462?w=300" },
  { id: 3, nombre: "Chorizo Artesanal (unidad)", precio: 2200, categoria: "Embutidos", disponible: true, imagenUrl: "https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?w=300" },
  { id: 4, nombre: "Morcilla Bombón (unidad)", precio: 1800, categoria: "Embutidos", disponible: false, imagenUrl: "https://images.unsplash.com/photo-1529692236671-f1f6e994a529?w=300" },
  { id: 5, nombre: "Carbón Vegetal Bolsa Grande", precio: 3500, categoria: "Accesorios", disponible: true, imagenUrl: "https://images.unsplash.com/photo-1596450514966-2f68dd3b1f1c?w=300" }
]

export default function CarteleraDigitalPage() {
  const [items, setItems] = useState<CarteleraItem[]>([])
  const [viewModeOnly, setViewModeOnly] = useState(false) // Ocultar barra de administración (para TV)
  const [selectedItem, setSelectedItem] = useState<CarteleraItem | null>(null)
  
  // Editor temp states
  const [editNombre, setEditNombre] = useState("")
  const [editPrecio, setEditPrecio] = useState(0)
  const [editDisponible, setEditDisponible] = useState(true)

  useEffect(() => {
    const saved = localStorage.getItem("claver:cartelera")
    if (saved) {
      setItems(JSON.parse(saved))
    } else {
      setItems(INITIAL_ITEMS)
      localStorage.setItem("claver:cartelera", JSON.stringify(INITIAL_ITEMS))
    }
  }, [])

  const saveToStorage = (newItems: CarteleraItem[]) => {
    setItems(newItems)
    localStorage.setItem("claver:cartelera", JSON.stringify(newItems))
  }

  const handleSelectItem = (item: CarteleraItem) => {
    setSelectedItem(item)
    setEditNombre(item.nombre)
    setEditPrecio(item.precio)
    setEditDisponible(item.disponible)
  }

  const handleSaveChanges = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedItem) return

    const actualizados = items.map(it => {
      if (it.id === selectedItem.id) {
        return {
          ...it,
          nombre: editNombre,
          precio: editPrecio,
          disponible: editDisponible
        }
      }
      return it
    })

    saveToStorage(actualizados)
    setSelectedItem(null)
  }

  return (
    <MotionPage className="flex h-full flex-col bg-slate-950 text-white">
      {!viewModeOnly && <Topbar />}
      
      {/* Panel Superior de Controles de Pantalla (se oculta en modo TV) */}
      {!viewModeOnly && (
        <div className="bg-slate-900 border-b border-slate-800 px-6 py-4 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
              <Tv className="h-5 w-5 text-blue-500" /> Cartelera de Precios Digital
            </h2>
            <p className="text-xs text-slate-400">Diseñada para Smart TV y monitores comerciales en locales.</p>
          </div>
          <Button 
            onClick={() => setViewModeOnly(true)} 
            className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 h-9 shadow-md"
          >
            <EyeOff className="h-3.5 w-3.5 mr-1" /> Modo Smart TV (Pantalla Completa)
          </Button>
        </div>
      )}

      {/* Grid Principal */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
        
        {/* Lado Izquierdo: Editor de Precios en Vivo (se oculta en modo TV) */}
        {!viewModeOnly && (
          <div className="lg:col-span-4 border-r border-slate-800 bg-slate-900/40 p-6 overflow-y-auto space-y-6">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <Sliders className="h-4 w-4" /> Gestor del Panel
            </h2>

            {/* Listado rápido de items para editar */}
            <div className="space-y-2">
              <p className="text-xs text-slate-400">Seleccioná un producto para actualizar su precio al instante en el televisor:</p>
              <div className="space-y-1.5">
                {items.map(it => (
                  <button 
                    key={it.id}
                    onClick={() => handleSelectItem(it)}
                    className={`w-full text-left p-3 rounded-lg border text-sm font-medium transition-all flex justify-between items-center ${
                      selectedItem?.id === it.id 
                        ? "bg-blue-600 border-blue-500 text-white shadow-lg" 
                        : "bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700"
                    }`}
                  >
                    <span className="truncate max-w-[180px]">{it.nombre}</span>
                    <span className="font-bold">${it.precio.toLocaleString("es-AR")}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Formulario de Modificación */}
            {selectedItem && (
              <Card className="border-slate-800 bg-slate-900 text-white shadow-xl">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-bold text-blue-400">Editar en Pantalla</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSaveChanges} className="space-y-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="editNombre" className="text-xs text-slate-400">Nombre en Cartelera</Label>
                      <Input 
                        id="editNombre" 
                        value={editNombre} 
                        onChange={e => setEditNombre(e.target.value)}
                        className="bg-slate-950 border-slate-800 text-white text-xs h-9 focus:ring-blue-600"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="editPrecio" className="text-xs text-slate-400">Precio en Pesos ($)</Label>
                      <Input 
                        id="editPrecio" 
                        type="number"
                        value={editPrecio} 
                        onChange={e => setEditPrecio(Number(e.target.value))}
                        className="bg-slate-950 border-slate-800 text-white text-xs h-9"
                      />
                    </div>
                    <div className="flex items-center justify-between pt-2">
                      <Label htmlFor="editDisp" className="text-xs text-slate-400">Stock / Disponibilidad</Label>
                      <select 
                        id="editDisp" 
                        value={editDisponible ? "true" : "false"}
                        onChange={e => setEditDisponible(e.target.value === "true")}
                        className="h-8 border border-slate-800 bg-slate-950 text-white text-xs rounded-md px-2 focus:ring-blue-600"
                      >
                        <option value="true">Disponible (Mostrar Precio)</option>
                        <option value="false">Agotado (Mostrar Alerta)</option>
                      </select>
                    </div>

                    <div className="flex gap-2 pt-2">
                      <Button 
                        type="button" 
                        variant="ghost" 
                        className="flex-1 text-xs border border-slate-800 text-slate-400 hover:bg-slate-800/50"
                        onClick={() => setSelectedItem(null)}
                      >
                        Cancelar
                      </Button>
                      <Button 
                        type="submit" 
                        className="flex-1 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                      >
                        <Save className="h-3.5 w-3.5 mr-1" /> Guardar
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Lado Derecho: Simulación Pantalla Smart TV / Menú Board Gigante */}
        <div className={`p-8 bg-slate-950 flex flex-col justify-between overflow-y-auto ${viewModeOnly ? "lg:col-span-12 h-screen" : "lg:col-span-8"}`}>
          
          {/* Botón flotante para salir del modo TV */}
          {viewModeOnly && (
            <button 
              onClick={() => setViewModeOnly(false)}
              className="fixed top-6 right-6 z-50 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 p-2.5 rounded-full shadow-lg flex items-center gap-1.5 text-xs font-bold"
            >
              <Eye className="h-4 w-4" /> Salir de Smart TV
            </button>
          )}

          {/* Cartelera Layout - Diseño Negro y Oro Elegante */}
          <div className="flex-1 max-w-4xl mx-auto w-full flex flex-col justify-center py-6">
            
            {/* Header del Comercio */}
            <div className="text-center mb-10 border-b border-double border-amber-550/40 pb-6">
              <h1 className="text-4xl font-serif font-black tracking-widest text-amber-400 uppercase">CORTES SELECCIONADOS CLAVER</h1>
              <p className="text-xs text-slate-400 tracking-widest font-sans uppercase mt-1">Precios Actualizados al Instante • Venta Directa</p>
            </div>

            {/* Listado de Precios */}
            <div className="space-y-6">
              {items.map(it => (
                <div 
                  key={it.id} 
                  className={`flex justify-between items-end border-b border-dashed border-slate-800 pb-3 transition-all duration-500 ${
                    !it.disponible ? "opacity-40" : ""
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="text-left">
                      <span className="text-xs font-sans text-amber-500/80 font-bold uppercase tracking-wider block">{it.categoria}</span>
                      <h3 className="text-xl font-serif font-bold text-slate-100">{it.nombre}</h3>
                    </div>
                  </div>

                  {/* Precio / Agotado */}
                  <div className="text-right pl-4">
                    {it.disponible ? (
                      <span className="text-3xl font-mono font-black text-amber-400 tracking-tight">
                        ${it.precio.toLocaleString("es-AR")}
                      </span>
                    ) : (
                      <Badge className="bg-rose-950 text-rose-350 border border-rose-800 font-sans tracking-wide text-xs">
                        SIN STOCK / REPOSITORIO
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Pie de pantalla publicitario o informativo */}
            <div className="mt-12 text-center text-[10px] text-slate-500 font-mono tracking-widest">
              SISTEMA DE PANTALLA ADAPTADO POR GRUPO CLAVER • TERMINAL CONECTADA DIRECTA AL CONTROL DE INVENTARIO
            </div>
          </div>
        </div>

      </div>
    </MotionPage>
  )
}
