"use client"
import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { ClipboardList, Search, Loader2, Plus } from "lucide-react"
import { useKeyboardShortcuts, erpShortcuts } from "@/hooks/use-keyboard-shortcuts"
import { PageShell, PageHeader, StatusBadge } from "@/components/layout"
import { tipoCuentaVariant, tipoCuentaLabel } from "@/lib/ui/status-map"

interface Cuenta {
  id?: number
  codigo: string
  nombre: string
  tipo: string
  categoria: string
  nivel?: number
  imputable?: boolean
  parentId?: number | null
}

const authHeaders = (): HeadersInit => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${localStorage.getItem("token")}`,
})

const EMPTY_FORM = {
  codigo: "",
  nombre: "",
  tipo: "activo",
  categoria: "",
  nivel: 3,
  imputable: true,
  parentId: "__none__" as string,
}

export default function PlanCuentasPage() {
  const [cuentas, setCuentas] = useState<Cuenta[]>([])
  const [loading, setLoading] = useState(true)
  const [busqueda, setBusqueda] = useState("")
  const [filtroTipo, setFiltroTipo] = useState("todos")
  const [dialogAbierto, setDialogAbierto] = useState(false)
  const [formData, setFormData] = useState({ ...EMPTY_FORM })
  const [guardando, setGuardando] = useState(false)
  const [errorMsg, setErrorMsg] = useState("")

  const set = (key: string, value: any) => setFormData(prev => ({ ...prev, [key]: value }))

  const cargar = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/contabilidad/plan-cuentas", { headers: authHeaders() })
      const data = await res.json()
      if (data.success) setCuentas(data.cuentas ?? [])
    } catch { /* ignore */ } finally { setLoading(false) }
  }, [])

  useEffect(() => { cargar() }, [cargar])

  useKeyboardShortcuts(erpShortcuts({
    onRefresh: cargar,
  }))

  const guardarCuenta = async () => {
    setGuardando(true)
    setErrorMsg("")
    try {
      const payload = {
        codigo: formData.codigo,
        nombre: formData.nombre,
        tipo: formData.tipo,
        categoria: formData.categoria,
        nivel: Number(formData.nivel),
        imputable: formData.imputable,
        parentId: formData.parentId === "__none__" ? null : Number(formData.parentId),
      }
      const res = await fetch("/api/contabilidad/plan-cuentas", {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) {
        setErrorMsg(data.error || "Error al crear cuenta")
        return
      }
      setDialogAbierto(false)
      setFormData({ ...EMPTY_FORM })
      cargar()
    } catch {
      setErrorMsg("Error de conexión")
    } finally {
      setGuardando(false)
    }
  }

  const nuevaCuenta = () => {
    setFormData({ ...EMPTY_FORM })
    setErrorMsg("")
    setDialogAbierto(true)
  }

  const filtradas = cuentas.filter(c => {
    const matchBusqueda = c.nombre.toLowerCase().includes(busqueda.toLowerCase()) || c.codigo.includes(busqueda)
    const matchTipo = filtroTipo === "todos" || c.tipo === filtroTipo
    return matchBusqueda && matchTipo
  })

  const tipos = [...new Set(cuentas.map(c => c.tipo))]
  const categorias = [...new Set(filtradas.map(c => c.categoria))]

  // Cuentas no-imputables = posibles padres
  const posiblesPadres = cuentas.filter(c => c.imputable === false || (c.nivel != null && c.nivel < 3))

  return (
    <PageShell>
      <PageHeader
        title="Plan de Cuentas"
        description="Estructura jerárquica de cuentas contables para la imputación de transacciones y armado de balances."
        badge={
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-medium text-primary">
            <ClipboardList className="h-3.5 w-3.5 text-primary/80" />
            {cuentas.length} cuentas configuradas
          </span>
        }
        actions={
          <Button onClick={nuevaCuenta} className="gap-2">
            <Plus className="h-4 w-4" /> Nueva Cuenta
          </Button>
        }
      />

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {tipos.map(t => (
          <Card key={t} className="backdrop-blur-sm bg-card/60 hover:shadow-sm transition-shadow">
            <CardContent className="p-4 text-center">
              <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">{tipoCuentaLabel(t)}</p>
              <p className="text-3xl font-bold mt-1 tracking-tight">{cuentas.filter(c => c.tipo === t).length}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="backdrop-blur-sm bg-card/60 border-muted/40">
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <CardTitle className="text-base font-semibold">Cuentas Contables</CardTitle>
            <div className="flex flex-wrap items-center gap-3">
              <Select value={filtroTipo} onValueChange={setFiltroTipo}>
                <SelectTrigger className="h-9 w-40 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos los tipos</SelectItem>
                  {tipos.map(t => <SelectItem key={t} value={t}>{tipoCuentaLabel(t)}</SelectItem>)}
                </SelectContent>
              </Select>
              <div className="relative flex-1 sm:flex-none">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Buscar..." className="pl-9 h-9 w-full sm:w-48 text-sm" value={busqueda} onChange={e => setBusqueda(e.target.value)} />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
          ) : (
            <>
              {categorias.map(cat => {
                const cuentasCat = filtradas.filter(c => c.categoria === cat)
                return (
                  <div key={cat}>
                    <div className="bg-muted/30 px-4 py-2 text-xs font-semibold text-muted-foreground border-t tracking-wider uppercase">{cat}</div>
                    {cuentasCat.map(c => (
                      <div key={c.codigo} className="flex items-center justify-between px-4 py-3 border-t hover:bg-muted/10 transition-colors text-sm">
                        <div className="flex items-center gap-4">
                          <span className="font-mono text-xs text-muted-foreground w-12">{c.codigo}</span>
                          <span className="font-medium text-foreground">{c.nombre}</span>
                        </div>
                        <StatusBadge variant={tipoCuentaVariant(c.tipo)} label={tipoCuentaLabel(c.tipo)} />
                      </div>
                    ))}
                  </div>
                )
              })}
              {filtradas.length === 0 && (
                <p className="text-center text-sm text-muted-foreground py-12">No se encontraron cuentas</p>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* ========== CREATE DIALOG ========== */}
      <Dialog open={dialogAbierto} onOpenChange={setDialogAbierto}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Nueva Cuenta Contable</DialogTitle>
            <DialogDescription>Complete los datos de la cuenta</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="cc-codigo">Código *</Label>
                <Input id="cc-codigo" value={formData.codigo} onChange={e => set("codigo", e.target.value)} placeholder="1.1.3.01" className="font-mono" />
              </div>
              <div>
                <Label>Tipo *</Label>
                <Select value={formData.tipo} onValueChange={v => set("tipo", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="activo">Activo</SelectItem>
                    <SelectItem value="pasivo">Pasivo</SelectItem>
                    <SelectItem value="patrimonio">Patrimonio Neto</SelectItem>
                    <SelectItem value="ingreso">Ingreso</SelectItem>
                    <SelectItem value="egreso">Egreso</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label htmlFor="cc-nombre">Nombre *</Label>
              <Input id="cc-nombre" value={formData.nombre} onChange={e => set("nombre", e.target.value)} placeholder="Caja y Bancos" />
            </div>
            <div>
              <Label htmlFor="cc-categoria">Categoría *</Label>
              <Input id="cc-categoria" value={formData.categoria} onChange={e => set("categoria", e.target.value)} placeholder="Disponibilidades" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="cc-nivel">Nivel jerárquico</Label>
                <Select value={String(formData.nivel)} onValueChange={v => set("nivel", Number(v))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 — Rubro</SelectItem>
                    <SelectItem value="2">2 — Sub-rubro</SelectItem>
                    <SelectItem value="3">3 — Cuenta</SelectItem>
                    <SelectItem value="4">4 — Sub-cuenta</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Cuenta padre</Label>
                <Select value={formData.parentId} onValueChange={v => set("parentId", v)}>
                  <SelectTrigger><SelectValue placeholder="Sin padre" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">— Sin padre (raíz) —</SelectItem>
                    {posiblesPadres.map(p => (
                      <SelectItem key={p.id ?? p.codigo} value={String(p.id ?? "")}>{p.codigo} {p.nombre}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Switch id="cc-imputable" checked={formData.imputable} onCheckedChange={v => set("imputable", v)} />
              <Label htmlFor="cc-imputable">Imputable (permite asientos directos)</Label>
            </div>
            {errorMsg && <p className="text-sm text-red-600 font-medium">{errorMsg}</p>}
          </div>
          <div className="flex justify-end gap-3 mt-4">
            <Button variant="outline" onClick={() => setDialogAbierto(false)}>Cancelar</Button>
            <Button onClick={guardarCuenta} disabled={guardando || !formData.codigo || !formData.nombre || !formData.categoria}>
              {guardando ? "Creando..." : "Crear Cuenta"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </PageShell>
  )
}
