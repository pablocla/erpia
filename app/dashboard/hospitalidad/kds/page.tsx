"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import { Button } from "@/components/ui/button"
import { CheckCircle2, Clock, ChefHat, RefreshCw, Wifi, WifiOff } from "lucide-react"
import { cn } from "@/lib/utils"
import { useKeyboardShortcuts, erpShortcuts } from "@/hooks/use-keyboard-shortcuts"

// ── Tipos ──────────────────────────────────────────────────────────────────────

type EstadoLinea = "pendiente" | "en_preparacion" | "lista" | "entregada"
type EstadoComanda = "enviada_cocina" | "en_preparacion" | "lista"

interface LineaComanda {
  id: number
  nombre: string
  cantidad: number
  notas: string | null
  estado: EstadoLinea
}

interface Comanda {
  id: number
  estado: EstadoComanda
  mozo: string | null
  notas: string | null
  createdAt: string
  mesa: { numero: number; id: number }
  lineas: LineaComanda[]
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function tiempoTranscurrido(isoDate: string): string {
  const min = Math.floor((Date.now() - new Date(isoDate).getTime()) / 60000)
  if (min < 1) return "< 1 min"
  if (min < 60) return `${min} min`
  return `${Math.floor(min / 60)}h ${min % 60}m`
}

function colorTimer(isoDate: string): string {
  const min = Math.floor((Date.now() - new Date(isoDate).getTime()) / 60000)
  if (min < 6) return "text-emerald-400"
  if (min < 12) return "text-yellow-400"
  return "text-red-400 animate-pulse"
}

const ESTADO_LINEA_LABEL: Record<EstadoLinea, string> = {
  pendiente: "Pendiente",
  en_preparacion: "En prep.",
  lista: "Lista",
  entregada: "Entregada",
}

const ESTADO_LINEA_CLASS: Record<EstadoLinea, string> = {
  pendiente: "bg-slate-700 text-slate-300",
  en_preparacion: "bg-blue-600 text-white",
  lista: "bg-emerald-600 text-white",
  entregada: "bg-slate-600 text-slate-500",
}

const SIGUIENTE_ESTADO: Partial<Record<EstadoLinea, EstadoLinea>> = {
  pendiente: "en_preparacion",
  en_preparacion: "lista",
}

// ── Componente principal ───────────────────────────────────────────────────────

export default function KDSPage() {
  const [comandas, setComandas] = useState<Comanda[]>([])
  const [cargando, setCargando] = useState(true)
  const [conectado, setConectado] = useState(true)
  const [ultimaActualizacion, setUltimaActualizacion] = useState<Date | null>(null)
  const [tick, setTick] = useState(0)
  const tokenRef = useRef<string | null>(null)

  useEffect(() => {
    tokenRef.current = localStorage.getItem("token")
  }, [])

  const fetchComandas = useCallback(async () => {
    const token = tokenRef.current
    if (!token) return
    try {
      const res = await fetch("/api/cocina", {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      })
      if (!res.ok) throw new Error()
      const data = await res.json()
      if (data.success) {
        setComandas(data.data)
        setConectado(true)
        setUltimaActualizacion(new Date())
      }
    } catch {
      setConectado(false)
    } finally {
      setCargando(false)
    }
  }, [])

  useKeyboardShortcuts(erpShortcuts({
    onRefresh: fetchComandas,
  }))

  useEffect(() => {
    fetchComandas()
    const poll = setInterval(fetchComandas, 5000)
    return () => clearInterval(poll)
  }, [fetchComandas])

  // Re-render timers cada 30s
  useEffect(() => {
    const t = setInterval(() => setTick((n) => n + 1), 30000)
    return () => clearInterval(t)
  }, [])

  const patchLinea = async (lineaId: number, estado: EstadoLinea) => {
    const token = tokenRef.current
    if (!token) return
    // Optimistic update
    setComandas((prev) =>
      prev.map((c) => ({
        ...c,
        lineas: c.lineas.map((l) => (l.id === lineaId ? { ...l, estado } : l)),
      }))
    )
    await fetch("/api/cocina", {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ tipo: "linea", lineaId, estado }),
    })
    fetchComandas()
  }

  const patchComanda = async (comandaId: number, estado: "en_preparacion" | "lista") => {
    const token = tokenRef.current
    if (!token) return
    await fetch("/api/cocina", {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ tipo: "comanda", comandaId, estado }),
    })
    fetchComandas()
  }

  const nuevas = comandas.filter((c) => c.estado === "enviada_cocina")
  const enPrep = comandas.filter((c) => c.estado === "en_preparacion")

  if (cargando) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-900 text-white">
        <div className="text-center space-y-3">
          <ChefHat className="h-12 w-12 mx-auto text-orange-400 animate-bounce" />
          <p className="text-slate-400">Conectando con cocina...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white p-4 space-y-5" key={tick}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ChefHat className="h-7 w-7 text-orange-400" />
          <div>
            <h1 className="text-xl font-bold tracking-tight">Pantalla de Cocina</h1>
            <p className="text-xs text-slate-500">
              {ultimaActualizacion
                ? `Actualizado: ${ultimaActualizacion.toLocaleTimeString("es-AR")}`
                : "Conectando..."}
              {" · "}Refresca cada 5 seg.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-slate-400">
            <span className="text-yellow-400 font-bold text-base">{nuevas.length}</span> nuevas
            {" · "}
            <span className="text-blue-400 font-bold text-base">{enPrep.length}</span> en prep.
          </span>
          {conectado ? (
            <Wifi className="h-4 w-4 text-emerald-400" />
          ) : (
            <WifiOff className="h-4 w-4 text-red-400 animate-pulse" title="Sin conexión" />
          )}
          <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white" onClick={fetchComandas}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Nuevas */}
      {nuevas.length > 0 && (
        <section>
          <p className="text-[11px] font-semibold uppercase tracking-widest text-yellow-500 mb-2">
            Nuevas — esperando inicio
          </p>
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {nuevas.map((c) => (
              <ComandaCard
                key={c.id}
                comanda={c}
                colorBorde="border-yellow-500"
                onLinea={patchLinea}
                onComanda={patchComanda}
              />
            ))}
          </div>
        </section>
      )}

      {/* En preparación */}
      {enPrep.length > 0 && (
        <section>
          <p className="text-[11px] font-semibold uppercase tracking-widest text-blue-400 mb-2">
            En preparación
          </p>
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {enPrep.map((c) => (
              <ComandaCard
                key={c.id}
                comanda={c}
                colorBorde="border-blue-500"
                onLinea={patchLinea}
                onComanda={patchComanda}
              />
            ))}
          </div>
        </section>
      )}

      {/* Vacío */}
      {comandas.length === 0 && (
        <div className="flex flex-col items-center justify-center h-72 text-slate-700 space-y-2">
          <ChefHat className="h-20 w-20" />
          <p className="text-xl font-semibold">Cocina libre</p>
          <p className="text-sm">Los pedidos aparecen automáticamente</p>
        </div>
      )}
    </div>
  )
}

