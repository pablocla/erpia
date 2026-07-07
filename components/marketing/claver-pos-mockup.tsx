"use client"

import { useState, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { MarketingBrowserChrome } from "@/components/marketing/marketing-browser-chrome"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { ShoppingCart, Plus, Minus, Trash2, CheckCircle2, Maximize2, X } from "lucide-react"
import { cn } from "@/lib/utils"

const currency = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  maximumFractionDigits: 0,
})

interface MockProduct {
  id: string
  name: string
  price: number
  color: string
}

type PosVariant = "general" | "kiosco" | "bar"

const VARIANT_PRODUCTS: Record<PosVariant, MockProduct[]> = {
  general: [
    { id: "p1", name: "Cerveza IPA Pinta", price: 3500, color: "bg-amber-500" },
    { id: "p2", name: "Hamburguesa Doble", price: 7800, color: "bg-orange-600" },
    { id: "p3", name: "Papas Fritas Cheddar", price: 4200, color: "bg-yellow-500" },
    { id: "p4", name: "Gaseosa Cola 500ml", price: 1500, color: "bg-red-600" },
    { id: "p5", name: "Agua Mineral", price: 1200, color: "bg-blue-400" },
    { id: "p6", name: "Alfajor Chocolate", price: 900, color: "bg-amber-800" },
  ],
  kiosco: [
    { id: "k1", name: "Gaseosa Cola 500ml", price: 1500, color: "bg-red-600" },
    { id: "k2", name: "Alfajor Triple Choco", price: 1200, color: "bg-amber-800" },
    { id: "k3", name: "Papas Fritas Paquete", price: 1800, color: "bg-yellow-500" },
    { id: "k4", name: "Galletitas Surtidas", price: 1100, color: "bg-orange-400" },
    { id: "k5", name: "Cerveza Lata 473ml", price: 1400, color: "bg-amber-500" },
    { id: "k6", name: "Caramelos x100g", price: 800, color: "bg-pink-400" },
  ],
  bar: [
    { id: "b1", name: "Pinta IPA Artesanal", price: 3500, color: "bg-amber-500" },
    { id: "b2", name: "Pinta Honey", price: 3200, color: "bg-yellow-500" },
    { id: "b3", name: "Hamburguesa Doble Bacon", price: 8500, color: "bg-orange-700" },
    { id: "b4", name: "Papas con Cheddar", price: 4500, color: "bg-yellow-600" },
    { id: "b5", name: "Gin Tonic Clásico", price: 4000, color: "bg-blue-200" },
    { id: "b6", name: "Pizza Muzzarella", price: 7500, color: "bg-red-500" },
  ]
}

interface CartItem extends MockProduct {
  quantity: number
}

