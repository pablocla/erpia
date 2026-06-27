"use client"

import { useEffect, useRef } from "react"
import maplibregl from "maplibre-gl"
import "maplibre-gl/dist/maplibre-gl.css"
import { MAPA_PIN_COLORES } from "@/lib/maps/hoja-ruta-catalog"
import { cn } from "@/lib/utils"

export type CampoMapPin = {
  id: string
  nombre: string
  subtitulo?: string | null
  etapa: string
  lat: number
  lon: number
  orden?: number
  selected?: boolean
}

type CampoMapaLibreProps = {
  pins: CampoMapPin[]
  routeLine?: { lat: number; lon: number }[]
  center?: { lat: number; lon: number }
  zoom?: number
  onPinClick?: (pin: CampoMapPin) => void
  className?: string
}

const DEFAULT_CENTER = { lat: -34.6037, lon: -58.3816 }

function pinColor(etapa: string, selected?: boolean) {
  if (selected) return "#a855f7"
  return MAPA_PIN_COLORES[etapa] ?? "#64748b"
}

export function CampoMapaLibre({
  pins,
  routeLine,
  center,
  zoom = 12,
  onPinClick,
  className,
}: CampoMapaLibreProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<maplibregl.Map | null>(null)
  const markersRef = useRef<maplibregl.Marker[]>([])

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return

    const c = center ?? (pins[0] ? { lat: pins[0].lat, lon: pins[0].lon } : DEFAULT_CENTER)

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
      center: [c.lon, c.lat],
      zoom,
    })

    map.addControl(new maplibregl.NavigationControl(), "top-right")
    map.addControl(new maplibregl.ScaleControl({ maxWidth: 100, unit: "metric" }))
    mapRef.current = map

    return () => {
      markersRef.current.forEach((m) => m.remove())
      markersRef.current = []
      map.remove()
      mapRef.current = null
    }
  }, [])

  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    const render = () => {
      markersRef.current.forEach((m) => m.remove())
      markersRef.current = []

      pins.forEach((pin) => {
        const el = document.createElement("button")
        el.type = "button"
        el.className = "campo-map-pin"
        el.title = pin.nombre
        el.style.cssText = `
          width: 28px; height: 28px; border-radius: 50%;
          border: 2px solid white; box-shadow: 0 2px 6px rgba(0,0,0,.35);
          background: ${pinColor(pin.etapa, pin.selected)};
          color: white; font-size: 11px; font-weight: 700;
          cursor: pointer; display: flex; align-items: center; justify-content: center;
        `
        el.textContent = pin.orden != null ? String(pin.orden) : "•"
        el.addEventListener("click", (e) => {
          e.stopPropagation()
          onPinClick?.(pin)
        })

        const marker = new maplibregl.Marker({ element: el, anchor: "center" })
          .setLngLat([pin.lon, pin.lat])
          .setPopup(
            new maplibregl.Popup({ offset: 12, closeButton: false }).setHTML(
              `<div style="font:12px system-ui;padding:2px 0">
                <strong>${pin.nombre}</strong>
                ${pin.subtitulo ? `<br/><span style="opacity:.75">${pin.subtitulo}</span>` : ""}
              </div>`,
            ),
          )
          .addTo(map)
        markersRef.current.push(marker)
      })

      if (routeLine && routeLine.length >= 2) {
        const coords = routeLine.map((p) => [p.lon, p.lat] as [number, number])
        const sourceId = "ruta-linea"
        const layerId = "ruta-linea-layer"

        if (map.getSource(sourceId)) {
          ;(map.getSource(sourceId) as maplibregl.GeoJSONSource).setData({
            type: "Feature",
            properties: {},
            geometry: { type: "LineString", coordinates: coords },
          })
        } else {
          map.addSource(sourceId, {
            type: "geojson",
            data: {
              type: "Feature",
              properties: {},
              geometry: { type: "LineString", coordinates: coords },
            },
          })
          map.addLayer({
            id: layerId,
            type: "line",
            source: sourceId,
            paint: {
              "line-color": "#8b5cf6",
              "line-width": 4,
              "line-opacity": 0.85,
            },
          })
        }
      } else if (map.getLayer("ruta-linea-layer")) {
        map.removeLayer("ruta-linea-layer")
        map.removeSource("ruta-linea")
      }

      if (pins.length > 0) {
        const bounds = new maplibregl.LngLatBounds()
        pins.forEach((p) => bounds.extend([p.lon, p.lat]))
        map.fitBounds(bounds, { padding: 48, maxZoom: 15, duration: 600 })
      }
    }

    if (map.isStyleLoaded()) render()
    else map.once("load", render)
  }, [pins, routeLine, onPinClick])

  return (
    <div className={cn("relative rounded-xl overflow-hidden border border-border/60", className)}>
      <div ref={containerRef} className="h-full w-full min-h-[320px]" />
      <p className="absolute bottom-2 left-2 text-[10px] text-muted-foreground bg-background/80 px-2 py-0.5 rounded">
        Mapa © OpenStreetMap · Geocodificación Nominatim
      </p>
    </div>
  )
}