"use client"

/**
 * POD — Proof of Delivery (Comprobante de Entrega)
 *
 * Módulo táctil para choferes / repartidores en campo.
 * Optimizado para uso con teléfono, sin teclado.
 *
 * Aplica a: distribución, logística
 *
 * Flujo completo:
 *  1. Chofer abre app con número de hoja de ruta
 *  2. Ve la parada actual (cliente, dirección, bultos esperados)
 *  3. Entrega:
 *     a. Captura firma digital (canvas touch)
 *     b. Toma foto del remito firmado (camera API)
 *     c. Geolocalización automática con timestamp
 *     d. Confirma → parada marcada como "entregada"
 *  4. No entrega:
 *     a. Selecciona motivo (parametrizable)
 *     b. Foto del local cerrado / evidencia
 *     c. Reagendamiento o devolución al depósito
 *
 * TODO (requiere schema migration):
 *  - Modelo ParadaRuta: agregar campos fotoUrl, firmaBase64, latEntrega, lngEntrega, motivoNoEntrega
 *  - Actualmente se registra vía PATCH /api/distribucion/paradas/[id]
 */

import { useState, useRef, useEffect, useCallback } from "react"
import { MapPin, Camera, PenLine, CheckCircle2, XCircle, Truck, Clock, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Input } from "@/components/ui/input"

interface ParadaRuta {
  id: number
  orden: number
  estado: string
  observaciones?: string
  cliente: { nombre: string; direccion?: string; telefono?: string }
  envio?: {
    id: number
    numeroSeguimiento: string
    bultos?: number
    pesoKg?: number
  }
}

interface HojaRuta {
  id: number
  numero: string
  fecha: string
  estado: string
  chofer?: { nombre: string }
  vehiculo?: { patente: string }
  paradas: ParadaRuta[]
}

const MOTIVOS_NO_ENTREGA = [
  "Ausente / No atendió",
  "Local cerrado",
  "Rechazó la mercadería",
  "Dirección incorrecta",
  "No tiene efectivo / no puede pagar",
  "Mercadería dañada",
  "Fuera de horario",
  "Otro",
]

function FirmaCanvas({ onFirma }: { onFirma: (base64: string | null) => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const dibujando = useRef(false)
  const [tieneFirma, setTieneFirma] = useState(false)

  const getPos = (e: React.TouchEvent | React.MouseEvent, canvas: HTMLCanvasElement) => {
    const rect = canvas.getBoundingClientRect()
    if ("touches" in e) {
      return { x: e.touches[0].clientX - rect.left, y: e.touches[0].clientY - rect.top }
    }
    return { x: (e as React.MouseEvent).clientX - rect.left, y: (e as React.MouseEvent).clientY - rect.top }
  }

  const start = (e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault()
    const canvas = canvasRef.current!
    const ctx = canvas.getContext("2d")!
    dibujando.current = true
    const { x, y } = getPos(e, canvas)
    ctx.beginPath()
    ctx.moveTo(x, y)
  }

  const draw = (e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault()
    if (!dibujando.current) return
    const canvas = canvasRef.current!
    const ctx = canvas.getContext("2d")!
    const { x, y } = getPos(e, canvas)
    ctx.lineTo(x, y)
    ctx.strokeStyle = "#1e293b"
    ctx.lineWidth = 2.5
    ctx.lineCap = "round"
    ctx.stroke()
    setTieneFirma(true)
  }

  const end = () => {
    dibujando.current = false
    if (tieneFirma && canvasRef.current) {
      onFirma(canvasRef.current.toDataURL("image/png"))
    }
  }

  const limpiar = () => {
    const canvas = canvasRef.current!
    canvas.getContext("2d")!.clearRect(0, 0, canvas.width, canvas.height)
    setTieneFirma(false)
    onFirma(null)
  }

  return (
    <div className="space-y-2">
      <div className="relative border-2 border-dashed rounded-xl overflow-hidden bg-white" style={{ height: 120 }}>
        <canvas
          ref={canvasRef}
          width={400}
          height={120}
          className="w-full h-full touch-none"
          onMouseDown={start}
          onMouseMove={draw}
          onMouseUp={end}
          onTouchStart={start}
          onTouchMove={draw}
          onTouchEnd={end}
        />
        {!tieneFirma && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <p className="text-slate-400 text-sm flex items-center gap-2">
              <PenLine className="h-4 w-4" /> Firmá aquí
            </p>
          </div>
        )}
      </div>
      {tieneFirma && (
        <Button variant="outline" size="sm" onClick={limpiar} className="text-xs h-7">
          Borrar firma
        </Button>
      )}
    </div>
  )
}