export function ClaverPosMockup({ className, variant: initialVariant = "kiosco" }: { className?: string, variant?: PosVariant }) {
  const [variant, setVariant] = useState<PosVariant>(initialVariant)
  const products = VARIANT_PRODUCTS[variant] || VARIANT_PRODUCTS.general
  const [cart, setCart] = useState<CartItem[]>([])
  const [showSuccess, setShowSuccess] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)

  const addToCart = useCallback((product: MockProduct) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.id === product.id)
      if (existing) {
        return prev.map((i) => (i.id === product.id ? { ...i, quantity: i.quantity + 1 } : i))
      }
      return [...prev, { ...product, quantity: 1 }]
    })
  }, [])

  const updateQuantity = useCallback((id: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((i) => (i.id === id ? { ...i, quantity: i.quantity + delta } : i))
        .filter((i) => i.quantity > 0)
    )
  }, [])

  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0)

  const handleCheckout = () => {
    if (cart.length === 0) return
    setShowSuccess(true)
    setTimeout(() => {
      setCart([])
      setShowSuccess(false)
    }, 2500)
  }

  const InnerContent = (
    <div className="flex h-full w-full flex-col md:flex-row overflow-hidden bg-slate-100">
      {/* Panel Izquierdo: Productos */}
      <div className="flex-1 flex flex-col min-h-0 relative">
        <div className="bg-white p-4 border-b border-slate-200 flex items-center justify-between shadow-sm z-10">
          <div>
            <h3 className="font-bold text-slate-800 text-sm md:text-base flex items-center gap-2">
              Caja Principal
              <select 
                className="text-xs bg-slate-100 border border-slate-200 rounded p-1 ml-2 font-normal text-slate-600 outline-none"
                value={variant}
                onChange={(e) => {
                  setVariant(e.target.value as PosVariant)
                  setCart([])
                }}
              >
                <option value="kiosco">Modo Kiosco</option>
                <option value="bar">Modo Bar/Restó</option>
                <option value="general">Modo General</option>
              </select>
            </h3>
            <p className="text-[10px] md:text-xs text-slate-500">Mostrador abierto</p>
          </div>
          <div className="flex items-center gap-2">
            {!isFullscreen && (
            <Button
              variant="outline"
              size="sm"
              className="text-xs h-8"
              onClick={() => setIsFullscreen(true)}
            >
              <Maximize2 className="w-3.5 h-3.5 mr-1" /> Fullscreen
            </Button>
          )}
          {isFullscreen && (
            <Button
              variant="outline"
              size="sm"
              className="text-xs h-8"
              onClick={() => setIsFullscreen(false)}
            >
              <X className="w-3.5 h-3.5 mr-1" /> Salir
            </Button>
          )}
          </div>
        </div>
        <ScrollArea className="flex-1 p-3 md:p-4 bg-slate-50">
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 pb-32 md:pb-0">
            {products.map((p) => (
              <button
                key={p.id}
                onClick={() => addToCart(p)}
                className="group relative flex flex-col h-24 md:h-32 rounded-xl bg-white shadow-sm border border-slate-200 hover:border-indigo-400 hover:shadow-md transition-all text-left overflow-hidden active:scale-95"
              >
                <div className={cn("h-8 md:h-10 w-full shrink-0 opacity-80 group-hover:opacity-100 transition-opacity", p.color)} />
                <div className="p-2 md:p-3 flex flex-col justify-between flex-1">
                  <span className="text-xs md:text-sm font-semibold text-slate-700 leading-tight line-clamp-2">
                    {p.name}
                  </span>
                  <span className="text-xs md:text-sm font-bold text-slate-900 mt-1">
                    {currency.format(p.price)}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Panel Derecho: Carrito */}
      <div className="w-full md:w-80 lg:w-96 bg-white border-t md:border-t-0 md:border-l border-slate-200 flex flex-col z-20 shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.1)] md:shadow-none absolute md:relative bottom-0 left-0 h-[45vh] md:h-auto max-h-full">
        <div className="p-3 md:p-4 border-b border-slate-100 bg-slate-50 flex items-center gap-2">
          <ShoppingCart className="w-4 h-4 md:w-5 md:h-5 text-indigo-600" />
          <h3 className="font-bold text-slate-800 text-sm md:text-base">Ticket Actual</h3>
          <Badge className="ml-auto bg-indigo-100 text-indigo-800">{cart.length} items</Badge>
        </div>
        
        <ScrollArea className="flex-1 p-3 md:p-4">
          <AnimatePresence>
            {cart.length === 0 ? (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center text-slate-400 mt-10 text-xs md:text-sm px-4"
              >
                Toca los productos para agregarlos al ticket
              </motion.div>
            ) : (
              <div className="space-y-2.5">
                {cart.map((item) => (
                  <motion.div
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    key={item.id}
                    className="flex flex-col gap-2 p-2.5 rounded-lg border border-slate-100 bg-white shadow-sm"
                  >
                    <div className="flex justify-between items-start">
                      <span className="text-xs md:text-sm font-semibold text-slate-800">{item.name}</span>
                      <span className="text-xs md:text-sm font-bold">{currency.format(item.price * item.quantity)}</span>
                    </div>
                    <div className="flex items-center justify-between mt-1">
                      <div className="flex items-center gap-1 md:gap-2 bg-slate-100 rounded-md p-1">
                        <button
                          onClick={() => updateQuantity(item.id, -1)}
                          className="p-1 rounded bg-white shadow-sm text-slate-600 hover:text-indigo-600 active:scale-90"
                        >
                          {item.quantity === 1 ? <Trash2 className="w-3 h-3 md:w-3.5 md:h-3.5 text-red-500" /> : <Minus className="w-3 h-3 md:w-3.5 md:h-3.5" />}
                        </button>
                        <span className="text-xs font-bold w-4 md:w-6 text-center">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.id, 1)}
                          className="p-1 rounded bg-white shadow-sm text-slate-600 hover:text-indigo-600 active:scale-90"
                        >
                          <Plus className="w-3 h-3 md:w-3.5 md:h-3.5" />
                        </button>
                      </div>
                      <span className="text-[10px] md:text-xs text-slate-400">{currency.format(item.price)} c/u</span>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </AnimatePresence>
        </ScrollArea>

        <div className="p-3 md:p-4 bg-slate-50 border-t border-slate-200">
          <div className="flex justify-between items-center mb-3 md:mb-4">
            <span className="text-xs md:text-sm font-bold text-slate-600">Total a cobrar:</span>
            <span className="text-xl md:text-2xl font-[var(--font-fraunces)] font-bold text-emerald-600">
              {currency.format(total)}
            </span>
          </div>
          <Button 
            className="w-full h-12 md:h-14 text-base md:text-lg font-bold shadow-lg bg-emerald-600 hover:bg-emerald-700 text-white transition-all"
            size="lg"
            disabled={cart.length === 0 || showSuccess}
            onClick={handleCheckout}
          >
            {showSuccess ? (
              <motion.div 
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                className="flex items-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4 md:w-5 md:h-5" /> Cobrado Exitosamente
              </motion.div>
            ) : (
              "Cobrar Ticket"
            )}
          </Button>
        </div>
      </div>
    </div>
  )

  if (isFullscreen) {
    return (
      <div className="fixed inset-0 z-[100] bg-slate-100 flex flex-col animate-in fade-in zoom-in-95 duration-200">
        {InnerContent}
      </div>
    )
  }

  return (
    <div className={cn("w-full relative h-[650px] md:h-[550px]", className)}>
      <MarketingBrowserChrome url="app.claver.com.ar/dashboard/pos" className="h-full">
        {InnerContent}
      </MarketingBrowserChrome>
    </div>
  )
}

function Badge({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium", className)}>
      {children}
    </span>
  )
}
