"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  RefreshCw, Plus, DollarSign, ArrowRightLeft, TrendingUp, Download,
} from "lucide-react"
import { DataTable, type DataTableColumn } from "@/components/data-table"
import { useKeyboardShortcuts, erpShortcuts } from "@/hooks/use-keyboard-shortcuts"

interface Moneda { id: number; codigo: string; descripcion: string; simbolo: string; esBase: boolean }
interface CotizacionEntry { fecha: string; tipo: string; valorArs: number; fuente?: string }
interface CotizacionFlat { _key: string; moneda: string; fecha: string; tipo: string; valorArs: number; fuente?: string }
interface MonedaCotiz { monedaId: number; codigo: string; descripcion: string; simbolo: string; cotizaciones: CotizacionEntry[] }

const TIPO_COLOR: Record<string, string> = {
  oficial: "bg-blue-500",
  mep: "bg-green-600",
  ccl: "bg-purple-500",
  blue: "bg-sky-500",
  tarjeta: "bg-orange-500",
}

export default function CotizacionesPage() {
  const [monedas, setMonedas] = useState<Moneda[]>([])
  const [cotizaciones, setCotizaciones] = useState<MonedaCotiz[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [fetchingBNA, setFetchingBNA] = useState(false)

  // Register dialog
  const [dialogOpen, setDialogOpen] = useState(false)
  const [regMonedaId, setRegMonedaId] = useState("")
  const [regFecha, setRegFecha] = useState(new Date().toISOString().slice(0, 10))
  const [regTipo, setRegTipo] = useState("oficial")
  const [regValor, setRegValor] = useState("")

  // Converter
  const [convMonto, setConvMonto] = useState("")
  const [convMonedaId, setConvMonedaId] = useState("")
  const [convTipo, setConvTipo] = useState("oficial")
  const [convDireccion, setConvDireccion] = useState<"a_ars" | "desde_ars">("a_ars")
  const [convResultado, setConvResultado] = useState<{ monto: number; cotizacion: number } | null>(null)

  useEffect(() => {
    cargar()
    fetch("/api/config/cotizaciones?vista=monedas").then(r => r.json()).then(setMonedas).catch(() => {})
  }, [])

  useKeyboardShortcuts(erpShortcuts({
    onRefresh: cargar,
  }))

  async function cargar() {
    setLoading(true)
    try {
      const res = await fetch("/api/config/cotizaciones")
      setCotizaciones(await res.json())
    } catch { setError("Error al cargar cotizaciones") }
    setLoading(false)
  }

  async function fetchBNA() {
    setFetchingBNA(true)
    setError("")
    try {
      const res = await fetch("/api/config/cotizaciones", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "fetch_bna" }),
      })
      if (!res.ok) throw new Error((await res.json()).error)
      const data = await res.json()
      setSuccess(`Cotización USD actualizada: Compra $${data.rates.compra} / Venta $${data.rates.venta}`)
      cargar()
    } catch (e: any) { setError(e.message) }
    setFetchingBNA(false)
  }

  async function registrarCotizacion() {
    setError("")
    if (!regMonedaId || !regValor) { setError("Complete moneda y valor"); return }
    try {
      const res = await fetch("/api/config/cotizaciones", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          monedaId: parseInt(regMonedaId),
          fecha: regFecha,
          tipo: regTipo,
          valorArs: parseFloat(regValor),
          fuente: "manual",
        }),
      })
      if (!res.ok) throw new Error((await res.json()).error)
      setSuccess("Cotización registrada")
      setDialogOpen(false)
      setRegValor("")
      cargar()
    } catch (e: any) { setError(e.message) }
  }

  async function convertir() {
    setError("")
    setConvResultado(null)
    if (!convMonto || !convMonedaId) { setError("Complete monto y moneda"); return }
    try {
      const res = await fetch("/api/config/cotizaciones", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "convertir",
          monto: parseFloat(convMonto),
          monedaId: parseInt(convMonedaId),
          tipo: convTipo,
          direccion: convDireccion,
        }),
      })
      if (!res.ok) throw new Error((await res.json()).error)
      const data = await res.json()
      setConvResultado({
        monto: data.montoARS ?? data.montoExtranjero,
        cotizacion: data.cotizacion,
      })
    } catch (e: any) { setError(e.message) }
  }

  const fmt = (n: number, d = 2) => n.toLocaleString("es-AR", { minimumFractionDigits: d, maximumFractionDigits: d })
  const monedasForex = monedas.filter(m => !m.esBase)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Cotizaciones</h1>
          <p className="text-muted-foreground">Gestión de tipos de cambio y conversión multi-moneda</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchBNA} disabled={fetchingBNA}>
            <Download className="mr-2 h-4 w-4" /> {fetchingBNA ? "Actualizando..." : "Actualizar BNA"}
          </Button>
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> Registrar Cotización
          </Button>
        </div>
      </div>

      {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}
      {success && <Alert><AlertDescription className="text-green-600">{success}</AlertDescription></Alert>}

      <Tabs defaultValue="cotizaciones">
        <TabsList>
          <TabsTrigger value="cotizaciones">Cotizaciones</TabsTrigger>
          <TabsTrigger value="convertidor">Convertidor</TabsTrigger>
        </TabsList>

        <TabsContent value="cotizaciones" className="space-y-4">
          {/* Currency cards with latest rates */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {cotizaciones.map(mc => {
              const latest = mc.cotizaciones[0]
              return (
                <Card key={mc.monedaId}>
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4" />
                        {mc.codigo}
                      </span>
                      <span className="text-xs text-muted-foreground">{mc.descripcion}</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {latest ? (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Badge className={TIPO_COLOR[latest.tipo] ?? "bg-gray-500"}>{latest.tipo}</Badge>
                          <span className="text-2xl font-bold">${fmt(latest.valorArs)}</span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {new Date(latest.fecha).toLocaleDateString("es-AR")} — {latest.fuente ?? "manual"}
                        </p>
                        {mc.cotizaciones.length > 1 && (
                          <div className="space-y-1 pt-1">
                            {mc.cotizaciones.slice(1, 4).map((c, i) => (
                              <div key={i} className="flex justify-between text-xs text-muted-foreground">
                                <span><Badge variant="outline" className="text-[10px] px-1">{c.tipo}</Badge></span>
                                <span>${fmt(c.valorArs)}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">Sin cotización</p>
                    )}
                  </CardContent>
                </Card>
              )
            })}
            {cotizaciones.length === 0 && !loading && (
              <Card className="col-span-full">
                <CardContent className="py-8 text-center text-muted-foreground">
                  Sin cotizaciones cargadas. Use &quot;Actualizar BNA&quot; o registre manualmente.
                </CardContent>
              </Card>
            )}
          </div>

          {/* Full history table */}
          {cotizaciones.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" /> Historial reciente
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <DataTable<CotizacionFlat>
                  data={cotizaciones.flatMap(mc => mc.cotizaciones.map((c, i) => ({ _key: `${mc.monedaId}-${i}`, moneda: `${mc.codigo} (${mc.simbolo})`, fecha: c.fecha, tipo: c.tipo, valorArs: c.valorArs, fuente: c.fuente })))}
                  columns={[
                    { key: "moneda", header: "Moneda", sortable: true, cell: (r) => <span className="font-medium">{r.moneda}</span> },
                    { key: "fecha", header: "Fecha", sortable: true, cell: (r) => new Date(r.fecha).toLocaleDateString("es-AR") },
                    { key: "tipo", header: "Tipo", sortable: true, cell: (r) => <Badge className={TIPO_COLOR[r.tipo] ?? "bg-gray-500"}>{r.tipo}</Badge> },
                    { key: "valorArs", header: "Valor (ARS)", sortable: true, cell: (r) => <span className="text-right block font-mono">${fmt(r.valorArs, 4)}</span> },
                    { key: "fuente", header: "Fuente", cell: (r) => <span className="text-muted-foreground">{r.fuente ?? "—"}</span> },
                  ] as DataTableColumn<CotizacionFlat>[]}
                  rowKey="_key"
                  searchPlaceholder="Buscar cotización..."
                  searchKeys={["moneda", "tipo", "fuente"]}
                  exportFilename="cotizaciones"
                  emptyMessage="Sin cotizaciones registradas"
                  compact
                />
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="convertidor">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ArrowRightLeft className="h-5 w-5" /> Convertidor de Moneda
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <Label>Monto</Label>
                  <Input type="number" min="0" step="0.01" value={convMonto} onChange={e => setConvMonto(e.target.value)} placeholder="1000" />
                </div>
                <div>
                  <Label>Moneda</Label>
                  <Select value={convMonedaId} onValueChange={setConvMonedaId}>
                    <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                    <SelectContent>
                      {monedasForex.map(m => (
                        <SelectItem key={m.id} value={String(m.id)}>{m.codigo} — {m.descripcion}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Tipo cotización</Label>
                  <Select value={convTipo} onValueChange={setConvTipo}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="oficial">Oficial</SelectItem>
                      <SelectItem value="mep">MEP</SelectItem>
                      <SelectItem value="ccl">CCL</SelectItem>
                      <SelectItem value="blue">Blue</SelectItem>
                      <SelectItem value="tarjeta">Tarjeta</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Dirección</Label>
                  <Select value={convDireccion} onValueChange={v => setConvDireccion(v as any)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="a_ars">Extranjera → ARS</SelectItem>
                      <SelectItem value="desde_ars">ARS → Extranjera</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button onClick={convertir}>
                <ArrowRightLeft className="mr-2 h-4 w-4" /> Convertir
              </Button>

              {convResultado && (
                <Card className="bg-muted">
                  <CardContent className="pt-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Resultado</p>
                        <p className="text-3xl font-bold">
                          {convDireccion === "a_ars" ? "$" : ""}{fmt(convResultado.monto)}
                          {convDireccion === "desde_ars" && (
                            <span className="text-lg ml-1">
                              {monedasForex.find(m => m.id === parseInt(convMonedaId))?.simbolo}
                            </span>
                          )}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Cotización utilizada</p>
                        <p className="text-xl font-medium">${fmt(convResultado.cotizacion, 4)}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Register dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Registrar Cotización</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Moneda</Label>
              <Select value={regMonedaId} onValueChange={setRegMonedaId}>
                <SelectTrigger><SelectValue placeholder="Seleccionar moneda" /></SelectTrigger>
                <SelectContent>
                  {monedasForex.map(m => (
                    <SelectItem key={m.id} value={String(m.id)}>{m.codigo} — {m.descripcion}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Fecha</Label>
                <Input type="date" value={regFecha} onChange={e => setRegFecha(e.target.value)} />
              </div>
              <div>
                <Label>Tipo</Label>
                <Select value={regTipo} onValueChange={setRegTipo}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="oficial">Oficial</SelectItem>
                    <SelectItem value="mep">MEP</SelectItem>
                    <SelectItem value="ccl">CCL</SelectItem>
                    <SelectItem value="blue">Blue</SelectItem>
                    <SelectItem value="tarjeta">Tarjeta</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Valor en ARS (por 1 unidad de moneda extranjera)</Label>
              <Input type="number" min="0" step="0.0001" value={regValor} onChange={e => setRegValor(e.target.value)} placeholder="1150.50" />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
              <Button onClick={registrarCotizacion}>Registrar</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
