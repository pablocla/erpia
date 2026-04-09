"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Edit2, Shield, User, Search, RefreshCw } from "lucide-react"

interface Usuario {
  id: number
  nombre: string
  email: string
  rol: string
  activo: boolean
  createdAt: string
}

const ROLES = [
  { value: "dueno", label: "Dueño / Admin", desc: "Acceso total. Ve costos, márgenes, sueldos", color: "bg-red-100 text-red-800" },
  { value: "gerente", label: "Gerente / Encargado", desc: "Operativo completo. No ve sueldos ni config", color: "bg-orange-100 text-orange-800" },
  { value: "cajero", label: "Cajero / Vendedor", desc: "Solo POS. Descuentos hasta límite configurado", color: "bg-green-100 text-green-800" },
  { value: "mozo", label: "Mozo (Hospitalidad)", desc: "Solo mesas y comandas. No cobra", color: "bg-blue-100 text-blue-800" },
  { value: "profesional", label: "Profesional (Médico/Vet)", desc: "Solo historia clínica y agenda propia", color: "bg-cyan-100 text-cyan-800" },
  { value: "deposito", label: "Depósito / Almacén", desc: "Stock y recepción. No ve precios de venta", color: "bg-yellow-100 text-yellow-800" },
  { value: "contador", label: "Contador (externo)", desc: "Solo lectura contable. Exporta libros", color: "bg-purple-100 text-purple-800" },
  { value: "vendedor_ruta", label: "Vendedor en Ruta", desc: "App móvil: pedidos offline y cobranza", color: "bg-teal-100 text-teal-800" },
  { value: "personal_servicio", label: "Personal Servicio", desc: "Solo su agenda y servicios. Ve comisiones", color: "bg-pink-100 text-pink-800" },
]

const PERMISOS_POR_ROL: Record<string, string[]> = {
  dueno: ["Ventas", "Compras", "Stock", "Caja", "Contabilidad", "Impuestos", "Usuarios", "Configuración", "Costos", "Sueldos"],
  gerente: ["Ventas", "Compras", "Stock", "Caja", "Reportes", "Proveedores", "Descuentos ≤20%"],
  cajero: ["POS", "Clientes (ver/crear)", "Stock (ver)", "Caja propia", "Descuentos ≤10%"],
  mozo: ["Hospitalidad (mesas/comandas)", "KDS (ver estado cocina)"],
  profesional: ["Historia Clínica", "Agenda propia", "Recetas digitales", "Stock farmacia (ver)"],
  deposito: ["Stock completo", "Compras (recibir)", "Proveedores (ver)", "Remitos"],
  contador: ["Contabilidad (ver)", "Impuestos (ver)", "Reportes (ver)", "Exportar todo"],
  vendedor_ruta: ["Ventas (app móvil)", "Clientes propios (ver)", "Stock aproximado", "Comisiones propias"],
  personal_servicio: ["Agenda propia", "Servicios realizados", "Comisiones propias"],
}

const initialForm = { nombre: "", email: "", rol: "vendedor", password: "" }

