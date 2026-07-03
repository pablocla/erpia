"use client"

import { useCallback, useEffect, useState } from "react"
import { Building2, MessageCircle, Plus, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { getAuthHeaders } from "@/lib/stores/auth-store"
import type { NicheAppDefinition } from "@/lib/niche/types"
import { NicheClientePicker, type ClienteOption } from "@/components/niche/niche-cliente-picker"
import { useToast } from "@/components/ui/use-toast"

const fmt = (n: number) =>
  n.toLocaleString("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 })

type Consorcio = {
  id: number
  nombre: string
  direccion: string
  _count: { unidades: number; gastos: number }
}

type Unidad = {
  id: number
  numero: string
  porceps: number
  residente?: { id: number; nombre: string; telefono: string | null } | null
}

export function NicheConsorciosPanel({ app }: { app: NicheAppDefinition }) {
  const { toast } = useToast()
  const [consorcios, setConsorcios] = useState<Consorcio[]>([])
  const [unidades, setUnidades] = useState<Unidad[]>([])
  const [selected, setSelected] = useState<number | null>(null)
  const [periodo, setPeriodo] = useState(new Date().toISOString().slice(0, 7))
  const [gastoDesc, setGastoDesc] = useState("")
  const [gastoMonto, setGastoMonto] = useState("")
  const [waAsunto, setWaAsunto] = useState("Expensas del mes")
  const [waCuerpo, setWaCuerpo] = useState(app.plantillaWhatsApp ?? "")
  const [ultimaLiquidacion, setUltimaLiquidacion] = useState<{
    periodo: string
    total: number
    unidades: number
  } | null>(null)

  const cargar = useCallback(async () => {
    const res = await fetch("/api/consorcios", { headers: getAuthHeaders() })
    if (res.ok) setConsorcios(await res.json())
  }, [])

  const cargarUnidades = useCallback(async (consorcioId: number) => {
    const res = await fetch(`/api/consorcios/${consorcioId}`, { headers: getAuthHeaders() })
    if (res.ok) {
      const data = await res.json()
      setUnidades(data.unidades ?? [])
    }
  }, [])

  useEffect(() => {
    void cargar()
  }, [cargar])

  useEffect(() => {
    if (selected) void cargarUnidades(selected)
    else setUnidades([])
  }, [selected, cargarUnidades])

  async function crearEdificio(nombre: string, direccion: string) {
    const res = await fetch("/api/consorcios", {
      method: "POST",
      headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
      body: JSON.stringify({ nombre, direccion }),
    })
    if (!res.ok) {
      toast({ variant: "destructive", title: "Error", description: "No se pudo crear el edificio." })
      return
    }
    toast({ title: "Edificio creado", description: nombre })
    void cargar()
  }

  async function agregarUnidad(numero: string, porceps: number, residente: ClienteOption | null) {
    if (!selected || !residente) {
      toast({ variant: "destructive", title: "Datos incompletos", description: "Unidad y residente son obligatorios." })
      return
    }
    const res = await fetch(`/api/consorcios/${selected}`, {
      method: "POST",
      headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "unidad",
        numero,
        porceps,
        residenteId: residente.id,
      }),
    })
    if (!res.ok) {
      toast({ variant: "destructive", title: "Error", description: "No se pudo agregar la unidad." })
      return
    }
    toast({ title: "Unidad agregada", description: `${numero} — ${residente.nombre}` })
    void cargarUnidades(selected)
    void cargar()
  }

  async function cargarGasto() {
    if (!selected || !gastoDesc.trim()) return
    const res = await fetch(`/api/consorcios/${selected}`, {
      method: "POST",
      headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "gasto",
        descripcion: gastoDesc,
        monto: Number(gastoMonto),
        periodo,
      }),
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      toast({
        variant: "destructive",
        title: "Gasto no cargado",
        description: err.error ?? "Revisá el período y el monto.",
      })
      return
    }
    toast({ title: "Gasto cargado", description: `${gastoDesc} — ${fmt(Number(gastoMonto))}` })
    setGastoDesc("")
    setGastoMonto("")
    void cargar()
  }

  async function liquidar() {
    if (!selected) return
    const res = await fetch(`/api/consorcios/${selected}`, {
      method: "POST",
      headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
      body: JSON.stringify({ action: "liquidar", periodo, emitirFactura: false }),
    })
    const data = res.ok ? await res.json() : null
    if (!res.ok) {
      toast({
        variant: "destructive",
        title: "Liquidación fallida",
        description: data?.error ?? "¿Hay gastos y unidades cargadas?",
      })
      return
    }
    const count = data?.expensasGeneradas?.length ?? unidades.length
    setUltimaLiquidacion({
      periodo,
      total: Number(data?.totalProrrateado ?? 0),
      unidades: count,
    })
    toast({
      title: "Expensas liquidadas",
      description: `${count} unidades · ${fmt(Number(data?.totalProrrateado ?? 0))} total`,
    })
    void cargar()
  }

  async function comunicado() {
    if (!selected || !waCuerpo.trim()) return
    const res = await fetch(`/api/consorcios/${selected}`, {
      method: "POST",
      headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "comunicado",
        asunto: waAsunto,
        cuerpo: waCuerpo,
        canal: "whatsapp",
      }),
    })
    const data = res.ok ? await res.json() : null
    if (!res.ok) {
      toast({ variant: "destructive", title: "Comunicado fallido", description: "Revisá residentes con teléfono." })
      return
    }
    toast({
      title: "Comunicado enviado",
      description: `${data?.destinatariosAlcanzados ?? 0} inquilino(s) alcanzados`,
    })
  }

  const selectedConsorcio = consorcios.find((c) => c.id === selected)

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-semibold flex items-center gap-2">
          <span>{app.emoji}</span> {app.nombre}
        </h1>
        <p className="text-muted-foreground mt-1">{app.lema}</p>
      </div>

      {ultimaLiquidacion && (
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="pt-4 text-sm">
            Última liquidación: <strong>{ultimaLiquidacion.periodo}</strong> —{" "}
            {ultimaLiquidacion.unidades} unidades · {fmt(ultimaLiquidacion.total)}
          </CardContent>
        </Card>
      )}

      <div className="flex gap-2 flex-wrap">
        <Dialog>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-1" />
              Nuevo edificio
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Alta consorcio</DialogTitle>
            </DialogHeader>
            <FormEdificio onSave={crearEdificio} />
          </DialogContent>
        </Dialog>
        <Button variant="outline" size="sm" onClick={() => void cargar()}>
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      <div className="grid gap-3">
        {consorcios.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-8">
            Creá tu primer edificio para empezar a liquidar expensas.
          </p>
        )}
        {consorcios.map((c) => (
          <Card
            key={c.id}
            className={selected === c.id ? "ring-2 ring-primary" : "cursor-pointer"}
            onClick={() => setSelected(c.id)}
          >
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                {c.nombre}
              </CardTitle>
              <p className="text-xs text-muted-foreground">{c.direccion}</p>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              {c._count.unidades} unidades · {c._count.gastos} gastos cargados
            </CardContent>
          </Card>
        ))}
      </div>

      {selected && selectedConsorcio && (
        <div className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Unidades / inquilinos</CardTitle>
              <Dialog>
                <DialogTrigger asChild>
                  <Button size="sm" variant="outline">
                    <Plus className="h-4 w-4 mr-1" />
                    Unidad
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Nueva unidad — {selectedConsorcio.nombre}</DialogTitle>
                  </DialogHeader>
                  <FormUnidad onSave={agregarUnidad} />
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent className="space-y-2">
              {unidades.length === 0 && (
                <p className="text-sm text-muted-foreground">Agregá unidades con % de expensa y residente.</p>
              )}
              {unidades.map((u) => (
                <div
                  key={u.id}
                  className="flex justify-between items-center border rounded-lg px-3 py-2 text-sm"
                >
                  <span>
                    <strong>{u.numero}</strong> — {u.residente?.nombre ?? "Sin residente"}
                  </span>
                  <span className="text-muted-foreground">{u.porceps}%</span>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Liquidar expensas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Período (YYYY-MM)</Label>
                <Input value={periodo} onChange={(e) => setPeriodo(e.target.value)} />
              </div>
              <div className="grid md:grid-cols-2 gap-3">
                <div>
                  <Label>Gasto — descripción</Label>
                  <Input value={gastoDesc} onChange={(e) => setGastoDesc(e.target.value)} />
                </div>
                <div>
                  <Label>Monto</Label>
                  <Input type="number" value={gastoMonto} onChange={(e) => setGastoMonto(e.target.value)} />
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button onClick={() => void cargarGasto()}>Cargar gasto</Button>
                <Button variant="secondary" onClick={() => void liquidar()}>
                  {app.accionPrincipal} ({periodo})
                </Button>
              </div>
              <div className="border-t pt-4 space-y-2">
                <Label>Comunicado masivo WhatsApp</Label>
                <Input value={waAsunto} onChange={(e) => setWaAsunto(e.target.value)} placeholder="Asunto" />
                <Input value={waCuerpo} onChange={(e) => setWaCuerpo(e.target.value)} placeholder="Mensaje" />
                <Button onClick={() => void comunicado()}>
                  <MessageCircle className="h-4 w-4 mr-1" />
                  Enviar a inquilinos
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}

function FormEdificio({ onSave }: { onSave: (n: string, d: string) => void }) {
  const [nombre, setNombre] = useState("")
  const [direccion, setDireccion] = useState("")
  return (
    <div className="space-y-3">
      <div>
        <Label>Nombre</Label>
        <Input value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Edificio Rivadavia 1200" />
      </div>
      <div>
        <Label>Dirección</Label>
        <Input value={direccion} onChange={(e) => setDireccion(e.target.value)} />
      </div>
      <Button
        className="w-full"
        disabled={!nombre.trim()}
        onClick={() => {
          onSave(nombre, direccion)
          setNombre("")
          setDireccion("")
        }}
      >
        Crear
      </Button>
    </div>
  )
}

function FormUnidad({ onSave }: { onSave: (num: string, pct: number, r: ClienteOption | null) => void }) {
  const [numero, setNumero] = useState("")
  const [porceps, setPorceps] = useState("10")
  const [residente, setResidente] = useState<ClienteOption | null>(null)
  return (
    <div className="space-y-3">
      <div>
        <Label>Nº unidad / depto</Label>
        <Input value={numero} onChange={(e) => setNumero(e.target.value)} placeholder="4B" />
      </div>
      <div>
        <Label>% expensa</Label>
        <Input type="number" value={porceps} onChange={(e) => setPorceps(e.target.value)} />
      </div>
      <NicheClientePicker value={residente?.id ?? null} onChange={setResidente} label="Residente / inquilino" required />
      <Button
        className="w-full"
        disabled={!numero.trim() || !residente}
        onClick={() => {
          onSave(numero, Number(porceps) || 0, residente)
          setNumero("")
          setPorceps("10")
          setResidente(null)
        }}
      >
        Agregar unidad
      </Button>
    </div>
  )
}