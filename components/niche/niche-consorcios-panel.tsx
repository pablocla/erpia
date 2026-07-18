"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import {
  AlertTriangle,
  Building2,
  FileDown,
  Globe,
  MessageCircle,
  Banknote,
  Link2,
  Plus,
  RefreshCw,
} from "lucide-react"
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
import { authFetch, getAuthHeaders } from "@/lib/stores/auth-store"
import type { NicheAppDefinition } from "@/lib/niche/types"
import { NicheClientePicker, type ClienteOption } from "@/components/niche/niche-cliente-picker"
import { AppExperienceHeader } from "@/components/app-experience/app-experience-header"
import { getNicheExperience } from "@/lib/comercial/app-experience"
import { useToast } from "@/components/ui/use-toast"
import {
  PropiedadOnboardingChecklist,
  completarPasoOnboardingPropiedad,
} from "@/components/comercial/propiedad-onboarding-checklist"

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

type Moroso = {
  expensaId: number
  periodo: string
  monto: number
  diasMora: number
  unidadNumero: string
  residenteNombre: string | null
  residenteTelefono: string | null
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
  const [morosos, setMorosos] = useState<Moroso[]>([])
  const [emitirFacturaLiq, setEmitirFacturaLiq] = useState(false)
  const [cobrandoId, setCobrandoId] = useState<number | null>(null)

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
    void completarPasoOnboardingPropiedad("abrir_consorcios")
  }, [cargar])

  const cargarMorosos = useCallback(async (consorcioId?: number) => {
    const q = consorcioId ? `?consorcioId=${consorcioId}` : ""
    const res = await fetch(`/api/consorcios/morosos${q}`, { headers: getAuthHeaders() })
    if (res.ok) setMorosos(await res.json())
    else setMorosos([])
  }, [])

  useEffect(() => {
    if (selected) {
      void cargarUnidades(selected)
      void cargarMorosos(selected)
    } else {
      setUnidades([])
      setMorosos([])
    }
  }, [selected, cargarUnidades, cargarMorosos])

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
    const resumenMsg = `¿Liquidar período ${periodo}?\nUnidades: ${unidades.length}\nSe generarán deudas (CxC) por UF con residente.`
    if (!confirm(resumenMsg)) return
    const res = await fetch(`/api/consorcios/${selected}`, {
      method: "POST",
      headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "liquidar",
        periodo,
        emitirFactura: emitirFacturaLiq,
      }),
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
    void completarPasoOnboardingPropiedad("liquidar_pdf")
    void cargar()
    if (selected) void cargarMorosos(selected)
  }

  async function avisarMoroso(expensaId: number) {
    const res = await fetch("/api/consorcios/morosos", {
      method: "POST",
      headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
      body: JSON.stringify({ expensaId, action: "avisar" }),
    })
    const data = res.ok ? null : await res.json().catch(() => ({}))
    if (!res.ok) {
      toast({
        variant: "destructive",
        title: "No se pudo avisar",
        description: data?.error ?? "Revisá teléfono y WhatsApp.",
      })
      return
    }
    toast({ title: "Aviso encolado", description: "WhatsApp al inquilino moroso." })
    void completarPasoOnboardingPropiedad("primer_wa")
  }

  async function cobrarMoroso(expensaId: number) {
    setCobrandoId(expensaId)
    try {
      const res = await fetch("/api/consorcios/morosos", {
        method: "POST",
        headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify({ expensaId, action: "cobrar", medioPago: "transferencia" }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast({
          variant: "destructive",
          title: "Cobro fallido",
          description: data?.error ?? "No se pudo registrar el cobro",
        })
        return
      }
      toast({
        title: "Expensa cobrada",
        description: data.reciboNumero
          ? `Recibo ${data.reciboNumero}`
          : "Recibo emitido y deuda actualizada",
      })
      if (selected) void cargarMorosos(selected)
      else void cargarMorosos()
    } finally {
      setCobrandoId(null)
    }
  }

  async function linkPagoMoroso(expensaId: number) {
    const res = await fetch("/api/consorcios/morosos", {
      method: "POST",
      headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
      body: JSON.stringify({ expensaId, action: "link_pago" }),
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok || !data.linkPago) {
      toast({
        variant: "destructive",
        title: "Sin link de pago",
        description: data?.error ?? "Configurá Mercado Pago o ClavPay en la empresa",
      })
      return
    }
    try {
      await navigator.clipboard.writeText(data.linkPago as string)
      toast({ title: "Link copiado", description: "Listo para enviar por WhatsApp o mail" })
    } catch {
      toast({ title: "Link generado", description: String(data.linkPago).slice(0, 80) + "…" })
    }
    window.open(data.linkPago as string, "_blank")
  }

  async function descargarPdf() {
    if (!selected) return
    try {
      const res = await authFetch(
        `/api/consorcios/${selected}/liquidacion/pdf?periodo=${encodeURIComponent(periodo)}`,
      )
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        toast({
          variant: "destructive",
          title: "PDF no disponible",
          description: err.error ?? "¿Hay gastos cargados para el período?",
        })
        return
      }
      const html = await res.text()
      const blob = new Blob([html], { type: "text/html;charset=utf-8" })
      const url = URL.createObjectURL(blob)
      const w = window.open(url, "_blank")
      if (!w) {
        toast({ variant: "destructive", title: "Permití ventanas emergentes para el PDF" })
      }
      setTimeout(() => URL.revokeObjectURL(url), 60_000)
      void completarPasoOnboardingPropiedad("liquidar_pdf")
    } catch {
      toast({ variant: "destructive", title: "Error al generar PDF" })
    }
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
  const guide = getNicheExperience(app.appId)

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-5xl mx-auto">
      {guide && <AppExperienceHeader guide={guide} />}
      <PropiedadOnboardingChecklist />

      {consorcios.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="pt-6 text-center space-y-3">
            <Building2 className="h-10 w-10 mx-auto text-muted-foreground" />
            <p className="font-medium">Empezá con tu primer edificio</p>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              Creá el consorcio, cargá unidades con % de expensas y después los gastos del mes.
            </p>
          </CardContent>
        </Card>
      )}

      {ultimaLiquidacion && (
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="pt-4 text-sm">
            Última liquidación: <strong>{ultimaLiquidacion.periodo}</strong> —{" "}
            {ultimaLiquidacion.unidades} unidades · {fmt(ultimaLiquidacion.total)}
          </CardContent>
        </Card>
      )}

      <div className="flex gap-2 flex-wrap items-center">
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
        <Button variant="outline" size="sm" asChild>
          <Link href="/dashboard/nicho/portales">
            <Globe className="h-4 w-4 mr-1" />
            Portales
          </Link>
        </Button>
        <Button variant="outline" size="sm" asChild>
          <Link href="/dashboard/nicho/inmobiliaria">Cartera inmo</Link>
        </Button>
        <Button variant="outline" size="sm" asChild>
          <Link href="/dashboard/nicho/garantia">Contratos legacy</Link>
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

      {morosos.length > 0 && (
        <Card className="border-amber-200 bg-amber-50/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2 text-amber-900">
              <AlertTriangle className="h-4 w-4" />
              Morosos expensas ({morosos.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {morosos.map((m) => (
              <div
                key={m.expensaId}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-amber-100 bg-white px-3 py-2 text-sm"
              >
                <div>
                  <strong>{m.unidadNumero}</strong> — {m.residenteNombre ?? "Sin residente"}
                  <p className="text-xs text-muted-foreground">
                    {m.periodo} · {fmt(m.monto)}
                    {m.diasMora > 0 ? ` · ${m.diasMora}d mora` : ""}
                  </p>
                </div>
                <div className="flex gap-1 flex-wrap">
                  <Button
                    size="sm"
                    variant="default"
                    disabled={cobrandoId === m.expensaId}
                    onClick={() => void cobrarMoroso(m.expensaId)}
                  >
                    <Banknote className="h-4 w-4 mr-1" />
                    {cobrandoId === m.expensaId ? "…" : "Cobrar"}
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => void avisarMoroso(m.expensaId)}>
                    <MessageCircle className="h-4 w-4 mr-1" />
                    WA
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => void linkPagoMoroso(m.expensaId)}>
                    <Link2 className="h-4 w-4 mr-1" />
                    Link MP
                  </Button>
                  <Button size="sm" variant="ghost" asChild>
                    <Link href="/dashboard/cuentas-cobrar">CxC</Link>
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

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
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={emitirFacturaLiq}
                  onChange={(e) => setEmitirFacturaLiq(e.target.checked)}
                  className="rounded border"
                />
                Preparar facturas AFIP (B) al liquidar — si no, solo deuda interna + CxC
              </label>
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
                <Button variant="outline" onClick={() => void descargarPdf()}>
                  <FileDown className="h-4 w-4 mr-1" />
                  Descargar PDF
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