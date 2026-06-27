"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import {
  CheckCircle2,
  ExternalLink,
  MapPin,
  Navigation,
  Plus,
  RefreshCw,
  Route,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { CampoMapaLibre, type CampoMapPin } from "@/components/claver-cloud/campo-mapa-libre"
import { CloudPageHeader } from "@/components/claver-cloud/cloud-page-header"
import { cloudAuthHeaders } from "@/lib/claver-cloud/auth-headers"
import {
  HOJA_RUTA_CONTEXTOS,
  PARADA_ESTADOS,
  buildOsmDirectionsUrl,
  type HojaRutaContexto,
} from "@/lib/maps/hoja-ruta-catalog"
import { cn } from "@/lib/utils"

type MapaPin = {
  id: string
  tipo: "lead" | "relevamiento" | "parada"
  refId: number
  nombre: string
  subtitulo: string | null
  direccion: string | null
  localidad: string | null
  rubro: string | null
  etapa: string
  lat: number
  lon: number
  telefono: string | null
}

type HojaParada = {
  id: number
  orden: number
  nombre: string
  direccion: string | null
  localidad: string | null
  lat: number | null
  lon: number | null
  telefono: string | null
  rubro: string | null
  origenTipo: string | null
  origenId: number | null
  estado: string
  notas: string | null
}

type HojaRuta = {
  id: number
  titulo: string
  fecha: string
  contexto: string
  rubro: string | null
  estado: string
  notas: string | null
  paradas: HojaParada[]
}

const fmtFecha = (iso: string) =>
  new Intl.DateTimeFormat("es-AR", { day: "2-digit", month: "2-digit", year: "numeric" }).format(
    new Date(iso),
  )

const hoyIso = () => new Date().toISOString().slice(0, 10)

