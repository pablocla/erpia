"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Search, Edit2, Phone, Mail, Building2, RefreshCw } from "lucide-react"

interface Proveedor {
  id: number
  nombre: string
  cuit: string
  direccion?: string
  telefono?: string
  email?: string
  condicionIva: string
  condicionPagoId?: number | null
  provinciaId?: number | null
  paisId?: number | null
  localidadId?: number | null
  rubroId?: number | null
  createdAt: string
  _count?: { compras: number }
}

type MaestroOption = { id: number; nombre: string }

const CONDICIONES_IVA = [
  "Responsable Inscripto",
  "Monotributista",
  "Exento",
  "No Responsable",
  "Consumidor Final",
]

const initialForm = {
  nombre: "",
  cuit: "",
  direccion: "",
  telefono: "",
  email: "",
  condicionIva: "Responsable Inscripto",
  condicionPagoId: "__none__",
  provinciaId: "__none__",
  paisId: "__none__",
  localidadId: "__none__",
  rubroId: "__none__",
}

export default function ProveedoresPage() {
  const [proveedores, setProveedores] = useState<Proveedor[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [proveedorSeleccionado, setProveedorSeleccionado] = useState<Proveedor | null>(null)
  const [form, setForm] = useState(initialForm)
  const [error, setError] = useState("")
  const [guardando, setGuardando] = useState(false)
  const [condicionesPago, setCondicionesPago] = useState<MaestroOption[]>([])
  const [provincias, setProvincias] = useState<MaestroOption[]>([])
  const [paises, setPaises] = useState<MaestroOption[]>([])
  const [localidades, setLocalidades] = useState<MaestroOption[]>([])
  const [rubros, setRubros] = useState<MaestroOption[]>([])

  const authHeaders = useCallback((): Record<string, string> => {
    const token = localStorage.getItem("token")
    return token ? { Authorization: `Bearer ${token}` } : {}
  }, [])

  const cargarProveedores = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (search) params.set("search", search)
      const res = await fetch(`/api/proveedores?${params}`, { headers: authHeaders() })
      const data = await res.json()
      setProveedores(Array.isArray(data) ? data : [])
    } catch {
      setError("Error al cargar proveedores")
    } finally {
      setLoading(false)
    }
  }, [search, authHeaders])

  useEffect(() => {
    cargarProveedores()
  }, [cargarProveedores])

  useEffect(() => {
    const cargarMaestros = async () => {
      const tablas: { tabla: string; setter: (data: MaestroOption[]) => void }[] = [
        { tabla: "condiciones-pago", setter: setCondicionesPago },
        { tabla: "provincias", setter: setProvincias },
        { tabla: "paises", setter: setPaises },
        { tabla: "localidades", setter: setLocalidades },
        { tabla: "rubros", setter: setRubros },
      ]

      await Promise.all(
        tablas.map(async ({ tabla, setter }) => {
          const res = await fetch(`/api/maestros/${tabla}?take=500`, { headers: authHeaders() })
          const data = await res.json()
          setter(Array.isArray(data) ? data : data.data ?? [])
        })
      )
    }

    void cargarMaestros()
  }, [authHeaders])

  const abrirNuevo = () => {
    setProveedorSeleccionado(null)
    setForm(initialForm)
    setError("")
    setDialogOpen(true)
  }

  const abrirEditar = (p: Proveedor) => {
    setProveedorSeleccionado(p)
    setForm({
      nombre: p.nombre,
      cuit: p.cuit,
      direccion: p.direccion || "",
      telefono: p.telefono || "",
      email: p.email || "",
      condicionIva: p.condicionIva,
      condicionPagoId: p.condicionPagoId ? String(p.condicionPagoId) : "__none__",
      provinciaId: p.provinciaId ? String(p.provinciaId) : "__none__",
      paisId: p.paisId ? String(p.paisId) : "__none__",
      localidadId: p.localidadId ? String(p.localidadId) : "__none__",
      rubroId: p.rubroId ? String(p.rubroId) : "__none__",
    })
    setError("")
    setDialogOpen(true)
  }

  const formToPayload = () => {
    const parseId = (value: string) => (value === "__none__" ? null : Number(value))

    return {
      nombre: form.nombre.trim(),
      cuit: form.cuit.trim(),
      direccion: form.direccion.trim() || null,
      telefono: form.telefono.trim() || null,
      email: form.email.trim() || null,
      condicionIva: form.condicionIva,
      condicionPagoId: parseId(form.condicionPagoId),
      provinciaId: parseId(form.provinciaId),
      paisId: parseId(form.paisId),
      localidadId: parseId(form.localidadId),
      rubroId: parseId(form.rubroId),
    }
  }

  const guardarProveedor = async () => {
    setError("")
    if (!form.nombre || !form.cuit) {
      setError("Nombre y CUIT son obligatorios")
      return
    }
    setGuardando(true)
    try {
      const url = proveedorSeleccionado ? `/api/proveedores/${proveedorSeleccionado.id}` : "/api/proveedores"
      const method = proveedorSeleccionado ? "PUT" : "POST"
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify(formToPayload()),
      })
      if (!res.ok) {
        const data = await res.json()
        setError(data.error || "Error al guardar")
        return
      }
      setDialogOpen(false)
      cargarProveedores()
    } catch {
      setError("Error de conexión")
    } finally {
      setGuardando(false)
    }
  }

  const proveedoresFiltrados = proveedores.filter(
    (p) =>
      !search ||
      p.nombre.toLowerCase().includes(search.toLowerCase()) ||
      p.cuit.includes(search)
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Proveedores</h1>
          <p className="text-muted-foreground">Gestión de proveedores y condiciones comerciales</p>
        </div>
        <Button onClick={abrirNuevo}>
          <Plus className="h-4 w-4 mr-2" />
          Nuevo Proveedor
        </Button>
      </div>

      {/* Búsqueda */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder="Buscar por nombre o CUIT..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Button variant="ghost" onClick={cargarProveedores}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tabla */}
      <Card>
        <CardHeader>
          <CardTitle>{proveedoresFiltrados.length} proveedor(es)</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-12 text-muted-foreground">Cargando...</div>
          ) : proveedoresFiltrados.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Building2 className="h-12 w-12 mx-auto mb-2 opacity-30" />
              No hay proveedores
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>CUIT</TableHead>
                  <TableHead>Condición IVA</TableHead>
                  <TableHead>Contacto</TableHead>
                  <TableHead>Compras</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {proveedoresFiltrados.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{p.nombre}</p>
                        {p.direccion && (
                          <p className="text-xs text-muted-foreground">{p.direccion}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-sm">{p.cuit}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{p.condicionIva}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {p.telefono && (
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Phone className="h-3 w-3" /> {p.telefono}
                          </div>
                        )}
                        {p.email && (
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Mail className="h-3 w-3" /> {p.email}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{p._count?.compras ?? 0} compras</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => abrirEditar(p)}>
                        <Edit2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{proveedorSeleccionado ? "Editar Proveedor" : "Nuevo Proveedor"}</DialogTitle>
          </DialogHeader>
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nombre / Razón Social *</Label>
              <Input
                value={form.nombre}
                onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                placeholder="Proveedor SRL"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>CUIT *</Label>
                <Input
                  value={form.cuit}
                  onChange={(e) => setForm({ ...form, cuit: e.target.value })}
                  placeholder="20-12345678-9"
                />
              </div>
              <div className="space-y-2">
                <Label>Condición IVA</Label>
                <Select value={form.condicionIva} onValueChange={(v) => setForm({ ...form, condicionIva: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CONDICIONES_IVA.map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Dirección</Label>
              <Input
                value={form.direccion}
                onChange={(e) => setForm({ ...form, direccion: e.target.value })}
                placeholder="Av. Corrientes 1234, Buenos Aires"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Teléfono</Label>
                <Input
                  value={form.telefono}
                  onChange={(e) => setForm({ ...form, telefono: e.target.value })}
                  placeholder="011-4567-8900"
                />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="contacto@proveedor.com"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Condición de pago</Label>
                <Select value={form.condicionPagoId} onValueChange={(v) => setForm({ ...form, condicionPagoId: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">— Sin condición —</SelectItem>
                    {condicionesPago.map((c) => (
                      <SelectItem key={c.id} value={String(c.id)}>{c.nombre}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Rubro</Label>
                <Select value={form.rubroId} onValueChange={(v) => setForm({ ...form, rubroId: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">— Sin rubro —</SelectItem>
                    {rubros.map((r) => (
                      <SelectItem key={r.id} value={String(r.id)}>{r.nombre}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>País</Label>
                <Select value={form.paisId} onValueChange={(v) => setForm({ ...form, paisId: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">— Sin país —</SelectItem>
                    {paises.map((p) => (
                      <SelectItem key={p.id} value={String(p.id)}>{p.nombre}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Provincia</Label>
                <Select value={form.provinciaId} onValueChange={(v) => setForm({ ...form, provinciaId: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">— Sin provincia —</SelectItem>
                    {provincias.map((p) => (
                      <SelectItem key={p.id} value={String(p.id)}>{p.nombre}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Localidad</Label>
              <Select value={form.localidadId} onValueChange={(v) => setForm({ ...form, localidadId: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">— Sin localidad —</SelectItem>
                  {localidades.map((l) => (
                    <SelectItem key={l.id} value={String(l.id)}>{l.nombre}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={guardarProveedor} disabled={guardando}>
              {guardando ? "Guardando..." : "Guardar"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
