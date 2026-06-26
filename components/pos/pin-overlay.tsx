"use client"
import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Loader2, Lock } from "lucide-react"
import { authFetch } from "@/lib/stores"
import { useAuthStore } from "@/lib/stores"

interface PinOverlayProps {
  isOpen: boolean
  onSuccess: () => void
}

export function PinOverlay({ isOpen, onSuccess }: PinOverlayProps) {
  const [pin, setPin] = useState("")
  const [error, setError] = useState(false)
  const [loading, setLoading] = useState(false)
  
  const setToken = useAuthStore(s => s.setToken)
  const setUsuario = useAuthStore(s => s.setUsuario)

  const handleNumber = (num: string) => {
    if (pin.length < 6) {
      setPin(prev => prev + num)
      setError(false)
    }
  }

  const handleDelete = () => {
    setPin(prev => prev.slice(0, -1))
    setError(false)
  }

  const handleSubmit = async () => {
    if (pin.length < 4) return
    setLoading(true)
    try {
      const res = await authFetch("/api/pos/auth/pin", {
        method: "POST",
        body: JSON.stringify({ pinCode: pin })
      })
      const data = await res.json()
      
      if (res.ok && data.success) {
        setToken(data.token)
        setUsuario(data.usuario)
        setPin("")
        onSuccess()
      } else {
        setError(true)
        setPin("")
      }
    } catch (e) {
      setError(true)
      setPin("")
    } finally {
      setLoading(false)
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/90 backdrop-blur-sm"
        >
          <motion.div 
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            className="bg-white dark:bg-slate-800 p-8 rounded-3xl shadow-2xl flex flex-col items-center max-w-sm w-full border border-slate-200 dark:border-slate-700"
          >
            <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mb-6 text-blue-600 dark:text-blue-400">
              <Lock size={32} />
            </div>
            
            <h2 className="text-2xl font-bold mb-2 text-slate-800 dark:text-slate-100">Desbloquear POS</h2>
            <p className="text-slate-500 dark:text-slate-400 mb-8 text-center text-sm">
              Ingresa tu PIN de 4 a 6 dígitos para continuar operando.
            </p>

            {/* Display de PIN */}
            <div className="flex gap-4 mb-8">
              {[0, 1, 2, 3, 4, 5].map((idx) => (
                <motion.div 
                  key={idx}
                  animate={error ? { x: [-10, 10, -10, 10, 0] } : {}}
                  transition={{ duration: 0.4 }}
                  className={`w-4 h-4 rounded-full border-2 ${
                    pin.length > idx 
                      ? "bg-blue-600 border-blue-600" 
                      : error 
                        ? "border-red-500 bg-red-100" 
                        : "border-slate-300 dark:border-slate-600"
                  }`}
                />
              ))}
            </div>

            {error && (
              <p className="text-red-500 text-sm mb-4 font-medium">PIN Incorrecto</p>
            )}

            {/* Keypad */}
            <div className="grid grid-cols-3 gap-4 w-full">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                <button
                  key={num}
                  onClick={() => handleNumber(num.toString())}
                  className="h-16 text-2xl font-medium bg-slate-50 hover:bg-slate-100 dark:bg-slate-700 dark:hover:bg-slate-600 rounded-2xl transition-colors active:scale-95"
                >
                  {num}
                </button>
              ))}
              <button
                onClick={handleDelete}
                className="h-16 text-lg font-medium text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 rounded-2xl transition-colors active:scale-95 flex items-center justify-center"
              >
                Borrar
              </button>
              <button
                onClick={() => handleNumber("0")}
                className="h-16 text-2xl font-medium bg-slate-50 hover:bg-slate-100 dark:bg-slate-700 dark:hover:bg-slate-600 rounded-2xl transition-colors active:scale-95"
              >
                0
              </button>
              <button
                onClick={handleSubmit}
                disabled={pin.length < 4 || loading}
                className="h-16 text-lg font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-2xl transition-all active:scale-95 disabled:opacity-50 disabled:active:scale-100 flex items-center justify-center"
              >
                {loading ? <Loader2 className="animate-spin" /> : "OK"}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