export default function CampoMapaPage() {
  const [tab, setTab] = useState("mapa")
  const [pins, setPins] = useState<MapaPin[]>([])
  const [sinCoordenadas, setSinCoordenadas] = useState(0)
  const [loadingMapa, setLoadingMapa] = useState(false)
  const [filtroRubro, setFiltroRubro] = useState("")
  const [seleccionados, setSeleccionados] = useState<Set<string>>(new Set())

  const [hojas, setHojas] = useState<HojaRuta[]>([])
  const [hojaActiva, setHojaActiva] = useState<HojaRuta | null>(null)
  const [loadingHojas, setLoadingHojas] = useState(false)
  const [creando, setCreando] = useState(false)
  const [routeLine, setRouteLine] = useState<{ lat: number; lon: number }[]>([])

  const [nuevaHoja, setNuevaHoja] = useState({
    titulo: "",
    fecha: hoyIso(),
    contexto: "comercial" as HojaRutaContexto,
    rubro: "",
    notas: "",
  })

  const rubrosDisponibles = useMemo(() => {
    const set = new Set<string>()
    pins.forEach((p) => {
      if (p.rubro) set.add(p.rubro)
    })
    return Array.from(set).sort()
  }, [pins])

  const cargarMapa = useCallback(async () => {
    setLoadingMapa(true)
    try {
      const qs = filtroRubro ? `?rubro=${encodeURIComponent(filtroRubro)}` : ""
      const res = await fetch(`/api/claver/comercial/mapa${qs}`, { headers: cloudAuthHeaders() })
      if (res.ok) {
        const data = await res.json()
        setPins(data.pins ?? [])
        setSinCoordenadas(data.sinCoordenadas ?? 0)
      }
    } finally {
      setLoadingMapa(false)
    }
  }, [filtroRubro])

  const cargarHojas = useCallback(async () => {
    setLoadingHojas(true)
    try {
      const res = await fetch("/api/claver/comercial/hojas-ruta", { headers: cloudAuthHeaders() })
      if (res.ok) setHojas(await res.json())
    } finally {
      setLoadingHojas(false)
    }
  }, [])

  useEffect(() => {
    void cargarMapa()
    void cargarHojas()
  }, [cargarMapa, cargarHojas])

  const toggleSeleccion = (id: string) => {
    setSeleccionados((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const pinsSeleccionados = pins.filter((p) => seleccionados.has(p.id))

  const mapPins: CampoMapPin[] = useMemo(() => {
    if (hojaActiva) {
      return hojaActiva.paradas
        .filter((p) => p.lat != null && p.lon != null)
        .map((p) => ({
          id: `parada-${p.id}`,
          nombre: p.nombre,
          subtitulo: p.localidad,
          etapa: p.estado,
          lat: p.lat!,
          lon: p.lon!,
          orden: p.orden,
        }))
    }
    return pins.map((p) => ({
      id: p.id,
      nombre: p.nombre,
      subtitulo: p.subtitulo,
      etapa: p.etapa,
      lat: p.lat,
      lon: p.lon,
      selected: seleccionados.has(p.id),
    }))
  }, [pins, seleccionados, hojaActiva])

  const fetchOsrmRoute = useCallback(async (coords: { lat: number; lon: number }[]) => {
    if (coords.length < 2) {
      setRouteLine([])
      return
    }
    const path = coords.map((c) => `${c.lon},${c.lat}`).join(";")
    try {
      const res = await fetch(
        `https://router.project-osrm.org/route/v1/driving/${path}?overview=full&geometries=geojson`,
      )
      if (!res.ok) {
        setRouteLine(coords)
        return
      }
      const data = await res.json()
      const geometry = data.routes?.[0]?.geometry?.coordinates as [number, number][] | undefined
      if (geometry?.length) {
        setRouteLine(geometry.map(([lon, lat]) => ({ lat, lon })))
      } else {
        setRouteLine(coords)
      }
    } catch {
      setRouteLine(coords)
    }
  }, [])

  useEffect(() => {
    if (!hojaActiva) {
      setRouteLine([])
      return
    }
    const coords = hojaActiva.paradas
      .filter((p) => p.lat != null && p.lon != null)
      .sort((a, b) => a.orden - b.orden)
      .map((p) => ({ lat: p.lat!, lon: p.lon! }))
    void fetchOsrmRoute(coords)
  }, [hojaActiva, fetchOsrmRoute])

  async function crearHojaDesdeSeleccion() {
    if (pinsSeleccionados.length === 0) return
    setCreando(true)
    try {
      const titulo =
        nuevaHoja.titulo.trim() ||
        `Ruta ${fmtFecha(nuevaHoja.fecha)} — ${pinsSeleccionados.length} paradas`
      const res = await fetch("/api/claver/comercial/hojas-ruta", {
        method: "POST",
        headers: cloudAuthHeaders(true),
        body: JSON.stringify({
          titulo,
          fecha: nuevaHoja.fecha,
          contexto: nuevaHoja.contexto,
          rubro: nuevaHoja.rubro || filtroRubro || null,
          notas: nuevaHoja.notas || null,
          paradas: pinsSeleccionados.map((p) => ({
            nombre: p.nombre,
            direccion: p.direccion,
            localidad: p.localidad,
            telefono: p.telefono,
            rubro: p.rubro,
            lat: p.lat,
            lon: p.lon,
            origenTipo: p.tipo,
            origenId: p.refId,
          })),
        }),
      })
      if (res.ok) {
        const hoja = (await res.json()) as HojaRuta
        setHojaActiva(hoja)
        setSeleccionados(new Set())
        setTab("ruta")
        void cargarHojas()
      }
    } finally {
      setCreando(false)
    }
  }

  async function marcarParada(paradaId: number, estado: string) {
    const res = await fetch(`/api/claver/comercial/hojas-ruta/paradas/${paradaId}`, {
      method: "PATCH",
      headers: cloudAuthHeaders(true),
      body: JSON.stringify({ estado }),
    })
    if (res.ok) {
      const hoja = (await res.json()) as HojaRuta
      setHojaActiva(hoja)
      void cargarHojas()
    }
  }

  const osmUrl = hojaActiva
    ? buildOsmDirectionsUrl(
        hojaActiva.paradas
          .filter((p) => p.lat != null && p.lon != null)
          .sort((a, b) => a.orden - b.orden)
          .map((p) => ({ lat: p.lat!, lon: p.lon! })),
      )
    : null

  return (
    <div className="flex flex-col gap-6 p-4 pb-24 sm:p-6 max-w-6xl mx-auto w-full">
      <CloudPageHeader
        title="Mapa y hoja de ruta"
        description="OpenStreetMap gratis — planificá visitas para cualquier rubro (comercial, logística, servicio, cobranza)."
        actions={
          <Button variant="outline" size="sm" asChild>
            <Link href="/claver-cloud/comercial/relevamientos">
              <MapPin className="h-4 w-4 mr-1.5" />
              Relevamiento
            </Link>
          </Button>
        }
      />

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="mapa">Mapa campo</TabsTrigger>
          <TabsTrigger value="ruta">Hoja de ruta</TabsTrigger>
        </TabsList>

        <TabsContent value="mapa" className="space-y-4 mt-4">
          <div className="flex flex-wrap gap-2 items-end">
            <div className="grid gap-1.5 min-w-[140px]">
              <Label className="text-xs">Filtrar rubro</Label>
              <Select value={filtroRubro || "__all"} onValueChange={(v) => setFiltroRubro(v === "__all" ? "" : v)}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all">Todos los rubros</SelectItem>
                  {rubrosDisponibles.map((r) => (
                    <SelectItem key={r} value={r}>
                      {r}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button variant="outline" size="sm" onClick={() => void cargarMapa()} disabled={loadingMapa}>
              <RefreshCw className={cn("h-4 w-4 mr-1.5", loadingMapa && "animate-spin")} />
              Actualizar
            </Button>
            {sinCoordenadas > 0 && (
              <Badge variant="secondary" className="text-xs">
                {sinCoordenadas} sin coordenadas (geocodifica al refrescar)
              </Badge>
            )}
          </div>

          <CampoMapaLibre
            pins={mapPins}
            className="h-[min(52vh,420px)]"
            onPinClick={(pin) => {
              if (!hojaActiva) toggleSeleccion(pin.id)
            }}
          />

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Route className="h-4 w-4 text-violet-400" />
                Armar hoja de ruta ({seleccionados.size} seleccionados)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-3">
                <div className="grid gap-1.5">
                  <Label>Título</Label>
                  <Input
                    placeholder={`Ruta ${fmtFecha(nuevaHoja.fecha)}`}
                    value={nuevaHoja.titulo}
                    onChange={(e) => setNuevaHoja((f) => ({ ...f, titulo: e.target.value }))}
                  />
                </div>
                <div className="grid gap-1.5">
                  <Label>Fecha</Label>
                  <Input
                    type="date"
                    value={nuevaHoja.fecha}
                    onChange={(e) => setNuevaHoja((f) => ({ ...f, fecha: e.target.value }))}
                  />
                </div>
                <div className="grid gap-1.5">
                  <Label>Proceso / contexto</Label>
                  <Select
                    value={nuevaHoja.contexto}
                    onValueChange={(v) =>
                      setNuevaHoja((f) => ({ ...f, contexto: v as HojaRutaContexto }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {HOJA_RUTA_CONTEXTOS.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-1.5">
                  <Label>Rubro (opcional)</Label>
                  <Input
                    placeholder="almacen, distribución, veterinaria…"
                    value={nuevaHoja.rubro}
                    onChange={(e) => setNuevaHoja((f) => ({ ...f, rubro: e.target.value }))}
                  />
                </div>
              </div>
              <div className="grid gap-1.5">
                <Label>Notas</Label>
                <Textarea
                  rows={2}
                  placeholder="Objetivo del día, zona, speech…"
                  value={nuevaHoja.notas}
                  onChange={(e) => setNuevaHoja((f) => ({ ...f, notas: e.target.value }))}
                />
              </div>

              <div className="max-h-48 overflow-y-auto space-y-1.5 border rounded-lg p-2">
                {pins.length === 0 ? (
                  <p className="text-sm text-muted-foreground p-2">
                    No hay pins con coordenadas. Cargá leads o relevamientos con localidad/dirección.
                  </p>
                ) : (
                  pins.map((p) => (
                    <label
                      key={p.id}
                      className="flex items-start gap-2 rounded-md p-2 hover:bg-muted/40 cursor-pointer text-sm"
                    >
                      <Checkbox
                        checked={seleccionados.has(p.id)}
                        onCheckedChange={() => toggleSeleccion(p.id)}
                      />
                      <span className="min-w-0 flex-1">
                        <span className="font-medium block truncate">{p.nombre}</span>
                        <span className="text-xs text-muted-foreground">
                          {p.tipo} · {p.etapa}
                          {p.localidad ? ` · ${p.localidad}` : ""}
                        </span>
                      </span>
                    </label>
                  ))
                )}
              </div>

              <Button
                className="w-full bg-violet-600 hover:bg-violet-500"
                disabled={creando || seleccionados.size === 0}
                onClick={() => void crearHojaDesdeSeleccion()}
              >
                <Plus className="h-4 w-4 mr-2" />
                {creando ? "Creando…" : `Crear hoja con ${seleccionados.size} paradas`}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ruta" className="space-y-4 mt-4">
          <div className="grid lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-2 flex-row items-center justify-between">
                <CardTitle className="text-base">Mis hojas</CardTitle>
                <Button variant="ghost" size="icon" onClick={() => void cargarHojas()} disabled={loadingHojas}>
                  <RefreshCw className={cn("h-4 w-4", loadingHojas && "animate-spin")} />
                </Button>
              </CardHeader>
              <CardContent className="space-y-2 max-h-[360px] overflow-y-auto">
                {hojas.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Todavía no tenés hojas de ruta.</p>
                ) : (
                  hojas.map((h) => (
                    <button
                      key={h.id}
                      type="button"
                      onClick={() => {
                        setHojaActiva(h)
                        setTab("ruta")
                      }}
                      className={cn(
                        "w-full text-left rounded-lg border p-3 text-sm transition-colors",
                        hojaActiva?.id === h.id
                          ? "border-violet-500/50 bg-violet-500/10"
                          : "hover:bg-muted/40",
                      )}
                    >
                      <div className="flex justify-between gap-2">
                        <span className="font-medium">{h.titulo}</span>
                        <Badge variant="outline" className="text-[10px] shrink-0">
                          {h.estado}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {fmtFecha(h.fecha)} · {h.paradas.length} paradas · {h.contexto}
                      </p>
                    </button>
                  ))
                )}
              </CardContent>
            </Card>

            <div className="space-y-4">
              {hojaActiva ? (
                <>
                  <CampoMapaLibre pins={mapPins} routeLine={routeLine} className="h-[min(40vh,320px)]" />
                  <Card>
                    <CardHeader className="pb-2">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <CardTitle className="text-base">{hojaActiva.titulo}</CardTitle>
                        {osmUrl && (
                          <Button variant="outline" size="sm" asChild>
                            <a href={osmUrl} target="_blank" rel="noopener noreferrer">
                              <Navigation className="h-4 w-4 mr-1.5" />
                              Abrir en OSM
                              <ExternalLink className="h-3 w-3 ml-1 opacity-60" />
                            </a>
                          </Button>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {hojaActiva.paradas.map((p) => (
                        <div key={p.id} className="rounded-lg border p-3 text-sm">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className="font-medium">
                                {p.orden}. {p.nombre}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {[p.direccion, p.localidad].filter(Boolean).join(" · ") || "Sin dirección"}
                                {p.telefono ? ` · ${p.telefono}` : ""}
                              </p>
                            </div>
                            <Badge variant="secondary" className="text-[10px] shrink-0">
                              {p.estado}
                            </Badge>
                          </div>
                          <div className="flex flex-wrap gap-1.5 mt-2">
                            {PARADA_ESTADOS.map((e) => (
                              <Button
                                key={e.id}
                                size="sm"
                                variant={p.estado === e.id ? "default" : "outline"}
                                className="h-7 text-xs"
                                onClick={() => void marcarParada(p.id, e.id)}
                              >
                                {e.id === "visitada" && <CheckCircle2 className="h-3 w-3 mr-1" />}
                                {e.label}
                              </Button>
                            ))}
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </>
              ) : (
                <Card>
                  <CardContent className="py-12 text-center text-sm text-muted-foreground">
                    Seleccioná una hoja o creá una desde el mapa con pins del pipeline y relevamientos.
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}