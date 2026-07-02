"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Check, Navigation, AlertCircle, RefreshCw, Trophy, MapPin, DollarSign } from "lucide-react"

interface Visita {
  id: number
  cliente: string
  dni: string
  direccion: string
  monto: number
  cuotaNro: string
  orden: number
  estado: "Pendiente" | "Cobrado" | "Ausente"
  coordenadas: { x: number; y: number } // Para dibujar en el mapa SVG mockup
}

const MOCK_VISITAS: Visita[] = [
  {
    id: 1,
    cliente: "Mariano Ariel Gómez",
    dni: "35.789.012",
    direccion: "Av. Belgrano 1450, CABA",
    monto: 5600,
    cuotaNro: "6/20",
    orden: 1,
    estado: "Pendiente",
    coordenadas: { x: 120, y: 180 }
  },
  {
    id: 2,
    cliente: "Juan Carlos Pérez",
    dni: "31.456.789",
    direccion: "Piedras 560, CABA",
    monto: 19500,
    cuotaNro: "5/10",
    orden: 2,
    estado: "Pendiente",
    coordenadas: { x: 280, y: 220 }
  },
  {
    id: 3,
    cliente: "Estela Maris Rodríguez",
    dni: "28.123.456",
    direccion: "Tacuarí 120, CABA",
    monto: 70000,
    cuotaNro: "3/6",
    orden: 3,
    estado: "Pendiente",
    coordenadas: { x: 420, y: 140 }
  }
]

