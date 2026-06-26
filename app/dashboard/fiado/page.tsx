"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { BookOpen, Plus, RefreshCw, Settings, Users, Wallet } from "lucide-react"
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

  const cargar = async () => {
    setLoading(true)
    try {
      const [dRes, rRes, cRes] = await Promise.all([
        fetch("/api/fiado/deudores", { headers: getAuthHeaders() }),
        fetch("/api/fiado/resumen", { headers: getAuthHeaders() }),
        fetch("/api/fiado/config", { headers: getAuthHeaders() }),
      ])
      if (dRes.ok) {
        const d = await dRes.json()
        setDeudores(d.data ?? [])
      }
      if (rRes.ok) setResumen(await rRes.json())
      if (cRes.ok) setConfig(await cRes.json())
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

  return (
    <div className="space-y-6 max-w-6xl mx-auto p-4 md:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-primary mb-1">
            <BookOpen className="h-5 w-5" />
            <span className="text-sm font-medium">Almacén de barrio</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Libreta Fiado</h1>
          <p className="text-muted-foreground mt-1">
            Fiá con límite. Cada compra avisa por email, WhatsApp y link de pago si están activos.
          </p>
        </div>
        <div className="flex gap-2">
          <Dialog open={configOpen} onOpenChange={setConfigOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Settings className="h-4 w-4 mr-2" />
                Configuración
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Configuración Libreta Fiado</DialogTitle>
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
                    <Switch
                      checked={config.fiadoNotificarWhatsApp !== false}
                      onCheckedChange={(v) => setConfig({ ...config, fiadoNotificarWhatsApp: v })}
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={savingConfig}>
                    {savingConfig ? "Guardando…" : "Guardar"}
                  </Button>
                </form>
              )}
            </DialogContent>
          </Dialog>
          <Button variant="outline" onClick={() => void cargar()} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Actualizar
          </Button>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Cliente fiado
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
      </div>

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
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            Deudores activos
          </CardTitle>
        </CardHeader>
        <CardContent>
          {deudores.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              Sin deuda fiado. Creá clientes con límite o vendé desde el{" "}
              <Link href="/dashboard/pos" className="text-primary underline">
                POS
              </Link>
              .
            </p>
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
                    <th className="py-2" />
                  </tr>
                </thead>
                <tbody>
                  {deudores.map((d) => (
                    <tr key={d.id} className="border-b last:border-0">
                      <td className="py-3 pr-4 font-medium">{d.nombre}</td>
                      <td className="py-3 pr-4">{d.telefono ?? "—"}</td>
                      <td className="py-3 pr-4 text-right text-red-600">{fmt(d.deuda)}</td>
                      <td className="py-3 pr-4 text-right">{fmt(d.limiteCredito)}</td>
                      <td className="py-3 pr-4 text-right">
                        <Badge variant="outline">{fmt(d.disponible)}</Badge>
                      </td>
                      <td className="py-3 text-right">
                        <Link href={`/dashboard/clientes?id=${d.id}`} className="text-primary text-xs hover:underline">
                          Ver
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}