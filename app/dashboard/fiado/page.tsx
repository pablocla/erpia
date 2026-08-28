"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { ArrowUpRight, Banknote, BookPlus, Plus, RefreshCw, Settings, Users, Wallet, MessageSquare } from "lucide-react"
import { getWhatsAppShareUrl } from "@/lib/utils/formatters-ar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { getAuthHeaders } from "@/lib/stores/auth-store"
import { AppExperienceHeader } from "@/components/app-experience/app-experience-header"
import { getFiadoExperience } from "@/lib/comercial/app-experience"
import { InflacionFiadoPanel } from "@/components/fiado/inflacion-fiado-panel"
import { useToast } from "@/hooks/use-toast"
import { useProductEntitlements } from "@/hooks/use-product-entitlements"
import { PaywallModal } from "@/components/billing/paywall-modal"

type Deudor = {
  id: number
  nombre: string
  telefono: string | null
  deuda: number
  limiteCredito: number
  disponible: number
  emailNotificacionFiado: string | null
}

type Resumen = {
  totalDeudores: number
  saldoFiadoTotal: number
  fiadosHoy: number
  notificacionesHoy: number
}

type ConfigFiado = {
  emailDuenoAlmacen: string | null
  fiadoRequiereLimite: boolean
  fiadoNotificarWhatsApp: boolean
  email: string | null
  nombre: string
}

