"use client"
import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
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

const TIPO_COLORS: Record<string, string> = {
  activo: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  pasivo: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
  patrimonio: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
  ingreso: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
  egreso: "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300",
}

const TIPO_LABELS: Record<string, string> = {
  activo: "Activo",
  pasivo: "Pasivo",
  patrimonio: "Patrimonio Neto",
  ingreso: "Ingreso",
  egreso: "Egreso",
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ClipboardList className="h-6 w-6 text-cyan-500" />
          <div><h1 className="text-2xl font-bold">Plan de Cuentas</h1><p className="text-sm text-muted-foreground">{cuentas.length} cuentas contables</p></div>
        </div>
        <Button onClick={nuevaCuenta}><Plus className="h-4 w-4 mr-2" />Nueva Cuenta</Button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-5 gap-3">
        {tipos.map(t => (
          <Card key={t} className="dashboard-surface">
            <CardContent className="p-3 text-center">
              <p className="text-xs text-muted-foreground">{TIPO_LABELS[t] ?? t}</p>
              <p className="text-lg font-bold">{cuentas.filter(c => c.tipo === t).length}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Cuentas</CardTitle>
            <div className="flex items-center gap-2">
              <Select value={filtroTipo} onValueChange={setFiltroTipo}>
                <SelectTrigger className="h-9 w-36 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos los tipos</SelectItem>
                  {tipos.map(t => <SelectItem key={t} value={t}>{TIPO_LABELS[t] ?? t}</SelectItem>)}
                </SelectContent>
              </Select>
              <div className="relative"><Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" /><Input placeholder="Buscar..." className="pl-9 h-9 w-48 text-sm" value={busqueda} onChange={e => setBusqueda(e.target.value)} /></div>
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
                    <div className="bg-muted/50 px-3 py-1.5 text-xs font-semibold text-muted-foreground border-t">{cat}</div>
                    {cuentasCat.map(c => (
                      <div key={c.codigo} className="flex items-center justify-between px-3 py-2 border-t hover:bg-muted/30 transition-colors text-sm">
                        <div className="flex items-center gap-3">
                          <span className="font-mono text-xs w-10">{c.codigo}</span>
                          <span className="font-medium">{c.nombre}</span>
                        </div>
                        <Badge variant="outline" className={`text-[10px] ${TIPO_COLORS[c.tipo] ?? ""}`}>
                          {TIPO_LABELS[c.tipo] ?? c.tipo}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )
              })}
              {filtradas.length === 0 && (
                <p className="text-center text-sm text-muted-foreground py-8">No se encontraron cuentas</p>
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
              <Switch checked={formData.imputable} onCheckedChange={v => set("imputable", v)} />
              <Label>Imputable (permite asientos directos)</Label>
            </div>
            {errorMsg && <p className="text-sm text-red-600">{errorMsg}</p>}
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setDialogAbierto(false)}>Cancelar</Button>
            <Button onClick={guardarCuenta} disabled={guardando || !formData.codigo || !formData.nombre || !formData.categoria}>
              {guardando ? "Creando..." : "Crear Cuenta"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
