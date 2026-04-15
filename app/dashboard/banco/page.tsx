"use client"

import { useEffect, useState, useCallback, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Landmark, Search, RefreshCw, CheckCircle2, XCircle, Plus, Sparkles, ArrowLeftRight } from "lucide-react"
import { DataTable, type DataTableColumn } from "@/components/data-table"
import { EmptyStateIllustration } from "@/components/empty-state-illustration"
import { cn } from "@/lib/utils"
import { useKeyboardShortcuts, erpShortcuts } from "@/hooks/use-keyboard-shortcuts"
import { useToast } from "@/hooks/use-toast"
import { FilterPanel, type FilterField, type FilterValues } from "@/components/filter-panel"

type Mov = {
  id: number
  fecha: string
  tipo: string
  importe: number
  descripcion: string
  referencia: string | null
  estado: string
  cuentaBancaria?: { id: number; alias: string | null; cbu: string | null; tipo: string; banco: { nombre: string } }
}
type CuentaBancariaOption = { id: number; alias: string | null; cbu: string | null; tipo: string; banco: { nombre: string } }
type Resumen = { saldo: number; pendientes: number; conciliados: number; totalMovimientos: number }

function formatCurrency(v: number) {
  return new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(v)
}

export default function BancoPage() {
  const [movimientos, setMovimientos] = useState<Mov[]>([])
  const [cuentas, setCuentas] = useState<CuentaBancariaOption[]>([])
  const [resumen, setResumen] = useState<Resumen | null>(null)
  const [loading, setLoading] = useState(false)
  const [busqueda, setBusqueda] = useState("")
  const [filtroCuenta, setFiltroCuenta] = useState("todas")
  const [filters, setFilters] = useState<FilterValues>({})

  // Modal nuevo movimiento
  const [modalNuevo, setModalNuevo] = useState(false)
  const [nCuentaId, setNCuentaId] = useState("")
  const [nTipo, setNTipo] = useState<"credito" | "debito">("credito")
  const [nImporte, setNImporte] = useState("")
  const [nDescripcion, setNDescripcion] = useState("")
  const [nReferencia, setNReferencia] = useState("")
  const [nFecha, setNFecha] = useState(new Date().toISOString().split("T")[0])
  const [creando, setCreando] = useState(false)
  const [errorNuevo, setErrorNuevo] = useState("")

  // Modal transferencia
  const [modalTransfer, setModalTransfer] = useState(false)
  const [tOrigenId, setTOrigenId] = useState("")
  const [tDestinoId, setTDestinoId] = useState("")
  const [tImporte, setTImporte] = useState("")
  const [tDescripcion, setTDescripcion] = useState("")
  const [tReferencia, setTReferencia] = useState("")
  const [tFecha, setTFecha] = useState(new Date().toISOString().split("T")[0])
  const [transferError, setTransferError] = useState("")
  const [transfiriendo, setTransfiriendo] = useState(false)
  const { toast } = useToast()

  const authHeaders = useCallback((): Record<string, string> => {
    const token = localStorage.getItem("token")
    return token ? { Authorization: `Bearer ${token}` } : {}
  }, [])

  const cargar = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filtroCuenta !== "todas") params.set("cuentaId", filtroCuenta)
      const res = await fetch(`/api/banco?${params}`, { headers: authHeaders() })
      const data = await res.json()
      setMovimientos(Array.isArray(data.data) ? data.data : [])
      setCuentas(Array.isArray(data.cuentas) ? data.cuentas : [])
      setResumen(data.resumen ?? null)
    } finally {
      setLoading(false)
    }
  }, [filtroCuenta, authHeaders])

  useEffect(() => {
    void cargar()
  }, [cargar])

  useKeyboardShortcuts(erpShortcuts({ onRefresh: cargar, onNew: () => setModalNuevo(true) }))

  const movsFiltrados = movimientos.filter((m) =>
    m.descripcion.toLowerCase().includes(busqueda.toLowerCase()) ||
    m.referencia?.toLowerCase().includes(busqueda.toLowerCase())
  )

  const filterFields: FilterField[] = [
    { key: "tipo", label: "Tipo", type: "select", options: [
      { value: "credito", label: "Ingreso (crédito)" },
      { value: "debito", label: "Egreso (débito)" },
    ]},
    { key: "descripcion", label: "Concepto", type: "text", placeholder: "Buscar concepto..." },
    { key: "fecha", label: "Fecha", type: "date-range" },
  ]

  const movsConFiltros = useMemo(() => {
    return movsFiltrados.filter((m) => {
      if (filters.tipo && m.tipo !== filters.tipo) return false
      if (filters.descripcion) {
        if (!m.descripcion.toLowerCase().includes(String(filters.descripcion).toLowerCase())) return false
      }
      if (filters.fecha) {
        const range = filters.fecha as { from?: string; to?: string }
        const fecha = m.fecha.slice(0, 10)
        if (range.from && fecha < range.from) return false
        if (range.to && fecha > range.to) return false
      }
      return true
    })
  }, [movsFiltrados, filters])

  const conciliar = async (ids: number[]) => {
    await fetch("/api/banco/conciliar", { method: "PATCH", headers: { "Content-Type": "application/json", ...authHeaders() }, body: JSON.stringify({ ids }) })
    await cargar()
    toast({ title: "Movimientos conciliados", description: `${ids.length} movimiento(s) marcados como conciliados` })
  }

  const crearMovimiento = async () => {
    setErrorNuevo("")
    const importe = parseFloat(nImporte)
    if (!importe || importe <= 0) { setErrorNuevo("Importe inválido"); return }
    if (!nCuentaId) { setErrorNuevo("Seleccione cuenta"); return }
    if (!nDescripcion.trim()) { setErrorNuevo("Ingrese descripción"); return }

    setCreando(true)
    try {
      const res = await fetch("/api/banco", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({
          cuentaBancariaId: parseInt(nCuentaId, 10),
          fecha: nFecha,
          tipo: nTipo,
          importe,
          descripcion: nDescripcion.trim(),
          referencia: nReferencia.trim() || undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) { setErrorNuevo(data.error || "Error"); toast({ title: "Error al crear movimiento", description: data.error || "Ocurrió un error", variant: "destructive" }); return }
      setModalNuevo(false)
      await cargar()
      toast({ title: "Movimiento bancario creado", description: `${nTipo === "credito" ? "Ingreso" : "Egreso"} registrado correctamente` })
    } finally {
      setCreando(false)
    }
  }

  const abrirTransferencia = () => {
    const first = cuentas[0]?.id?.toString() ?? ""
    const second = cuentas[1]?.id?.toString() ?? first
    setModalTransfer(true)
    setTOrigenId(first)
    setTDestinoId(second)
    setTImporte("")
    setTDescripcion("")
    setTReferencia("")
    setTFecha(new Date().toISOString().split("T")[0])
    setTransferError("")
  }

  const transferir = async () => {
    setTransferError("")
    const importe = parseFloat(tImporte)
    if (!tOrigenId || !tDestinoId) { setTransferError("Seleccione cuentas origen y destino"); return }
    if (tOrigenId === tDestinoId) { setTransferError("Origen y destino no pueden ser iguales"); return }
    if (!importe || importe <= 0) { setTransferError("Importe inválido"); return }

    setTransfiriendo(true)
    try {
      const res = await fetch("/api/banco/transferencias", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({
          cuentaOrigenId: parseInt(tOrigenId, 10),
          cuentaDestinoId: parseInt(tDestinoId, 10),
          importe,
          fecha: tFecha,
          descripcion: tDescripcion.trim() || undefined,
          referencia: tReferencia.trim() || undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) { setTransferError(data.error || "Error al transferir"); toast({ title: "Error en transferencia", description: data.error || "No se pudo completar", variant: "destructive" }); return }
      setModalTransfer(false)
      await cargar()
      toast({ title: "Transferencia realizada", description: "La transferencia entre cuentas se registró correctamente" })
    } finally {
      setTransfiriendo(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="dashboard-surface rounded-xl p-4 sm:p-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-medium text-primary mb-2">
            <Sparkles className="h-3.5 w-3.5" />
            Conciliación bancaria corporativa
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Cuenta Bancaria</h1>
          <p className="text-muted-foreground text-sm mt-1">Movimientos, conciliación y control de saldos</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={cargar} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Actualizar
          </Button>
          <Button variant="outline" onClick={abrirTransferencia} disabled={cuentas.length < 2}>
            <ArrowLeftRight className="h-4 w-4 mr-2" />
            Transferir
          </Button>
          <Button onClick={() => {
            setModalNuevo(true)
            setNCuentaId(cuentas[0]?.id.toString() ?? "")
            setNTipo("credito")
            setNImporte("")
            setNDescripcion("")
            setNReferencia("")
            setNFecha(new Date().toISOString().split("T")[0])
            setErrorNuevo("")
          }}>
            <Plus className="h-4 w-4 mr-2" />
            Nuevo movimiento
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid gap-3 sm:grid-cols-3">
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs text-muted-foreground mb-1">Saldo actual</p>
            <p className={cn("text-2xl font-bold", (resumen?.saldo ?? 0) >= 0 ? "text-green-700" : "text-red-700")}>
              {formatCurrency(resumen?.saldo ?? 0)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs text-muted-foreground mb-1">Movimientos pendientes</p>
            <p className="text-2xl font-bold text-amber-600">{resumen?.pendientes ?? 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs text-muted-foreground mb-1">Conciliados</p>
            <p className="text-2xl font-bold text-green-700">
              {resumen?.conciliados ?? 0} / {resumen?.totalMovimientos ?? 0}
            </p>
          </CardContent>
        </Card>
      </div>

      <FilterPanel fields={filterFields} values={filters} onChange={setFilters} />

      {/* Table */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Movimientos bancarios</CardTitle>
            <div className="flex gap-2">
              {cuentas.length > 1 && (
                <Select value={filtroCuenta} onValueChange={setFiltroCuenta}>
                  <SelectTrigger className="h-9 w-48"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todas">Todas las cuentas</SelectItem>
                    {cuentas.map((c) => (
                      <SelectItem key={c.id} value={String(c.id)}>{c.alias ?? c.cbu ?? `${c.banco.nombre} ${c.tipo}`}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <DataTable<Mov>
            data={movsConFiltros}
            columns={[
              { key: "fecha", header: "Fecha", sortable: true, cell: (m) => <span className="text-muted-foreground">{new Date(m.fecha).toLocaleDateString("es-AR")}</span> },
              { key: "descripcion", header: "Descripción", sortable: true },
              { key: "referencia", header: "Referencia", cell: (m) => <span className="text-xs text-muted-foreground font-mono">{m.referencia ?? "—"}</span> },
              { key: "importe", header: "Importe", align: "right", sortable: true, cell: (m) => <span className={cn("font-bold", m.tipo === "credito" ? "text-green-700" : "text-red-700")}>{m.tipo === "credito" ? "+" : "-"}{formatCurrency(Math.abs(m.importe))}</span> },
              { key: "estado", header: "Estado", cell: (m) => m.estado === "conciliado" ? <span className="flex items-center gap-1 text-green-600 text-xs"><CheckCircle2 className="h-3.5 w-3.5" />Conciliado</span> : <span className="flex items-center gap-1 text-amber-600 text-xs"><XCircle className="h-3.5 w-3.5" />Pendiente</span> },
              { key: "acciones" as any, header: "", cell: (m) => m.estado === "pendiente" ? <Button size="sm" variant="outline" className="h-7 text-xs" onClick={(e) => { e.stopPropagation(); conciliar([m.id]) }}>Conciliar</Button> : null },
            ] as DataTableColumn<Mov>[]}
            rowKey="id"
            searchPlaceholder="Buscar movimiento..."
            searchKeys={["descripcion", "referencia"]}
            selectable
            exportFilename="movimientos-banco"
            loading={loading}
            emptyMessage="No hay movimientos bancarios"
            emptyIcon={<EmptyStateIllustration type="generico" compact title="Sin movimientos" description="Cargá movimientos o sincronizá con el banco." />}
            defaultPageSize={25}
            compact
          />
        </CardContent>
      </Card>

      {/* Modal nuevo movimiento */}
      <Dialog open={modalNuevo} onOpenChange={setModalNuevo}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Nuevo Movimiento Bancario</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            {errorNuevo && <div className="p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">{errorNuevo}</div>}
            <div className="space-y-1.5">
              <Label>Cuenta bancaria</Label>
              <Select value={nCuentaId} onValueChange={setNCuentaId}>
                <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                <SelectContent>
                  {cuentas.map((c) => (
                    <SelectItem key={c.id} value={String(c.id)}>{c.alias ?? c.cbu ?? `${c.banco.nombre} ${c.tipo}`}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Tipo</Label>
                <Select value={nTipo} onValueChange={(v) => setNTipo(v as "credito" | "debito")}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="credito">Crédito (+)</SelectItem>
                    <SelectItem value="debito">Débito (-)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Fecha</Label>
                <Input type="date" value={nFecha} onChange={(e) => setNFecha(e.target.value)} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Importe</Label>
              <Input type="number" step="0.01" placeholder="0.00" value={nImporte} onChange={(e) => setNImporte(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Descripción</Label>
              <Input placeholder="Transferencia recibida, pago servicio..." value={nDescripcion} onChange={(e) => setNDescripcion(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Referencia</Label>
              <Input placeholder="N° operación, CBU origen..." value={nReferencia} onChange={(e) => setNReferencia(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalNuevo(false)}>Cancelar</Button>
            <Button onClick={crearMovimiento} disabled={creando}>{creando ? "Guardando..." : "Registrar"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal transferencia */}
      <Dialog open={modalTransfer} onOpenChange={setModalTransfer}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Transferencia entre cuentas</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            {transferError && <div className="p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">{transferError}</div>}
            <div className="space-y-1.5">
              <Label>Cuenta origen</Label>
              <Select value={tOrigenId} onValueChange={setTOrigenId}>
                <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                <SelectContent>
                  {cuentas.map((c) => (
                    <SelectItem key={`o-${c.id}`} value={String(c.id)}>{c.alias ?? c.cbu ?? `${c.banco.nombre} ${c.tipo}`}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Cuenta destino</Label>
              <Select value={tDestinoId} onValueChange={setTDestinoId}>
                <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                <SelectContent>
                  {cuentas.map((c) => (
                    <SelectItem key={`d-${c.id}`} value={String(c.id)}>{c.alias ?? c.cbu ?? `${c.banco.nombre} ${c.tipo}`}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Importe</Label>
                <Input type="number" step="0.01" placeholder="0.00" value={tImporte} onChange={(e) => setTImporte(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Fecha</Label>
                <Input type="date" value={tFecha} onChange={(e) => setTFecha(e.target.value)} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Descripción</Label>
              <Input placeholder="Transferencia interna" value={tDescripcion} onChange={(e) => setTDescripcion(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Referencia</Label>
              <Input placeholder="Referencia opcional" value={tReferencia} onChange={(e) => setTReferencia(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalTransfer(false)}>Cancelar</Button>
            <Button onClick={transferir} disabled={transfiriendo}>{transfiriendo ? "Procesando..." : "Transferir"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
