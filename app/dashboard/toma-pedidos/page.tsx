"use client"

import { useEffect, useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Plus, Minus, Trash2, ChefHat, ShoppingCart, Search, Send
} from "lucide-react"
import { cn } from "@/lib/utils"

// ── Tipos ──────────────────────────────────────────────────────────────────────

interface Producto {
  id: number
  nombre: string
  descripcion: string | null
  precioVenta: number
  categoria: { nombre: string } | null
}

interface Mesa {
  id: number
  numero: number
  estado: string
  salon: { nombre: string }
}

interface ItemCarrito {
  productoId: number
  nombre: string
  precio: number
  cantidad: number
  notas: string
}

// ── Componente principal ───────────────────────────────────────────────────────

export default function TomaPedidosPage() {
  const [productos, setProductos] = useState<Producto[]>([])
  const [mesas, setMesas] = useState<Mesa[]>([])
  const [carrito, setCarrito] = useState<ItemCarrito[]>([])
  const [mesaSeleccionada, setMesaSeleccionada] = useState<Mesa | null>(null)
  const [mozo, setMozo] = useState("")
  const [notaComanda, setNotaComanda] = useState("")
  const [busqueda, setBusqueda] = useState("")
  const [enviando, setEnviando] = useState(false)
  const [mensaje, setMensaje] = useState<{ tipo: "ok" | "error"; texto: string } | null>(null)
  const [notaItem, setNotaItem] = useState<Record<number, string>>({})

  const authHeaders = useCallback((): HeadersInit => {
    const token = localStorage.getItem("token")
    return token ? { Authorization: `Bearer ${token}` } : {}
  }, [])

  useEffect(() => {
    const cargar = async () => {
      const [resPlatos, resHosp] = await Promise.all([
        fetch("/api/hospitalidad/platos", { headers: authHeaders() }),
        fetch("/api/hospitalidad", { headers: authHeaders() }),
      ])
      if (resPlatos.ok) {
        const data = await resPlatos.json()
        // platos viene como array de { producto, receta }
        setProductos(data.map((d: { producto: Producto }) => d.producto))
      }
      if (resHosp.ok) {
        const data = await resHosp.json()
        setMesas(data.mesas ?? [])
      }
    }
    cargar()
  }, [authHeaders])

  // ── Carrito ──────────────────────────────────────────────────────────────────

  const agregarItem = (producto: Producto) => {
    setCarrito((prev) => {
      const existente = prev.find((i) => i.productoId === producto.id)
      if (existente) {
        return prev.map((i) =>
          i.productoId === producto.id ? { ...i, cantidad: i.cantidad + 1 } : i
        )
      }
      return [...prev, { productoId: producto.id, nombre: producto.nombre, precio: producto.precioVenta, cantidad: 1, notas: "" }]
    })
  }

  const cambiarCantidad = (productoId: number, delta: number) => {
    setCarrito((prev) =>
      prev
        .map((i) => (i.productoId === productoId ? { ...i, cantidad: i.cantidad + delta } : i))
        .filter((i) => i.cantidad > 0)
    )
  }

  const quitarItem = (productoId: number) => {
    setCarrito((prev) => prev.filter((i) => i.productoId !== productoId))
  }

  const limpiarPedido = () => {
    setCarrito([])
    setMesaSeleccionada(null)
    setNotaComanda("")
    setMozo("")
    setNotaItem({})
  }

  const total = carrito.reduce((sum, i) => sum + i.precio * i.cantidad, 0)

  // ── Enviar a cocina ──────────────────────────────────────────────────────────

  const enviarACocina = async () => {
    if (!mesaSeleccionada) {
      setMensaje({ tipo: "error", texto: "Seleccioná una mesa antes de enviar" })
      return
    }
    if (carrito.length === 0) {
      setMensaje({ tipo: "error", texto: "El pedido está vacío" })
      return
    }

    setEnviando(true)
    setMensaje(null)

    try {
      const res = await fetch("/api/hospitalidad", {
        method: "POST",
        headers: { ...authHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify({
          mesaId: mesaSeleccionada.id,
          mozo: mozo || undefined,
          notas: notaComanda || undefined,
          lineas: carrito.map((item) => ({
            productoId: item.productoId,
            cantidad: item.cantidad,
            precio: item.precio,
            notas: notaItem[item.productoId] || undefined,
          })),
        }),
      })

      const data = await res.json()
      if (data.success) {
        setMensaje({ tipo: "ok", texto: `Pedido enviado a cocina — Mesa ${mesaSeleccionada.numero}` })
        limpiarPedido()
        // Refrescar mesas
        const resHosp = await fetch("/api/hospitalidad", { headers: authHeaders() })
        if (resHosp.ok) setMesas((await resHosp.json()).mesas ?? [])
      } else {
        setMensaje({ tipo: "error", texto: data.error ?? "Error al enviar el pedido" })
      }
    } catch {
      setMensaje({ tipo: "error", texto: "Error de conexión" })
    } finally {
      setEnviando(false)
    }
  }

  // ── Filtros ──────────────────────────────────────────────────────────────────

  const productosFiltrados = productos.filter((p) =>
    p.nombre.toLowerCase().includes(busqueda.toLowerCase())
  )

  // Agrupar por categoría
  const porCategoria = productosFiltrados.reduce<Record<string, Producto[]>>((acc, p) => {
    const cat = p.categoria?.nombre ?? "Sin categoría"
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(p)
    return acc
  }, {})

  return (
    <div className="flex h-[calc(100vh-80px)] gap-0 overflow-hidden rounded-xl border border-border bg-background">
      {/* ── Panel izquierdo: menú ── */}
      <div className="flex-1 flex flex-col border-r min-w-0">
        {/* Header */}
        <div className="p-4 border-b space-y-3">
          <div className="flex items-center gap-2">
            <ChefHat className="h-5 w-5 text-orange-500" />
            <h1 className="font-bold text-lg">Toma de Pedidos</h1>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar plato..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        {/* Menú */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {Object.entries(porCategoria).map(([cat, items]) => (
            <div key={cat}>
              <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">
                {cat}
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {items.map((p) => {
                  const enCarrito = carrito.find((i) => i.productoId === p.id)
                  return (
                    <button
                      key={p.id}
                      onClick={() => agregarItem(p)}
                      className={cn(
                        "text-left rounded-xl border p-3 transition-all hover:border-primary hover:bg-primary/5 active:scale-[0.97]",
                        enCarrito ? "border-primary bg-primary/5" : "border-border bg-card"
                      )}
                    >
                      <p className="font-semibold text-sm leading-tight">{p.nombre}</p>
                      {p.descripcion && (
                        <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-1">{p.descripcion}</p>
                      )}
                      <p className="text-primary font-bold mt-1 text-sm">
                        ${p.precioVenta.toLocaleString("es-AR")}
                      </p>
                      {enCarrito && (
                        <Badge variant="secondary" className="mt-1 text-[10px]">
                          ×{enCarrito.cantidad} en pedido
                        </Badge>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>
          ))}

          {productosFiltrados.length === 0 && (
            <p className="text-center text-muted-foreground py-12">
              Sin platos que coincidan con &ldquo;{busqueda}&rdquo;
            </p>
          )}
        </div>
      </div>

      {/* ── Panel derecho: pedido ── */}
      <div className="w-80 shrink-0 flex flex-col bg-muted/30">
        {/* Mesa selector */}
        <div className="p-4 border-b space-y-3">
          <div className="flex items-center justify-between">
            <p className="font-semibold text-sm">Mesa</p>
            {mesaSeleccionada && (
              <Badge variant="outline" className="text-xs">{mesaSeleccionada.salon.nombre}</Badge>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {mesas.map((m) => (
              <button
                key={m.id}
                onClick={() => setMesaSeleccionada(m)}
                className={cn(
                  "w-12 h-12 rounded-xl border-2 text-sm font-bold transition-all",
                  mesaSeleccionada?.id === m.id
                    ? "border-primary bg-primary text-primary-foreground"
                    : m.estado === "ocupada"
                    ? "border-orange-300 bg-orange-50 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400"
                    : "border-border bg-background hover:border-primary"
                )}
              >
                {m.numero}
              </button>
            ))}
            {mesas.length === 0 && (
              <p className="text-xs text-muted-foreground">Sin mesas configuradas</p>
            )}
          </div>
          <Input
            placeholder="Mozo / cajero (opcional)"
            value={mozo}
            onChange={(e) => setMozo(e.target.value)}
            className="text-sm"
          />
        </div>

        {/* Carrito */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          <div className="flex items-center gap-2 mb-3">
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            <p className="font-semibold text-sm">Pedido ({carrito.length} ítems)</p>
          </div>

          {carrito.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-8">
              Tocá un plato del menú para agregarlo
            </p>
          )}

          {carrito.map((item) => (
            <div key={item.productoId} className="bg-background rounded-xl border p-3 space-y-2">
              <div className="flex items-start gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold leading-tight">{item.nombre}</p>
                  <p className="text-xs text-muted-foreground">
                    ${(item.precio * item.cantidad).toLocaleString("es-AR")}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => cambiarCantidad(item.productoId, -1)}
                    className="h-6 w-6 rounded-md border flex items-center justify-center hover:bg-muted"
                  >
                    <Minus className="h-3 w-3" />
                  </button>
                  <span className="w-5 text-center text-sm font-bold">{item.cantidad}</span>
                  <button
                    onClick={() => cambiarCantidad(item.productoId, 1)}
                    className="h-6 w-6 rounded-md border flex items-center justify-center hover:bg-muted"
                  >
                    <Plus className="h-3 w-3" />
                  </button>
                  <button
                    onClick={() => quitarItem(item.productoId)}
                    className="h-6 w-6 rounded-md flex items-center justify-center hover:bg-destructive/10 text-destructive ml-1"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              </div>
              <Input
                placeholder="Aclaración (sin sal, sin cebolla...)"
                value={notaItem[item.productoId] ?? ""}
                onChange={(e) =>
                  setNotaItem((prev) => ({ ...prev, [item.productoId]: e.target.value }))
                }
                className="h-7 text-xs"
              />
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="p-4 border-t space-y-3">
          <Input
            placeholder="Nota para cocina (ej: alergias)"
            value={notaComanda}
            onChange={(e) => setNotaComanda(e.target.value)}
            className="text-sm"
          />

          {/* Total */}
          {carrito.length > 0 && (
            <div className="flex items-center justify-between text-sm font-semibold">
              <span className="text-muted-foreground">Total estimado</span>
              <span className="text-lg">${total.toLocaleString("es-AR")}</span>
            </div>
          )}

          {/* Mensaje */}
          {mensaje && (
            <p className={cn(
              "text-xs text-center rounded-lg px-3 py-2 font-medium",
              mensaje.tipo === "ok"
                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
            )}>
              {mensaje.texto}
            </p>
          )}

          <Button
            className="w-full gap-2 font-bold"
            size="lg"
            disabled={enviando || carrito.length === 0 || !mesaSeleccionada}
            onClick={enviarACocina}
          >
            <Send className="h-4 w-4" />
            {enviando ? "Enviando..." : "Enviar a Cocina"}
          </Button>

          {carrito.length > 0 && (
            <Button variant="ghost" size="sm" className="w-full text-muted-foreground" onClick={limpiarPedido}>
              Limpiar pedido
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
