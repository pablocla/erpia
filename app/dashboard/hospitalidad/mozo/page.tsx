"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import {
  UtensilsCrossed,
  Send,
  Plus,
  Minus,
  Trash2,
  CheckCircle2,
  Coffee,
  Beer,
  Pizza,
  Cake,
  ArrowLeft,
  Sparkles,
} from "lucide-react"
import Link from "next/link"

interface ItemPedido {
  nombre: string
  precio: number
  cantidad: number
  categoria: string
}

const CATEGORIAS_RAPIDAS = [
  { id: "bebidas", nombre: "Bebidas", icon: Beer },
  { id: "platos", nombre: "Platos", icon: Pizza },
  { id: "cafeteria", nombre: "Cafetería", icon: Coffee },
  { id: "postres", nombre: "Postres", icon: Cake },
]

const MENU_DEMO: Record<string, { nombre: string; precio: number }[]> = {
  bebidas: [
    { nombre: "Gaseosa 500ml", precio: 1500 },
    { nombre: "Agua Mineral 500ml", precio: 1200 },
    { nombre: "Cerveza Tirada Pint", precio: 2800 },
    { nombre: "Vino Malbec Copa", precio: 3200 },
  ],
  platos: [
    { nombre: "Milanesa Napolitana con Fritas", precio: 8500 },
    { nombre: "Hamburguesa Completa Claver", precio: 7200 },
    { nombre: "Pizza Muzzarella Ocho Porciones", precio: 6800 },
    { nombre: "Empanada de Carne Cuchillo", precio: 1200 },
  ],
  cafeteria: [
    { nombre: "Café Doble Espresso", precio: 1800 },
    { nombre: "Capuchino Italiano", precio: 2200 },
    { nombre: "Medialuna de Manteca", precio: 800 },
  ],
  postres: [
    { nombre: "Flan Casero con Mixto", precio: 2500 },
    { nombre: "Volcán de Chocolate", precio: 3500 },
  ],
}

