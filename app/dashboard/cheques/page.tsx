"use client"

/**
 * MÓDULO CHEQUES — Gestión completa de cartera de cheques
 *
 * Crítico para el mercado argentino donde los cheques siguen siendo
 * el instrumento de pago/cobro más común en operaciones B2B.
 *
 * Aplica a: todos los rubros con clientes B2B
 *
 * Flujos:
 *  1. Recibir cheque de cliente → estado "cartera"
 *  2. Depositar → estado "depositado"  → conciliación bancaria automática
 *  3. Endosar a proveedor → estado "endosado"
 *  4. Rebotado → genera deuda al cliente + alerta
 *  5. Cheques propios emitidos a proveedores → seguimiento de débito
 *
 * TODO (requiere schema migration):
 *  - Agregar campo `fotoUrl String?` para foto del cheque (capturada por vendedor)
 *  - Agregar campo `endosadoAProveedorId Int?` para tracking de endosos
 */

import { useState, useEffect, useCallback } from "react"
import { FileText, Plus, Search, AlertTriangle, CheckCircle2, Clock, ArrowRight, DollarSign, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface Cheque {
  id: number
  numero: string
  tipoCheque: string
  monto: number
  fechaEmision: string
  fechaVencimiento: string
  cuitBancoLibrador?: string
  estado: string
  observaciones?: string
  cliente?: { id: number; nombre: string }
  proveedor?: { id: number; nombre: string }
}

interface Stats {
  totalCartera: number
  totalEmitidos: number
  proximosVencer: number
}

const currency = new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 })

const ESTADO_CONFIG: Record<string, { label: string; color: string; icon: typeof Clock }> = {
  cartera:    { label: "En cartera",   color: "bg-blue-100 text-blue-700",   icon: Clock },
  depositado: { label: "Depositado",   color: "bg-cyan-100 text-cyan-700",   icon: ArrowRight },
  endosado:   { label: "Endosado",     color: "bg-purple-100 text-purple-700", icon: ArrowRight },
  rechazado:  { label: "Rechazado",    color: "bg-red-100 text-red-700",     icon: AlertTriangle },
  debitado:   { label: "Debitado",     color: "bg-green-100 text-green-700", icon: CheckCircle2 },
  anulado:    { label: "Anulado",      color: "bg-gray-100 text-gray-500",   icon: FileText },
}

const initialForm = {
  numero: "", tipoCheque: "tercero", monto: "", fechaEmision: new Date().toISOString().split("T")[0],
  fechaVencimiento: "", cuitBancoLibrador: "", estado: "cartera", observaciones: "",
  clienteId: "", proveedorId: "",
}

