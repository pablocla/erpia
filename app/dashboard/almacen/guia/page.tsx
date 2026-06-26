"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { ArrowLeft, BookOpen, Lock } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getAuthHeaders } from "@/lib/stores/auth-store"
import {
  ALMACEN_ROSARIO_FAQ,
  DOLOR_POR_SKU,
  VISIBILIDAD_MENSAJE,
  modulosPorGrupo,
} from "@/lib/almacen-rosario/comercial"
import type { ModuloConEstado } from "@/components/almacen/almacen-modulos-grid"

export default function AlmacenGuiaPage() {
  const [modulos, setModulos] = useState<ModuloConEstado[]>([])
  const [loading, setLoading] = useState(true)

  const activoMap = Object.fromEntries(modulos.map((m) => [m.sku, m.activo]))
  const grupos = modulosPorGrupo().map((g) => ({
    ...g,
    modulos: g.modulos.map((m) => ({
      ...m,
      activo: activoMap[m.sku] ?? false,
    })),
  }))

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch("/api/almacen-rosario/modulos", { headers: getAuthHeaders() })
        if (res.ok) {
          const data = await res.json()
          setModulos(data.modulos ?? [])
        }
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  return (
    <div className="flex-1 w-full p-4 md:p-8 pt-6 space-y-6 max-w-4xl">
      <div>
        <Link
          href="/dashboard/almacen"
          className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1 mb-2"
        >
          <ArrowLeft className="h-3 w-3" />
          Panel Almacén
        </Link>
        <h1 className="text-2xl font-semibold flex items-center gap-2">
          <BookOpen className="h-6 w-6" />
          Guía Pack Almacén Rosario
        </h1>
        <p className="text-sm text-muted-foreground mt-2">{VISIBILIDAD_MENSAJE}</p>
      </div>

      <Card className="border-orange-500/20 bg-orange-500/5">
        <CardContent className="pt-4 text-sm space-y-2">
          <p className="font-medium">¿Cómo empiezo?</p>
          <ol className="list-decimal list-inside text-muted-foreground space-y-1">
            <li>App Store → elegí el módulo o el pack completo → <strong>Obtener App</strong></li>
            <li>Volvé acá: el módulo debe decir <strong>Activo</strong></li>
            <li>Seguí los pasos de abajo (sin tecnicismos)</li>
          </ol>
        </CardContent>
      </Card>

      {loading && <p className="text-sm text-muted-foreground">Cargando módulos…</p>}

      {grupos.map((grupo) => (
        <div key={grupo.id} className="space-y-3">
          <h2 className="text-lg font-semibold">
            {grupo.emoji} {grupo.nombre}
          </h2>
          <p className="text-xs text-muted-foreground -mt-2">{grupo.descripcion}</p>
          {grupo.modulos.map((m) => (
            <Card key={m.sku} id={m.docAnchor} className="scroll-mt-20">
              <CardHeader>
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <CardTitle className="text-base">{m.nombre}</CardTitle>
                  <Badge variant={m.activo ? "default" : "outline"}>
                    {m.activo ? "Activo" : "Requiere activación"}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground italic">«{m.lema}»</p>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                {DOLOR_POR_SKU[m.sku] && (
                  <p className="text-muted-foreground">
                    <span className="font-medium text-foreground">Problema que resuelve: </span>
                    {DOLOR_POR_SKU[m.sku]}
                  </p>
                )}
                <div>
                  <p className="text-xs font-medium mb-1">Cómo usarlo</p>
                  <ol className="list-decimal list-inside text-muted-foreground space-y-1">
                    {m.pasosUso.map((p, i) => (
                      <li key={i}>{p}</li>
                    ))}
                  </ol>
                </div>
                <p className="text-xs text-muted-foreground">
                  {m.superficie === "pos"
                    ? "📍 Lo usás desde el Punto de Venta (POS)"
                    : m.superficie === "dashboard"
                      ? "📍 Lo usás desde este panel Almacén"
                      : m.superficie === "ambos"
                        ? "📍 Panel Almacén y POS"
                        : "📍 Se activa solo al vender (automático)"}
                </p>
                {!m.activo && (
                  <Button asChild size="sm" variant="secondary">
                    <Link href={`/dashboard/apps?sku=${m.sku}`}>
                      <Lock className="h-3.5 w-3.5 mr-1" />
                      Activar en App Store
                    </Link>
                  </Button>
                )}
                {m.activo && m.superficie === "pos" && (
                  <Button asChild size="sm" variant="outline">
                    <Link href="/dashboard/pos">Ir al POS</Link>
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ))}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Preguntas frecuentes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          {ALMACEN_ROSARIO_FAQ.map((f) => (
            <div key={f.pregunta}>
              <p className="font-medium">{f.pregunta}</p>
              <p className="text-muted-foreground mt-1">{f.respuesta}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}