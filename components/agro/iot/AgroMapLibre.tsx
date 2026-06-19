"use client"

import { useEffect, useRef, useState } from "react"
import maplibregl from "maplibre-gl"
import "maplibre-gl/dist/maplibre-gl.css"
import { cn } from "@/lib/utils"

// ─── Tipos de datos del mapa ─────────────────────────────────────────────────

export type SensorPin = {
  id: number
  nombre: string
  tipo: string
  lat: number
  lon: number
  activo: boolean
}

export type ZonaRiegoPin = {
  id: number
  nombre: string
  activa: boolean
  tipoRiego: string
}

export type MaquinaPin = {
  id: number
  nombre: string
  marca: string
  operacion: string | null
  lat: number
  lon: number
}

export type MapaLoteData = {
  lote: {
    id: number
    nombre: string
    lat: number
    lon: number
    cultivoActual?: string | null
    superficieHa: number
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    geoJson: any
  }
  sensores: SensorPin[]
  zonas: ZonaRiegoPin[]
  maquinas: MaquinaPin[]
  ndviMedio: number
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Convierte NDVI 0-1 a color hex OSM-friendly */
function ndviColor(ndvi: number): string {
  if (ndvi < 0.3) return "#ef4444" // rojo — estrés
  if (ndvi < 0.5) return "#f59e0b" // naranja — moderado
  if (ndvi < 0.65) return "#84cc16" // verde claro — bueno
  return "#16a34a" // verde — excelente
}

function ndviOpacity(ndvi: number): number {
  return ndvi < 0.3 ? 0.5 : ndvi < 0.5 ? 0.4 : 0.3
}

function tipoColor(tipo: string): string {
  switch (tipo) {
    case "HUMEDAD_SUELO": return "#3b82f6"
    case "TEMPERATURA_SUELO": return "#f97316"
    case "TEMPERATURA_AIRE": return "#a78bfa"
    case "CAUDAL_RIEGO": return "#06b6d4"
    case "PRESION_AGUA": return "#10b981"
    case "LLUVIA": return "#6366f1"
    case "VIENTO": return "#64748b"
    default: return "#6b7280"
  }
}

function tipoEmoji(tipo: string): string {
  switch (tipo) {
    case "HUMEDAD_SUELO": return "💧"
    case "TEMPERATURA_SUELO": return "🌡️"
    case "TEMPERATURA_AIRE": return "💨"
    case "CAUDAL_RIEGO": return "🚿"
    case "PRESION_AGUA": return "📊"
    case "LLUVIA": return "🌧️"
    case "VIENTO": return "🌬️"
    default: return "📡"
  }
}

// ─── Capas toggle ──────────────────────────────────────────────────────────

type LayerKey = "sensores" | "riego" | "maquinaria" | "ndvi"

const LAYER_LABELS: Record<LayerKey, string> = {
  sensores: "Sensores",
  riego: "Zonas riego",
  maquinaria: "Maquinaria",
  ndvi: "NDVI",
}

// ─── Componente principal ────────────────────────────────────────────────────

interface AgroMapLibreProps {
  data: MapaLoteData
  className?: string
}

export function AgroMapLibre({ data, className }: AgroMapLibreProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<maplibregl.Map | null>(null)
  const markersRef = useRef<maplibregl.Marker[]>([])
  const [layers, setLayers] = useState<Record<LayerKey, boolean>>({
    sensores: true,
    riego: true,
    maquinaria: true,
    ndvi: true,
  })

  // Inicializar el mapa una sola vez
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: {
        version: 8,
        sources: {
          osm: {
            type: "raster",
            tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
            tileSize: 256,
            attribution: "© OpenStreetMap contributors",
          },
        },
        layers: [
          {
            id: "osm-tiles",
            type: "raster",
            source: "osm",
            minzoom: 0,
            maxzoom: 19,
          },
        ],
      },
      center: [data.lote.lon, data.lote.lat],
      zoom: 13,
    })

    map.addControl(new maplibregl.NavigationControl(), "top-right")
    map.addControl(new maplibregl.ScaleControl({ maxWidth: 100, unit: "metric" }))

    map.on("load", () => {
      // ── Capa NDVI (fill del polígono del lote) ──────────────────────────
      const geo = data.lote.geoJson
      const feature = geo?.type === "FeatureCollection"
        ? geo.features?.[0]
        : geo?.type === "Feature"
          ? geo
          : { type: "Feature", geometry: geo, properties: {} }

      if (feature?.geometry) {
        map.addSource("lote-geojson", {
          type: "geojson",
          data: {
            type: "FeatureCollection",
            features: [
              {
                ...feature,
                properties: {
                  ...feature.properties,
                  ndvi: data.ndviMedio,
                  nombre: data.lote.nombre,
                },
              },
            ],
          },
        })

        // contorno del lote
        map.addLayer({
          id: "lote-outline",
          type: "line",
          source: "lote-geojson",
          paint: {
            "line-color": "#1d4ed8",
            "line-width": 2.5,
            "line-dasharray": [4, 2],
          },
        })

        // fill NDVI (color según valor)
        map.addLayer(
          {
            id: "lote-ndvi-fill",
            type: "fill",
            source: "lote-geojson",
            paint: {
              "fill-color": ndviColor(data.ndviMedio),
              "fill-opacity": ndviOpacity(data.ndviMedio),
            },
          },
          "lote-outline"
        )
      }
    })

    mapRef.current = map

    return () => {
      markersRef.current.forEach((m) => m.remove())
      markersRef.current = []
      map.remove()
      mapRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Actualizar marcadores cuando cambian layers o data
  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    const render = () => {
      // limpiar marcadores anteriores
      markersRef.current.forEach((m) => m.remove())
      markersRef.current = []

      // ── Sensores ──────────────────────────────────────────────────────
      if (layers.sensores) {
        data.sensores.forEach((s) => {
          const el = document.createElement("div")
          el.title = `${s.nombre} (${s.tipo})`
          el.style.cssText = `
            width:28px;height:28px;border-radius:50%;cursor:pointer;
            background:${tipoColor(s.tipo)};border:2px solid white;
            display:flex;align-items:center;justify-content:center;
            font-size:13px;box-shadow:0 2px 6px rgba(0,0,0,0.35);
            ${!s.activo ? "opacity:0.45;filter:grayscale(1);" : ""}
          `
          el.textContent = tipoEmoji(s.tipo)

          const popup = new maplibregl.Popup({ offset: 18, closeButton: true })
            .setHTML(`
              <strong style="font-size:13px">${s.nombre}</strong><br/>
              <span style="font-size:11px;color:#6b7280">${s.tipo.replace(/_/g, " ")}</span><br/>
              <span style="font-size:11px">${s.activo ? "🟢 Activo" : "🔴 Inactivo"}</span>
            `)

          const marker = new maplibregl.Marker({ element: el })
            .setLngLat([s.lon, s.lat])
            .setPopup(popup)
            .addTo(map)

          markersRef.current.push(marker)
        })
      }

      // ── Maquinaria GPS ────────────────────────────────────────────────
      if (layers.maquinaria) {
        data.maquinas.forEach((m) => {
          const el = document.createElement("div")
          el.title = `${m.nombre} — ${m.operacion ?? "sin operación"}`
          el.style.cssText = `
            width:32px;height:32px;border-radius:6px;cursor:pointer;
            background:#f59e0b;border:2px solid white;
            display:flex;align-items:center;justify-content:center;
            font-size:16px;box-shadow:0 2px 6px rgba(0,0,0,0.35);
          `
          el.textContent = "🚜"

          const popup = new maplibregl.Popup({ offset: 20, closeButton: true })
            .setHTML(`
              <strong style="font-size:13px">${m.nombre}</strong><br/>
              <span style="font-size:11px;color:#6b7280">${m.marca}</span><br/>
              <span style="font-size:11px">Operación: ${m.operacion ?? "—"}</span>
            `)

          const marker = new maplibregl.Marker({ element: el })
            .setLngLat([m.lon, m.lat])
            .setPopup(popup)
            .addTo(map)

          markersRef.current.push(marker)
        })
      }

      // ── Zonas de riego (marcadores badge) ─────────────────────────────
      if (layers.riego) {
        data.zonas.forEach((z, i) => {
          const latZ = data.lote.lat + ((i % 3) - 1) * 0.004
          const lonZ = data.lote.lon + ((i % 5) - 2) * 0.004
          const el = document.createElement("div")
          el.title = `${z.nombre} — ${z.tipoRiego}`
          el.style.cssText = `
            padding:3px 8px;border-radius:12px;cursor:pointer;font-size:11px;font-weight:600;
            background:${z.activa ? "#2563eb" : "#94a3b8"};color:white;
            box-shadow:0 2px 6px rgba(0,0,0,0.35);white-space:nowrap;
            border:1.5px solid white;
          `
          el.textContent = `💧 ${z.nombre}`

          const popup = new maplibregl.Popup({ offset: 18, closeButton: true })
            .setHTML(`
              <strong style="font-size:13px">${z.nombre}</strong><br/>
              <span style="font-size:11px;color:#6b7280">${z.tipoRiego}</span><br/>
              <span style="font-size:11px">${z.activa ? "🟢 Regando" : "⚪ Inactiva"}</span>
            `)

          const marker = new maplibregl.Marker({ element: el })
            .setLngLat([lonZ, latZ])
            .setPopup(popup)
            .addTo(map)

          markersRef.current.push(marker)
        })
      }
    }

    // Si el mapa ya cargó, renderizar inmediatamente; si no, esperar
    if (map.loaded()) {
      render()
    } else {
      map.once("load", render)
    }
  }, [layers, data])

  // Sincronizar visibilidad NDVI fill con toggle
  useEffect(() => {
    const map = mapRef.current
    if (!map || !map.loaded()) return
    if (!map.getLayer("lote-ndvi-fill")) return
    map.setLayoutProperty("lote-ndvi-fill", "visibility", layers.ndvi ? "visible" : "none")
  }, [layers.ndvi])

  function toggleLayer(key: LayerKey) {
    setLayers((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      {/* Toggles */}
      <div className="flex flex-wrap gap-2">
        {(Object.keys(LAYER_LABELS) as LayerKey[]).map((key) => (
          <button
            key={key}
            onClick={() => toggleLayer(key)}
            className={cn(
              "text-xs px-3 py-1 rounded-full border transition-colors",
              layers[key]
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-background text-muted-foreground border-muted"
            )}
          >
            {LAYER_LABELS[key]}
          </button>
        ))}
      </div>

      {/* NDVI badge */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <span
          className="inline-block w-3 h-3 rounded-full"
          style={{ background: ndviColor(data.ndviMedio) }}
        />
        NDVI {data.ndviMedio.toFixed(3)} · {data.lote.cultivoActual ?? "Cultivo s/d"} · {data.lote.superficieHa} ha
      </div>

      {/* Mapa */}
      <div ref={containerRef} className="w-full rounded-md overflow-hidden border" style={{ height: 420 }} />

      {/* Leyenda */}
      <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-xs text-muted-foreground px-1">
        <span>🔵 Contorno del lote</span>
        <span>🟩 NDVI color (fill)</span>
        <span>💧 Zona de riego</span>
        <span>🚜 Maquinaria GPS</span>
        <span>📡 Sensores IoT</span>
        <span>© OpenStreetMap contributors</span>
      </div>
    </div>
  )
}