export default function MozoMobilePage() {
  const { toast } = useToast()
  const [mesaSeleccionada, setMesaSeleccionada] = useState<string>("1")
  const [categoriaActiva, setCategoriaActiva] = useState<string>("bebidas")
  const [comanda, setComanda] = useState<ItemPedido[]>([])
  const [enviando, setEnviando] = useState(false)

  const agregarItem = (nombre: string, precio: number, categoria: string) => {
    setComanda((prev) => {
      const idx = prev.findIndex((i) => i.nombre === nombre)
      if (idx >= 0) {
        const next = [...prev]
        next[idx].cantidad += 1
        return next
      }
      return [...prev, { nombre, precio, cantidad: 1, categoria }]
    })
  }

  const modificarCantidad = (nombre: string, delta: number) => {
    setComanda((prev) =>
      prev
        .map((i) => {
          if (i.nombre === nombre) {
            const nextCant = i.cantidad + delta
            return nextCant > 0 ? { ...i, cantidad: nextCant } : null
          }
          return i
        })
        .filter(Boolean) as ItemPedido[],
    )
  }

  const totalComanda = comanda.reduce((acc, i) => acc + i.precio * i.cantidad, 0)
  const totalItems = comanda.reduce((acc, i) => acc + i.cantidad, 0)

  const enviarACocina = async () => {
    if (comanda.length === 0) return
    setEnviando(true)
    try {
      const res = await fetch("/api/hospitalidad/comandas/ruteo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mesaNumero: mesaSeleccionada,
          items: comanda,
        }),
      })

      if (res.ok) {
        toast({
          title: "¡Comanda enviada!",
          description: `Mesa #${mesaSeleccionada}: ${totalItems} ítems enviados a cocina y barra`,
        })
        setComanda([])
      } else {
        toast({ variant: "destructive", title: "Error", description: "No se pudo enviar la comanda" })
      }
    } catch {
      toast({ variant: "destructive", title: "Error de red", description: "Verificá la conexión" })
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className="max-w-md mx-auto min-h-screen bg-background pb-20 space-y-4">
      {/* Header Mozo */}
      <div className="sticky top-0 z-30 bg-background/95 backdrop-blur border-b p-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button asChild variant="ghost" size="icon" className="h-9 w-9">
            <Link href="/dashboard/hospitalidad">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="text-base font-bold">Tomapedidos Mozo</h1>
              <Badge variant="outline" className="text-[10px] bg-primary/10 text-primary border-primary/20">
                PWA Touch
              </Badge>
            </div>
            <p className="text-[11px] text-muted-foreground">Mesa activa: #{mesaSeleccionada}</p>
          </div>
        </div>

        {/* Selección de Mesa */}
        <div className="flex items-center gap-1">
          <span className="text-xs font-semibold text-muted-foreground">Mesa:</span>
          <Input
            type="number"
            value={mesaSeleccionada}
            onChange={(e) => setMesaSeleccionada(e.target.value)}
            className="w-16 h-9 text-center font-bold text-base"
          />
        </div>
      </div>

      {/* Pestañas Táctiles de Categorías */}
      <div className="grid grid-cols-4 gap-1.5 px-3">
        {CATEGORIAS_RAPIDAS.map((cat) => {
          const CatIcon = cat.icon
          const isActive = categoriaActiva === cat.id
          return (
            <button
              key={cat.id}
              onClick={() => setCategoriaActiva(cat.id)}
              className={`flex flex-col items-center justify-center p-2.5 rounded-xl border transition-all touch-manipulation min-h-[56px] ${
                isActive
                  ? "bg-primary text-primary-foreground border-primary shadow-sm"
                  : "bg-card hover:bg-muted text-muted-foreground"
              }`}
            >
              <CatIcon className="h-5 w-5 mb-0.5" />
              <span className="text-[11px] font-semibold">{cat.nombre}</span>
            </button>
          )
        })}
      </div>

      {/* Grilla de Platos Táctiles (48px+ touch targets) */}
      <div className="px-3 space-y-2">
        <div className="grid grid-cols-1 gap-2">
          {MENU_DEMO[categoriaActiva]?.map((item) => (
            <button
              key={item.nombre}
              onClick={() => agregarItem(item.nombre, item.precio, categoriaActiva)}
              className="flex items-center justify-between p-3.5 bg-card border rounded-xl hover:border-primary/50 active:scale-[0.98] transition-all touch-manipulation min-h-[56px] text-left"
            >
              <span className="font-semibold text-sm">{item.nombre}</span>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-primary">
                  ${item.precio.toLocaleString("es-AR")}
                </span>
                <div className="h-7 w-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                  <Plus className="h-4 w-4" />
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Resumen de Comanda Actual */}
      {comanda.length > 0 && (
        <Card className="mx-3 border-primary/30 shadow-md">
          <CardHeader className="py-2.5 border-b bg-primary/5">
            <CardTitle className="text-xs font-bold flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <UtensilsCrossed className="h-4 w-4 text-primary" />
                Comanda Mesa #{mesaSeleccionada}
              </span>
              <Badge variant="secondary" className="text-[10px]">
                {totalItems} ítems
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="py-3 space-y-2 max-h-48 overflow-y-auto">
            {comanda.map((item) => (
              <div key={item.nombre} className="flex items-center justify-between text-xs">
                <span className="font-medium truncate max-w-[180px]">{item.nombre}</span>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1 bg-muted rounded-lg p-0.5">
                    <button
                      onClick={() => modificarCantidad(item.nombre, -1)}
                      className="h-6 w-6 rounded bg-background flex items-center justify-center font-bold"
                    >
                      -
                    </button>
                    <span className="w-5 text-center font-semibold text-xs">{item.cantidad}</span>
                    <button
                      onClick={() => modificarCantidad(item.nombre, 1)}
                      className="h-6 w-6 rounded bg-background flex items-center justify-center font-bold"
                    >
                      +
                    </button>
                  </div>
                  <span className="font-bold w-16 text-right">
                    ${(item.precio * item.cantidad).toLocaleString("es-AR")}
                  </span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Barra Inferior Fija para Enviar a Cocina */}
      <div className="fixed bottom-0 inset-x-0 z-40 bg-background/95 backdrop-blur border-t p-3 max-w-md mx-auto">
        <Button
          onClick={enviarACocina}
          disabled={comanda.length === 0 || enviando}
          size="lg"
          className="w-full h-13 rounded-xl font-bold shadow-lg gap-2 text-base"
        >
          <Send className="h-5 w-5" />
          <span>Enviar a Cocina</span>
          {totalComanda > 0 && (
            <span className="ml-auto font-extrabold text-sm opacity-90">
              ${totalComanda.toLocaleString("es-AR")}
            </span>
          )}
        </Button>
      </div>
    </div>
  )
}
