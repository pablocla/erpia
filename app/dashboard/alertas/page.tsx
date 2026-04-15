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
  Bell, BellRing, Plus, RefreshCw, Trash2,
  Package, DollarSign, AlertTriangle, ShieldAlert,
  ToggleLeft, ToggleRight, Zap,
} from "lucide-react"
import { useKeyboardShortcuts, erpShortcuts } from "@/hooks/use-keyboard-shortcuts"
import { useToast } from "@/hooks/use-toast"

interface Regla {
  id: number
  nombre: string
  tipoRegla: string
  condicion: string
  accion: string
  frecuenciaHoras: number
  activo: boolean
  ultimoChequeo: string | null
  ultimoResultado: boolean | null
}

interface ResultadoEvaluacion {
  reglaId: number
  nombre: string
  disparada: boolean
  mensaje: string
}

const TIPOS_REGLA = [
  { value: "stock_bajo", label: "Stock bajo mínimo", icon: Package },
  { value: "cxc_vencida", label: "CxC vencida", icon: DollarSign },
  { value: "cxp_vencida", label: "CxP vencida", icon: DollarSign },
  { value: "venta_baja", label: "Ventas bajas", icon: AlertTriangle },
  { value: "diferencia_caja", label: "Diferencia de caja", icon: ShieldAlert },
]

export default function AlertasPage() {
  const [reglas, setReglas] = useState<Regla[]>([])
  const [resultados, setResultados] = useState<ResultadoEvaluacion[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [evaluando, setEvaluando] = useState(false)
  const { toast } = useToast()

  const headers = { Authorization: `Bearer ${typeof window !== "undefined" ? localStorage.getItem("token") : ""}` }

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/alertas", { headers })
      if (res.ok) setReglas(await res.json())
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  useKeyboardShortcuts(erpShortcuts({ onRefresh: fetchData, onNew: () => setDialogOpen(true) }))

  async function handleCrear(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const tipoRegla = fd.get("tipoRegla") as string
    const valor = fd.get("valor") as string

    const res = await fetch("/api/alertas", {
      method: "POST",
      headers: { ...headers, "Content-Type": "application/json" },
      body: JSON.stringify({
        nombre: fd.get("nombre"),
        tipoRegla,
        condicion: { operador: "mayor", valor: Number(valor) },
        accion_alerta: fd.get("accion") || "notificacion",
        frecuenciaHoras: Number(fd.get("frecuencia")) || 24,
        emailDestino: fd.get("emailDestino") || undefined,
      }),
    })
    if (res.ok) { setDialogOpen(false); fetchData(); toast({ title: "Regla creada", description: "La regla de alerta se guardó correctamente" }) }
    else { toast({ title: "Error al crear regla", description: "No se pudo guardar la regla de alerta", variant: "destructive" }) }
  }

  async function handleToggle(id: number, activo: boolean) {
    await fetch("/api/alertas", {
      method: "POST",
      headers: { ...headers, "Content-Type": "application/json" },
      body: JSON.stringify({ accion: "toggle", id, activo: !activo }),
    })
    fetchData()
  }

  async function handleEliminar(id: number) {
    await fetch(`/api/alertas?id=${id}`, { method: "DELETE", headers })
    fetchData()
    toast({ title: "Regla eliminada", description: "La regla de alerta fue eliminada" })
  }

  async function handleEvaluar() {
    setEvaluando(true)
    try {
      const res = await fetch("/api/alertas", {
        method: "POST",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({ accion: "evaluar" }),
      })
      if (res.ok) {
        const data = await res.json()
        setResultados(data)
        fetchData()
      }
    } finally {
      setEvaluando(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Alertas Configurables</h1>
          <p className="text-muted-foreground">
            Definí reglas de alerta automáticas para tu empresa
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleEvaluar} disabled={evaluando}>
            <Zap className="mr-2 h-4 w-4" /> {evaluando ? "Evaluando..." : "Evaluar ahora"}
          </Button>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm"><Plus className="mr-2 h-4 w-4" /> Nueva Regla</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Nueva Regla de Alerta</DialogTitle></DialogHeader>
              <form onSubmit={handleCrear} className="space-y-4">
                <div><Label>Nombre *</Label><Input name="nombre" placeholder="Ej: Stock bajo de insumos" required /></div>
                <div>
                  <Label>Tipo de regla *</Label>
                  <Select name="tipoRegla" required>
                    <SelectTrigger><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
                    <SelectContent>
                      {TIPOS_REGLA.map((t) => (
                        <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div><Label>Umbral / valor</Label><Input name="valor" type="number" placeholder="Ej: 30 (días), 5 (productos)" /></div>
                <div>
                  <Label>Acción</Label>
                  <Select name="accion">
                    <SelectTrigger><SelectValue placeholder="Notificación" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="notificacion">Notificación</SelectItem>
                      <SelectItem value="email">Email</SelectItem>
                      <SelectItem value="whatsapp">WhatsApp</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div><Label>Email destino (si acción = email)</Label><Input name="emailDestino" type="email" /></div>
                <div><Label>Frecuencia (horas)</Label><Input name="frecuencia" type="number" defaultValue="24" /></div>
                <DialogFooter><Button type="submit">Crear regla</Button></DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Resultados de última evaluación */}
      {resultados.length > 0 && (
        <Card className="border-amber-500/30 bg-amber-500/5">
          <CardHeader><CardTitle className="text-base flex items-center gap-2">
            <BellRing className="h-5 w-5 text-amber-500" /> Resultados de evaluación
          </CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {resultados.map((r) => (
              <div key={r.reglaId} className="flex items-center justify-between text-sm">
                <span>{r.nombre}</span>
                {r.disparada ? (
                  <Badge className="bg-red-500/15 text-red-600">{r.mensaje}</Badge>
                ) : (
                  <Badge className="bg-emerald-500/15 text-emerald-600">OK</Badge>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Lista de reglas */}
      {loading ? (
        <p className="text-muted-foreground text-center py-10">Cargando...</p>
      ) : reglas.length === 0 ? (
        <Card><CardContent className="py-10 text-center text-muted-foreground">
          No hay reglas configuradas. Creá tu primera alerta.
        </CardContent></Card>
      ) : (
        <div className="space-y-3">
          {reglas.map((regla) => {
            const tipo = TIPOS_REGLA.find((t) => t.value === regla.tipoRegla)
            const Icon = tipo?.icon ?? Bell
            return (
              <Card key={regla.id} className={!regla.activo ? "opacity-50" : ""}>
                <CardContent className="py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="rounded-lg bg-primary/10 p-2">
                        <Icon className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-semibold">{regla.nombre}</p>
                        <div className="flex items-center gap-3 text-sm text-muted-foreground">
                          <Badge variant="outline">{tipo?.label ?? regla.tipoRegla}</Badge>
                          <span>Cada {regla.frecuenciaHoras}h</span>
                          <span>Acción: {regla.accion}</span>
                          {regla.ultimoChequeo && (
                            <span>Último check: {new Date(regla.ultimoChequeo).toLocaleString("es-AR")}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
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
