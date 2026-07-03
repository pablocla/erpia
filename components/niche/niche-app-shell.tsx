"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { ArrowRight, MessageCircle, Plus, RefreshCw } from "lucide-react"
import { Badge } from "@/components/ui/badge"
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
import { NicheConsorciosPanel } from "@/components/niche/niche-consorcios-panel"
import { NicheClientePicker, type ClienteOption } from "./niche-cliente-picker"
import { AppExperienceHeader } from "@/components/app-experience/app-experience-header"
import { getNicheExperience } from "@/lib/comercial/app-experience"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

const fmt = (n: number) =>
  n.toLocaleString("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 })

type Movimiento = {
  id: number
  titulo: string
  categoria: string
  monto: string | number
  estado: string
  periodo: string | null
  cliente?: { id: number; nombre: string; telefono: string | null } | null
}

type Resumen = {
  total: number
  pendientes: number
  pagados: number
  montoPendiente: number
  montoTotal: number
}

export function NicheAppShell({ app }: { app: NicheAppDefinition }) {
  if (app.engine === "consorcio") {
    return <NicheConsorciosPanel app={app} />
  }

  if (app.redirectPath) {
    const guide = getNicheExperience(app.appId)
    return (
      <div className="p-4 md:p-6 space-y-4 max-w-5xl mx-auto">
        {guide && <AppExperienceHeader guide={guide} compact />}
        <Button asChild size="lg" className="w-full sm:w-auto">
          <Link href={app.redirectPath}>
            Ir a {app.nombre}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </div>
    )
  }

  if (app.engine === "cuotas") {
    return <NicheCuotasPanel app={app} />
  }

  return <NicheMovimientosPanel app={app} />
}

type MembresiaRow = {
  id: number
  estado: string
  cliente: { id: number; nombre: string; telefono: string | null }
  plan: { nombre: string; precio: number }
}

function NicheCuotasPanel({ app }: { app: NicheAppDefinition }) {
  const [membresias, setMembresias] = useState<MembresiaRow[]>([])
  const [movimientos, setMovimientos] = useState<Movimiento[]>([])
  const [resumen, setResumen] = useState<Resumen | null>(null)
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const [monto, setMonto] = useState("")
  const [cliente, setCliente] = useState<ClienteOption | null>(null)

  const cargar = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/niche/${app.appId}`, { headers: getAuthHeaders() })
      if (res.ok) {
        const data = await res.json()
        setMembresias(data.membresias ?? [])
        setMovimientos(data.movimientos ?? [])
        setResumen(data.resumen ?? null)
      }
    } finally {
      setLoading(false)
    }
  }, [app.appId])

  useEffect(() => {
    void cargar()
  }, [cargar])

  async function registrarCuota() {
    if (!cliente) {
      toast.error("Seleccioná un socio")
      return
    }
    const res = await fetch(`/api/niche/${app.appId}`, {
      method: "POST",
      headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "cuota",
        clienteId: cliente.id,
        monto: Number(monto) || app.precioArs,
        periodo: new Date().toISOString().slice(0, 7),
      }),
    })
    if (res.ok) {
      toast.success("Cuota registrada")
      setOpen(false)
      setMonto("")
      setCliente(null)
      void cargar()
    } else {
      toast.error("Error al guardar")
    }
  }

  const guide = getNicheExperience(app.appId)
  const morosos = movimientos.filter((m) => m.estado === "pendiente")
  const vacio = membresias.length === 0 && movimientos.length === 0

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-5xl mx-auto">
      {guide && (
        <AppExperienceHeader guide={guide} onPrimaryClick={() => setOpen(true)} />
      )}

      {resumen && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card>
            <CardContent className="pt-4">
              <p className="text-xs text-muted-foreground">Socios</p>
              <p className="text-2xl font-semibold">{membresias.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <p className="text-xs text-muted-foreground">Cuotas pendientes</p>
              <p className="text-2xl font-semibold text-amber-600">{resumen.pendientes}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <p className="text-xs text-muted-foreground">Cobrado</p>
              <p className="text-2xl font-semibold text-emerald-600">{resumen.pagados}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <p className="text-xs text-muted-foreground">Pendiente $</p>
              <p className="text-lg font-semibold">{fmt(resumen.montoPendiente)}</p>
            </CardContent>
          </Card>
        </div>
      )}

      {vacio ? (
        <Card className="border-dashed border-primary/30">
          <CardContent className="py-10 text-center space-y-4">
            <p className="text-sm text-muted-foreground max-w-md mx-auto">{app.wowMoment}</p>
            <Button size="lg" onClick={() => setOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              {app.accionPrincipal}
            </Button>
            {app.appId === "gimnasio" && (
              <p className="text-xs text-muted-foreground">
                Tip: la demo <strong>/demo/gimnasio</strong> también abre Membresías con socios de ejemplo.
              </p>
            )}
          </CardContent>
        </Card>
      ) : (
        <>
          {membresias.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Socios</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {membresias.slice(0, 8).map((m) => (
                  <div
                    key={m.id}
                    className="flex items-center justify-between gap-2 border rounded-lg px-3 py-2 text-sm"
                  >
                    <div>
                      <p className="font-medium">{m.cliente.nombre}</p>
                      <p className="text-xs text-muted-foreground">{m.plan.nombre}</p>
                    </div>
                    <Badge variant={m.estado === "activa" ? "default" : "secondary"}>{m.estado}</Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-base">Cuotas recientes</CardTitle>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => void cargar()} disabled={loading}>
                  <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
                </Button>
                <Button size="sm" onClick={() => setOpen(true)}>
                  <Plus className="h-4 w-4 mr-1" />
                  {app.accionPrincipal}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {morosos.length === 0 && movimientos.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">Sin cuotas — registrá la primera</p>
              ) : (
                movimientos.map((m) => (
                  <div
                    key={m.id}
                    className="flex flex-wrap items-center justify-between gap-2 border rounded-lg px-3 py-2"
                  >
                    <div>
                      <p className="font-medium text-sm">{m.titulo}</p>
                      <p className="text-xs text-muted-foreground">
                        {m.cliente?.nombre ?? "—"} · {m.periodo ?? ""}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{fmt(Number(m.monto))}</span>
                      <Badge variant={m.estado === "pendiente" ? "secondary" : "default"}>{m.estado}</Badge>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{app.accionPrincipal}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <NicheClientePicker value={cliente?.id ?? null} onChange={setCliente} required />
            <div>
              <Label>Monto (ARS)</Label>
              <Input
                type="number"
                value={monto}
                onChange={(e) => setMonto(e.target.value)}
                placeholder={String(app.precioArs)}
              />
            </div>
            <Button className="w-full" onClick={() => void registrarCuota()}>
              Guardar cuota
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function NicheMovimientosPanel({ app }: { app: NicheAppDefinition }) {
  const [movimientos, setMovimientos] = useState<Movimiento[]>([])
  const [resumen, setResumen] = useState<Resumen | null>(null)
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const [titulo, setTitulo] = useState("")
  const [monto, setMonto] = useState("")
  const [cliente, setCliente] = useState<ClienteOption | null>(null)
  const [waMsg, setWaMsg] = useState(app.plantillaWhatsApp ?? "")
  const necesitaCliente = app.engine === "cuotas" || app.categorias.includes("ticket")

  const cargar = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/niche/${app.appId}`, { headers: getAuthHeaders() })
      if (res.ok) {
        const data = await res.json()
        setMovimientos(data.movimientos ?? data.movimientos ?? [])
        setResumen(data.resumen ?? null)
      }
    } finally {
      setLoading(false)
    }
  }, [app.appId])

  useEffect(() => {
    void cargar()
  }, [cargar])

  async function crearRegistro() {
    if (app.engine === "cuotas" && !cliente) {
      toast.error("Seleccioná un cliente")
      return
    }

    const body: Record<string, unknown> = {
      titulo: titulo || app.accionPrincipal,
      monto: Number(monto) || 0,
      categoria: app.categorias[0],
    }
    if (app.engine === "cuotas") {
      body.action = "cuota"
      body.periodo = new Date().toISOString().slice(0, 7)
      body.clienteId = cliente?.id
    } else if (cliente) {
      body.clienteId = cliente.id
    }
    const res = await fetch(`/api/niche/${app.appId}`, {
      method: "POST",
      headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
    
    if (res.ok) {
      toast.success("Registro creado")
      setOpen(false)
      setTitulo("")
      setMonto("")
      setCliente(null)
      void cargar()
    } else {
      toast.error("Error al guardar")
    }
  }

  async function marcarListo(id: number) {
    const res = await fetch(`/api/niche/${app.appId}`, {
      method: "POST",
      headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
      body: JSON.stringify({ action: "marcar_estado", id, estado: "listo" }),
    })
    if (res.ok) {
      const data = await res.json()
      if (data.whatsappEncolado) {
        toast.success("Listo — WhatsApp encolado al cliente")
      } else if (app.appId === "plancha") {
        toast.success("Marcado como listo", {
          description: "Activá com.whatsapp o agregá teléfono al cliente para avisar.",
        })
      } else {
        toast.success("Marcado como listo")
      }
      void cargar()
    }
  }

  async function marcarPagado(id: number) {
    const res = await fetch(`/api/niche/${app.appId}`, {
      method: "POST",
      headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
      body: JSON.stringify({ action: "marcar_estado", id, estado: "pagado" }),
    })
    if (res.ok) {
      toast.success("Marcado como cobrado")
      void cargar()
    }
  }

  async function whatsappMasivo() {
    const res = await fetch(`/api/niche/${app.appId}`, {
      method: "POST",
      headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "whatsapp_masivo",
        mensaje: waMsg,
        soloPendientes: true,
      }),
    })
    if (res.ok) {
      toast.success("Mensajes enviados a la cola")
    } else {
      toast.error("Error al enviar WhatsApp masivo")
    }
  }

  const guide = getNicheExperience(app.appId)

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-5xl mx-auto">
      {guide && (
        <AppExperienceHeader
          guide={guide}
          onPrimaryClick={() => setOpen(true)}
        />
      )}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex gap-2 ml-auto w-full sm:w-auto justify-end">
          <Button variant="outline" size="sm" onClick={() => void cargar()} disabled={loading}>
            <RefreshCw className="h-4 w-4 mr-1" />
            Actualizar
          </Button>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-1" />
                {app.accionPrincipal}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{app.accionPrincipal}</DialogTitle>
              </DialogHeader>
              <div className="space-y-3">
                <div>
                  <Label>Concepto</Label>
                  <Input value={titulo} onChange={(e) => setTitulo(e.target.value)} />
                </div>
                <div>
                  <Label>Monto (ARS)</Label>
                  <Input type="number" value={monto} onChange={(e) => setMonto(e.target.value)} />
                </div>
                {(necesitaCliente || app.engine === "movimientos") && (
                  <NicheClientePicker
                    value={cliente?.id ?? null}
                    onChange={setCliente}
                    required={necesitaCliente}
                  />
                )}
                <Button className="w-full" onClick={() => void crearRegistro()}>
                  Guardar
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {resumen && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card>
            <CardHeader className="pb-1">
              <CardTitle className="text-xs text-muted-foreground">Registros</CardTitle>
            </CardHeader>
            <CardContent className="text-xl font-semibold">{resumen.total}</CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-1">
              <CardTitle className="text-xs text-muted-foreground">Pendientes</CardTitle>
            </CardHeader>
            <CardContent className="text-xl font-semibold text-amber-600">{resumen.pendientes}</CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-1">
              <CardTitle className="text-xs text-muted-foreground">Cobrado / OK</CardTitle>
            </CardHeader>
            <CardContent className="text-xl font-semibold text-emerald-600">{resumen.pagados}</CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-1">
              <CardTitle className="text-xs text-muted-foreground">Pendiente $</CardTitle>
            </CardHeader>
            <CardContent className="text-lg font-semibold">{fmt(resumen.montoPendiente)}</CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Actividad reciente</CardTitle>
          <Button variant="secondary" size="sm" onClick={() => void whatsappMasivo()}>
            <MessageCircle className="h-4 w-4 mr-1" />
            WhatsApp masivo
          </Button>
        </CardHeader>
        <CardContent className="space-y-2">
          <Input
            className="text-sm"
            value={waMsg}
            onChange={(e) => setWaMsg(e.target.value)}
            placeholder="Mensaje para pendientes..."
          />
          {movimientos.length === 0 && (
            <div className="py-8 text-center space-y-3">
              <p className="text-sm text-muted-foreground">
                Sin registros todavía — {app.wowMoment}
              </p>
              <Button size="sm" onClick={() => setOpen(true)}>
                <Plus className="h-4 w-4 mr-1" />
                {app.accionPrincipal}
              </Button>
            </div>
          )}
          {movimientos.map((m) => (
            <div
              key={m.id}
              className="flex flex-wrap items-center justify-between gap-2 border rounded-lg px-3 py-2"
            >
              <div>
                <p className="font-medium text-sm">{m.titulo}</p>
                <p className="text-xs text-muted-foreground">
                  {m.cliente?.nombre ?? "—"} · {m.categoria}
                  {m.periodo ? ` · ${m.periodo}` : ""}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">{fmt(Number(m.monto))}</span>
                <Badge variant={m.estado === "pendiente" ? "secondary" : "default"}>{m.estado}</Badge>
                {m.estado === "pendiente" && app.appId === "plancha" && (
                  <Button size="sm" variant="outline" onClick={() => void marcarListo(m.id)}>
                    Listo
                  </Button>
                )}
                {m.estado === "pendiente" && app.appId !== "plancha" && (
                  <Button size="sm" variant="outline" onClick={() => void marcarPagado(m.id)}>
                    Cobrado
                  </Button>
                )}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}