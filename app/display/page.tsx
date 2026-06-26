"use client"
import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"

export default function CustomerDisplayPage() {
  const [carrito, setCarrito] = useState<{ nombre: string; cantidad: number; precio: number }[]>([])
  const [total, setTotal] = useState(0)

  useEffect(() => {
    const channel = new BroadcastChannel("pos_display_channel")
    channel.onmessage = (event) => {
      if (event.data.type === "UPDATE_CART") {
        setCarrito(event.data.payload.items)
        setTotal(event.data.payload.total)
      } else if (event.data.type === "CLEAR_CART") {
        setCarrito([])
        setTotal(0)
      }
    }
    return () => channel.close()
  }, [])

  return (
    <div className="flex h-screen w-full bg-slate-900 text-slate-100 overflow-hidden font-sans">
      <div className="flex w-2/3 flex-col justify-center items-center p-12 bg-slate-800">
        <h1 className="text-6xl font-bold mb-8 text-blue-400">Bienvenido</h1>
        <p className="text-2xl text-slate-400 text-center">Aquí verás los detalles de tu compra.</p>
        
        {/* Espacio para promociones o logo del cliente */}
        <div className="mt-16 w-full max-w-md aspect-video bg-slate-700/50 rounded-2xl border border-slate-600 flex items-center justify-center overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/20 to-purple-500/20" />
          <span className="text-slate-500 font-medium">Espacio Promocional</span>
        </div>
      </div>

      <div className="flex w-1/3 flex-col border-l border-slate-700 bg-slate-900 p-8 shadow-2xl z-10">
        <h2 className="text-3xl font-semibold mb-6">Tu Pedido</h2>
        
        <div className="flex-1 overflow-y-auto pr-2 space-y-4 custom-scrollbar">
          <AnimatePresence>
            {carrito.length === 0 ? (
              <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                className="text-slate-500 text-center mt-10 text-lg"
              >
                El carrito está vacío
              </motion.div>
            ) : (
              carrito.map((item, index) => (
                <motion.div
                  key={`${item.nombre}-${index}`}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="flex justify-between items-center bg-slate-800 p-4 rounded-xl border border-slate-700/50"
                >
                  <div className="flex flex-col">
                    <span className="font-medium text-lg truncate max-w-[200px]">{item.nombre}</span>
                    <span className="text-slate-400 text-sm">{item.cantidad} x ${item.precio.toLocaleString()}</span>
                  </div>
                  <span className="font-bold text-xl">${(item.cantidad * item.precio).toLocaleString()}</span>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>

        <div className="mt-6 pt-6 border-t border-slate-700">
          <div className="flex justify-between items-end">
            <span className="text-slate-400 text-xl">Total a pagar</span>
            <motion.span 
              key={total}
              initial={{ scale: 1.2, color: "#60a5fa" }}
              animate={{ scale: 1, color: "#f1f5f9" }}
              className="text-5xl font-bold"
            >
              ${total.toLocaleString()}
            </motion.span>
          </div>
        </div>
      </div>
    </div>
  )
}
