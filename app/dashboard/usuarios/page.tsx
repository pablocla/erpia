"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { PageShell, PageHeader } from "@/components/layout"
import { Switch } from "@/components/ui/switch"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Plus, Edit2, RefreshCw } from "lucide-react"
import { DataTable, type DataTableColumn } from "@/components/data-table"
import { EmptyStateIllustration } from "@/components/empty-state-illustration"
import { useKeyboardShortcuts, erpShortcuts } from "@/hooks/use-keyboard-shortcuts"
import { authFetch } from "@/lib/stores"

interface Usuario {
  id: number
  nombre: string
  email: string
  rol: string
  activo: boolean
  authProvider?: string
  hasGoogle?: boolean
  avatarUrl?: string | null
  createdAt?: string
}

const ROLES = [
  { value: "dueno", label: "Dueño / Admin", desc: "Acceso total. Ve costos, márgenes, sueldos", color: "bg-red-100 text-red-800" },
  { value: "administrador", label: "Administrador", desc: "Gestión completa del tenant", color: "bg-red-50 text-red-700" },
  { value: "gerente", label: "Gerente / Encargado", desc: "Operativo completo. No ve sueldos ni config", color: "bg-orange-100 text-orange-800" },
  { value: "cajero", label: "Cajero / Vendedor", desc: "Solo POS. Descuentos hasta límite configurado", color: "bg-green-100 text-green-800" },
  { value: "vendedor", label: "Vendedor", desc: "Ventas y clientes", color: "bg-emerald-100 text-emerald-800" },
  { value: "mozo", label: "Mozo (Hospitalidad)", desc: "Solo mesas y comandas. No cobra", color: "bg-blue-100 text-blue-800" },
  { value: "profesional", label: "Profesional (Médico/Vet)", desc: "Solo historia clínica y agenda propia", color: "bg-cyan-100 text-cyan-800" },
  { value: "deposito", label: "Depósito / Almacén", desc: "Stock y recepción. No ve precios de venta", color: "bg-yellow-100 text-yellow-800" },
  { value: "contador", label: "Contador (externo)", desc: "Solo lectura contable. Exporta libros", color: "bg-purple-100 text-purple-800" },
  { value: "vendedor_ruta", label: "Vendedor en Ruta", desc: "App móvil: pedidos offline y cobranza", color: "bg-teal-100 text-teal-800" },
  { value: "personal_servicio", label: "Personal Servicio", desc: "Solo su agenda y servicios. Ve comisiones", color: "bg-pink-100 text-pink-800" },
  { value: "stakeholder", label: "Stakeholder (portal)", desc: "Portal de seguimiento Claver Cliente", color: "bg-slate-100 text-slate-800" },
]

const PERMISOS_POR_ROL: Record<string, string[]> = {
  dueno: ["Ventas", "Compras", "Stock", "Caja", "Contabilidad", "Impuestos", "Usuarios", "Configuración", "Costos", "Sueldos"],
  administrador: ["Ventas", "Compras", "Stock", "Caja", "Contabilidad", "Usuarios", "Configuración"],
  gerente: ["Ventas", "Compras", "Stock", "Caja", "Reportes", "Proveedores", "Descuentos ≤20%"],
  cajero: ["POS", "Clientes (ver/crear)", "Stock (ver)", "Caja propia", "Descuentos ≤10%"],
  vendedor: ["Ventas", "Clientes", "Stock (ver)"],
  mozo: ["Hospitalidad (mesas/comandas)", "KDS (ver estado cocina)"],
  profesional: ["Historia Clínica", "Agenda propia", "Recetas digitales", "Stock farmacia (ver)"],
  deposito: ["Stock completo", "Compras (recibir)", "Proveedores (ver)", "Remitos"],
  contador: ["Contabilidad (ver)", "Impuestos (ver)", "Reportes (ver)", "Exportar todo"],
  vendedor_ruta: ["Ventas (app móvil)", "Clientes propios (ver)", "Stock aproximado", "Comisiones propias"],
  personal_servicio: ["Agenda propia", "Servicios realizados", "Comisiones propias"],
  stakeholder: ["Portal seguimiento", "Tickets", "Facturas (ver)"],
}

type AuthMethod = "credentials" | "google"

const initialForm = {
  nombre: "",
  email: "",
  rol: "cajero",
  password: "",
  authMethod: "credentials" as AuthMethod,
}

function AuthBadge({ u }: { u: Usuario }) {
  const isGoogle = u.authProvider === "google" || u.hasGoogle
  const isHybrid = u.authProvider === "credentials" && u.hasGoogle
  if (isHybrid) {
    return (
      <div className="flex gap-1 flex-wrap">
        <Badge variant="outline" className="text-xs">Email</Badge>
        <Badge className="text-xs bg-blue-100 text-blue-800">Google</Badge>
      </div>
    )
  }
  if (isGoogle) {
    return <Badge className="text-xs bg-blue-100 text-blue-800">Google</Badge>
  }
  return <Badge variant="outline" className="text-xs">Email / clave</Badge>
}

