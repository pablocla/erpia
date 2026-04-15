"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Upload, Search, Database, FileSpreadsheet, CheckCircle2, XCircle, AlertTriangle, Users } from "lucide-react"
import { DataTable, type DataTableColumn } from "@/components/data-table"
import { EmptyStateIllustration } from "@/components/empty-state-illustration"
import { useKeyboardShortcuts, erpShortcuts } from "@/hooks/use-keyboard-shortcuts"

interface PadronEntry {
  id: number
  cuitSujeto: string
  organismo: string
  jurisdiccion: string
  tipoRegimen: string
  alicuota: number
  vigenciaDesde: string
  vigenciaHasta: string | null
  cliente?: { id: number; nombre: string; cuit: string }
}

interface Stats {
  total: number
  vigentes: number
  vencidos: number
  porOrganismo: Array<{ organismo: string; cantidad: number; alicuotaPromedio: number }>
}

interface ImportResult {
  total: number
  insertados: number
  actualizados: number
  errores: number
  detalleErrores: string[]
}

const ORGANISMOS = [
  { value: "ARBA", label: "ARBA (Buenos Aires)", jurisdiccion: "PBA" },
  { value: "AGIP", label: "AGIP/ARCIBA (CABA)", jurisdiccion: "CABA" },
  { value: "DGR_SF", label: "DGR Santa Fe", jurisdiccion: "SF" },
  { value: "DGR_CBA", label: "DGR Córdoba", jurisdiccion: "CBA" },
  { value: "DGR_MZA", label: "DGR Mendoza", jurisdiccion: "MZA" },
]

