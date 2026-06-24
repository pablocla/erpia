"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent } from "@/components/ui/card"
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
  Bell, Plus, Trash2, Package, DollarSign, AlertTriangle, ShieldAlert,
  ToggleLeft, ToggleRight, MessageCircle, Send,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface Usuario {
  id: number
  nombre: string
  email: string
}

interface Regla {
  id: number
  nombre: string
  tipoRegla: string
  condicion: string
  accion: string
  destinatarioId: number | null
  frecuenciaHoras: number
  activo: boolean
  ultimoChequeo: string | null
  ultimoResultado: boolean | null
}

const TIPOS_REGLA = [
  { value: "stock_bajo", label: "Stock bajo mínimo", icon: Package },
  { value: "cxc_vencida", label: "CxC vencida", icon: DollarSign },
  { value: "cxp_vencida", label: "CxP vencida", icon: DollarSign },
  { value: "venta_baja", label: "Ventas bajas", icon: AlertTriangle },
  { value: "diferencia_caja", label: "Diferencia de caja", icon: ShieldAlert },
]

const ACCION_ICON: Record<string, typeof Bell> = {
  whatsapp: MessageCircle,
  telegram: Send,
}

export function ReglasAlertasPanel({ authHeaders }: { authHeaders: () => HeadersInit }) {
  const [reglas, setReglas] = useState<Regla[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [accionSeleccionada, setAccionSeleccionada] = useState("notificacion")
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const { toast } = useToast()

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [resReglas, resUsuarios] = await Promise.all([
        fetch("/api/alertas", { headers: authHeaders() }),
        fetch("/api/config/usuarios", { headers: authHeaders() }),
      ])
      if (resReglas.ok) setReglas(await resReglas.json())
      if (resUsuarios.ok) {
        const u = await resUsuarios.json()
        setUsuarios(Array.isArray(u) ? u : u.data ?? [])
      }
    } finally {
      setLoading(false)
    }
  }, [authHeaders])

  useEffect(() => { fetchData() }, [fetchData])

  async function handleCrear(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const res = await fetch("/api/alertas", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify({
        nombre: fd.get("nombre"),
        tipoRegla: fd.get("tipoRegla"),
        condicion: { operador: "mayor", valor: Number(fd.get("valor")) },
        accion_alerta: fd.get("accion") || "notificacion",
        frecuenciaHoras: Number(fd.get("frecuencia")) || 24,
        emailDestino: fd.get("emailDestino") || undefined,
        telefonoDestino: fd.get("telefonoDestino") || undefined,
        destinatarioId: fd.get("destinatarioId") ? Number(fd.get("destinatarioId")) : undefined,
      }),
    })
    if (res.ok) {
      setDialogOpen(false)
      fetchData()
      toast({ title: "Regla creada" })
    } else {
      toast({ title: "Error", variant: "destructive" })
    }
  }

  async function handleToggle(id: number, activo: boolean) {
    await fetch("/api/alertas", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify({ accion: "toggle", id, activo: !activo }),
    })
    fetchData()
  }

  async function handleEliminar(id: number) {
    await fetch(`/api/alertas?id=${id}`, { method: "DELETE", headers: authHeaders() })
    fetchData()
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Reglas automáticas con notificación, WhatsApp o Telegram
        </p>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="mr-2 h-4 w-4" /> Nueva regla</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Nueva regla de alerta</DialogTitle></DialogHeader>
            <form onSubmit={handleCrear} className="space-y-4">
              <div><Label>Nombre *</Label><Input name="nombre" required /></div>
              <div>
                <Label>Tipo *</Label>
                <Select name="tipoRegla" required>
                  <SelectTrigger><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
                  <SelectContent>
                    {TIPOS_REGLA.map((t) => (
                      <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Umbral / valor</Label><Input name="valor" type="number" /></div>
              <div>
                <Label>Acción al disparar</Label>
                <Select name="accion" value={accionSeleccionada} onValueChange={setAccionSeleccionada}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="notificacion">Notificación in-app</SelectItem>
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="whatsapp">WhatsApp</SelectItem>
                    <SelectItem value="telegram">Telegram</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Usuario destino</Label>
                <Select name="destinatarioId">
                  <SelectTrigger><SelectValue placeholder="Administradores" /></SelectTrigger>
                  <SelectContent>
                    {usuarios.map((u) => (
                      <SelectItem key={u.id} value={String(u.id)}>{u.nombre}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {accionSeleccionada === "whatsapp" && (
                <div>
                  <Label>Teléfono equipo (+549...)</Label>
                  <Input name="telefonoDestino" placeholder="+5491112345678" />
                </div>
              )}
              <div><Label>Frecuencia (horas)</Label><Input name="frecuencia" type="number" defaultValue="24" /></div>
              <DialogFooter><Button type="submit">Crear</Button></DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <p className="text-center text-muted-foreground py-8">Cargando reglas...</p>
      ) : reglas.length === 0 ? (
        <Card><CardContent className="py-8 text-center text-muted-foreground">Sin reglas configuradas</CardContent></Card>
      ) : (
        <div className="space-y-2">
          {reglas.map((regla) => {
            const tipo = TIPOS_REGLA.find((t) => t.value === regla.tipoRegla)
            const Icon = tipo?.icon ?? Bell
            const AccionIcon = ACCION_ICON[regla.accion] ?? Bell
            return (
              <Card key={regla.id} className={!regla.activo ? "opacity-50" : ""}>
                <CardContent className="py-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="rounded-lg bg-primary/10 p-2 shrink-0">
                        <Icon className="h-4 w-4 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-sm truncate">{regla.nombre}</p>
                        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                          <Badge variant="outline">{tipo?.label ?? regla.tipoRegla}</Badge>
                          <span className="flex items-center gap-1">
                            <AccionIcon className="h-3 w-3" />{regla.accion}
                          </span>
                          <span>Cada {regla.frecuenciaHoras}h</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      {regla.ultimoResultado !== null && (
                        <Badge className={regla.ultimoResultado ? "bg-red-500/15 text-red-600" : "bg-emerald-500/15 text-emerald-600"}>
                          {regla.ultimoResultado ? "DISPARADA" : "OK"}
                        </Badge>
                      )}
                      <Button variant="ghost" size="icon" onClick={() => handleToggle(regla.id, regla.activo)}>
                        {regla.activo ? <ToggleRight className="h-5 w-5 text-emerald-500" /> : <ToggleLeft className="h-5 w-5" />}
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleEliminar(regla.id)}>
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}