export default function PODPage() {
  const [hojaRuta, setHojaRuta] = useState<HojaRuta | null>(null)
  const [numeroHoja, setNumeroHoja] = useState("")
  const [paradaIndex, setParadaIndex] = useState(0)
  const [firma, setFirma] = useState<string | null>(null)
  const [motivoNoEntrega, setMotivoNoEntrega] = useState("")
  const [geoStatus, setGeoStatus] = useState<"idle" | "obteniendo" | "ok" | "error">("idle")
  const [geo, setGeo] = useState<{ lat: number; lng: number } | null>(null)
  const [procesando, setProcesando] = useState(false)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null

  const buscarHoja = async () => {
    if (!numeroHoja.trim()) return
    setLoading(true); setError("")
    try {
      const res = await fetch(`/api/distribucion/hojas-ruta?numero=${encodeURIComponent(numeroHoja)}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      if (!res.ok) { setError("Hoja de ruta no encontrada"); return }
      const data = await res.json()
      const hoja = Array.isArray(data) ? data[0] : data
      if (!hoja) { setError("Hoja de ruta no encontrada"); return }
      setHojaRuta(hoja)
      setParadaIndex(0)
    } finally { setLoading(false) }
  }

  const obtenerGeo = () => {
    setGeoStatus("obteniendo")
    navigator.geolocation.getCurrentPosition(
      (pos) => { setGeo({ lat: pos.coords.latitude, lng: pos.coords.longitude }); setGeoStatus("ok") },
      () => setGeoStatus("error"),
      { timeout: 10000 }
    )
  }

  const confirmarEntrega = async (entregado: boolean) => {
    if (!hojaRuta) return
    const parada = hojaRuta.paradas[paradaIndex]
    if (!parada) return

    if (entregado && !firma) { setError("Necesitás capturar la firma del receptor"); return }
    if (!entregado && !motivoNoEntrega) { setError("Seleccioná el motivo de no entrega"); return }

    setProcesando(true); setError("")
    try {
      const payload: Record<string, unknown> = {
        estado: entregado ? "entregado" : "no_entregado",
        observaciones: entregado ? undefined : motivoNoEntrega,
        // En producción: enviar firmaBase64, fotoUrl, lat, lng
        // Requiere schema migration para agregar esos campos a ParadaRuta
      }
      if (geo) { payload.lat = geo.lat; payload.lng = geo.lng }

      await fetch(`/api/distribucion/paradas/${parada.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify(payload),
      })

      // Mover a la siguiente parada
      const siguientes = hojaRuta.paradas.filter((_, i) => i > paradaIndex && _.estado !== "entregado")
      if (siguientes.length > 0) {
        setParadaIndex(hojaRuta.paradas.indexOf(siguientes[0]))
        setFirma(null); setMotivoNoEntrega(""); setGeo(null); setGeoStatus("idle")
      } else {
        setHojaRuta({ ...hojaRuta, estado: "completada" })
      }
    } finally { setProcesando(false) }
  }

  const parada = hojaRuta?.paradas[paradaIndex]
  const entregadas = hojaRuta?.paradas.filter((p) => p.estado === "entregado").length ?? 0
  const total = hojaRuta?.paradas.length ?? 0

  if (!hojaRuta) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Truck className="h-6 w-6 text-emerald-600" />
            POD — Comprobante de Entrega
          </h1>
          <p className="text-muted-foreground text-sm">Confirmación digital de entregas en ruta</p>
        </div>

        <Card className="max-w-sm mx-auto mt-12">
          <CardHeader><CardTitle className="text-center">Ingresar Hoja de Ruta</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {error && <Alert variant="destructive"><AlertDescription className="text-xs">{error}</AlertDescription></Alert>}
            <Input
              placeholder="Ej: HR-00042"
              value={numeroHoja}
              onChange={(e) => setNumeroHoja(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && buscarHoja()}
              className="text-center text-lg"
            />
            <Button className="w-full" onClick={buscarHoja} disabled={loading}>
              {loading ? "Buscando..." : "Abrir Hoja de Ruta"}
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (hojaRuta.estado === "completada" || entregadas === total) {
    return (
      <div className="flex flex-col items-center justify-center min-h-96 gap-6 text-center">
        <CheckCircle2 className="h-24 w-24 text-green-500" />
        <div>
          <p className="text-3xl font-bold text-green-600">Ruta completada</p>
          <p className="text-muted-foreground mt-1">{hojaRuta.numero} — {entregadas} de {total} entregas</p>
        </div>
        <Button onClick={() => { setHojaRuta(null); setNumeroHoja("") }}>Nueva hoja de ruta</Button>
      </div>
    )
  }

  return (
    <div className="max-w-lg mx-auto space-y-4">
      {/* Header ruta */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-bold">{hojaRuta.numero}</h2>
          <p className="text-xs text-muted-foreground">
            {hojaRuta.chofer?.nombre} · {hojaRuta.vehiculo?.patente}
          </p>
        </div>
        <div className="text-right">
          <p className="text-xl font-bold text-emerald-600">{entregadas}/{total}</p>
          <div className="w-24 h-2 bg-muted rounded-full overflow-hidden mt-1">
            <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${(entregadas / total) * 100}%` }} />
          </div>
        </div>
      </div>

      {error && <Alert variant="destructive"><AlertDescription className="text-xs">{error}</AlertDescription></Alert>}

      {/* Parada actual */}
      {parada && (
        <Card className="border-2 border-emerald-500">
          <CardContent className="p-4 space-y-4">
            <div>
              <Badge className="mb-2 text-xs">Parada {paradaIndex + 1} de {total}</Badge>
              <h3 className="text-xl font-bold">{parada.cliente.nombre}</h3>
              {parada.cliente.direccion && (
                <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                  <MapPin className="h-3.5 w-3.5" />{parada.cliente.direccion}
                </p>
              )}
              {parada.envio && (
                <div className="mt-2 p-2 rounded-lg bg-muted/50 text-sm">
                  <p>Envío: <span className="font-mono font-medium">{parada.envio.numeroSeguimiento}</span></p>
                  {parada.envio.bultos && <p>Bultos: <strong>{parada.envio.bultos}</strong></p>}
                </div>
              )}
            </div>

            {/* Geolocalización */}
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1">Ubicación</p>
              {geoStatus === "idle" && (
                <Button variant="outline" size="sm" className="gap-2 h-8 text-xs" onClick={obtenerGeo}>
                  <MapPin className="h-3.5 w-3.5" /> Capturar ubicación
                </Button>
              )}
              {geoStatus === "obteniendo" && <p className="text-xs text-muted-foreground animate-pulse">Obteniendo GPS...</p>}
              {geoStatus === "ok" && geo && (
                <p className="text-xs text-green-600 flex items-center gap-1">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  {geo.lat.toFixed(5)}, {geo.lng.toFixed(5)}
                </p>
              )}
              {geoStatus === "error" && (
                <p className="text-xs text-orange-600 flex items-center gap-1">
                  <AlertCircle className="h-3.5 w-3.5" /> Sin GPS — se registrará sin coordenadas
                </p>
              )}
            </div>

            {/* Firma */}
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1">Firma del receptor</p>
              <FirmaCanvas onFirma={setFirma} />
              {firma && <p className="text-xs text-green-600 flex items-center gap-1 mt-1"><CheckCircle2 className="h-3 w-3" /> Firma capturada</p>}
            </div>

            {/* Foto remito (placeholder — requiere File API) */}
            <div className="p-3 rounded-xl border border-dashed text-center text-xs text-muted-foreground">
              <Camera className="h-5 w-5 mx-auto mb-1 opacity-40" />
              Foto del remito firmado (próximamente — requiere integración nativa)
            </div>

            {/* Botones confirmar */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <Button
                className="bg-green-600 hover:bg-green-700 h-14 text-base font-bold"
                onClick={() => confirmarEntrega(true)}
                disabled={procesando}
              >
                <CheckCircle2 className="h-5 w-5 mr-2" />
                Entregado
              </Button>
              <Button
                variant="outline"
                className="border-red-400 text-red-600 hover:bg-red-50 h-14 text-base font-bold"
                onClick={() => confirmarEntrega(false)}
                disabled={procesando || !motivoNoEntrega}
              >
                <XCircle className="h-5 w-5 mr-2" />
                No entregado
              </Button>
            </div>

            {/* Motivo no entrega */}
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1">Motivo de no entrega</p>
              <Select value={motivoNoEntrega} onValueChange={setMotivoNoEntrega}>
                <SelectTrigger className="text-sm">
                  <SelectValue placeholder="Seleccionar motivo..." />
                </SelectTrigger>
                <SelectContent>
                  {MOTIVOS_NO_ENTREGA.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Lista de paradas restantes */}
      <div className="space-y-2">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Próximas paradas</p>
        {hojaRuta.paradas.map((p, i) => i !== paradaIndex && (
          <div key={p.id} className={`flex items-center gap-3 p-3 rounded-lg border text-sm ${p.estado === "entregado" ? "opacity-50 bg-muted/30" : ""}`}>
            <div className={`h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold ${p.estado === "entregado" ? "bg-green-500 text-white" : "bg-muted text-muted-foreground"}`}>
              {p.estado === "entregado" ? "✓" : p.orden}
            </div>
            <div>
              <p className="font-medium">{p.cliente.nombre}</p>
              <p className="text-xs text-muted-foreground">{p.cliente.direccion}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