export default function UsuariosPage() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState<Usuario | null>(null)
  const [form, setForm] = useState(initialForm)
  const [error, setError] = useState("")
  const [successMsg, setSuccessMsg] = useState("")
  const [guardando, setGuardando] = useState(false)

  const cargarUsuarios = useCallback(async () => {
    setLoading(true)
    setError("")
    try {
      const res = await authFetch("/api/usuarios")
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || "Error al cargar usuarios")
        setUsuarios([])
        return
      }
      const list = Array.isArray(data.usuarios)
        ? data.usuarios
        : Array.isArray(data)
          ? data
          : []
      setUsuarios(list)
    } catch {
      setError("Error al cargar usuarios")
      setUsuarios([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    cargarUsuarios()
  }, [cargarUsuarios])

  useKeyboardShortcuts(
    erpShortcuts({
      onRefresh: cargarUsuarios,
      onNew: () => {
        setUsuarioSeleccionado(null)
        setForm(initialForm)
        setError("")
        setSuccessMsg("")
        setDialogOpen(true)
      },
    }),
  )

  const abrirNuevo = () => {
    setUsuarioSeleccionado(null)
    setForm(initialForm)
    setError("")
    setSuccessMsg("")
    setDialogOpen(true)
  }

  const abrirEditar = (u: Usuario) => {
    setUsuarioSeleccionado(u)
    setForm({
      nombre: u.nombre,
      email: u.email,
      rol: u.rol,
      password: "",
      authMethod: u.authProvider === "google" ? "google" : "credentials",
    })
    setError("")
    setSuccessMsg("")
    setDialogOpen(true)
  }

  const guardarUsuario = async () => {
    setError("")
    setSuccessMsg("")
    if (!form.nombre || !form.email) {
      setError("Nombre y email son obligatorios")
      return
    }
    if (!usuarioSeleccionado && form.authMethod === "credentials" && !form.password) {
      setError("Contraseña obligatoria para usuario con email/clave")
      return
    }
    if (!usuarioSeleccionado && form.authMethod === "credentials" && form.password.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres")
      return
    }

    setGuardando(true)
    try {
      if (usuarioSeleccionado) {
        const body: Record<string, unknown> = {
          nombre: form.nombre,
          rol: form.rol,
        }
        if (form.password) body.password = form.password

        const res = await authFetch(`/api/usuarios/${usuarioSeleccionado.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        })
        const data = await res.json()
        if (!res.ok) {
          setError(data.error || "Error al guardar")
          return
        }
        setDialogOpen(false)
        cargarUsuarios()
        return
      }

      // Create: prefer invite endpoint for Google (clear messaging), usuarios POST for both
      if (form.authMethod === "google") {
        const res = await authFetch("/api/auth/invite", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            nombre: form.nombre,
            email: form.email,
            rol: form.rol,
            authMethod: "google",
          }),
        })
        const data = await res.json()
        if (!res.ok) {
          setError(data.error || "Error al invitar")
          return
        }
        setSuccessMsg(
          data.mensaje ||
            "Invitación Google creada. El usuario se activa al iniciar sesión con Google.",
        )
        setDialogOpen(false)
        cargarUsuarios()
        return
      }

      const res = await authFetch("/api/usuarios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre: form.nombre,
          email: form.email,
          rol: form.rol,
          password: form.password,
          authMethod: "credentials",
        }),
      })
      const data = await res.json()
      if (!res.ok) {
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
    try {
      const res = await authFetch(`/api/usuarios/${usuario.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ activo: !usuario.activo }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setError(data.error || "No se pudo cambiar el estado")
        return
      }
      cargarUsuarios()
    } catch {
      setError("Error de conexión")
    }
  }

  const usuariosFiltrados = usuarios.filter(
    (u) =>
      !search ||
      u.nombre.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()),
  )

  return (
    <PageShell>
      <PageHeader
        title="Usuarios y Permisos"
        description="Gestión de accesos, roles y método de login (email o Google) — Grupo Claver"
        actions={
          <div className="flex gap-2">
            <Button variant="outline" size="icon" onClick={cargarUsuarios} title="Actualizar">
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Button onClick={abrirNuevo}>
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Usuario
            </Button>
          </div>
        }
      />

      {successMsg && (
        <Alert className="mb-4">
          <AlertDescription>{successMsg}</AlertDescription>
        </Alert>
      )}
      {error && !dialogOpen && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Roles disponibles */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        {ROLES.slice(0, 8).map((rol) => (
          <Card key={rol.value} className="text-sm">
            <CardContent className="pt-3 pb-3">
              <Badge className={`${rol.color} mb-1`}>{rol.label}</Badge>
              <p className="text-xs text-muted-foreground">{rol.desc}</p>
              <div className="mt-2 space-y-0.5">
                {(PERMISOS_POR_ROL[rol.value] ?? []).slice(0, 3).map((p) => (
                  <p key={p} className="text-xs text-muted-foreground">
                    • {p}
                  </p>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardContent className="pt-4">
          <div className="mb-3">
            <Input
              placeholder="Buscar por nombre o email…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="max-w-sm"
            />
          </div>
          <DataTable<Usuario>
            data={usuariosFiltrados}
            columns={
              [
                {
                  key: "nombre",
                  header: "Usuario",
                  sortable: true,
                  cell: (u) => (
                    <div className="flex items-center gap-2">
                      {u.avatarUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={u.avatarUrl}
                          alt=""
                          className="h-8 w-8 rounded-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="h-8 w-8 rounded-full bg-primary/10 text-primary text-sm font-bold flex items-center justify-center">
                          {u.nombre.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <span className="font-medium">{u.nombre}</span>
                    </div>
                  ),
                },
                {
                  key: "email",
                  header: "Email",
                  sortable: true,
                  cell: (u) => <span className="text-muted-foreground">{u.email}</span>,
                },
                {
                  key: "authProvider",
                  header: "Login",
                  cell: (u) => <AuthBadge u={u} />,
                  exportFn: (u) => u.authProvider ?? "credentials",
                },
                {
                  key: "rol",
                  header: "Rol",
                  cell: (u) => {
                    const rol = ROLES.find((r) => r.value === u.rol)
                    return <Badge className={rol?.color ?? ""}>{rol?.label ?? u.rol}</Badge>
                  },
                },
                {
                  key: "activo",
                  header: "Activo",
                  cell: (u) => (
                    <Switch checked={u.activo} onCheckedChange={() => toggleActivo(u)} />
                  ),
                  exportFn: (u) => (u.activo ? "Sí" : "No"),
                },
                {
                  key: "acciones" as keyof Usuario,
                  header: "Acciones",
                  align: "right",
                  cell: (u) => (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation()
                        abrirEditar(u)
                      }}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                  ),
                },
              ] as DataTableColumn<Usuario>[]
            }
            rowKey="id"
            searchPlaceholder="Buscar usuario..."
            searchKeys={["nombre", "email", "rol"]}
            selectable
            exportFilename="usuarios"
            loading={loading}
            emptyMessage="No hay usuarios"
            emptyIcon={
              <EmptyStateIllustration
                type="generico"
                compact
                title="Sin usuarios"
                description="Creá el primer usuario o invitalo con Google."
                actionLabel="Nuevo Usuario"
                onAction={abrirNuevo}
              />
            }
            defaultPageSize={25}
            compact
            onRowClick={abrirEditar}
          />
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {usuarioSeleccionado ? "Editar Usuario" : "Nuevo Usuario / Invitación"}
            </DialogTitle>
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
                <Input
                  value={form.nombre}
                  onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Email *</Label>
                <Input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  disabled={!!usuarioSeleccionado}
                  className={usuarioSeleccionado ? "bg-muted" : ""}
                />
              </div>
            </div>

            {!usuarioSeleccionado && (
              <div className="space-y-2">
                <Label>Método de acceso</Label>
                <Select
                  value={form.authMethod}
                  onValueChange={(v) =>
                    setForm({ ...form, authMethod: v as AuthMethod, password: "" })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="credentials">Email y contraseña</SelectItem>
                    <SelectItem value="google">Solo Google (invitación)</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  {form.authMethod === "google"
                    ? "El usuario se crea inactivo y se activa al primer «Continuar con Google» con ese email."
                    : "El usuario podrá ingresar con email y contraseña. También puede vincular Google después."}
                </p>
              </div>
            )}

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
                    <Badge key={p} variant="outline" className="text-xs">
                      {p}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {(usuarioSeleccionado || form.authMethod === "credentials") && (
              <div className="space-y-2">
                <Label>
                  {usuarioSeleccionado
                    ? "Nueva contraseña (dejar vacío para no cambiar)"
                    : "Contraseña *"}
                </Label>
                <Input
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder={usuarioSeleccionado ? "••••••••" : "Mínimo 8 caracteres"}
                  autoComplete="new-password"
                />
                {usuarioSeleccionado?.authProvider === "google" && (
                  <p className="text-xs text-muted-foreground">
                    Esta cuenta usa Google. Si definís una contraseña, podrá usar ambos métodos.
                  </p>
                )}
              </div>
            )}
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={guardarUsuario} disabled={guardando}>
              {guardando
                ? "Guardando…"
                : usuarioSeleccionado
                  ? "Guardar"
                  : form.authMethod === "google"
                    ? "Invitar con Google"
                    : "Crear usuario"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </PageShell>
  )
}
