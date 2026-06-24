"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Plug, Search, CheckCircle2, AlertCircle, Circle, Sparkles,
  RefreshCw, Loader2, Plus,
} from "lucide-react"
import { CATEGORIA_LABELS } from "@/lib/integrations/catalog"

interface CatalogItem {
  id: string
  nombre: string
  categoria: string
  emoji: string
  descripcion: string
  badge?: string
  novedad?: boolean
  nivelImplementacion?: string
  nivelLabel?: string
  conexion: { estado: string; cuentaExterna?: string | null }
}

interface Resumen {
  total: number
  conectadas: number
  conError: number
  novedades: number
}

const ESTADO_STYLE: Record<string, { label: string; className: string; icon: typeof CheckCircle2 }> = {
  conectado: { label: "Conectado", className: "bg-emerald-500/15 text-emerald-700", icon: CheckCircle2 },
  error: { label: "Error", className: "bg-red-500/15 text-red-700", icon: AlertCircle },
  pausado: { label: "Pausado", className: "bg-amber-500/15 text-amber-700", icon: Circle },
  desconectado: { label: "Desconectado", className: "bg-muted text-muted-foreground", icon: Circle },
}

export function ConnectionsHub({ authHeaders }: { authHeaders: () => HeadersInit }) {
  const [catalogo, setCatalogo] = useState<CatalogItem[]>([])
  const [resumen, setResumen] = useState<Resumen | null>(null)
  const [loading, setLoading] = useState(true)
  const [busqueda, setBusqueda] = useState("")
  const [filtro, setFiltro] = useState<"todas" | "conectadas" | "listas" | "novedades" | "error">("todas")

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/integrations", { headers: authHeaders() })
      const data = await res.json()
      if (data.success) {
        setCatalogo(data.catalogo)
        setResumen(data.resumen)
      }
    } finally {
      setLoading(false)
    }
  }, [authHeaders])

  useEffect(() => { fetchData() }, [fetchData])

  const filtrado = useMemo(() => {
    let items = catalogo
    if (filtro === "conectadas") items = items.filter((i) => i.conexion.estado === "conectado")
    if (filtro === "listas") items = items.filter((i) => i.nivelImplementacion === "completo" || i.nivelImplementacion === "parcial")
    if (filtro === "novedades") items = items.filter((i) => i.novedad)
    if (filtro === "error") items = items.filter((i) => i.conexion.estado === "error")
    if (busqueda.trim()) {
      const q = busqueda.toLowerCase()
      items = items.filter(
        (i) => i.nombre.toLowerCase().includes(q) || i.descripcion.toLowerCase().includes(q),
      )
    }
    return items
  }, [catalogo, filtro, busqueda])

  const porCategoria = useMemo(() => {
    const map: Record<string, CatalogItem[]> = {}
    for (const item of filtrado) {
      if (!map[item.categoria]) map[item.categoria] = []
      map[item.categoria].push(item)
    }
    return map
  }, [filtrado])

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-4">
        <Card><CardContent className="pt-4 pb-3">
          <p className="text-xs text-muted-foreground">Disponibles</p>
          <p className="text-2xl font-bold">{resumen?.total ?? "—"}</p>
        </CardContent></Card>
        <Card className="border-emerald-500/20"><CardContent className="pt-4 pb-3">
          <p className="text-xs text-muted-foreground">Conectadas</p>
          <p className="text-2xl font-bold text-emerald-600">{resumen?.conectadas ?? 0}</p>
        </CardContent></Card>
        <Card className="border-violet-500/20"><CardContent className="pt-4 pb-3">
          <p className="text-xs text-muted-foreground">Novedades</p>
          <p className="text-2xl font-bold text-violet-600">{resumen?.novedades ?? 0}</p>
        </CardContent></Card>
        <Card className="border-red-500/20"><CardContent className="pt-4 pb-3">
          <p className="text-xs text-muted-foreground">Con error</p>
          <p className="text-2xl font-bold text-red-600">{resumen?.conError ?? 0}</p>
        </CardContent></Card>
      </div>

      <div className="flex flex-wrap gap-2 items-center">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Buscar Shopify, Mercado Pago..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
        </div>
        {(["todas", "listas", "conectadas", "novedades", "error"] as const).map((f) => (
          <Button key={f} size="sm" variant={filtro === f ? "default" : "outline"} onClick={() => setFiltro(f)}>
            {f === "todas" ? "Todas"
              : f === "listas" ? "Listas para usar"
                : f === "conectadas" ? "Conectadas"
                  : f === "novedades" ? "Novedades" : "Con error"}
          </Button>
        ))}
        <Button size="sm" variant="ghost" onClick={fetchData} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-1 ${loading ? "animate-spin" : ""}`} />
        </Button>
        <Button size="sm" variant="outline" asChild>
          <Link href="/dashboard/conexiones/solicitar">
            <Plus className="h-4 w-4 mr-1" /> Solicitar integración
          </Link>
        </Button>
      </div>

      {loading && (
        <div className="text-center py-12"><Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" /></div>
      )}

      {!loading && Object.entries(porCategoria).map(([cat, items]) => (
        <div key={cat} className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            {CATEGORIA_LABELS[cat] ?? cat}
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((item) => {
              const st = ESTADO_STYLE[item.conexion.estado] ?? ESTADO_STYLE.desconectado
              const Icon = st.icon
              return (
                <Card key={item.id} className="hover:border-primary/40 transition-colors">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex gap-3 min-w-0">
                        <span className="text-2xl shrink-0">{item.emoji}</span>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-medium text-sm">{item.nombre}</p>
                            {item.novedad && (
                              <Badge className="text-[10px] bg-violet-500/15 text-violet-700">
                                <Sparkles className="h-3 w-3 mr-0.5" />Nuevo
                              </Badge>
                            )}
                            {item.nivelLabel && (
                              <Badge variant="outline" className={`text-[10px] ${
                                item.nivelImplementacion === "completo" ? "border-emerald-500/40 text-emerald-700"
                                  : item.nivelImplementacion === "proximamente" ? "text-muted-foreground"
                                    : "border-sky-500/40 text-sky-700"
                              }`}>
                                {item.nivelLabel}
                              </Badge>
                            )}
                            {item.badge && item.nivelImplementacion !== "completo" && !item.novedad && (
                              <Badge variant="outline" className="text-[10px]">{item.badge}</Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{item.descripcion}</p>
                          {item.conexion.cuentaExterna && (
                            <p className="text-[10px] text-muted-foreground mt-1 truncate">{item.conexion.cuentaExterna}</p>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-3">
                      <Badge className={`text-[10px] gap-1 ${st.className}`}>
                        <Icon className="h-3 w-3" />{st.label}
                      </Badge>
                      <Button size="sm" variant="outline" asChild>
                        <Link href={`/dashboard/conexiones/${item.id}`}>
                          <Plug className="h-3 w-3 mr-1" />
                          {item.conexion.estado === "conectado" ? "Configurar" : "Conectar"}
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}