export default function RuteoCobranzaPage() {
  const router = useRouter()
  const [visitas, setVisitas] = useState<Visita[]>([])

  useEffect(() => {
    const saved = localStorage.getItem("claver:visitas")
    if (saved) {
      setVisitas(JSON.parse(saved))
    } else {
      setVisitas(MOCK_VISITAS)
      localStorage.setItem("claver:visitas", JSON.stringify(MOCK_VISITAS))
    }
  }, [])

  const updateVisitaEstado = (id: number, nuevoEstado: "Cobrado" | "Ausente") => {
    const actualizados = visitas.map(v => (v.id === id ? { ...v, estado: nuevoEstado } : v))
    setVisitas(actualizados)
    localStorage.setItem("claver:visitas", JSON.stringify(actualizados))

    // Si cobramos, también impactamos en la base de préstamos local
    if (nuevoEstado === "Cobrado") {
      const savedPrestamos = localStorage.getItem("claver:prestamos")
      if (savedPrestamos) {
        const prestamos = JSON.parse(savedPrestamos)
        const prestamosActualizados = prestamos.map((p: any) => {
          if (p.dni === visitas.find(v => v.id === id)?.dni) {
            const pagas = Math.min(p.cuotasPagas + 1, p.cuotasTotales)
            const estado = pagas === p.cuotasTotales ? "Al día" : p.estado
            return { ...p, cuotasPagas: pagas, estado }
          }
          return p
        })
        localStorage.setItem("claver:prestamos", JSON.stringify(prestamosActualizados))
      }
    }
  }

  const handleReset = () => {
    setVisitas(MOCK_VISITAS)
    localStorage.setItem("claver:visitas", JSON.stringify(MOCK_VISITAS))
  }

  // Métricas de ruteo
  const totalACobrar = visitas.reduce((sum, v) => sum + v.monto, 0)
  const cobrado = visitas.filter(v => v.estado === "Cobrado").reduce((sum, v) => sum + v.monto, 0)
  const efectividad = visitas.length ? Math.round((visitas.filter(v => v.estado === "Cobrado").length / visitas.length) * 100) : 0

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header fijo */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 px-6 py-4 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-3">
          <Button variant="ghost" onClick={() => router.push("/dashboard/prestamos")} className="text-slate-600">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Ruteo Inteligente de Cobranzas</h1>
            <p className="text-xs text-slate-500">Hoja de ruta diaria optimizada para cobradores de calle.</p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={handleReset} className="border-slate-300">
          <RefreshCw className="h-3.5 w-3.5 mr-1" /> Reiniciar
        </Button>
      </header>

      {/* Grid de contenido */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden h-[calc(100vh-69px)]">
        
        {/* Columna Izquierda: Listado de Clientes y Recorrido (5 cols) */}
        <div className="lg:col-span-5 border-r border-slate-200 bg-white overflow-y-auto p-6 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100">
              <span className="text-xs text-slate-500 font-medium block">Total Cobrado</span>
              <span className="text-xl font-bold text-blue-600">${cobrado.toLocaleString("es-AR")}</span>
              <span className="text-[10px] text-slate-400 block mt-1">de ${totalACobrar.toLocaleString("es-AR")}</span>
            </div>
            <div className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-100">
              <span className="text-xs text-slate-500 font-medium block">Efectividad Visitas</span>
              <span className="text-xl font-bold text-emerald-600">{efectividad}%</span>
              <span className="text-[10px] text-slate-400 block mt-1">SLA diario</span>
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">Secuencia de Visitas</h2>
            
            <div className="space-y-3 relative before:absolute before:left-6 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
              {visitas.map((v, i) => (
                <div 
                  key={v.id} 
                  className={`relative pl-12 flex flex-col gap-2 p-4 rounded-xl border transition-all ${
                    v.estado === "Cobrado" 
                      ? "bg-slate-50 border-slate-100 opacity-60" 
                      : v.estado === "Ausente"
                        ? "bg-rose-50/30 border-rose-100 opacity-80"
                        : "bg-white border-slate-200 shadow-sm"
                  }`}
                >
                  {/* Marcador del Orden */}
                  <span className={`absolute left-3 top-4 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white z-10 ${
                    v.estado === "Cobrado" 
                      ? "bg-emerald-500" 
                      : v.estado === "Ausente"
                        ? "bg-rose-500"
                        : "bg-blue-600"
                  }`}>
                    {v.orden}
                  </span>

                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold text-slate-900 text-sm">{v.cliente}</h3>
                      <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                        <MapPin className="h-3 w-3 text-slate-400" /> {v.direccion}
                      </p>
                    </div>
                    <span className="font-bold text-slate-900 text-sm">${v.monto.toLocaleString("es-AR")}</span>
                  </div>

                  <div className="flex justify-between items-center pt-2 border-t border-slate-100">
                    <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded font-mono">Cuota {v.cuotaNro}</span>
                    {v.estado === "Pendiente" && (
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          onClick={() => updateVisitaEstado(v.id, "Ausente")}
                          className="h-7 text-xs bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 px-3 font-medium"
                        >
                          <AlertCircle className="h-3.5 w-3.5 mr-1" /> No pagó
                        </Button>
                        <Button 
                          size="sm" 
                          onClick={() => updateVisitaEstado(v.id, "Cobrado")}
                          className="h-7 text-xs bg-emerald-600 text-white hover:bg-emerald-700 px-3 font-medium"
                        >
                          <Check className="h-3.5 w-3.5 mr-1" /> Cobrado
                        </Button>
                      </div>
                    )}
                    {v.estado !== "Pendiente" && (
                      <Badge className={v.estado === "Cobrado" ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"}>
                        {v.estado}
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Columna Derecha: Mapa de ruteo simulador interactivo (7 cols) */}
        <div className="lg:col-span-7 bg-slate-900 p-6 flex flex-col justify-between relative overflow-hidden">
          
          {/* Elementos decorativos de interfaz tipo mapa GPS */}
          <div className="absolute top-6 left-6 z-10 bg-slate-950/80 backdrop-blur border border-slate-800 p-3 rounded-lg flex items-center gap-2">
            <Navigation className="h-5 w-5 text-blue-500 animate-pulse" />
            <div className="text-left">
              <span className="text-[10px] text-slate-500 uppercase font-sans">Navegador ClavMaps</span>
              <span className="text-xs text-white font-bold block">Recorrido óptimo activo</span>
            </div>
          </div>

          {/* Lienzo del Mapa (Mock SVG Canvas) */}
          <div className="flex-1 w-full flex items-center justify-center">
            <svg 
              viewBox="0 0 600 400" 
              className="w-full max-w-xl h-auto border border-slate-800 bg-slate-950/40 rounded-2xl shadow-inner"
            >
              {/* Calles mockup (cuadrículas y diagonales de ciudad) */}
              <line x1="50" y1="50" x2="550" y2="50" stroke="#334155" strokeWidth="6" strokeLinecap="round" />
              <line x1="50" y1="150" x2="550" y2="150" stroke="#334155" strokeWidth="6" strokeLinecap="round" />
              <line x1="50" y1="250" x2="550" y2="250" stroke="#334155" strokeWidth="6" strokeLinecap="round" />
              <line x1="50" y1="350" x2="550" y2="350" stroke="#334155" strokeWidth="6" strokeLinecap="round" />
              
              <line x1="100" y1="30" x2="100" y2="370" stroke="#334155" strokeWidth="6" strokeLinecap="round" />
              <line x1="250" y1="30" x2="250" y2="370" stroke="#334155" strokeWidth="6" strokeLinecap="round" />
              <line x1="400" y1="30" x2="400" y2="370" stroke="#334155" strokeWidth="6" strokeLinecap="round" />
              <line x1="520" y1="30" x2="520" y2="370" stroke="#334155" strokeWidth="6" strokeLinecap="round" />

              {/* Dotted route path */}
              <path 
                d="M 50 180 L 120 180 L 280 220 L 420 140" 
                fill="none" 
                stroke="#3b82f6" 
                strokeWidth="3" 
                strokeDasharray="6 4"
                strokeLinecap="round"
                className="animate-[dash_10s_linear_infinite]"
              />

              {/* Inicio ruteador */}
              <circle cx="50" cy="180" r="8" fill="#10b981" />
              <text x="45" y="200" fill="#10b981" className="text-[10px] font-sans font-bold">INICIO</text>

              {/* Pins de Clientes */}
              {visitas.map((v) => {
                const isSelected = v.estado === "Pendiente"
                return (
                  <g key={v.id} className="cursor-pointer">
                    {/* Ripple animation on active pins */}
                    {isSelected && (
                      <circle cx={v.coordenadas.x} cy={v.coordenadas.y} r="16" fill="#3b82f6" opacity="0.3" className="animate-ping" />
                    )}
                    {/* Pin body */}
                    <circle 
                      cx={v.coordenadas.x} 
                      cy={v.coordenadas.y} 
                      r="10" 
                      fill={
                        v.estado === "Cobrado" 
                          ? "#10b981" 
                          : v.estado === "Ausente"
                            ? "#ef4444"
                            : "#3b82f6"
                      } 
                    />
                    {/* Numero de orden */}
                    <text 
                      x={v.coordenadas.x} 
                      y={v.coordenadas.y + 4} 
                      textAnchor="middle" 
                      fill="#ffffff" 
                      className="text-[10px] font-bold font-mono"
                    >
                      {v.orden}
                    </text>
                    {/* Nombre del cliente */}
                    <text 
                      x={v.coordenadas.x} 
                      y={v.coordenadas.y - 15} 
                      textAnchor="middle" 
                      fill="#94a3b8" 
                      className="text-[10px] font-sans"
                    >
                      {v.cliente.split(" ")[0]}
                    </text>
                  </g>
                )
              })}
            </svg>
          </div>

          {/* Estado de la misión */}
          <div className="bg-slate-950/80 border border-slate-800 p-4 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Trophy className="h-6 w-6 text-amber-400" />
              <div className="text-left">
                <p className="text-white text-xs font-bold">Progreso de la Cobranza diaria</p>
                <p className="text-[10px] text-slate-400">
                  {visitas.filter(v => v.estado !== "Pendiente").length} de {visitas.length} clientes visitados.
                </p>
              </div>
            </div>
            <div className="w-32 bg-slate-800 h-2 rounded-full overflow-hidden">
              <div 
                className="bg-blue-500 h-full rounded-full" 
                style={{ width: `${(visitas.filter(v => v.estado !== "Pendiente").length / visitas.length) * 100}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