// ── Card de comanda ────────────────────────────────────────────────────────────

function ComandaCard({
  comanda,
  colorBorde,
  onLinea,
  onComanda,
}: {
  comanda: Comanda
  colorBorde: string
  onLinea: (id: number, estado: EstadoLinea) => void
  onComanda: (id: number, estado: "en_preparacion" | "lista") => void
}) {
  const todasListas = comanda.lineas.every((l) => l.estado === "lista" || l.estado === "entregada")

  return (
    <div className={cn("bg-slate-800 rounded-xl border-2 p-4 flex flex-col gap-3", colorBorde)}>
      {/* Cabecera */}
      <div className="flex items-start justify-between">
        <div>
          <span className="text-3xl font-black leading-none">Mesa {comanda.mesa.numero}</span>
          {comanda.mozo && <span className="text-xs text-slate-400 ml-1">· {comanda.mozo}</span>}
        </div>
        <span className={cn("flex items-center gap-1 text-sm font-semibold", colorTimer(comanda.createdAt))}>
          <Clock className="h-3.5 w-3.5" />
          {tiempoTranscurrido(comanda.createdAt)}
        </span>
      </div>

      {/* Nota de la comanda */}
      {comanda.notas && (
        <p className="text-xs bg-yellow-900/30 text-yellow-300 border border-yellow-700/40 rounded px-2 py-1">
          ★ {comanda.notas}
        </p>
      )}

      {/* Líneas */}
      <div className="space-y-2 flex-1">
        {comanda.lineas.map((linea) => {
          const siguiente = SIGUIENTE_ESTADO[linea.estado]
          return (
            <div key={linea.id} className="flex items-start gap-2">
              <span className="text-slate-400 text-sm w-5 shrink-0 text-right pt-0.5">{linea.cantidad}×</span>
              <div className="flex-1 min-w-0">
                <p className={cn(
                  "text-sm font-semibold leading-snug",
                  (linea.estado === "entregada") && "line-through text-slate-500"
                )}>
                  {linea.nombre}
                </p>
                {linea.notas && (
                  <p className="text-[11px] text-yellow-400 leading-tight mt-0.5">{linea.notas}</p>
                )}
              </div>
              <button
                disabled={!siguiente}
                onClick={() => siguiente && onLinea(linea.id, siguiente)}
                className={cn(
                  "text-[10px] px-1.5 py-0.5 rounded font-bold shrink-0 transition-all",
                  ESTADO_LINEA_CLASS[linea.estado],
                  siguiente && "hover:opacity-80 active:scale-95 cursor-pointer"
                )}
              >
                {ESTADO_LINEA_LABEL[linea.estado]}
              </button>
            </div>
          )
        })}
      </div>

      {/* Botón global */}
      <Button
        size="sm"
        className={cn(
          "w-full gap-2 font-bold",
          todasListas
            ? "bg-emerald-600 hover:bg-emerald-500 text-white"
            : "bg-slate-700 hover:bg-emerald-700 text-slate-300 hover:text-white"
        )}
        onClick={() => onComanda(comanda.id, "lista")}
      >
        <CheckCircle2 className="h-4 w-4" />
        {todasListas ? "LISTO — Confirmar" : "Marcar todo listo"}
      </Button>
    </div>
  )
}
