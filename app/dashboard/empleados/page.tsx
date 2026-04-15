"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Users, UserPlus, Building2, Phone, Mail,
  Search, Briefcase, Shield, Heart, RefreshCw,
  Plus, Calendar, UserX, Download,
} from "lucide-react"
import { DataTable, type DataTableColumn } from "@/components/data-table"
import { EmptyStateIllustration } from "@/components/empty-state-illustration"
import { useKeyboardShortcuts, erpShortcuts } from "@/hooks/use-keyboard-shortcuts"
import { useToast } from "@/hooks/use-toast"

interface Empleado {
  id: number
  nombre: string
  cuil: string
  dni: string | null
  email: string | null
  telefono: string | null
  fechaIngreso: string
  fechaEgreso: string | null
  estado: string
  cargo: string | null
  departamento: string | null
  modalidad: string
  tipoJornada: string
  sueldoBruto: number | null
  art: string | null
  obraSocial: string | null
  sindicato: string | null
  categoriaConvenio: string | null
  convenioCCT: string | null
}

interface Resumen {
  activos: number
  licencia: number
  baja: number
  total: number
  porDepartamento: { departamento: string; cantidad: number }[]
}

export default function EmpleadosPage() {
  const [empleados, setEmpleados] = useState<Empleado[]>([])
  const [resumen, setResumen] = useState<Resumen | null>(null)
  const [loading, setLoading] = useState(true)
  const [busqueda, setBusqueda] = useState("")
  const [filtroEstado, setFiltroEstado] = useState("activo")
  const [dialogOpen, setDialogOpen] = useState(false)
  const { toast } = useToast()

  const headers = { Authorization: `Bearer ${typeof window !== "undefined" ? localStorage.getItem("token") : ""}` }

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [empRes, resRes] = await Promise.all([
        fetch(`/api/empleados?estado=${filtroEstado}${busqueda ? `&q=${busqueda}` : ""}`, { headers }),
        fetch("/api/empleados?vista=resumen", { headers }),
      ])
      if (empRes.ok) setEmpleados(await empRes.json())
      if (resRes.ok) setResumen(await resRes.json())
    } finally {
      setLoading(false)
    }
  }, [filtroEstado, busqueda])

  useEffect(() => { fetchData() }, [fetchData])

  useKeyboardShortcuts(erpShortcuts({ onRefresh: fetchData, onNew: () => setDialogOpen(true) }))

  async function handleCrear(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const body: Record<string, unknown> = {}
    fd.forEach((v, k) => { if (v) body[k] = v })
    if (body.sueldoBruto) body.sueldoBruto = Number(body.sueldoBruto)
    const res = await fetch("/api/empleados", {
      method: "POST",
      headers: { ...headers, "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
    if (res.ok) {
      setDialogOpen(false)
      fetchData()
      toast({ title: "Empleado creado", description: "El legajo se guardó correctamente" })
    } else {
      toast({ title: "Error al crear empleado", description: "No se pudo guardar el legajo", variant: "destructive" })
    }
  }

  const estadoBadge: Record<string, string> = {
    activo: "bg-emerald-500/15 text-emerald-600",
    licencia: "bg-amber-500/15 text-amber-600",
    baja: "bg-red-500/15 text-red-600",
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Empleados / Legajos</h1>
          <p className="text-muted-foreground">
            Gestión de RRHH: legajos, ART, obra social, sindicato
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={fetchData}>
            <RefreshCw className="mr-2 h-4 w-4" /> Actualizar
          </Button>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm"><Plus className="mr-2 h-4 w-4" /> Nuevo Empleado</Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Alta de Empleado</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCrear} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div><Label>Nombre completo *</Label><Input name="nombre" required /></div>
                  <div><Label>CUIL (XX-XXXXXXXX-X) *</Label><Input name="cuil" placeholder="20-12345678-9" required /></div>
                  <div><Label>DNI</Label><Input name="dni" /></div>
                  <div><Label>Fecha ingreso *</Label><Input name="fechaIngreso" type="date" required /></div>
                  <div><Label>Cargo</Label><Input name="cargo" /></div>
                  <div><Label>Departamento</Label><Input name="departamento" /></div>
                  <div><Label>Email</Label><Input name="email" type="email" /></div>
                  <div><Label>Teléfono</Label><Input name="telefono" /></div>
                  <div><Label>Sueldo bruto</Label><Input name="sueldoBruto" type="number" step="0.01" /></div>
                  <div><Label>CBU</Label><Input name="cbu" /></div>
                  <div><Label>ART</Label><Input name="art" /></div>
                  <div><Label>Obra Social</Label><Input name="obraSocial" /></div>
                  <div><Label>Sindicato</Label><Input name="sindicato" /></div>
                  <div><Label>Convenio CCT</Label><Input name="convenioCCT" /></div>
                </div>
                <DialogFooter>
                  <Button type="submit">Guardar</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Resumen */}
      {resumen && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-emerald-500/10 p-2"><Users className="h-5 w-5 text-emerald-500" /></div>
                <div>
                  <p className="text-2xl font-bold">{resumen.activos}</p>
                  <p className="text-xs text-muted-foreground">Activos</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-amber-500/10 p-2"><Calendar className="h-5 w-5 text-amber-500" /></div>
                <div>
                  <p className="text-2xl font-bold">{resumen.licencia}</p>
                  <p className="text-xs text-muted-foreground">En licencia</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-red-500/10 p-2"><UserX className="h-5 w-5 text-red-500" /></div>
                <div>
                  <p className="text-2xl font-bold">{resumen.baja}</p>
                  <p className="text-xs text-muted-foreground">Baja</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-blue-500/10 p-2"><Building2 className="h-5 w-5 text-blue-500" /></div>
                <div>
                  <p className="text-2xl font-bold">{resumen.porDepartamento.length}</p>
                  <p className="text-xs text-muted-foreground">Departamentos</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filtros */}
      <div className="flex gap-4">
        <Select value={filtroEstado} onValueChange={setFiltroEstado}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="activo">Activos</SelectItem>
            <SelectItem value="licencia">En licencia</SelectItem>
            <SelectItem value="baja">Baja</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Tabla */}
      <Card>
        <CardContent className="pt-4">
          <DataTable<Empleado>
            data={empleados}
            columns={[
              {
                key: "nombre", header: "Empleado", sortable: true,
                cell: (emp) => (
                  <div className="flex items-center gap-3">
                    <div className="rounded-full bg-primary/10 p-2"><Users className="h-4 w-4 text-primary" /></div>
                    <div>
                      <p className="font-semibold">{emp.nombre}</p>
                      <p className="text-xs text-muted-foreground">CUIL: {emp.cuil}</p>
                    </div>
                  </div>
                ),
              },
              { key: "cargo" as any, header: "Cargo", sortable: true, cell: (emp) => emp.cargo ?? "—" },
              { key: "departamento" as any, header: "Departamento", sortable: true, cell: (emp) => emp.departamento ?? "—" },
              { key: "estado", header: "Estado", cell: (emp) => <Badge className={estadoBadge[emp.estado] ?? ""}>{emp.estado}</Badge> },
              { key: "fechaIngreso", header: "Ingreso", sortable: true, cell: (emp) => new Date(emp.fechaIngreso).toLocaleDateString("es-AR") },
              { key: "obraSocial" as any, header: "Obra Social", cell: (emp) => emp.obraSocial ?? "—" },
            ] as DataTableColumn<Empleado>[]}
            rowKey="id"
            searchPlaceholder="Buscar por nombre, CUIL o DNI..."
            searchKeys={["nombre", "cuil", "dni", "cargo", "departamento"]}
            selectable
            bulkActions={(selected, clear) => (
              <Button variant="outline" size="sm" onClick={() => {
                const h = "nombre,cuil,cargo,departamento,estado,fechaIngreso,obraSocial"
                const rows = selected.map((e) => [e.nombre, e.cuil, e.cargo, e.departamento, e.estado, e.fechaIngreso?.slice(0, 10), e.obraSocial].map(v => `"${String(v ?? "").replace(/"/g, '""')}"`).join(","))
                const blob = new Blob(["\uFEFF" + [h, ...rows].join("\n")], { type: "text/csv;charset=utf-8;" })
                const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "empleados-seleccionados.csv"; a.click()
                clear()
              }}>
                <Download className="h-4 w-4 mr-1" /> Exportar ({selected.length})
              </Button>
            )}
            exportFilename="empleados"
            loading={loading}
            emptyMessage="No hay empleados registrados"
            emptyIcon={<EmptyStateIllustration type="generico" compact title="Sin empleados" description="Registr\u00e1 el primer empleado." actionLabel="Nuevo Empleado" onAction={() => setDialogOpen(true)} />}
            defaultPageSize={25}
            compact
          />
        </CardContent>
      </Card>
    </div>
  )
}
