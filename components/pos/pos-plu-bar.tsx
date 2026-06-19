"use client"

import { useCallback, useEffect, useState } from "react"
import { Zap } from "lucide-react"
import type { PosPluItem } from "@/lib/pos/pos-plu-service"

interface PosPluBarProps {
  authHeaders: () => HeadersInit
  onAgregar: (producto: {
    id: number
    nombre: string
    precioVenta: number
    porcentajeIva: number
    stock: number
  }) => void
}

export function PosPluBar({ authHeaders, onAgregar }: PosPluBarProps) {
  const [plus, setPlus] = useState<PosPluItem[]>([])
  const [loading, setLoading] = useState(true)

  const cargar = useCallback(async () => {
    try {
      const res = await fetch("/api/pos/plu", { headers: authHeaders() })
      if (res.ok) {
        const data = await res.json()
        setPlus(data.items ?? [])
      }
    } catch {
      /* silencioso */
    } finally {
      setLoading(false)
    }
  }, [authHeaders])

  useEffect(() => {
    void cargar()
  }, [cargar])

  if (loading || plus.length === 0) return null

  const fmt = (n: number) =>
    n.toLocaleString("es-AR", { minimumFractionDigits: 0, maximumFractionDigits: 0 })

  return (
    <div className="shrink-0 border-b px-3 py-2 bg-muted/20">
      <div className="flex items-center gap-1.5 mb-1.5">
        <Zap className="h-3 w-3 text-amber-500" />
        <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">
          Acceso rápido
        </span>
      </div>
      <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
        {plus.map((plu) => {
          const colorClass =
            plu.color?.startsWith("bg-") ? plu.color : "bg-primary"
          const sinStock = plu.stock <= 0

          return (
            <button
              key={plu.productoId}
              type="button"
              disabled={sinStock}
              onClick={() =>
                onAgregar({
                  id: plu.productoId,
                  nombre: plu.nombre,
                  precioVenta: plu.precioVenta,
                  porcentajeIva: 21,
                  stock: plu.stock,
                })
              }
              className={`
                shrink-0 flex flex-col items-center justify-center
                min-w-[72px] max-w-[88px] h-[52px] rounded-lg px-1.5
                text-white text-center transition-all select-none
                ${sinStock ? "opacity-40 cursor-not-allowed bg-gray-500" : `${colorClass} hover:brightness-110 active:scale-95`}
              `}
            >
              <span className="text-[10px] font-bold leading-tight line-clamp-2">
                {plu.etiqueta ?? plu.nombre.split(" ").slice(0, 2).join(" ")}
              </span>
              <span className="text-[9px] opacity-90 mt-0.5">${fmt(plu.precioVenta)}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}