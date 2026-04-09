"use client"
import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/hooks/use-toast"
import { Database, Search, Eye, Loader2, RefreshCw, Save, Plus } from "lucide-react"

const TABLAS = [
  { nombre: "Condiciones de IVA", clave: "condiciones-iva", editables: true },
  { nombre: "Tipos de documento", clave: "tipos-documento", editables: false },
  { nombre: "Provincias", clave: "provincias", editables: false },
  { nombre: "Países", clave: "paises", editables: false },
  { nombre: "Localidades", clave: "localidades", editables: true },
  { nombre: "Unidades de medida", clave: "unidades-medida", editables: true },
  { nombre: "Monedas", clave: "monedas", editables: true },
  { nombre: "Bancos", clave: "bancos", editables: false },
  { nombre: "Condiciones de pago", clave: "condiciones-pago", editables: true },
  { nombre: "Formas de pago", clave: "formas-pago", editables: true },
  { nombre: "Motivos", clave: "motivos", editables: true },
  { nombre: "Feriados", clave: "feriados", editables: true },
  { nombre: "Tipos de cliente", clave: "tipos-cliente", editables: true },
  { nombre: "Estados de cliente", clave: "estados-cliente", editables: true },
  { nombre: "Rubros", clave: "rubros", editables: true },
  { nombre: "Canales de venta", clave: "canales-venta", editables: true },
  { nombre: "Segmentos de cliente", clave: "segmentos-cliente", editables: true },
  { nombre: "Tipos de empresa", clave: "tipos-empresa", editables: true },
  { nombre: "Profesiones", clave: "profesiones", editables: true },
  { nombre: "Nacionalidades", clave: "nacionalidades", editables: false },
  { nombre: "Idiomas", clave: "idiomas", editables: false },
  { nombre: "Zonas geográficas", clave: "zonas-geograficas", editables: true },
  { nombre: "Actividades económicas", clave: "actividades-economicas", editables: false },
  { nombre: "Centros de costo", clave: "centros-costo", editables: true },
  { nombre: "Vendedores", clave: "vendedores", editables: true },
  { nombre: "Incoterms", clave: "incoterms", editables: false },
  { nombre: "Depósitos", clave: "depositos", editables: true },
  { nombre: "Transportistas", clave: "transportistas", editables: true },
]

interface TablaConteo { clave: string; registros: number }
interface CanalVentaItem {
  id: number
  codigo: string
  nombre: string
  descripcion?: string | null
  markupPct: number
  activo: boolean
}

