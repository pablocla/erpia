"use client"

import { useState, useEffect } from "react"
import { useAuthStore } from "@/lib/stores"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Trash2, UserPlus } from "lucide-react"

type Asignacion = {
  id: number
  empresaId: number
  analistaEmail: string
  rolAsignacion: string
  activo: boolean
  empresa: { nombre: string; razonSocial: string }
  createdAt: string
}

type EmpresaFlota = { id: number; nombre: string }

export default function AsignacionesPage() {
  const token = useAuthStore((s) => s.token)
  const [asignaciones, setAsignaciones] = useState<Asignacion[]>([])
  const [empresas, setEmpresas] = useState<EmpresaFlota[]>([])
  const [loading, setLoading] = useState(true)
  
  // Form state
  const [open, setOpen] = useState(false)
  const [email, setEmail] = useState("")
  const [empresaId, setEmpresaId] = useState("")
  const [rol, setRol] = useState("soporte")

  const headers = { Authorization: `Bearer ${token}` }

  async function loadData() {
    setLoading(true)
    try {
      const resAsig = await fetch("/api/claver/ops/asignaciones", { headers })
      if (resAsig.ok) {
        const json = await resAsig.json()
        setAsignaciones(json.data || json)
      }
      
      const resCli = await fetch("/api/claver/ops/clientes", { headers })
      if (resCli.ok) {
        const jsonCli = await resCli.json()
        setEmpresas(jsonCli.data || [])
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (token) loadData()
  }, [token])

  async function handleCrear(e: React.FormEvent) {
    e.preventDefault()
    if (!email || !empresaId || !rol) return
    const res = await fetch("/api/claver/ops/asignaciones", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...headers },
      body: JSON.stringify({
        analistaEmail: email,
        empresaId: Number(empresaId),
        rolAsignacion: rol,
      })
    })
    if (res.ok) {
      setOpen(false)
      setEmail("")
      setEmpresaId("")
      setRol("soporte")
      loadData()
    } else {
      alert("Error al crear asignación")
    }
  }

  async function handleDesactivar(id: number) {
    if (!confirm("¿Desactivar asignación?")) return
    const res = await fetch(`/api/claver/ops/asignaciones/${id}`, {
      method: "DELETE",
      headers,
    })
    if (res.ok) {
      loadData()
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Analyst Assignments</h1>
          <p className="text-muted-foreground mt-1">
            Manage which Claver analysts have access to operate which tenants.
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <UserPlus className="h-4 w-4 mr-2" />
              New Assignment
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Assign Tenant to Analyst</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCrear} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Tenant</label>
                <Select value={empresaId} onValueChange={setEmpresaId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a tenant..." />
                  </SelectTrigger>
                  <SelectContent>
                    {empresas.map((e) => (
                      <SelectItem key={e.id} value={String(e.id)}>
                        {e.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Analyst Email</label>
                <Input 
                  type="email" 
                  placeholder="analista@claver.cloud" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Assigned Role</label>
                <Select value={rol} onValueChange={setRol}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="lead">Lead / Account Manager</SelectItem>
                    <SelectItem value="soporte">Technical Support</SelectItem>
                    <SelectItem value="implementacion">Implementation</SelectItem>
                    <SelectItem value="dba">Database Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" className="w-full">Save Assignment</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Analyst</TableHead>
                <TableHead>Tenant</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : asignaciones.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                    No assignments configured. Super-analysts can view all tenants.
                  </TableCell>
                </TableRow>
              ) : (
                asignaciones.map((a) => (
                  <TableRow key={a.id} className={!a.activo ? "opacity-50 bg-muted/30" : ""}>
                    <TableCell className="font-medium">{a.analistaEmail}</TableCell>
                    <TableCell>{a.empresa?.nombre ?? `ID: ${a.empresaId}`}</TableCell>
                    <TableCell className="capitalize">{a.rolAsignacion}</TableCell>
                    <TableCell>
                      {a.activo ? (
                        <Badge variant="outline" className="text-emerald-600 bg-emerald-50">Active</Badge>
                      ) : (
                        <Badge variant="secondary">Inactive</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {a.activo && (
                        <Button variant="ghost" size="sm" onClick={() => handleDesactivar(a.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
