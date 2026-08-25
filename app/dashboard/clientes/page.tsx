"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Plus, Pencil, Trash2, Search, ChevronLeft, ChevronRight,
  Building2, FileText, MapPin, DollarSign, ShoppingCart, Eye, Download, ToggleRight, Sparkles,
  CalendarPlus, PlayCircle, Receipt, BookOpen,
} from "lucide-react"
import { useAuthStore } from "@/lib/stores/auth-store"
import { PageShell, PageHeader, StatusBadge } from "@/components/layout"
import { PageSkeleton } from "@/components/layout/page-skeleton"
import { parseApiList } from "@/lib/api/parse-list-response"
import { DataTable, type DataTableColumn } from "@/components/data-table"
import { EmptyState } from "@/components/ui/empty-state"
import { activoVariant, activoLabel } from "@/lib/ui/status-map"
import { CSVImport } from "@/components/csv-import"
import { useKeyboardShortcuts, erpShortcuts } from "@/hooks/use-keyboard-shortcuts"
import { useConfirm } from "@/hooks/use-confirm"
import { useToast } from "@/hooks/use-toast"
import { FilterPanel, type FilterField, type FilterValues } from "@/components/filter-panel"
import { CuitPadronLookup, mapCondicionIvaPadron } from "@/components/fiscal/cuit-padron-lookup"
import { HistorialFumigacion } from "@/components/clientes/historial-fumigacion"
import { Bug } from "lucide-react"
const authHeaders = (): HeadersInit => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${localStorage.getItem("token")}`,
})

const EMPTY_FORM: Record<string, any> = {
  nombre: "", nombreFantasia: "", tipoPersona: "persona_juridica", codigo: "",
  cuit: "", dni: "", condicionIva: "RESPONSABLE_INSCRIPTO",
  nroIIBB: "", situacionIIBB: "__none__",
  esAgenteRetencionIVA: false, esAgenteRetencionGanancias: false,
  esAgentePercepcionIVA: false, esAgentePercepcionIIBB: false,
  esGranEmpresa: false, esExportacion: false,
  nroCertificadoExclusion: "", vigenciaCertificadoExclusion: "",
  direccion: "", direccionComplemento: "", codigoPostal: "",
  provinciaId: "__none__", localidadId: "__none__", paisId: "__none__", zonaGeograficaId: "__none__",
  telefono: "", telefonoAlternativo: "", email: "", emailFacturacion: "", web: "",
  fechaNacimiento: "", observaciones: "",
  limiteCredito: 0, fiadoHabilitado: false, emailNotificacionFiado: "", emailNotificacionFiado2: "",
  notificarClienteFiado: false,
  descuentoPct: 0, diasGraciaExtra: 0, monedaHabitual: "pesos",
  cuentaContableCodigo: "",
  condicionPagoId: "__none__", formaPagoId: "__none__",
  vendedorId: "__none__", listaPrecioId: "__none__",
  tipoClienteId: "__none__", estadoClienteId: "__none__",
  rubroId: "__none__", canalVentaId: "__none__", segmentoClienteId: "__none__",
  activo: true,
}

const PAGE_SIZE = 25

function clienteToForm(c: any): Record<string, any> {
  return {
    nombre: c.nombre ?? "",
    nombreFantasia: c.nombreFantasia ?? "",
    tipoPersona: c.tipoPersona ?? "persona_juridica",
    codigo: c.codigo ?? "",
    cuit: c.cuit ?? "",
    dni: c.dni ?? "",
    condicionIva: c.condicionIva ?? "RESPONSABLE_INSCRIPTO",
    nroIIBB: c.nroIIBB ?? "",
    situacionIIBB: c.situacionIIBB ?? "__none__",
    esAgenteRetencionIVA: c.esAgenteRetencionIVA ?? false,
    esAgenteRetencionGanancias: c.esAgenteRetencionGanancias ?? false,
    esAgentePercepcionIVA: c.esAgentePercepcionIVA ?? false,
    esAgentePercepcionIIBB: c.esAgentePercepcionIIBB ?? false,
    esGranEmpresa: c.esGranEmpresa ?? false,
    esExportacion: c.esExportacion ?? false,
    nroCertificadoExclusion: c.nroCertificadoExclusion ?? "",
    vigenciaCertificadoExclusion: c.vigenciaCertificadoExclusion ? c.vigenciaCertificadoExclusion.slice(0, 10) : "",
    direccion: c.direccion ?? "",
    direccionComplemento: c.direccionComplemento ?? "",
    codigoPostal: c.codigoPostal ?? "",
    provinciaId: c.provinciaId ? String(c.provinciaId) : "__none__",
    localidadId: c.localidadId ? String(c.localidadId) : "__none__",
    paisId: c.paisId ? String(c.paisId) : "__none__",
    zonaGeograficaId: c.zonaGeograficaId ? String(c.zonaGeograficaId) : "__none__",
    telefono: c.telefono ?? "",
    telefonoAlternativo: c.telefonoAlternativo ?? "",
    email: c.email ?? "",
    emailFacturacion: c.emailFacturacion ?? "",
    web: c.web ?? "",
    fechaNacimiento: c.fechaNacimiento ? c.fechaNacimiento.slice(0, 10) : "",
    observaciones: c.observaciones ?? "",
    limiteCredito: c.limiteCredito ?? 0,
    fiadoHabilitado: c.fiadoHabilitado ?? false,
    emailNotificacionFiado: c.emailNotificacionFiado ?? "",
    emailNotificacionFiado2: c.emailNotificacionFiado2 ?? "",
    notificarClienteFiado: c.notificarClienteFiado ?? false,
    descuentoPct: c.descuentoPct ?? 0,
    diasGraciaExtra: c.diasGraciaExtra ?? 0,
    monedaHabitual: c.monedaHabitual ?? "pesos",
    cuentaContableCodigo: c.cuentaContableCodigo ?? "",
    condicionPagoId: c.condicionPagoId ? String(c.condicionPagoId) : "__none__",
    formaPagoId: c.formaPagoId ? String(c.formaPagoId) : "__none__",
    vendedorId: c.vendedorId ? String(c.vendedorId) : "__none__",
    listaPrecioId: c.listaPrecioId ? String(c.listaPrecioId) : "__none__",
    tipoClienteId: c.tipoClienteId ? String(c.tipoClienteId) : "__none__",
    estadoClienteId: c.estadoClienteId ? String(c.estadoClienteId) : "__none__",
    rubroId: c.rubroId ? String(c.rubroId) : "__none__",
    canalVentaId: c.canalVentaId ? String(c.canalVentaId) : "__none__",
    segmentoClienteId: c.segmentoClienteId ? String(c.segmentoClienteId) : "__none__",
    activo: c.activo ?? true,
  }
}

function formToPayload(f: Record<string, any>) {
  const p = { ...f }
  const fkToInt = (v: string) => v === "__none__" ? null : Number(v)
  
  if (p.situacionIIBB === "__none__") p.situacionIIBB = null

  p.limiteCredito = Number(p.limiteCredito) || 0
  p.descuentoPct = Number(p.descuentoPct) || 0
  p.diasGraciaExtra = Number(p.diasGraciaExtra) || 0

  p.provinciaId = fkToInt(p.provinciaId)
  p.localidadId = fkToInt(p.localidadId)
  p.paisId = fkToInt(p.paisId)
  p.zonaGeograficaId = fkToInt(p.zonaGeograficaId)
  p.condicionPagoId = fkToInt(p.condicionPagoId)
  p.formaPagoId = fkToInt(p.formaPagoId)
  p.vendedorId = fkToInt(p.vendedorId)
  p.listaPrecioId = fkToInt(p.listaPrecioId)
  p.tipoClienteId = fkToInt(p.tipoClienteId)
  p.estadoClienteId = fkToInt(p.estadoClienteId)
  p.rubroId = fkToInt(p.rubroId)
  p.canalVentaId = fkToInt(p.canalVentaId)
  p.segmentoClienteId = fkToInt(p.segmentoClienteId)
  p.vigenciaCertificadoExclusion = p.vigenciaCertificadoExclusion || null
  p.fechaNacimiento = p.fechaNacimiento || null
  p.emailNotificacionFiado = p.emailNotificacionFiado || null
  p.emailNotificacionFiado2 = p.emailNotificacionFiado2 || null
  
  return p
}

/* ---------- maestro lookup selector ---------- */
function MaestroSelect({ tabla, value, onChange, label }: { tabla: string; value: string; onChange: (v: string) => void; label: string }) {
  const [opts, setOpts] = useState<{ id: number; nombre: string }[]>([])
  useEffect(() => {
    fetch(`/api/maestros/${tabla}?take=500`, { headers: authHeaders() })
      .then(r => r.json())
      .then(d => setOpts(Array.isArray(d) ? d : d.data ?? []))
      .catch(() => {})
  }, [tabla])
  return (
    <div>
      <Label>{label}</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
        <SelectContent>
          <SelectItem value="__none__">— Sin asignar —</SelectItem>
          {opts.map(o => <SelectItem key={o.id} value={String(o.id)}>{o.nombre}</SelectItem>)}
        </SelectContent>
      </Select>
    </div>
  )
}

/* ========== MAIN COMPONENT ========== */
export default function ClientesPage() {
  const router = useRouter()
  const user = useAuthStore((s) => s.user)
  const isFumigacion = user?.empresaRubro === "fumigacion" || user?.empresaModoLite === "fumigacion"
  const [clientes, setClientes] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [busqueda, setBusqueda] = useState("")
  const [dialogAbierto, setDialogAbierto] = useState(false)
  const [vistaDetalle, setVistaDetalle] = useState<any>(null)
  const [clienteEditando, setClienteEditando] = useState<any>(null)
  const [formData, setFormData] = useState<Record<string, any>>({ ...EMPTY_FORM })
  const [guardando, setGuardando] = useState(false)
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState<FilterValues>({})
  const { toast } = useToast()

  const set = (key: string, value: any) => setFormData(prev => ({ ...prev, [key]: value }))

  /* ---------- CRUD ---------- */
  const cargarClientes = useCallback(async () => {
    setLoading(true)
    try {
      const qs = new URLSearchParams({ take: "5000" }) // Fetch a large amount of clients to let DataTable handle pagination
      if (busqueda) qs.set("q", busqueda)
      const res = await fetch(`/api/clientes?${qs}`, { headers: authHeaders() })
      if (!res.ok) throw new Error("Error fetching")
      const raw = await res.json()
      setClientes(parseApiList(raw))
      setTotal(raw.total ?? 0)
    } catch (error) {
      console.error("Error al cargar clientes:", error)
      toast({
        title: "No se pudieron cargar los clientes",
        description: "Revisá tu conexión e intentá de nuevo.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
    // toast is stable (module-level store); omit from deps to avoid refetch loops
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [busqueda])

  useEffect(() => { cargarClientes() }, [cargarClientes])

  const guardarCliente = async () => {
    setGuardando(true)
    try {
      const url = clienteEditando ? `/api/clientes/${clienteEditando.id}` : "/api/clientes"
      const method = clienteEditando ? "PUT" : "POST"
      const res = await fetch(url, { method, headers: authHeaders(), body: JSON.stringify(formToPayload(formData)) })
      const resJson = await res.json().catch(() => ({}))
      
      if (!res.ok) {
        toast({ title: "Error al guardar cliente", description: resJson.error || "Ocurrió un error inesperado", variant: "destructive" })
        return
      }
      setDialogAbierto(false)
      setClienteEditando(null)
      setFormData({ ...EMPTY_FORM })
      cargarClientes()
      
      const warnings = resJson._warnings || resJson.warnings
      if (warnings && warnings.length > 0) {
        toast({ 
          title: "Cliente guardado, faltan datos recomendados", 
          description: (
            <div className="mt-2 space-y-1">
              {warnings.map((w: any, idx: number) => (
                <div key={idx} className="text-xs">{w.label} — {w.reason}</div>
              ))}
            </div>
          ),
          duration: 8000
        })
      } else {
        toast({ title: clienteEditando ? "Cliente actualizado" : "Cliente creado", description: "Los datos se guardaron correctamente" })
      }
    } catch (error) {
      console.error("Error al guardar cliente:", error)
      toast({ title: "Error al guardar cliente", description: "Error de conexión", variant: "destructive" })
    } finally {
      setGuardando(false)
    }
  }

  const nuevoCliente = () => {
    setClienteEditando(null)
    setFormData({ ...EMPTY_FORM })
    setDialogAbierto(true)
  }

  const editarCliente = async (cliente: any) => {
    try {
      const res = await fetch(`/api/clientes/${cliente.id}`, { headers: authHeaders() })
      const full = await res.json()
      setClienteEditando(full)
      setFormData(clienteToForm(full))
      setDialogAbierto(true)
    } catch {
      setClienteEditando(cliente)
      setFormData(clienteToForm(cliente))
      setDialogAbierto(true)
    }
  }

  const verDetalle = async (cliente: any) => {
    try {
      const res = await fetch(`/api/clientes/${cliente.id}`, { headers: authHeaders() })
      setVistaDetalle(await res.json())
    } catch {
      setVistaDetalle(cliente)
    }
  }

  const { confirm, ConfirmDialog } = useConfirm()

  const eliminarCliente = async (id: number) => {
    const ok = await confirm({
      title: "Desactivar cliente",
      description: "¿Desactivar este cliente? Quedará marcado como inactivo.",
      confirmLabel: "Desactivar",
      variant: "destructive",
    })
    if (!ok) return
    try {
      await fetch(`/api/clientes/${id}`, { method: "DELETE", headers: authHeaders() })
      cargarClientes()
      toast({ title: "Cliente desactivado", description: "El cliente fue marcado como inactivo" })
    } catch (error) {
      console.error("Error al eliminar cliente:", error)
      toast({ title: "Error al desactivar", description: "No se pudo desactivar el cliente", variant: "destructive" })
    }
  }



  const filterFields: FilterField[] = [
    { key: "condicionIva", label: "Condición IVA", type: "select", options: [
      { value: "RESPONSABLE_INSCRIPTO", label: "Responsable Inscripto" },
      { value: "MONOTRIBUTISTA", label: "Monotributista" },
      { value: "CONSUMIDOR_FINAL", label: "Consumidor Final" },
      { value: "EXENTO", label: "Exento" },
    ]},
    { key: "tipoPersona", label: "Tipo Persona", type: "select", options: [
      { value: "persona_fisica", label: "Persona Física" },
      { value: "persona_juridica", label: "Persona Jurídica" },
    ]},
    { key: "activo", label: "Activo", type: "boolean" },
  ]

  const hasActiveFilters = useMemo(() => {
    return Boolean(
      filters.condicionIva ||
      filters.tipoPersona ||
      filters.activo !== undefined ||
      busqueda.trim(),
    )
  }, [filters, busqueda])

  const clientesFiltrados = useMemo(() => {
    return clientes.filter((c: any) => {
      if (filters.condicionIva && c.condicionIva !== filters.condicionIva) return false
      if (filters.tipoPersona && c.tipoPersona !== filters.tipoPersona) return false
      if (filters.activo !== undefined && c.activo !== filters.activo) return false
      return true
    })
  }, [clientes, filters])

  const clearClientFilters = () => {
    setFilters({})
    setBusqueda("")
  }

  /* ---------- RENDER ---------- */
  if (loading && clientes.length === 0) {
    return <PageSkeleton kpis={0} tableRows={10} tableCols={6} />
  }

  return (
    <PageShell>
      <PageHeader
        variant="surface"
        title="Clientes"
        description="Base de clientes con datos fiscales, crédito y comercial. Buscá por CUIT, razón social o código."
        badge={
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-medium text-primary">
            <Sparkles className="h-3.5 w-3.5" />
            Maestro comercial
          </span>
        }
        actions={
          <>
          <CSVImport
            columns={[
              { key: "codigo", label: "Código" },
              { key: "nombre", label: "Razón Social", required: true },
              { key: "cuit", label: "CUIT", validate: (v) => v && !/^\d{2}-\d{8}-\d$/.test(v) ? "Formato: XX-XXXXXXXX-X" : null },
              { key: "condicionIva", label: "Condición IVA" },
              { key: "email", label: "Email" },
              { key: "telefono", label: "Teléfono" },
              { key: "direccion", label: "Dirección" },
            ]}
            onImport={async (rows) => {
              let success = 0
              const errors: { row: number; field: string; message: string }[] = []
              for (let i = 0; i < rows.length; i++) {
                try {
                  const res = await fetch("/api/clientes", {
                    method: "POST",
                    headers: authHeaders(),
                    body: JSON.stringify(formToPayload({ ...EMPTY_FORM, ...rows[i] })),
                  })
                  if (res.ok) success++
                  else {
                    const d = await res.json()
                    errors.push({ row: i + 1, field: "", message: d.error || "Error" })
                  }
                } catch {
                  errors.push({ row: i + 1, field: "", message: "Error de conexión" })
                }
              }
              cargarClientes()
              return { success, errors }
            }}
            title="Importar Clientes desde CSV"
          />
          <Button onClick={nuevoCliente} className="min-h-[40px]">
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Cliente
          </Button>
          </>
        }
      />

      <FilterPanel fields={filterFields} values={filters} onChange={setFilters} />

      {/* DataTable */}
      <Card>
        <CardContent className="pt-4">
          <DataTable
            data={clientesFiltrados}
            columns={[
              { key: "codigo", header: "Código", sortable: true, cell: (c: any) => <span className="font-mono text-xs">{c.codigo || "-"}</span> },
              { key: "nombre", header: "Razón Social", sortable: true, cell: (c: any) => (
                <div>
                  <span className="font-medium">{c.nombre}</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {!c.telefono && (
                      <Badge variant="outline" className="text-[10px] h-4">Sin teléfono</Badge>
                    )}
                    {c.fiadoHabilitado && (
                      <Badge variant="secondary" className="text-[10px] h-4">Fiado</Badge>
                    )}
                    {c.fiadoHabilitado && (!c.limiteCredito || Number(c.limiteCredito) <= 0) && (
                      <Badge variant="outline" className="text-[10px] h-4">Sin límite</Badge>
                    )}
                  </div>
                </div>
              ) },
              { key: "cuit", header: "CUIT", sortable: true, cell: (c: any) => c.cuit || "-" },
              ...(isFumigacion
                ? [{
                    key: "ultimaVisita",
                    header: "Última Visita",
                    sortable: true,
                    sortFn: (a: any, b: any) => {
                      const da = a.turnos?.[0]?.fecha ? new Date(a.turnos[0].fecha).getTime() : 0
                      const db = b.turnos?.[0]?.fecha ? new Date(b.turnos[0].fecha).getTime() : 0
                      return db - da
                    },
                    cell: (c: any) => {
                      const turno = c.turnos?.[0]
                      if (!turno) return <span className="text-muted-foreground">-</span>
                      const days = Math.floor((new Date().getTime() - new Date(turno.fecha).getTime()) / (1000 * 3600 * 24))
                      return (
                        <div className="flex flex-col gap-0.5">
                          <span className="text-xs font-medium">{new Date(turno.fecha).toLocaleDateString("es-AR")}</span>
                          <span className="text-[10px] text-muted-foreground">Hace {days} {days === 1 ? "día" : "días"}</span>
                        </div>
                      )
                    },
                  }]
                : []),
              { key: "condicionIva", header: "Cond. IVA", cell: (c: any) => <span className="text-xs">{(c.condicionIva ?? "").replace(/_/g, " ")}</span> },
              { key: "provincia", header: "Provincia", cell: (c: any) => <span className="text-xs">{c.provincia?.nombre || "-"}</span>, exportFn: (c: any) => c.provincia?.nombre ?? "" },
              { key: "limiteCredito", header: "Lím. Crédito", align: "right" as const, sortable: true, cell: (c: any) => c.limiteCredito != null ? Number(c.limiteCredito).toLocaleString("es-AR", { style: "currency", currency: "ARS" }) : "-" },
              { key: "activo", header: "Estado", cell: (c: any) => <StatusBadge variant={activoVariant(c.activo !== false)} label={activoLabel(c.activo !== false)} />, exportFn: (c: any) => c.activo ? "Activo" : "Inactivo" },
              {
                key: "acciones" as any, header: "Acciones", align: "right" as const,
                cell: (c: any) => (
                  <div className="flex justify-end items-center gap-1">
                    <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); router.push(`/dashboard/ventas?clienteId=${c.id}`) }} title="Emitir Factura AFIP"><Receipt className="h-4 w-4 text-emerald-600" /></Button>
                    {c.fiadoHabilitado && (
                      <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); router.push(`/dashboard/fiado?clienteId=${c.id}`) }} title="Libreta de Fiado"><BookOpen className="h-4 w-4 text-blue-600" /></Button>
                    )}
                    {isFumigacion && (
                      <>
                        <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); router.push(`/dashboard/fumigacion/calendario?clienteId=${c.id}`) }} title="Agendar visita"><CalendarPlus className="h-4 w-4 text-emerald-600" /></Button>
                        <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); router.push(`/dashboard/fumigacion?action=new_visit&clienteId=${c.id}`) }} title="Visita rápida"><PlayCircle className="h-4 w-4 text-blue-600" /></Button>
                      </>
                    )}
                    <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); verDetalle(c) }} title="Ver detalle"><Eye className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); editarCliente(c) }} title="Editar"><Pencil className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); eliminarCliente(c.id) }} title="Desactivar"><Trash2 className="h-4 w-4" /></Button>
                  </div>
                ),
              },
            ] as DataTableColumn<any>[]}
            rowKey="id"
            searchPlaceholder="Buscar por nombre, CUIT o código…"
            searchKeys={["nombre", "cuit", "codigo"]}
            selectable
            bulkActions={(selected, clear) => (
              <>
                <Button variant="outline" size="sm" onClick={() => {
                  const h = "codigo,nombre,cuit,condicionIva,activo"
                  const rows = selected.map((c: any) => [c.codigo, c.nombre, c.cuit, c.condicionIva, c.activo ? "Activo" : "Inactivo"].map(v => `"${String(v ?? "").replace(/"/g, '""')}"`).join(","))
                  const blob = new Blob(["\uFEFF" + [h, ...rows].join("\n")], { type: "text/csv;charset=utf-8;" })
                  const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "clientes-seleccionados.csv"; a.click()
                  clear()
                }}>
                  <Download className="h-4 w-4 mr-1" /> Exportar ({selected.length})
                </Button>
                <Button variant="outline" size="sm" onClick={async () => {
                  const activos = selected.filter((c: any) => c.activo !== false)
                  if (!activos.length) return
                  const confirmBulk = window.confirm(`¿Está seguro de que desea desactivar ${activos.length} clientes seleccionados?`)
                  if (!confirmBulk) return
                  await Promise.all(activos.map((c: any) => fetch(`/api/clientes/${c.id}`, { method: "DELETE", headers: authHeaders() })))
                  cargarClientes(); clear()
                }}>
                  <ToggleRight className="h-4 w-4 mr-1" /> Desactivar ({selected.filter((c: any) => c.activo !== false).length})
                </Button>
              </>
            )}
            exportFilename="clientes"
            loading={loading}
            emptyState={
              <EmptyState
                icon={Building2}
                title={hasActiveFilters ? "Ningún cliente coincide" : "Todavía no hay clientes"}
                description={
                  hasActiveFilters
                    ? "Probá con otros filtros o limpiá la búsqueda. También podés crear un cliente nuevo."
                    : "Cargá el primer cliente manualmente o importá un CSV. Con CUIT podés completar datos fiscales al crear."
                }
                actionLabel="Nuevo Cliente"
                onAction={nuevoCliente}
                secondaryActionLabel={hasActiveFilters ? "Limpiar filtros" : undefined}
                onSecondaryAction={hasActiveFilters ? clearClientFilters : undefined}
              />
            }
            emptyMessage="No se encontraron clientes"
            defaultPageSize={25}
            compact
            onRowClick={verDetalle}
          />
        </CardContent>
      </Card>

      {/* ========== DETAIL PANEL ========== */}
      <Dialog open={!!vistaDetalle} onOpenChange={() => setVistaDetalle(null)}>
        <DialogContent className="max-w-[calc(100vw-1.5rem)] sm:max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{vistaDetalle?.nombre}</DialogTitle>
            <DialogDescription>Detalle completo del cliente</DialogDescription>
          </DialogHeader>
          {vistaDetalle && (
            <Tabs defaultValue="general" className="mt-2">
              <TabsList className={`grid w-full ${isFumigacion ? "grid-cols-6" : "grid-cols-5"}`}>
                <TabsTrigger value="general">General</TabsTrigger>
                <TabsTrigger value="fiscal">Fiscal</TabsTrigger>
                <TabsTrigger value="contacto">Contacto</TabsTrigger>
                <TabsTrigger value="financiero">Financiero</TabsTrigger>
                <TabsTrigger value="comercial">Comercial</TabsTrigger>
                {isFumigacion && <TabsTrigger value="fumigacion"><Bug className="w-3.5 h-3.5 mr-1"/> Fumigación</TabsTrigger>}
              </TabsList>
              <TabsContent value="general" className="space-y-2 mt-4">
                <DatoRO label="Código" value={vistaDetalle.codigo} />
                <DatoRO label="Razón Social" value={vistaDetalle.nombre} />
                <DatoRO label="Nombre Fantasía" value={vistaDetalle.nombreFantasia} />
                <DatoRO label="Tipo Persona" value={vistaDetalle.tipoPersona === "persona_fisica" ? "Persona Física" : "Persona Jurídica"} />
                <DatoRO label="DNI" value={vistaDetalle.dni} />
                <DatoRO label="Fecha Nacimiento" value={vistaDetalle.fechaNacimiento?.slice(0, 10)} />
                <DatoRO label="Activo" value={vistaDetalle.activo ? "Sí" : "No"} />
                <DatoRO label="Observaciones" value={vistaDetalle.observaciones} />
              </TabsContent>
              <TabsContent value="fiscal" className="space-y-2 mt-4">
                <DatoRO label="CUIT" value={vistaDetalle.cuit} />
                <DatoRO label="Condición IVA" value={vistaDetalle.condicionIva?.replace(/_/g, " ")} />
                <DatoRO label="Nro. IIBB" value={vistaDetalle.nroIIBB} />
                <DatoRO label="Situación IIBB" value={vistaDetalle.situacionIIBB?.replace(/_/g, " ")} />
                <Separator />
                <p className="text-sm font-semibold">Retenciones / Percepciones / Regímenes Especiales</p>
                <DatoRO label="Agente Ret. IVA" value={vistaDetalle.esAgenteRetencionIVA ? "Sí" : "No"} />
                <DatoRO label="Agente Ret. Ganancias" value={vistaDetalle.esAgenteRetencionGanancias ? "Sí" : "No"} />
                <DatoRO label="Agente Perc. IVA" value={vistaDetalle.esAgentePercepcionIVA ? "Sí" : "No"} />
                <DatoRO label="Agente Perc. IIBB" value={vistaDetalle.esAgentePercepcionIIBB ? "Sí" : "No"} />
                <DatoRO label="Es Gran Empresa (FCE)" value={vistaDetalle.esGranEmpresa ? "Sí" : "No"} />
                <DatoRO label="Cliente Exportación" value={vistaDetalle.esExportacion ? "Sí" : "No"} />
                <DatoRO label="Cert. Exclusión" value={vistaDetalle.nroCertificadoExclusion} />
                <DatoRO label="Vigencia Cert." value={vistaDetalle.vigenciaCertificadoExclusion?.slice(0, 10)} />
              </TabsContent>
              <TabsContent value="contacto" className="space-y-2 mt-4">
                <DatoRO label="Domicilio" value={vistaDetalle.direccion} />
                <DatoRO label="Complemento" value={vistaDetalle.direccionComplemento} />
                <DatoRO label="Código Postal" value={vistaDetalle.codigoPostal} />
                <DatoRO label="Provincia" value={vistaDetalle.provincia?.nombre} />
                <DatoRO label="Localidad" value={vistaDetalle.localidad?.nombre} />
                <Separator />
                <DatoRO label="Teléfono" value={vistaDetalle.telefono} />
                <DatoRO label="Tel. Alternativo" value={vistaDetalle.telefonoAlternativo} />
                <DatoRO label="Email" value={vistaDetalle.email} />
                <DatoRO label="Email Facturación" value={vistaDetalle.emailFacturacion} />
                <DatoRO label="Web" value={vistaDetalle.web} />
              </TabsContent>
              <TabsContent value="financiero" className="space-y-2 mt-4">
                <DatoRO label="Límite Crédito" value={vistaDetalle.limiteCredito != null ? `$ ${Number(vistaDetalle.limiteCredito).toLocaleString("es-AR")}` : null} />
                <DatoRO label="Saldo Cta. Cte." value={vistaDetalle.saldoCuentaCorriente != null ? `$ ${Number(vistaDetalle.saldoCuentaCorriente).toLocaleString("es-AR")}` : null} />
                <DatoRO label="Descuento %" value={vistaDetalle.descuentoPct != null ? `${vistaDetalle.descuentoPct}%` : null} />
                <DatoRO label="Días Gracia Extra" value={vistaDetalle.diasGraciaExtra} />
                <DatoRO label="Moneda Habitual" value={vistaDetalle.monedaHabitual} />
                <DatoRO label="Cond. Pago" value={vistaDetalle.condicionPago?.nombre} />
                <DatoRO label="Forma Pago" value={vistaDetalle.formaPago?.nombre} />
                <DatoRO label="Cuenta Contable" value={vistaDetalle.cuentaContableCodigo} />
              </TabsContent>
              <TabsContent value="comercial" className="space-y-2 mt-4">
                <DatoRO label="Tipo Cliente" value={vistaDetalle.tipoCliente?.nombre} />
                <DatoRO label="Estado" value={vistaDetalle.estadoCliente?.nombre} />
                <DatoRO label="Rubro" value={vistaDetalle.rubro?.nombre} />
                <DatoRO label="Canal Venta" value={vistaDetalle.canalVenta?.nombre} />
                <DatoRO label="Segmento" value={vistaDetalle.segmentoCliente?.nombre} />
                <DatoRO label="Vendedor" value={vistaDetalle.vendedor?.nombre} />
                <DatoRO label="Lista Precio" value={vistaDetalle.listaPrecio?.nombre} />
                <DatoRO label="Zona Geográfica" value={vistaDetalle.zonaGeografica?.nombre} />
              </TabsContent>
              {isFumigacion && (
                <TabsContent value="fumigacion" className="mt-4">
                  <HistorialFumigacion clienteId={vistaDetalle.id} />
                </TabsContent>
              )}
            </Tabs>
          )}
        </DialogContent>
      </Dialog>

      {/* ========== CREATE / EDIT DIALOG ========== */}
      <Dialog open={dialogAbierto} onOpenChange={(open) => { if (!open) { setDialogAbierto(false); setClienteEditando(null) } }}>
        <DialogContent className="max-w-[calc(100vw-1.5rem)] sm:max-w-4xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{clienteEditando ? "Editar Cliente" : "Nuevo Cliente"}</DialogTitle>
            <DialogDescription>Complete todas las pestañas con la información del cliente</DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="general" className="mt-2">
            <TabsList className={`grid w-full ${isFumigacion ? "grid-cols-6" : "grid-cols-5"}`}>
              <TabsTrigger value="general"><Building2 className="h-3.5 w-3.5 mr-1" />General</TabsTrigger>
              <TabsTrigger value="fiscal"><FileText className="h-3.5 w-3.5 mr-1" />Fiscal</TabsTrigger>
              <TabsTrigger value="contacto"><MapPin className="h-3.5 w-3.5 mr-1" />Contacto</TabsTrigger>
              <TabsTrigger value="financiero"><DollarSign className="h-3.5 w-3.5 mr-1" />Financiero</TabsTrigger>
              <TabsTrigger value="comercial"><ShoppingCart className="h-3.5 w-3.5 mr-1" />Comercial</TabsTrigger>
              {isFumigacion && <TabsTrigger value="fumigacion"><Bug className="h-3.5 w-3.5 mr-1" />Visitas</TabsTrigger>}
            </TabsList>

            {/* ----- TAB: General ----- */}
            <TabsContent value="general" className="space-y-4 mt-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-2">
                  <Label htmlFor="nombre">Razón Social *</Label>
                  <Input id="nombre" value={formData.nombre} onChange={e => set("nombre", e.target.value)} />
                </div>
                <div>
                  <Label htmlFor="codigo">Código interno</Label>
                  <Input id="codigo" value={formData.codigo} onChange={e => set("codigo", e.target.value)} placeholder="CLT-001" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-2">
                  <Label htmlFor="nombreFantasia">Nombre Fantasía</Label>
                  <Input id="nombreFantasia" value={formData.nombreFantasia} onChange={e => set("nombreFantasia", e.target.value)} />
                </div>
                <div>
                  <Label>Tipo Persona</Label>
                  <Select value={formData.tipoPersona} onValueChange={v => set("tipoPersona", v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="persona_juridica">Persona Jurídica</SelectItem>
                      <SelectItem value="persona_fisica">Persona Física</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="dni">DNI</Label>
                  <Input id="dni" value={formData.dni} onChange={e => set("dni", e.target.value)} />
                </div>
                <div>
                  <Label htmlFor="fechaNacimiento">Fecha Nacimiento</Label>
                  <Input id="fechaNacimiento" type="date" value={formData.fechaNacimiento} onChange={e => set("fechaNacimiento", e.target.value)} />
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Switch checked={formData.activo} onCheckedChange={v => set("activo", v)} />
                <Label>Cliente activo</Label>
              </div>
              <div>
                <Label htmlFor="observaciones">Observaciones</Label>
                <Textarea id="observaciones" value={formData.observaciones} onChange={e => set("observaciones", e.target.value)} rows={3} />
              </div>
            </TabsContent>

            {/* ----- TAB: Fiscal / Impositiva ----- */}
            <TabsContent value="fiscal" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="cuit">CUIT *</Label>
                  <Input id="cuit" value={formData.cuit} onChange={e => set("cuit", e.target.value)} placeholder="20-12345678-9" />
                  <CuitPadronLookup
                    cuit={formData.cuit}
                    disabled={guardando}
                    onResult={(r) => {
                      set("nombre", r.denominacion)
                      set("cuit", r.cuit.replace(/(\d{2})(\d{8})(\d)/, "$1-$2-$3"))
                      set("condicionIva", mapCondicionIvaPadron(r.condicionIva))
                      if (r.domicilioFiscal) {
                        const dir = [r.domicilioFiscal.direccion, r.domicilioFiscal.localidad].filter(Boolean).join(", ")
                        if (dir) set("direccion", dir)
                        if (r.domicilioFiscal.codigoPostal) set("codigoPostal", r.domicilioFiscal.codigoPostal)
                      }
                    }}
                  />
                </div>
                <div>
                  <Label>Condición IVA *</Label>
                  <Select value={formData.condicionIva} onValueChange={v => set("condicionIva", v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="RESPONSABLE_INSCRIPTO">Responsable Inscripto</SelectItem>
                      <SelectItem value="MONOTRIBUTISTA">Monotributista</SelectItem>
                      <SelectItem value="EXENTO">Exento</SelectItem>
                      <SelectItem value="CONSUMIDOR_FINAL">Consumidor Final</SelectItem>
                      <SelectItem value="NO_RESPONSABLE">No Responsable</SelectItem>
                      <SelectItem value="RESPONSABLE_NO_INSCRIPTO">Resp. No Inscripto</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="nroIIBB">Nro. Ingresos Brutos</Label>
                  <Input id="nroIIBB" value={formData.nroIIBB} onChange={e => set("nroIIBB", e.target.value)} />
                </div>
                <div>
                  <Label>Situación IIBB</Label>
                  <Select value={formData.situacionIIBB} onValueChange={v => set("situacionIIBB", v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">— Sin definir —</SelectItem>
                      <SelectItem value="local">Local</SelectItem>
                      <SelectItem value="convenio_multilateral">Convenio Multilateral</SelectItem>
                      <SelectItem value="exento">Exento</SelectItem>
                      <SelectItem value="no_inscripto">No Inscripto</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Separator />
              <p className="text-sm font-semibold">Retenciones / Percepciones / Regímenes Especiales</p>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  <Switch checked={formData.esAgenteRetencionIVA} onCheckedChange={v => set("esAgenteRetencionIVA", v)} />
                  <Label>Agente Retención IVA</Label>
                </div>
                <div className="flex items-center gap-3">
                  <Switch checked={formData.esAgenteRetencionGanancias} onCheckedChange={v => set("esAgenteRetencionGanancias", v)} />
                  <Label>Agente Retención Ganancias</Label>
                </div>
                <div className="flex items-center gap-3">
                  <Switch checked={formData.esAgentePercepcionIVA} onCheckedChange={v => set("esAgentePercepcionIVA", v)} />
                  <Label>Agente Percepción IVA</Label>
                </div>
                <div className="flex items-center gap-3">
                  <Switch checked={formData.esAgentePercepcionIIBB} onCheckedChange={v => set("esAgentePercepcionIIBB", v)} />
                  <Label>Agente Percepción IIBB</Label>
                </div>
                <div className="flex items-center gap-3">
                  <Switch checked={formData.esGranEmpresa} onCheckedChange={v => set("esGranEmpresa", v)} />
                  <Label>Es Gran Empresa (Sujeto a FCE)</Label>
                </div>
                <div className="flex items-center gap-3">
                  <Switch checked={formData.esExportacion} onCheckedChange={v => set("esExportacion", v)} />
                  <Label>Cliente Exportación (Comprobante E)</Label>
                </div>
              </div>
              <Separator />
              <p className="text-sm font-semibold">Certificado de Exclusión</p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="nroCertificadoExclusion">Nro. Certificado</Label>
                  <Input id="nroCertificadoExclusion" value={formData.nroCertificadoExclusion} onChange={e => set("nroCertificadoExclusion", e.target.value)} />
                </div>
                <div>
                  <Label htmlFor="vigenciaCertificadoExclusion">Vigencia</Label>
                  <Input id="vigenciaCertificadoExclusion" type="date" value={formData.vigenciaCertificadoExclusion} onChange={e => set("vigenciaCertificadoExclusion", e.target.value)} />
                </div>
              </div>
            </TabsContent>

            {/* ----- TAB: Contacto / Ubicación ----- */}
            <TabsContent value="contacto" className="space-y-4 mt-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-2">
                  <Label htmlFor="direccion">Domicilio</Label>
                  <Input id="direccion" value={formData.direccion} onChange={e => set("direccion", e.target.value)} />
                </div>
                <div>
                  <Label htmlFor="codigoPostal">Cód. Postal</Label>
                  <Input id="codigoPostal" value={formData.codigoPostal} onChange={e => set("codigoPostal", e.target.value)} />
                </div>
              </div>
              <div>
                <Label htmlFor="direccionComplemento">Complemento dirección</Label>
                <Input id="direccionComplemento" value={formData.direccionComplemento} onChange={e => set("direccionComplemento", e.target.value)} placeholder="Piso, depto, oficina..." />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <MaestroSelect tabla="paises" value={formData.paisId} onChange={v => set("paisId", v)} label="País" />
                <MaestroSelect tabla="provincias" value={formData.provinciaId} onChange={v => set("provinciaId", v)} label="Provincia" />
                <MaestroSelect tabla="localidades" value={formData.localidadId} onChange={v => set("localidadId", v)} label="Localidad" />
              </div>
              <MaestroSelect tabla="zonas-geograficas" value={formData.zonaGeograficaId} onChange={v => set("zonaGeograficaId", v)} label="Zona Geográfica" />
              <Separator />
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="telefono">Teléfono</Label>
                  <Input id="telefono" value={formData.telefono} onChange={e => set("telefono", e.target.value)} />
                </div>
                <div>
                  <Label htmlFor="telefonoAlternativo">Teléfono Alternativo</Label>
                  <Input id="telefonoAlternativo" value={formData.telefonoAlternativo} onChange={e => set("telefonoAlternativo", e.target.value)} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" value={formData.email} onChange={e => set("email", e.target.value)} />
                </div>
                <div>
                  <Label htmlFor="emailFacturacion">Email Facturación</Label>
                  <Input id="emailFacturacion" type="email" value={formData.emailFacturacion} onChange={e => set("emailFacturacion", e.target.value)} />
                </div>
              </div>
              <div>
                <Label htmlFor="web">Sitio Web</Label>
                <Input id="web" value={formData.web} onChange={e => set("web", e.target.value)} placeholder="https://..." />
              </div>
            </TabsContent>

            {/* ----- TAB: Financiero ----- */}
            <TabsContent value="financiero" className="space-y-4 mt-4">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="limiteCredito">Límite Crédito ($)</Label>
                  <Input id="limiteCredito" type="number" min={0} step={0.01} value={formData.limiteCredito} onChange={e => set("limiteCredito", e.target.value)} />
                </div>
                <div>
                  <Label htmlFor="descuentoPct">Descuento %</Label>
                  <Input id="descuentoPct" type="number" min={0} max={100} step={0.01} value={formData.descuentoPct} onChange={e => set("descuentoPct", e.target.value)} />
                </div>
                <div>
                  <Label htmlFor="diasGraciaExtra">Días Gracia Extra</Label>
                  <Input id="diasGraciaExtra" type="number" min={0} step={1} value={formData.diasGraciaExtra} onChange={e => set("diasGraciaExtra", e.target.value)} />
                </div>
              </div>
              <div className="rounded-lg border p-4 space-y-3 bg-muted/30">
                <p className="text-sm font-semibold">Libreta Fiado</p>
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={!!formData.fiadoHabilitado} onChange={e => set("fiadoHabilitado", e.target.checked)} />
                  Habilitar fiado en POS
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="emailNotificacionFiado">Email notificación (fiador)</Label>
                    <Input id="emailNotificacionFiado" type="email" value={formData.emailNotificacionFiado} onChange={e => set("emailNotificacionFiado", e.target.value)} placeholder="quien@entera.com" />
                  </div>
                  <div>
                    <Label htmlFor="emailNotificacionFiado2">Email notificación 2</Label>
                    <Input id="emailNotificacionFiado2" type="email" value={formData.emailNotificacionFiado2} onChange={e => set("emailNotificacionFiado2", e.target.value)} />
                  </div>
                </div>
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={!!formData.notificarClienteFiado} onChange={e => set("notificarClienteFiado", e.target.checked)} />
                  También notificar al email del cliente
                </label>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <MaestroSelect tabla="condiciones-pago" value={formData.condicionPagoId} onChange={v => set("condicionPagoId", v)} label="Condición de Pago" />
                <MaestroSelect tabla="formas-pago" value={formData.formaPagoId} onChange={v => set("formaPagoId", v)} label="Forma de Pago Habitual" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Moneda Habitual</Label>
                  <Select value={formData.monedaHabitual} onValueChange={v => set("monedaHabitual", v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pesos">Pesos (ARS)</SelectItem>
                      <SelectItem value="dolares">Dólares (USD)</SelectItem>
                      <SelectItem value="euros">Euros (EUR)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="cuentaContableCodigo">Cuenta Contable</Label>
                  <Input id="cuentaContableCodigo" value={formData.cuentaContableCodigo} onChange={e => set("cuentaContableCodigo", e.target.value)} placeholder="1.1.3.01.001" />
                </div>
              </div>
            </TabsContent>

            {/* ----- TAB: Comercial ----- */}
            <TabsContent value="comercial" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <MaestroSelect tabla="tipos-cliente" value={formData.tipoClienteId} onChange={v => set("tipoClienteId", v)} label="Tipo de Cliente" />
                <MaestroSelect tabla="estados-cliente" value={formData.estadoClienteId} onChange={v => set("estadoClienteId", v)} label="Estado del Cliente" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <MaestroSelect tabla="rubros" value={formData.rubroId} onChange={v => set("rubroId", v)} label="Rubro" />
                <MaestroSelect tabla="canales-venta" value={formData.canalVentaId} onChange={v => set("canalVentaId", v)} label="Canal de Venta" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <MaestroSelect tabla="segmentos-cliente" value={formData.segmentoClienteId} onChange={v => set("segmentoClienteId", v)} label="Segmento" />
                <MaestroSelect tabla="vendedores" value={formData.vendedorId} onChange={v => set("vendedorId", v)} label="Vendedor Asignado" />
              </div>
              <MaestroSelect tabla="listas-precio" value={formData.listaPrecioId} onChange={v => set("listaPrecioId", v)} label="Lista de Precio" />
            </TabsContent>
          </Tabs>

          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => { setDialogAbierto(false); setClienteEditando(null) }}>Cancelar</Button>
            <Button onClick={guardarCliente} disabled={guardando || !formData.nombre}>{guardando ? "Guardando..." : "Guardar"}</Button>
          </div>
        </DialogContent>
      </Dialog>
      <ConfirmDialog />
    </PageShell>
  )
}

/* ---------- Read-only detail row ---------- */
function DatoRO({ label, value }: { label: string; value: any }) {
  return (
    <div className="flex items-baseline gap-2">
      <span className="text-sm text-muted-foreground w-40 shrink-0">{label}:</span>
      <span className="text-sm font-medium">{value ?? "—"}</span>
    </div>
  )
}