const fmt = (n: number) =>
  n.toLocaleString("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 })

export default function LibretaFiadoPage() {
  const { toast } = useToast()
  const [deudores, setDeudores] = useState<Deudor[]>([])
  const [resumen, setResumen] = useState<Resumen | null>(null)
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const [nombre, setNombre] = useState("")
  const [telefono, setTelefono] = useState("")
  const [limite, setLimite] = useState("30000")
  const [emailNotif, setEmailNotif] = useState("")
  const [config, setConfig] = useState<ConfigFiado | null>(null)
  const [configOpen, setConfigOpen] = useState(false)
  const [savingConfig, setSavingConfig] = useState(false)
  const [demoIndustryId, setDemoIndustryId] = useState<string | null>(null)
  
  const { tieneSku } = useProductEntitlements()
  const [showPaywall, setShowPaywall] = useState(false)
  const [opCliente, setOpCliente] = useState<Deudor | null>(null)
  const [opMode, setOpMode] = useState<"anotar" | "cobrar" | null>(null)
  const [opMonto, setOpMonto] = useState("")
  const [opConcepto, setOpConcepto] = useState("")
  const [opSaving, setOpSaving] = useState(false)
  const [opMedioPago, setOpMedioPago] = useState("efectivo")
  const [clientesFiado, setClientesFiado] = useState<Deudor[]>([])
  const [pickClienteId, setPickClienteId] = useState<string>("")
  const [qDeudor, setQDeudor] = useState("")

  const cargar = async () => {
    setLoading(true)
    try {
      const [dRes, rRes, cRes, eRes] = await Promise.all([
        fetch("/api/fiado/deudores", { headers: getAuthHeaders() }),
        fetch("/api/fiado/resumen", { headers: getAuthHeaders() }),
        fetch("/api/fiado/config", { headers: getAuthHeaders() }),
        fetch("/api/config/empresa", { headers: getAuthHeaders() }),
      ])
      if (dRes.ok) {
        const d = await dRes.json()
        setDeudores(d.data ?? [])
      }
      if (rRes.ok) setResumen(await rRes.json())
      if (cRes.ok) setConfig(await cRes.json())
      if (eRes.ok) {
        const empresa = await eRes.json()
        setDemoIndustryId(empresa.demoIndustryId ?? null)
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void cargar()
  }, [])

  async function crearCliente(e: React.FormEvent) {
    e.preventDefault()
    const res = await fetch("/api/fiado/clientes-rapido", {
      method: "POST",
      headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
      body: JSON.stringify({
        nombre,
        telefono: telefono || undefined,
        limiteCredito: Number(limite),
        emailNotificacionFiado: emailNotif || undefined,
      }),
    })
    if (res.ok) {
      setOpen(false)
      setNombre("")
      setTelefono("")
      setEmailNotif("")
      await cargar()
    }
  }

  async function guardarConfig(e: React.FormEvent) {
    e.preventDefault()
    if (!config) return
    setSavingConfig(true)
    try {
      const res = await fetch("/api/fiado/config", {
        method: "PATCH",
        headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify({
          emailDuenoAlmacen: config.emailDuenoAlmacen ?? "",
          fiadoRequiereLimite: config.fiadoRequiereLimite,
          fiadoNotificarWhatsApp: config.fiadoNotificarWhatsApp,
        }),
      })
      if (res.ok) {
        setConfig(await res.json())
        setConfigOpen(false)
      }
    } finally {
      setSavingConfig(false)
    }
  }

  function abrirOp(d: Deudor, mode: "anotar" | "cobrar") {
    setOpCliente(d)
    setPickClienteId(String(d.id))
    setOpMode(mode)
    setOpMonto(mode === "cobrar" && d.deuda > 0 ? String(Math.round(d.deuda)) : "")
    setOpConcepto(mode === "anotar" ? "Fiado mostrador" : "")
  }

  async function abrirAnotarLibre() {
    const res = await fetch("/api/fiado/deudores?todos=1", { headers: getAuthHeaders() })
    if (res.ok) {
      const d = await res.json()
      setClientesFiado(d.data ?? [])
    }
    setOpCliente(null)
    setPickClienteId("")
    setOpMode("anotar")
    setOpMonto("")
    setOpConcepto("Fiado mostrador")
  }

  async function confirmarOp(e: React.FormEvent) {
    e.preventDefault()
    if (!opMode) return
    const clienteId = opCliente?.id ?? Number(pickClienteId)
    if (!clienteId) {
      toast({ title: "Elegí un cliente", variant: "destructive" })
      return
    }
    const monto = Number(opMonto)
    if (!Number.isFinite(monto) || monto <= 0) {
      toast({ title: "Monto inválido", variant: "destructive" })
      return
    }
    setOpSaving(true)
    try {
      const path = opMode === "anotar" ? "/api/fiado/anotar" : "/api/fiado/cobrar"
      const res = await fetch(path, {
        method: "POST",
        headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify({
          clienteId,
          monto,
          concepto: opConcepto || undefined,
          medioPago: opMedioPago,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error(data.error ?? "No se pudo completar la operación")
      }
      toast({
        title: opMode === "anotar" ? "Fiado anotado" : "Cobro registrado",
        description:
          opMode === "anotar"
            ? `Deuda actual: ${fmt(data.deuda ?? 0)}`
            : `Recibo ${data.reciboNumero ?? ""} · Deuda restante ${fmt(data.deudaRestante ?? 0)}`,
      })
      setOpCliente(null)
      setOpMode(null)
      await cargar()
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Error",
        variant: "destructive",
      })
    } finally {
      setOpSaving(false)
    }
  }

  const experience = getFiadoExperience(demoIndustryId)
  const saldoTotal = resumen?.saldoFiadoTotal ?? 0
  const showUpsellCobra = saldoTotal >= 15000 || (resumen?.totalDeudores ?? 0) >= 3

  return (
    <div className="space-y-6 max-w-6xl mx-auto p-4 md:p-6">
      <AppExperienceHeader
        guide={experience}
        onPrimaryClick={() => setOpen(true)}
      />

      <InflacionFiadoPanel saldoTotal={resumen?.saldoFiadoTotal} />

      <div className="flex flex-wrap justify-end gap-2">
          <Dialog open={configOpen} onOpenChange={setConfigOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" id="config-fiado">
                <Settings className="h-4 w-4 mr-2" />
                Configuración
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Configuración {experience.title}</DialogTitle>
              </DialogHeader>
              {config && (
                <form onSubmit={guardarConfig} className="space-y-4">
                  <div>
                    <Label>Email del dueño del almacén</Label>
                    <Input
                      type="email"
                      value={config.emailDuenoAlmacen ?? ""}
                      onChange={(e) =>
                        setConfig({ ...config, emailDuenoAlmacen: e.target.value || null })
                      }
                      placeholder={config.email ?? "dueño@almacen.com"}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Recibe copia de cada compra a fiado.
                    </p>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <Label>Exigir límite de crédito</Label>
                      <p className="text-xs text-muted-foreground">
                        Sin límite no se puede fiar desde el POS.
                      </p>
                    </div>
                    <Switch
                      checked={config.fiadoRequiereLimite !== false}
                      onCheckedChange={(v) => setConfig({ ...config, fiadoRequiereLimite: v })}
                    />
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <Label>WhatsApp al cliente</Label>
                      <p className="text-xs text-muted-foreground">
                        Requiere WhatsApp ON activo en App Store.
                      </p>
                    </div>
                    <div onClick={(e) => {
                      if (!tieneSku("channel.whatsapp")) {
                        e.preventDefault()
                        setShowPaywall(true)
                      }
                    }}>
                      <Switch
                        checked={config.fiadoNotificarWhatsApp !== false}
                        onCheckedChange={(v) => {
                          if (!tieneSku("channel.whatsapp")) {
                            setShowPaywall(true)
                            return
                          }
                          setConfig({ ...config, fiadoNotificarWhatsApp: v })
                        }}
                      />
                    </div>
                  </div>
                  <Button type="submit" className="w-full" disabled={savingConfig}>
                    {savingConfig ? "Guardando…" : "Guardar"}
                  </Button>
                </form>
              )}
            </DialogContent>
          </Dialog>
          <PaywallModal
            open={showPaywall}
            onOpenChange={setShowPaywall}
            disparoKey="whatsapp_outbound"
            requiredSku="channel.whatsapp"
          />
          <Button variant="outline" onClick={() => void cargar()} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Actualizar
          </Button>
          <Button variant="secondary" onClick={() => void abrirAnotarLibre()}>
            <BookPlus className="h-4 w-4 mr-2" />
            {demoIndustryId === "prestamista" ? "Anotar préstamo" : "Anotar fiado"}
          </Button>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button id="alta-fiado">
                <Plus className="h-4 w-4 mr-2" />
                {demoIndustryId === "prestamista" ? "Nuevo Cliente" : "Cliente fiado"}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Alta rápida — cliente fiado</DialogTitle>
              </DialogHeader>
              <form onSubmit={crearCliente} className="space-y-4">
                <div>
                  <Label>Nombre</Label>
                  <Input value={nombre} onChange={(e) => setNombre(e.target.value)} required />
                </div>
                <div>
                  <Label>Teléfono (WhatsApp)</Label>
                  <Input value={telefono} onChange={(e) => setTelefono(e.target.value)} />
                </div>
                <div>
                  <Label>Límite de crédito ($)</Label>
                  <Input type="number" min={0} value={limite} onChange={(e) => setLimite(e.target.value)} required />
                </div>
                <div>
                  <Label>Email notificación (fiador / dueño)</Label>
                  <Input type="email" value={emailNotif} onChange={(e) => setEmailNotif(e.target.value)} placeholder="quien@recibe.com" />
                </div>
                <Button type="submit" className="w-full">
                  Crear
                </Button>
              </form>
            </DialogContent>
          </Dialog>
      </div>

      {showUpsellCobra && (
        <Card className="border-emerald-200 bg-emerald-50/50 dark:border-emerald-900 dark:bg-emerald-950/20">
          <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-emerald-900 dark:text-emerald-100">
                Tenés {fmt(saldoTotal)} en fiado — cobrá sin llamar uno por uno
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Claver Cobrá manda recordatorios por WhatsApp. La libreta sigue gratis.
              </p>
            </div>
            <Button size="sm" className="bg-emerald-600 hover:bg-emerald-500 shrink-0" asChild>
              <Link href="/dashboard/apps?sku=intang.cobranzas_wa">
                Activar Cobrá
                <ArrowUpRight className="ml-1.5 h-3.5 w-3.5" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {resumen && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">Deudores</CardTitle>
            </CardHeader>
            <CardContent className="text-2xl font-bold flex items-center gap-2">
              <Users className="h-5 w-5 text-muted-foreground" />
              {resumen.totalDeudores}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">Saldo fiado</CardTitle>
            </CardHeader>
            <CardContent className="text-2xl font-bold text-red-600">{fmt(resumen.saldoFiadoTotal)}</CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">Fiados hoy</CardTitle>
            </CardHeader>
            <CardContent className="text-2xl font-bold">{resumen.fiadosHoy}</CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">Emails hoy</CardTitle>
            </CardHeader>
            <CardContent className="text-2xl font-bold">{resumen.notificacionesHoy}</CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardHeader className="space-y-3">
          <CardTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            Deudores activos
          </CardTitle>
          {deudores.length > 0 && (
            <Input
              className="min-h-11 text-base"
              placeholder="Buscar deudor por nombre o teléfono…"
              value={qDeudor}
              onChange={(e) => setQDeudor(e.target.value)}
            />
          )}
        </CardHeader>
        <CardContent>
          {deudores.length === 0 ? (
            <div className="text-center py-12 space-y-4 max-w-sm mx-auto">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                <BookPlus className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-semibold text-base">Libreta de fiados vacía</h3>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  Anotá tu primer fiado en segundos. Si el cliente no existe, se guarda automáticamente.
                </p>
              </div>
              <Button
                size="lg"
                onClick={() => void abrirAnotarLibre()}
                className="w-full bg-emerald-600 hover:bg-emerald-500 font-semibold text-white shadow-sm"
              >
                <Plus className="h-4 w-4 mr-2" />
                Anotar fiado
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="py-2 pr-4">Cliente</th>
                    <th className="py-2 pr-4">Teléfono</th>
                    <th className="py-2 pr-4 text-right">Deuda</th>
                    <th className="py-2 pr-4 text-right">Límite</th>
                    <th className="py-2 pr-4 text-right">Disponible</th>
                    <th className="py-2 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {deudores
                    .filter((d) => {
                      const q = qDeudor.trim().toLowerCase()
                      if (!q) return true
                      return (
                        d.nombre.toLowerCase().includes(q) ||
                        (d.telefono ?? "").toLowerCase().includes(q)
                      )
                    })
                    .map((d) => {
                    const ratio =
                      d.limiteCredito > 0 ? d.deuda / d.limiteCredito : d.deuda > 0 ? 1 : 0
                    const semaforo =
                      d.deuda <= 0
                        ? "bg-emerald-500"
                        : ratio >= 0.85
                          ? "bg-red-500"
                          : ratio >= 0.5
                            ? "bg-amber-500"
                            : "bg-emerald-500"
                    return (
                    <tr key={d.id} className="border-b last:border-0">
                      <td className="py-3 pr-4 font-medium">
                        <span className="inline-flex items-center gap-2">
                          <span className={`h-2.5 w-2.5 rounded-full shrink-0 ${semaforo}`} title="Semáforo deuda" />
                          {d.nombre}
                        </span>
                      </td>
                      <td className="py-3 pr-4">{d.telefono ?? "—"}</td>
                      <td className="py-3 pr-4 text-right text-red-600 font-medium">{fmt(d.deuda)}</td>
                      <td className="py-3 pr-4 text-right">{fmt(d.limiteCredito)}</td>
                      <td className="py-3 pr-4 text-right">
                        <Badge variant="outline">{fmt(d.disponible === Infinity ? 0 : d.disponible)}</Badge>
                      </td>
                      <td className="py-3 text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            className="min-h-10 px-3"
                            onClick={() => abrirOp(d, "anotar")}
                            title="Anotar fiado"
                          >
                            <BookPlus className="h-4 w-4 mr-1" />
                            <span className="hidden sm:inline">Anotar</span>
                          </Button>
                          <Button
                            size="sm"
                            className="min-h-10 px-3"
                            disabled={d.deuda <= 0}
                            onClick={() => abrirOp(d, "cobrar")}
                            title="Registrar cobro"
                          >
                            <Banknote className="h-4 w-4 mr-1" />
                            <span className="hidden sm:inline">Cobrar</span>
                          </Button>
                          {d.deuda > 0 && (
                            <a
                              href={getWhatsAppShareUrl(
                                d.telefono || "",
                                `Hola ${d.nombre}, te recordamos que tenés un saldo pendiente de fiado de ${fmt(d.deuda)}. Podés pasar a regularizarlo cuando quieras. ¡Muchas gracias!`
                              )}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center justify-center min-h-10 px-2.5 rounded-md text-xs font-medium border border-emerald-500/30 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/20"
                              title="Enviar recordatorio por WhatsApp"
                            >
                              <MessageSquare className="h-4 w-4" />
                            </a>
                          )}
                        </div>
                      </td>
                    </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog
        open={!!opMode}
        onOpenChange={(v) => {
          if (!v) {
            setOpMode(null)
            setOpCliente(null)
            setPickClienteId("")
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {opMode === "anotar" ? "Anotar fiado" : "Registrar cobro"}
              {opCliente ? ` — ${opCliente.nombre}` : ""}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={confirmarOp} className="space-y-4">
            {!opCliente && opMode === "anotar" && (
              <div>
                <Label>Cliente fiado</Label>
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={pickClienteId}
                  onChange={(e) => setPickClienteId(e.target.value)}
                  required
                >
                  <option value="">Elegí un cliente…</option>
                  {clientesFiado.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nombre}
                      {c.deuda > 0 ? ` (debe ${fmt(c.deuda)})` : ""}
                    </option>
                  ))}
                </select>
                {clientesFiado.length === 0 && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Primero creá un cliente con el botón &quot;Cliente fiado&quot;.
                  </p>
                )}
              </div>
            )}
            {opMode === "anotar" && (
              <div>
                <Label>Concepto</Label>
                <Input
                  value={opConcepto}
                  onChange={(e) => setOpConcepto(e.target.value)}
                  placeholder="Ej. Compra del día"
                />
              </div>
            )}
            <div>
              <Label>Monto ($)</Label>
              <Input
                type="number"
                min={1}
                step="1"
                value={opMonto}
                onChange={(e) => setOpMonto(e.target.value)}
                required
              />
              {opMode === "cobrar" && opCliente && (
                <p className="text-xs text-muted-foreground mt-1">Deuda actual: {fmt(opCliente.deuda)}</p>
              )}
            </div>
            {opMode === "cobrar" && (
              <div>
                <Label>Medio de pago</Label>
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm mt-1"
                  value={opMedioPago}
                  onChange={(e) => setOpMedioPago(e.target.value)}
                >
                  <option value="efectivo">Efectivo</option>
                  <option value="transferencia">Transferencia / CVU</option>
                  <option value="qr">QR / Mercado Pago</option>
                  <option value="tarjeta_debito">Tarjeta de Débito</option>
                </select>
              </div>
            )}
            {opMode === "anotar" && opCliente && (
              <p className="text-xs text-muted-foreground mt-1">
                Disponible:{" "}
                {fmt(
                  !Number.isFinite(opCliente.disponible) || opCliente.disponible === Infinity
                    ? 0
                    : opCliente.disponible,
                )}
              </p>
            )}
            <Button type="submit" className="w-full" disabled={opSaving}>
              {opSaving ? "Guardando…" : opMode === "anotar" ? "Anotar fiado" : "Cobrar y emitir recibo"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}