export default function PadronIIBBPage() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [padrones, setPadrones] = useState<PadronEntry[]>([])
  const [total, setTotal] = useState(0)
  const [filtroOrganismo, setFiltroOrganismo] = useState<string>("todos")
  const [soloVigentes, setSoloVigentes] = useState(true)
  const [loading, setLoading] = useState(true)

  // Import state
  const [importOpen, setImportOpen] = useState(false)
  const [importOrganismo, setImportOrganismo] = useState("ARBA")
  const [csvText, setCsvText] = useState("")
  const [importing, setImporting] = useState(false)
  const [importResult, setImportResult] = useState<ImportResult | null>(null)

  // Consulta state
  const [consultaCuit, setConsultaCuit] = useState("")
  const [consultaResult, setConsultaResult] = useState<any[] | null>(null)
  const [buscando, setBuscando] = useState(false)

  useEffect(() => { cargarDatos() }, [filtroOrganismo, soloVigentes])

  useKeyboardShortcuts(erpShortcuts({
    onRefresh: cargarDatos,
  }))

  async function cargarDatos() {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filtroOrganismo !== "todos") params.set("organismo", filtroOrganismo)
      if (soloVigentes) params.set("soloVigentes", "true")
      params.set("take", "50")

      const [listRes, statsRes] = await Promise.all([
        fetch(`/api/impuestos/padron?${params}`),
        fetch("/api/impuestos/padron?vista=estadisticas"),
      ])

      if (listRes.ok) {
        const d = await listRes.json()
        setPadrones(d.data ?? [])
        setTotal(d.total ?? 0)
      }
      if (statsRes.ok) {
        setStats(await statsRes.json())
      }
    } catch { /* noop */ }
    setLoading(false)
  }

  async function importarPadron() {
    if (!csvText.trim()) return
    setImporting(true)
    setImportResult(null)
    try {
      const res = await fetch("/api/impuestos/padron", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "importar",
          organismo: importOrganismo,
          csv: csvText,
        }),
      })
      if (res.ok) {
        const d = await res.json()
        setImportResult(d.resultado)
        cargarDatos()
      }
    } catch { /* noop */ }
    setImporting(false)
  }

  async function consultarCuit() {
    if (!consultaCuit.trim()) return
    setBuscando(true)
    setConsultaResult(null)
    try {
      const res = await fetch("/api/impuestos/padron", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "consultar", cuit: consultaCuit }),
      })
      if (res.ok) {
        const d = await res.json()
        setConsultaResult(d.regimenes ?? [])
      }
    } catch { /* noop */ }
    setBuscando(false)
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Padrón de Percepciones IIBB</h1>
          <p className="text-sm text-muted-foreground">
            Gestión de padrones ARBA / ARCIBA / DGR para percepciones y retenciones de Ingresos Brutos
          </p>
        </div>
        <Dialog open={importOpen} onOpenChange={setImportOpen}>
          <DialogTrigger asChild>
            <Button>
              <Upload className="h-4 w-4 mr-2" />
              Importar Padrón
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Importar Padrón CSV</DialogTitle>
              <DialogDescription>
                Pegá el contenido CSV del padrón descargado de ARBA, ARCIBA o DGR provincial
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Organismo</Label>
                <Select value={importOrganismo} onValueChange={setImportOrganismo}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {ORGANISMOS.map((o) => (
                      <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Formato esperado</Label>
                <p className="text-xs text-muted-foreground mt-1">
                  {importOrganismo === "ARBA" && "CUIT;FechaDesde;FechaHasta;Alícuota;..."}
                  {importOrganismo === "AGIP" && "CUIT|Alícuota|FechaDesde|FechaHasta|..."}
                  {!["ARBA", "AGIP"].includes(importOrganismo) && "CUIT,Alícuota,FechaDesde,FechaHasta"}
                </p>
              </div>
              <div>
                <Label>Datos CSV</Label>
                <Textarea
                  value={csvText}
                  onChange={(e) => setCsvText(e.target.value)}
                  placeholder="Pegá el contenido del archivo CSV aquí..."
                  rows={10}
                  className="font-mono text-xs"
                />
              </div>
              <Button onClick={importarPadron} disabled={importing || !csvText.trim()} className="w-full">
                {importing ? "Importando..." : "Importar"}
              </Button>

              {importResult && (
                <Card className={importResult.errores > 0 ? "border-amber-300" : "border-green-300"}>
                  <CardContent className="p-4 space-y-2">
                    <div className="flex items-center gap-2">
                      {importResult.errores === 0 ? (
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                      ) : (
                        <AlertTriangle className="h-5 w-5 text-amber-600" />
                      )}
                      <span className="font-medium">
                        Resultado: {importResult.insertados} insertados, {importResult.actualizados} actualizados
                      </span>
                    </div>
                    <div className="grid grid-cols-4 gap-2 text-sm">
                      <div>Total: <strong>{importResult.total}</strong></div>
                      <div className="text-green-600">Nuevos: <strong>{importResult.insertados}</strong></div>
                      <div className="text-blue-600">Actualizados: <strong>{importResult.actualizados}</strong></div>
                      <div className="text-red-600">Errores: <strong>{importResult.errores}</strong></div>
                    </div>
                    {importResult.detalleErrores.length > 0 && (
                      <div className="text-xs text-muted-foreground max-h-24 overflow-y-auto">
                        {importResult.detalleErrores.map((e, i) => <div key={i}>{e}</div>)}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Total Registros</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.total ?? 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Vigentes</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats?.vigentes ?? 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Vencidos</CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats?.vencidos ?? 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Organismos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.porOrganismo?.length ?? 0}</div>
          </CardContent>
        </Card>
      </div>

      {/* Organismo breakdown */}
      {stats?.porOrganismo && stats.porOrganismo.length > 0 && (
        <div className="grid gap-3 md:grid-cols-5">
          {ORGANISMOS.map((o) => {
            const data = stats.porOrganismo.find((p) => p.organismo === o.value)
            return (
              <Card key={o.value} className={data ? "" : "opacity-50"}>
                <CardContent className="p-4">
                  <div className="text-xs text-muted-foreground">{o.label}</div>
                  <div className="text-lg font-bold">{data?.cantidad ?? 0}</div>
                  <div className="text-xs">
                    Alícuota prom: <strong>{data?.alicuotaPromedio?.toFixed(2) ?? "—"}%</strong>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Tabs */}
      <Tabs defaultValue="padron">
        <TabsList>
          <TabsTrigger value="padron">
            <FileSpreadsheet className="h-4 w-4 mr-1" />
            Padrón
          </TabsTrigger>
          <TabsTrigger value="consulta">
            <Search className="h-4 w-4 mr-1" />
            Consultar CUIT
          </TabsTrigger>
        </TabsList>

        <TabsContent value="padron" className="space-y-4">
          {/* Filters */}
          <div className="flex gap-3 items-center">
            <Select value={filtroOrganismo} onValueChange={setFiltroOrganismo}>
              <SelectTrigger className="w-48"><SelectValue placeholder="Organismo" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos los organismos</SelectItem>
                {ORGANISMOS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant={soloVigentes ? "default" : "outline"}
              size="sm"
              onClick={() => setSoloVigentes(!soloVigentes)}
            >
              {soloVigentes ? "Solo vigentes" : "Todos"}
            </Button>
            <span className="text-sm text-muted-foreground ml-auto">{total} registros</span>
          </div>

          <DataTable<PadronEntry>
            data={padrones}
            columns={[
              { key: "cuitSujeto", header: "CUIT", sortable: true, cell: (p) => <span className="font-mono text-xs">{p.cuitSujeto}</span> },
              { key: "cliente" as any, header: "Cliente", cell: (p) => <span className="text-sm">{p.cliente?.nombre ?? "—"}</span>, exportFn: (p) => p.cliente?.nombre ?? "" },
              { key: "organismo", header: "Organismo", sortable: true, cell: (p) => <Badge variant="outline">{p.organismo}</Badge> },
              { key: "jurisdiccion", header: "Jurisdicción", sortable: true },
              { key: "tipoRegimen", header: "Tipo", cell: (p) => <span className="text-xs">{p.tipoRegimen}</span> },
              { key: "alicuota", header: "Alícuota", sortable: true, cell: (p) => <span className="text-right block font-medium">{Number(p.alicuota).toFixed(2)}%</span> },
              { key: "vigenciaDesde", header: "Vigencia", cell: (p) => <span className="text-xs">{new Date(p.vigenciaDesde).toLocaleDateString("es-AR")} — {p.vigenciaHasta ? new Date(p.vigenciaHasta).toLocaleDateString("es-AR") : "∞"}</span> },
            ] as DataTableColumn<PadronEntry>[]}
            rowKey="id"
            searchPlaceholder="Buscar por CUIT, cliente, organismo..."
            searchKeys={["cuitSujeto", "organismo", "jurisdiccion", "tipoRegimen"]}
            exportFilename="padron-impuestos"
            loading={loading}
            emptyMessage="Sin registros. Importá un padrón para comenzar."
            emptyIcon={<EmptyStateIllustration type="generico" compact title="Sin registros de padrón" description="Importá un padrón para comenzar." />}
            compact
          />
        </TabsContent>

        <TabsContent value="consulta" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Consultar CUIT</CardTitle>
              <CardDescription>Buscá un CUIT para ver todos los regímenes de percepción/retención vigentes</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-3">
                <Input
                  value={consultaCuit}
                  onChange={(e) => setConsultaCuit(e.target.value)}
                  placeholder="20-12345678-9"
                  className="max-w-xs font-mono"
                />
                <Button onClick={consultarCuit} disabled={buscando || !consultaCuit.trim()}>
                  <Search className="h-4 w-4 mr-2" />
                  {buscando ? "Buscando..." : "Consultar"}
                </Button>
              </div>

              {consultaResult !== null && (
                <div>
                  {consultaResult.length === 0 ? (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground py-4">
                      <XCircle className="h-4 w-4" />
                      CUIT no encontrado en ningún padrón
                    </div>
                  ) : (
                    <DataTable<PadronEntry>
                      data={consultaResult}
                      columns={[
                        { key: "organismo", header: "Organismo", cell: (r) => <Badge variant="outline">{r.organismo}</Badge> },
                        { key: "jurisdiccion", header: "Jurisdicción" },
                        { key: "tipoRegimen", header: "Tipo Régimen", cell: (r) => <span className="text-xs">{r.tipoRegimen}</span> },
                        { key: "alicuota", header: "Alícuota", sortable: true, cell: (r) => <span className="text-right block font-bold">{Number(r.alicuota).toFixed(2)}%</span> },
                        { key: "vigenciaDesde", header: "Vigencia", cell: (r) => <span className="text-xs">{new Date(r.vigenciaDesde).toLocaleDateString("es-AR")} — {r.vigenciaHasta ? new Date(r.vigenciaHasta).toLocaleDateString("es-AR") : "∞"}</span> },
                      ] as DataTableColumn<PadronEntry>[]}
                      rowKey="id"
                      exportFilename="consulta-cuit"
                      compact
                    />
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