function diasParaVencer(fecha: string) {
  const dias = Math.floor((new Date(fecha).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
  return dias
}

export default function ChequesPage() {
  const [cheques, setCheques] = useState<Cheque[]>([])
  const [stats, setStats] = useState<Stats>({ totalCartera: 0, totalEmitidos: 0, proximosVencer: 0 })
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [filtroEstado, setFiltroEstado] = useState("todos")
  const [filtroTipo, setFiltroTipo] = useState("todos")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [form, setForm] = useState(initialForm)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState("")
  const [cambioEstado, setCambioEstado] = useState<{ chequeId: number; estadoActual: string } | null>(null)
  const [nuevoEstado, setNuevoEstado] = useState("")
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null

  const fetchCheques = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filtroEstado !== "todos") params.set("estado", filtroEstado)
      if (filtroTipo !== "todos") params.set("tipo", filtroTipo)
      if (search) params.set("search", search)
      const res = await fetch(`/api/cheques?${params}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      if (res.ok) {
        const data = await res.json()
        setCheques(data.cheques ?? data)
        setStats(data.stats ?? { totalCartera: 0, totalEmitidos: 0, proximosVencer: 0 })
      }
    } finally { setLoading(false) }
  }, [filtroEstado, filtroTipo, search, token])

  useEffect(() => {
    const t = setTimeout(fetchCheques, 300)
    return () => clearTimeout(t)
  }, [fetchCheques])

  const guardar = async () => {
    if (!form.numero.trim()) { setError("El número es obligatorio"); return }
    if (!form.monto || parseFloat(form.monto) <= 0) { setError("El monto debe ser mayor a 0"); return }
    if (!form.fechaVencimiento) { setError("La fecha de vencimiento es obligatoria"); return }
    setGuardando(true); setError("")
    try {
      const res = await fetch("/api/cheques", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({
          numero: form.numero,
          tipoCheque: form.tipoCheque,
          monto: parseFloat(form.monto),
          fechaEmision: form.fechaEmision,
          fechaVencimiento: form.fechaVencimiento,
          cuitBancoLibrador: form.cuitBancoLibrador || undefined,
          estado: form.estado,
          observaciones: form.observaciones || undefined,
          clienteId: form.clienteId ? parseInt(form.clienteId) : null,
          proveedorId: form.proveedorId ? parseInt(form.proveedorId) : null,
        }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || "Error al guardar"); return }
      setDialogOpen(false)
      setForm(initialForm)
      fetchCheques()
    } finally { setGuardando(false) }
  }

  const cambiarEstadoCheque = async () => {
    if (!cambioEstado || !nuevoEstado) return
    await fetch(`/api/cheques/${cambioEstado.chequeId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify({ estado: nuevoEstado }),
    })
    setCambioEstado(null)
    setNuevoEstado("")
    fetchCheques()
  }

  const chequesFiltrados = cheques.filter((c) => {
    if (filtroEstado !== "todos" && c.estado !== filtroEstado) return false
    if (filtroTipo !== "todos" && c.tipoCheque !== filtroTipo) return false
    return true
  })

  const proximosVencer = cheques.filter((c) => {
    const dias = diasParaVencer(c.fechaVencimiento)
    return dias >= 0 && dias <= 7 && ["cartera", "depositado"].includes(c.estado)
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <FileText className="h-6 w-6 text-violet-600" />
            Cheques
          </h1>
          <p className="text-muted-foreground text-sm">Cartera de cheques recibidos y emitidos — mercado argentino</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={fetchCheques} className="gap-1">
            <RefreshCw className="h-3.5 w-3.5" />
          </Button>
          <Button onClick={() => { setForm(initialForm); setError(""); setDialogOpen(true) }} className="gap-2">
            <Plus className="h-4 w-4" /> Nuevo Cheque
          </Button>
        </div>
      </div>

      {/* Alerta vencimientos */}
      {proximosVencer.length > 0 && (
        <Alert className="border-orange-200 bg-orange-50">
          <AlertTriangle className="h-4 w-4 text-orange-600" />
          <AlertDescription className="text-orange-800">
            <strong>{proximosVencer.length} cheque(s)</strong> vencen en los próximos 7 días.
            Total: {currency.format(proximosVencer.reduce((s, c) => s + c.monto, 0))}
          </AlertDescription>
        </Alert>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs text-muted-foreground">Cartera de terceros</p>
            <p className="text-2xl font-bold text-blue-600">{currency.format(stats.totalCartera)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs text-muted-foreground">Emitidos propios</p>
            <p className="text-2xl font-bold text-orange-600">{currency.format(stats.totalEmitidos)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs text-muted-foreground">Próximos a vencer</p>
            <p className="text-2xl font-bold text-red-600">{stats.proximosVencer}</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="todos">
        <TabsList>
          <TabsTrigger value="todos">Todos ({cheques.length})</TabsTrigger>
          <TabsTrigger value="terceros">De Clientes ({cheques.filter(c => c.tipoCheque === "tercero").length})</TabsTrigger>
          <TabsTrigger value="propios">Emitidos ({cheques.filter(c => c.tipoCheque === "propio").length})</TabsTrigger>
          <TabsTrigger value="vencer" className="text-orange-600">Vencen pronto ({proximosVencer.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="todos" className="mt-4">
          <ChequeTable
            cheques={chequesFiltrados}
            loading={loading}
            search={search}
            onSearchChange={setSearch}
            filtroEstado={filtroEstado}
            onFiltroEstadoChange={setFiltroEstado}
            onCambiarEstado={(id, est) => { setCambioEstado({ chequeId: id, estadoActual: est }); setNuevoEstado("") }}
          />
        </TabsContent>
        <TabsContent value="terceros" className="mt-4">
          <ChequeTable
            cheques={cheques.filter(c => c.tipoCheque === "tercero")}
            loading={loading}
            search={search}
            onSearchChange={setSearch}
            filtroEstado={filtroEstado}
            onFiltroEstadoChange={setFiltroEstado}
            onCambiarEstado={(id, est) => { setCambioEstado({ chequeId: id, estadoActual: est }); setNuevoEstado("") }}
          />
        </TabsContent>
        <TabsContent value="propios" className="mt-4">
          <ChequeTable
            cheques={cheques.filter(c => c.tipoCheque === "propio")}
            loading={loading}
            search={search}
            onSearchChange={setSearch}
            filtroEstado={filtroEstado}
            onFiltroEstadoChange={setFiltroEstado}
            onCambiarEstado={(id, est) => { setCambioEstado({ chequeId: id, estadoActual: est }); setNuevoEstado("") }}
          />
        </TabsContent>
        <TabsContent value="vencer" className="mt-4">
          <ChequeTable
            cheques={proximosVencer}
            loading={loading}
            search=""
            onSearchChange={() => {}}
            filtroEstado="todos"
            onFiltroEstadoChange={() => {}}
            onCambiarEstado={(id, est) => { setCambioEstado({ chequeId: id, estadoActual: est }); setNuevoEstado("") }}
          />
        </TabsContent>
      </Tabs>

      {/* Dialog Nuevo Cheque */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Registrar Cheque</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Tipo</Label>
                <Select value={form.tipoCheque} onValueChange={(v) => setForm({ ...form, tipoCheque: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="tercero">De cliente (recibido)</SelectItem>
                    <SelectItem value="propio">Propio (emitido)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Número *</Label>
                <Input value={form.numero} onChange={(e) => setForm({ ...form, numero: e.target.value })} placeholder="00123456" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Monto *</Label>
                <Input type="number" step="0.01" value={form.monto} onChange={(e) => setForm({ ...form, monto: e.target.value })} placeholder="50000" />
              </div>
              <div className="space-y-1">
                <Label>Estado inicial</Label>
                <Select value={form.estado} onValueChange={(v) => setForm({ ...form, estado: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(ESTADO_CONFIG).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Fecha emisión</Label>
                <Input type="date" value={form.fechaEmision} onChange={(e) => setForm({ ...form, fechaEmision: e.target.value })} />
              </div>
              <div className="space-y-1">
                <Label>Fecha vencimiento *</Label>
                <Input type="date" value={form.fechaVencimiento} onChange={(e) => setForm({ ...form, fechaVencimiento: e.target.value })} />
              </div>
            </div>
            <div className="space-y-1">
              <Label>CUIT Banco librador</Label>
              <Input value={form.cuitBancoLibrador} onChange={(e) => setForm({ ...form, cuitBancoLibrador: e.target.value })} placeholder="30-71362330-5 (Banco Galicia)" />
            </div>
            <div className="space-y-1">
              <Label>Observaciones</Label>
              <Input value={form.observaciones} onChange={(e) => setForm({ ...form, observaciones: e.target.value })} placeholder="Referencia, concepto..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={guardar} disabled={guardando}>{guardando ? "Guardando..." : "Registrar"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Cambio de Estado */}
      <Dialog open={!!cambioEstado} onOpenChange={() => setCambioEstado(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Cambiar estado del cheque</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <p className="text-sm text-muted-foreground">
              Estado actual: <span className="font-medium">{ESTADO_CONFIG[cambioEstado?.estadoActual || ""]?.label}</span>
            </p>
            <Select value={nuevoEstado} onValueChange={setNuevoEstado}>
              <SelectTrigger><SelectValue placeholder="Seleccionar nuevo estado..." /></SelectTrigger>
              <SelectContent>
                {Object.entries(ESTADO_CONFIG).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCambioEstado(null)}>Cancelar</Button>
            <Button onClick={cambiarEstadoCheque} disabled={!nuevoEstado}>Confirmar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function ChequeTable({
  cheques, loading, search, onSearchChange, filtroEstado, onFiltroEstadoChange, onCambiarEstado,
}: {
  cheques: Cheque[]
  loading: boolean
  search: string
  onSearchChange: (v: string) => void
  filtroEstado: string
  onFiltroEstadoChange: (v: string) => void
  onCambiarEstado: (id: number, estadoActual: string) => void
}) {
  return (
    <div className="space-y-3">
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar..." value={search} onChange={(e) => onSearchChange(e.target.value)} className="pl-9" />
        </div>
        <Select value={filtroEstado} onValueChange={onFiltroEstadoChange}>
          <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos los estados</SelectItem>
            {Object.entries(ESTADO_CONFIG).map(([k, v]) => (
              <SelectItem key={k} value={k}>{v.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Número</TableHead>
                <TableHead>Titular</TableHead>
                <TableHead className="text-right">Monto</TableHead>
                <TableHead>Vencimiento</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Cargando...</TableCell></TableRow>
              ) : cheques.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No hay cheques</TableCell></TableRow>
              ) : cheques.map((c) => {
                const dias = diasParaVencer(c.fechaVencimiento)
                const venceProx = dias >= 0 && dias <= 7
                const cfg = ESTADO_CONFIG[c.estado] || { label: c.estado, color: "bg-gray-100 text-gray-600", icon: FileText }
                return (
                  <TableRow key={c.id} className={venceProx && c.estado !== "debitado" ? "bg-orange-50 dark:bg-orange-900/10" : ""}>
                    <TableCell>
                      <p className="font-mono font-medium">{c.numero}</p>
                      <p className="text-[10px] text-muted-foreground">{c.tipoCheque === "tercero" ? "Recibido" : "Emitido"}</p>
                    </TableCell>
                    <TableCell>
                      {c.cliente?.nombre || c.proveedor?.nombre || "—"}
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      {currency.format(c.monto)}
                    </TableCell>
                    <TableCell>
                      <p className={`text-sm ${venceProx ? "font-bold text-orange-600" : ""}`}>
                        {new Date(c.fechaVencimiento).toLocaleDateString("es-AR")}
                      </p>
                      {venceProx && <p className="text-[10px] text-orange-500">En {dias} días</p>}
                    </TableCell>
                    <TableCell>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${cfg.color}`}>
                        {cfg.label}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs"
                        onClick={() => onCambiarEstado(c.id, c.estado)}
                      >
                        Cambiar estado
                      </Button>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