export default function TablasPage() {
  const { toast } = useToast()
  const [busqueda, setBusqueda] = useState("")
  const [conteos, setConteos] = useState<Record<string, number>>({})
  const [loadingConteos, setLoadingConteos] = useState(true)
  const [visor, setVisor] = useState<{ clave: string; nombre: string; datos: Record<string, unknown>[] } | null>(null)
  const [loadingVisor, setLoadingVisor] = useState(false)
  const [canalesVenta, setCanalesVenta] = useState<CanalVentaItem[]>([])
  const [savingCanalId, setSavingCanalId] = useState<number | null>(null)
  const [savingNuevo, setSavingNuevo] = useState(false)
  const [nuevoCanal, setNuevoCanal] = useState({
    codigo: "",
    nombre: "",
    descripcion: "",
    markupPct: 0,
    activo: true,
  })

  const authHeaders = useCallback((): Record<string, string> => {
    const token = localStorage.getItem("token")
    return token ? { Authorization: `Bearer ${token}` } : {}
  }, [])

  const formatMarkup = (value: number) => value.toLocaleString("es-AR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })

  const cargarConteos = useCallback(async () => {
    setLoadingConteos(true)
    const results = await Promise.allSettled(
      TABLAS.map(async t => {
        const res = await fetch(`/api/maestros/${t.clave}`, { headers: authHeaders() })
        const data = await res.json()
        return { clave: t.clave, registros: Array.isArray(data.data) ? data.data.length : 0 }
      })
    )
    const map: Record<string, number> = {}
    results.forEach((r, i) => {
      map[TABLAS[i].clave] = r.status === "fulfilled" ? r.value.registros : 0
    })
    setConteos(map)
    setLoadingConteos(false)
  }, [authHeaders])

  useEffect(() => { cargarConteos() }, [cargarConteos])

  const abrirVisor = async (clave: string, nombre: string) => {
    setLoadingVisor(true)
    setVisor({ clave, nombre, datos: [] })
    try {
      const res = await fetch(`/api/maestros/${clave}`, { headers: authHeaders() })
      const data = await res.json()
      const datos = Array.isArray(data.data) ? data.data : []
      setVisor({ clave, nombre, datos })
      if (clave === "canales-venta") {
        setCanalesVenta(datos as CanalVentaItem[])
      }
    } catch {
      toast({ title: "Tablas", description: "No se pudo cargar la tabla" })
    } finally {
      setLoadingVisor(false)
    }
  }

  const actualizarCanal = (id: number, patch: Partial<CanalVentaItem>) => {
    setCanalesVenta(prev => prev.map(c => c.id === id ? { ...c, ...patch } : c))
  }

  const guardarCanal = async (canal: CanalVentaItem) => {
    setSavingCanalId(canal.id)
    try {
      const res = await fetch("/api/maestros/canales-venta", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({
          id: canal.id,
          codigo: canal.codigo,
          nombre: canal.nombre.trim(),
          descripcion: canal.descripcion?.trim() || null,
          markupPct: Number(canal.markupPct) || 0,
          activo: canal.activo,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data?.error || "Error al guardar")
      }
      actualizarCanal(canal.id, data as CanalVentaItem)
      toast({ title: "Canales de venta", description: "Canal actualizado" })
    } catch (error: any) {
      toast({ title: "Canales de venta", description: error?.message || "Error al guardar" })
    } finally {
      setSavingCanalId(null)
    }
  }

  const crearCanal = async () => {
    if (!nuevoCanal.codigo.trim() || !nuevoCanal.nombre.trim()) {
      toast({ title: "Canales de venta", description: "Codigo y nombre son obligatorios" })
      return
    }
    setSavingNuevo(true)
    try {
      const payload = {
        codigo: nuevoCanal.codigo.trim().toUpperCase(),
        nombre: nuevoCanal.nombre.trim(),
        descripcion: nuevoCanal.descripcion.trim() || null,
        markupPct: Number(nuevoCanal.markupPct) || 0,
        activo: nuevoCanal.activo,
      }
      const res = await fetch("/api/maestros/canales-venta", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data?.error || "Error al crear")
      }
      setCanalesVenta(prev => [...prev, data as CanalVentaItem])
      setNuevoCanal({ codigo: "", nombre: "", descripcion: "", markupPct: 0, activo: true })
      toast({ title: "Canales de venta", description: "Canal creado" })
      cargarConteos()
    } catch (error: any) {
      toast({ title: "Canales de venta", description: error?.message || "Error al crear" })
    } finally {
      setSavingNuevo(false)
    }
  }

  const filtradas = TABLAS.filter(t => t.nombre.toLowerCase().includes(busqueda.toLowerCase()) || t.clave.includes(busqueda.toLowerCase()))
  const totalRegistros = Object.values(conteos).reduce((s, c) => s + c, 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Database className="h-6 w-6 text-slate-500" />
        <div><h1 className="text-2xl font-bold">Tablas del Sistema</h1><p className="text-sm text-muted-foreground">{TABLAS.length} tablas maestras — {totalRegistros.toLocaleString("es-AR")} registros totales</p></div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Card className="dashboard-surface"><CardContent className="p-3 text-center"><p className="text-xs text-muted-foreground">Tablas</p><p className="text-lg font-bold">{TABLAS.length}</p></CardContent></Card>
        <Card className="dashboard-surface"><CardContent className="p-3 text-center"><p className="text-xs text-muted-foreground">Editables</p><p className="text-lg font-bold text-blue-600">{TABLAS.filter(t => t.editables).length}</p></CardContent></Card>
        <Card className="dashboard-surface"><CardContent className="p-3 text-center"><p className="text-xs text-muted-foreground">Registros totales</p><p className="text-lg font-bold">{totalRegistros.toLocaleString("es-AR")}</p></CardContent></Card>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Tablas disponibles</CardTitle>
            <div className="relative"><Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" /><Input placeholder="Buscar tabla..." className="pl-9 h-9 w-48 text-sm" value={busqueda} onChange={e => setBusqueda(e.target.value)} /></div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loadingConteos ? (
            <div className="flex items-center justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-muted/50 border-t"><tr>
                <th className="text-left p-3 font-medium">Tabla</th>
                <th className="text-left p-3 font-medium">Clave API</th>
                <th className="text-right p-3 font-medium">Registros</th>
                <th className="text-left p-3 font-medium">Tipo</th>
                <th className="p-3"></th>
              </tr></thead>
              <tbody>{filtradas.map(t => (
                <tr key={t.clave} className="border-t hover:bg-muted/30 transition-colors">
                  <td className="p-3 font-medium">{t.nombre}</td>
                  <td className="p-3 font-mono text-xs text-muted-foreground">{t.clave}</td>
                  <td className="p-3 text-right tabular-nums">{conteos[t.clave] ?? 0}</td>
                  <td className="p-3"><Badge variant={t.editables ? "default" : "secondary"} className="text-xs">{t.editables ? "Editable" : "Sistema"}</Badge></td>
                  <td className="p-3 text-right">
                    <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={() => abrirVisor(t.clave, t.nombre)}>
                      <Eye className="h-3 w-3" />Ver
                    </Button>
                  </td>
                </tr>
              ))}</tbody>
            </table>
          )}
        </CardContent>
      </Card>

      {/* Visor de tabla */}
      <Dialog open={visor !== null} onOpenChange={o => { if (!o) setVisor(null) }}>
        <DialogContent className="max-w-5xl">
          <DialogHeader><DialogTitle>{visor?.nombre}</DialogTitle></DialogHeader>
          {loadingVisor ? (
            <div className="flex items-center justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div>
          ) : visor && visor.clave === "canales-venta" ? (
            <div className="space-y-5">
              <div className="rounded-2xl border border-slate-200/70 bg-gradient-to-br from-slate-950 to-slate-900 p-5 text-white shadow-[0_20px_50px_-40px_rgba(15,23,42,0.7)]">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Canales de venta</p>
                    <h3 className="text-lg font-semibold">Control de markup y condiciones comerciales</h3>
                    <p className="text-sm text-slate-300">Los ajustes afectan precios del ecommerce y circuitos de venta.</p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-white/20 bg-white/10 text-white hover:bg-white/20"
                    onClick={() => visor && abrirVisor(visor.clave, visor.nombre)}
                  >
                    <RefreshCw className="h-4 w-4" />
                    Actualizar
                  </Button>
                </div>
              </div>

              <div className="grid gap-4 lg:grid-cols-[1.4fr_0.6fr]">
                <ScrollArea className="max-h-[440px] pr-3">
                  <div className="space-y-3">
                    {canalesVenta.length === 0 && (
                      <div className="rounded-xl border border-dashed border-muted-foreground/30 bg-muted/40 p-6 text-sm text-muted-foreground">
                        No hay canales de venta cargados.
                      </div>
                    )}
                    {canalesVenta.map((canal) => {
                      const markupLabel = canal.markupPct === 0
                        ? "Base"
                        : canal.markupPct > 0
                          ? `+${formatMarkup(canal.markupPct)}%`
                          : `${formatMarkup(canal.markupPct)}%`
                      return (
                        <Card key={canal.id} className="border-slate-200/70 bg-white/90 shadow-sm">
                          <CardContent className="space-y-3 p-4">
                            <div className="flex flex-wrap items-center justify-between gap-3">
                              <div className="flex flex-wrap items-center gap-3">
                                <Badge variant="secondary" className="font-mono text-xs">
                                  {canal.codigo}
                                </Badge>
                                <Badge className="bg-slate-900 text-white text-xs">{markupLabel}</Badge>
                                <Input
                                  value={canal.nombre}
                                  onChange={(e) => actualizarCanal(canal.id, { nombre: e.target.value })}
                                  className="h-9 w-full md:w-64"
                                />
                              </div>
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                Activo
                                <Switch
                                  checked={canal.activo}
                                  onCheckedChange={(checked) => actualizarCanal(canal.id, { activo: checked })}
                                />
                              </div>
                            </div>
                            <div className="grid gap-3 md:grid-cols-[1.1fr_0.4fr]">
                              <Input
                                placeholder="Descripcion"
                                value={canal.descripcion ?? ""}
                                onChange={(e) => actualizarCanal(canal.id, { descripcion: e.target.value })}
                              />
                              <div className="relative">
                                <Input
                                  type="number"
                                  step="0.01"
                                  value={canal.markupPct}
                                  onChange={(e) => actualizarCanal(canal.id, { markupPct: Number(e.target.value) })}
                                />
                                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                                  %
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center justify-end">
                              <Button
                                size="sm"
                                className="gap-2"
                                onClick={() => guardarCanal(canal)}
                                disabled={savingCanalId === canal.id}
                              >
                                {savingCanalId === canal.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                                Guardar
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      )
                    })}
                  </div>
                </ScrollArea>

                <Card className="border-slate-200/70 bg-white/95 shadow-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Nuevo canal</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Input
                      placeholder="Codigo (ONLINE, DIST)"
                      value={nuevoCanal.codigo}
                      onChange={(e) => setNuevoCanal(prev => ({ ...prev, codigo: e.target.value }))}
                    />
                    <Input
                      placeholder="Nombre comercial"
                      value={nuevoCanal.nombre}
                      onChange={(e) => setNuevoCanal(prev => ({ ...prev, nombre: e.target.value }))}
                    />
                    <Input
                      placeholder="Descripcion"
                      value={nuevoCanal.descripcion}
                      onChange={(e) => setNuevoCanal(prev => ({ ...prev, descripcion: e.target.value }))}
                    />
                    <div className="relative">
                      <Input
                        type="number"
                        step="0.01"
                        value={nuevoCanal.markupPct}
                        onChange={(e) => setNuevoCanal(prev => ({ ...prev, markupPct: Number(e.target.value) }))}
                      />
                      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">%</span>
                    </div>
                    <div className="flex items-center justify-between rounded-lg border border-dashed border-muted-foreground/30 p-3 text-xs text-muted-foreground">
                      Activo
                      <Switch
                        checked={nuevoCanal.activo}
                        onCheckedChange={(checked) => setNuevoCanal(prev => ({ ...prev, activo: checked }))}
                      />
                    </div>
                    <Button className="w-full gap-2" onClick={crearCanal} disabled={savingNuevo}>
                      {savingNuevo ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                      Crear canal
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          ) : visor && visor.datos.length > 0 ? (
            <ScrollArea className="max-h-[400px]">
              <table className="w-full text-sm">
                <thead className="bg-muted/50"><tr>
                  {Object.keys(visor.datos[0]).filter(k => !["createdAt", "updatedAt", "empresaId"].includes(k)).map(k => (
                    <th key={k} className="text-left p-2 font-medium text-xs">{k}</th>
                  ))}
                </tr></thead>
                <tbody>{visor.datos.map((row, i) => (
                  <tr key={i} className="border-t">
                    {Object.entries(row).filter(([k]) => !["createdAt", "updatedAt", "empresaId"].includes(k)).map(([k, v]) => (
                      <td key={k} className="p-2 text-xs">{typeof v === "boolean" ? (v ? "Sí" : "No") : String(v ?? "—")}</td>
                    ))}
                  </tr>
                ))}</tbody>
              </table>
            </ScrollArea>
          ) : (
            <p className="text-center text-sm text-muted-foreground py-4">Tabla vacía</p>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
