"use client"

import { useState, useEffect } from "react"
import { Sparkles, Trash2, X } from "lucide-react"

export function InstantDemoBanner() {
  const [isDemo, setIsDemo] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search)
      const hasDemoQuery = urlParams.get("demo") === "1"
      const hasDemoStorage = localStorage.getItem("claver_demo_mode") === "true"
      
      if (hasDemoQuery || hasDemoStorage) {
        setIsDemo(true)
      }
    }
  }, [])

  const handleClearDemo = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("claver_demo_mode")
      const url = new URL(window.location.href)
      url.searchParams.delete("demo")
      window.history.replaceState({}, "", url.toString())
    }
    setIsDemo(false)
  }

  if (!isDemo || dismissed) return null

  return (
    <div className="w-full bg-gradient-to-r from-amber-950 via-slate-900 to-amber-950 border-b border-amber-500/30 px-4 py-2.5 text-xs text-amber-200 flex flex-wrap items-center justify-between gap-3 shadow-md z-40">
      <div className="flex items-center gap-2">
        <span className="p-1 rounded bg-amber-500/20 text-amber-400">
          <Sparkles className="w-4 h-4" />
        </span>
        <span>
          <strong className="font-semibold text-amber-300">Modo Demostración Activo:</strong> Estás explorando con datos de prueba pre-cargados.
        </span>
      </div>

      <div className="flex items-center gap-3 ml-auto">
        <button
          onClick={handleClearDemo}
          className="flex items-center gap-1.5 px-3 py-1 rounded bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-200 transition-colors font-medium text-[11px]"
        >
          <Trash2 className="w-3.5 h-3.5" />
          Limpiar datos de prueba y empezar limpio
        </button>
        
        <button
          onClick={() => setDismissed(true)}
          className="p-1 hover:text-white transition-colors"
          title="Ocultar aviso"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