export default function UsuariosPage() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState<Usuario | null>(null)
  const [form, setForm] = useState(initialForm)
  const [error, setError] = useState("")
  const [guardando, setGuardando] = useState(false)

  const cargarUsuarios = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/usuarios")
      const data = await res.json()
      setUsuarios(Array.isArray(data) ? data : [])
    } catch {
      setError("Error al cargar usuarios")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    cargarUsuarios()
  }, [cargarUsuarios])

  const abrirNuevo = () => {
    setUsuarioSeleccionado(null)
    setForm(initialForm)
    setError("")
    setDialogOpen(true)
  }

  const abrirEditar = (u: Usuario) => {
    setUsuarioSeleccionado(u)
    setForm({ nombre: u.nombre, email: u.email, rol: u.rol, password: "" })
    setError("")
    setDialogOpen(true)
  }

  const guardarUsuario = async () => {
    setError("")
    if (!form.nombre || !form.email) {
      setError("Nombre y email son obligatorios")
      return
    }
    if (!usuarioSeleccionado && !form.password) {
      setError("Contraseña obligatoria para usuario nuevo")
      return
    }
    setGuardando(true)
    try {
      const url = usuarioSeleccionado ? `/api/usuarios/${usuarioSeleccionado.id}` : "/api/usuarios"
      const method = usuarioSeleccionado ? "PUT" : "POST"
      const body = { ...form, empresaId: 1 }
      if (usuarioSeleccionado && !form.password) delete (body as Record<string, unknown>).password
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const data = await res.json()
        setError(data.error || "Error al guardar")
        return
      }
      setDialogOpen(false)
      cargarUsuarios()
    } catch {
      setError("Error de conexión")
    } finally {
      setGuardando(false)
    }
  }

  const toggleActivo = async (usuario: Usuario) => {
    await fetch(`/api/usuarios/${usuario.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ activo: !usuario.activo }),
    })
    cargarUsuarios()
  }

  const usuariosFiltrados = usuarios.filter(
    (u) =>
      !search ||
      u.nombre.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Shield className="h-7 w-7" />
            Usuarios y Permisos
          </h1>
          <p className="text-muted-foreground">Gestión de accesos y roles del sistema</p>
        </div>
        <Button onClick={abrirNuevo}>
          <Plus className="h-4 w-4 mr-2" />
          Nuevo Usuario
        </Button>
      </div>

      {/* Roles disponibles */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {ROLES.map((rol) => (
          <Card key={rol.value} className="text-sm">
            <CardContent className="pt-3 pb-3">
              <Badge className={`${rol.color} mb-1`}>{rol.label}</Badge>
              <p className="text-xs text-muted-foreground">{rol.desc}</p>
              <div className="mt-2 space-y-0.5">
                {(PERMISOS_POR_ROL[rol.value] ?? []).slice(0, 3).map((p) => (
                  <p key={p} className="text-xs text-muted-foreground">• {p}</p>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filtro */}
      <div className="flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Buscar usuario..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Button variant="ghost" onClick={cargarUsuarios}>
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      {/* Tabla */}
      <Card>
        <CardHeader>
          <CardTitle>{usuariosFiltrados.length} usuario(s)</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Cargando...</div>
          ) : usuariosFiltrados.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <User className="h-10 w-10 mx-auto mb-2 opacity-30" />
              No hay usuarios
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Usuario</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Rol</TableHead>
                  <TableHead>Permisos</TableHead>
                  <TableHead>Activo</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {usuariosFiltrados.map((u) => {
                  const rol = ROLES.find((r) => r.value === u.rol)
                  const permisos = PERMISOS_POR_ROL[u.rol] ?? []
                  return (
                    <TableRow key={u.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="h-8 w-8 rounded-full bg-primary/10 text-primary text-sm font-bold flex items-center justify-center">
                            {u.nombre.charAt(0).toUpperCase()}
                          </div>
                          <span className="font-medium">{u.nombre}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{u.email}</TableCell>
                      <TableCell>
                        <Badge className={rol?.color ?? ""}>{rol?.label ?? u.rol}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {permisos.slice(0, 3).map((p) => (
                            <Badge key={p} variant="outline" className="text-xs">{p}</Badge>
                          ))}
                          {permisos.length > 3 && (
                            <Badge variant="outline" className="text-xs">+{permisos.length - 3}</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Switch checked={u.activo} onCheckedChange={() => toggleActivo(u)} />
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => abrirEditar(u)}>
                          <Edit2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{usuarioSeleccionado ? "Editar Usuario" : "Nuevo Usuario"}</DialogTitle>
          </DialogHeader>
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nombre *</Label>
                <Input value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Email *</Label>
                <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Rol</Label>
              <Select value={form.rol} onValueChange={(v) => setForm({ ...form, rol: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ROLES.map((r) => (
                    <SelectItem key={r.value} value={r.value}>
                      <span>{r.label}</span>
                      <span className="text-muted-foreground ml-2 text-xs">— {r.desc}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {form.rol && (
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-xs font-semibold mb-1">Permisos del rol:</p>
                <div className="flex flex-wrap gap-1">
                  {(PERMISOS_POR_ROL[form.rol] ?? []).map((p) => (
                    <Badge key={p} variant="outline" className="text-xs">{p}</Badge>
                  ))}
                </div>
              </div>
            )}
            <div className="space-y-2">
              <Label>{usuarioSeleccionado ? "Nueva contraseña (dejar vacío para no cambiar)" : "Contraseña *"}</Label>
              <Input
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder={usuarioSeleccionado ? "••••••••" : "Mínimo 8 caracteres"}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={guardarUsuario} disabled={guardando}>
              {guardando ? "Guardando..." : "Guardar"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
