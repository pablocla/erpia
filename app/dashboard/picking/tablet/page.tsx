"use client"

/**
 * PICKING TABLET — Modo full-screen táctil para depósito
 *
 * Diseño optimizado para tablet Android/iPad en landscape:
 * - Fuente grande, botones grandes (mínimo 48px)
 * - Un ítem a la vez en pantalla
 * - Confirmación por número grande o escaneo de código de barras (cámara)
 * - Sin teclado virtual (solo botones numéricos grandes)
 * - Verde / Rojo claro para estado visual rápido
 *
 * Rubro: distribución, retail con depósito, industria
 */

import { useState, useEffect, useCallback, useRef } from "react"
import { CheckCircle2, XCircle, ChevronLeft, ChevronRight, ScanLine, Minus, Plus, RotateCcw, Check } from "lucide-react"
import { Button } from "@/components/ui/button"

interface LineaPicking {
  id: number
  descripcion: string
  cantidadPedida: number
  cantidadPicada: number
  ubicacion?: string
  estado: string
  producto?: { id: number; nombre: string; codigo: string }
}

interface ListaPicking {
  id: number
  numero: string
  estado: string
  prioridad: string
  zonaAlmacen?: string
  operario?: string
  lineas: LineaPicking[]
}

export default function PickingTabletPage() {
  const [listas, setListas] = useState<ListaPicking[]>([])
  const [listaActiva, setListaActiva] = useState<ListaPicking | null>(null)
  const [lineaIndex, setLineaIndex] = useState(0)
  const [cantidadInput, setCantidadInput] = useState(0)
  const [guardando, setGuardando] = useState(false)
  const [loading, setLoading] = useState(true)
  const [fase, setFase] = useState<"seleccionar" | "picar" | "finalizado">("seleccionar")
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null

  const fetchListas = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/picking?estado=pendiente", {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      if (res.ok) setListas(await res.json())
    } finally { setLoading(false) }
  }, [token])

  useEffect(() => { fetchListas() }, [fetchListas])

  const lineaActual = listaActiva?.lineas[lineaIndex]
  const totalLineas = listaActiva?.lineas.length ?? 0
  const completadas = listaActiva?.lineas.filter((l) => l.cantidadPicada >= l.cantidadPedida).length ?? 0

  const iniciarLista = (lista: ListaPicking) => {
    setListaActiva({ ...lista, lineas: lista.lineas.map((l) => ({ ...l, cantidadPicada: 0 })) })
    setLineaIndex(0)
    setCantidadInput(0)
    setFase("picar")
    // Marcar como en proceso
    fetch(`/api/picking/${lista.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify({ estado: "en_proceso" }),
    })
  }

  const confirmarLinea = () => {
    if (!listaActiva || !lineaActual) return
    const nuevas = listaActiva.lineas.map((l, i) =>
      i === lineaIndex ? { ...l, cantidadPicada: cantidadInput, estado: cantidadInput >= l.cantidadPedida ? "completo" : "parcial" } : l
    )
    const actualizada = { ...listaActiva, lineas: nuevas }
    setListaActiva(actualizada)

    if (lineaIndex + 1 < totalLineas) {
      setLineaIndex(lineaIndex + 1)
      setCantidadInput(nuevas[lineaIndex + 1]?.cantidadPedida ?? 0)
    } else {
      finalizarPicking(actualizada)
    }
  }

  const finalizarPicking = async (lista: ListaPicking) => {
    setGuardando(true)
    try {
      const allDone = lista.lineas.every((l) => l.cantidadPicada >= l.cantidadPedida)
      await fetch(`/api/picking/${lista.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({
          estado: allDone ? "completada" : "en_proceso",
          lineas: lista.lineas.map((l) => ({ id: l.id, cantidadPicada: l.cantidadPicada })),
        }),
      })
      setFase("finalizado")
    } finally { setGuardando(false) }
  }

  const setPredefinido = (n: number) => setCantidadInput(n)
  const adjustCantidad = (delta: number) => setCantidadInput((v) => Math.max(0, v + delta))

  // Pantalla selección
  if (fase === "seleccionar") {
    return (
      <div className="min-h-screen bg-slate-900 text-white p-6 flex flex-col">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <ScanLine className="h-8 w-8 text-violet-400" />
            Picking — Modo Tablet
          </h1>
          <Button variant="outline" className="border-slate-600 text-white" onClick={fetchListas}>
            <RotateCcw className="h-5 w-5 mr-2" /> Actualizar
          </Button>
        </div>

        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-slate-400 text-xl">Cargando listas...</div>
          </div>
        ) : listas.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-4">
            <CheckCircle2 className="h-20 w-20 text-green-500" />
            <p className="text-2xl font-semibold text-slate-300">No hay listas pendientes</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {listas.map((lista) => {
              const prioColor = lista.prioridad === "urgente" ? "border-red-500 bg-red-900/20" :
                lista.prioridad === "alta" ? "border-orange-500 bg-orange-900/20" :
                "border-slate-600 bg-slate-800"
              return (
                <button
                  key={lista.id}
                  className={`p-6 rounded-2xl border-2 text-left transition-all hover:scale-[1.02] active:scale-[0.98] ${prioColor}`}
                  onClick={() => iniciarLista(lista)}
                >
                  <p className="text-xs uppercase tracking-widest text-slate-400 mb-1">{lista.prioridad}</p>
                  <p className="text-2xl font-bold font-mono mb-2">{lista.numero}</p>
                  <p className="text-slate-300 text-lg">{lista.lineas.length} ítems</p>
                  {lista.zonaAlmacen && <p className="text-slate-400 text-sm mt-1">Zona: {lista.zonaAlmacen}</p>}
                  {lista.operario && <p className="text-slate-400 text-sm">Op: {lista.operario}</p>}
                  <div className="mt-4">
                    <span className="inline-block bg-violet-600 text-white px-4 py-2 rounded-xl text-sm font-bold">
                      INICIAR PICKING →
                    </span>
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </div>
    )
  }

  // Pantalla finalizado
  if (fase === "finalizado") {
    const faltantes = listaActiva?.lineas.filter((l) => l.cantidadPicada < l.cantidadPedida) ?? []
    return (
      <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-6 gap-8">
        <CheckCircle2 className="h-32 w-32 text-green-500" />
        <div className="text-center">
          <p className="text-4xl font-bold text-green-400 mb-2">Picking completado</p>
          <p className="text-2xl text-slate-300">{listaActiva?.numero}</p>
          {faltantes.length > 0 && (
            <div className="mt-4 p-4 rounded-xl bg-orange-900/30 border border-orange-600">
              <p className="text-orange-300 font-semibold">Ítems con faltante:</p>
              {faltantes.map((l) => (
                <p key={l.id} className="text-orange-200 text-sm">{l.descripcion}: {l.cantidadPicada}/{l.cantidadPedida}</p>
              ))}
            </div>
          )}
        </div>
        <div className="flex gap-4">
          <Button
            size="lg"
            className="text-xl px-10 py-6 bg-violet-600 hover:bg-violet-700 rounded-2xl"
            onClick={() => { setFase("seleccionar"); setListaActiva(null); fetchListas() }}
          >
            Nueva lista
          </Button>
        </div>
      </div>
    )
  }

  // Pantalla picking de ítem
  if (!lineaActual || !listaActiva) return null

  const completo = cantidadInput >= lineaActual.cantidadPedida
  const esFaltante = cantidadInput < lineaActual.cantidadPedida && lineaIndex > 0

  return (
    <div className={`min-h-screen flex flex-col transition-colors ${completo ? "bg-green-900" : "bg-slate-900"} text-white`}>
      {/* Barra superior */}
      <div className="flex items-center justify-between px-6 py-4 bg-black/20">
        <div>
          <p className="text-sm text-slate-400">Lista {listaActiva.numero}</p>
          <p className="text-slate-300">Zona: {listaActiva.zonaAlmacen || "—"}</p>
        </div>
        <div className="text-center">
          <p className="text-3xl font-bold">{lineaIndex + 1} / {totalLineas}</p>
          <p className="text-sm text-slate-400">{completadas} completados</p>
        </div>
        {/* Barra de progreso */}
        <div className="w-40">
          <div className="h-3 rounded-full bg-slate-700 overflow-hidden">
            <div
              className="h-full bg-green-500 rounded-full transition-all"
              style={{ width: `${(completadas / totalLineas) * 100}%` }}
            />
          </div>
          <p className="text-xs text-slate-400 text-right mt-1">{Math.round((completadas / totalLineas) * 100)}%</p>
        </div>
      </div>

      {/* Ítem actual — pantalla principal */}
      <div className="flex-1 flex flex-col lg:flex-row gap-0">
        {/* Info del ítem */}
        <div className="flex-1 flex flex-col justify-center items-center p-8 gap-4">
          {lineaActual.ubicacion && (
            <div className="bg-yellow-500 text-yellow-900 font-bold px-6 py-3 rounded-2xl text-2xl tracking-widest">
              📦 {lineaActual.ubicacion}
            </div>
          )}
          <p className="text-5xl font-bold text-center leading-tight">
            {lineaActual.descripcion}
          </p>
          {lineaActual.producto && (
            <p className="text-2xl text-slate-400 font-mono">{lineaActual.producto.codigo}</p>
          )}
          <div className="flex items-baseline gap-3 mt-4">
            <span className="text-slate-400 text-2xl">Pedir:</span>
            <span className="text-6xl font-black text-white">{lineaActual.cantidadPedida}</span>
          </div>
        </div>

        {/* Panel de cantidad */}
        <div className="lg:w-80 flex flex-col justify-center items-center p-6 gap-4 bg-black/20">
          <p className="text-slate-400 text-lg">Cantidad picada:</p>

          {/* Display grande */}
          <div className={`text-8xl font-black w-48 h-48 rounded-3xl flex items-center justify-center transition-colors ${completo ? "bg-green-500 text-white" : "bg-slate-700 text-white"}`}>
            {cantidadInput}
          </div>

          {/* +/- */}
          <div className="flex gap-3">
            <Button
              size="icon"
              className="h-16 w-16 rounded-2xl bg-red-700 hover:bg-red-600 text-3xl"
              onClick={() => adjustCantidad(-1)}
            >
              <Minus className="h-8 w-8" />
            </Button>
            <Button
              size="icon"
              className="h-16 w-16 rounded-2xl bg-green-700 hover:bg-green-600 text-3xl"
              onClick={() => adjustCantidad(1)}
            >
              <Plus className="h-8 w-8" />
            </Button>
          </div>

          {/* Botones predefinidos */}
          <div className="grid grid-cols-3 gap-2 w-full">
            {[1, 2, 3, 6, 12, 24].map((n) => (
              <Button
                key={n}
                variant="outline"
                className="h-12 border-slate-600 text-white text-lg font-bold hover:bg-slate-700 rounded-xl"
                onClick={() => setPredefinido(n)}
              >
                {n}
              </Button>
            ))}
          </div>

          {/* Confirmar */}
          <Button
            size="lg"
            className={`w-full h-16 text-xl font-bold rounded-2xl transition-colors ${completo ? "bg-green-600 hover:bg-green-500" : "bg-slate-600 hover:bg-slate-500"}`}
            onClick={confirmarLinea}
            disabled={guardando}
          >
            {lineaIndex + 1 < totalLineas ? (
              <span className="flex items-center gap-2">
                <Check className="h-6 w-6" /> OK → Siguiente
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <CheckCircle2 className="h-6 w-6" /> {guardando ? "Guardando..." : "Finalizar"}
              </span>
            )}
          </Button>
        </div>
      </div>

      {/* Nav inferior */}
      <div className="flex items-center justify-between px-6 py-3 bg-black/20">
        <Button
          variant="ghost"
          className="text-slate-400 gap-2"
          onClick={() => { setLineaIndex(Math.max(0, lineaIndex - 1)); setCantidadInput(0) }}
          disabled={lineaIndex === 0}
        >
          <ChevronLeft className="h-5 w-5" /> Anterior
        </Button>
        <div className="flex gap-1">
          {listaActiva.lineas.map((l, i) => (
            <div
              key={i}
              className={`h-2 rounded-full transition-all ${i === lineaIndex ? "w-6 bg-white" : l.cantidadPicada >= l.cantidadPedida ? "w-2 bg-green-500" : "w-2 bg-slate-600"}`}
            />
          ))}
        </div>
        <Button
          variant="ghost"
          className="text-slate-400 gap-2"
          onClick={() => { setLineaIndex(Math.min(totalLineas - 1, lineaIndex + 1)); setCantidadInput(0) }}
          disabled={lineaIndex === totalLineas - 1}
        >
          Siguiente <ChevronRight className="h-5 w-5" />
        </Button>
      </div>
    </div>
  )
}
