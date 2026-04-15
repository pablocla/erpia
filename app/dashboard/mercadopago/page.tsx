"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  CreditCard, DollarSign, Settings, RefreshCw,
  CheckCircle, Clock, XCircle, TrendingUp,
  QrCode, ShoppingCart,
} from "lucide-react"
import { useKeyboardShortcuts, erpShortcuts } from "@/hooks/use-keyboard-shortcuts"

interface Config {
  publicKey: string
  accessToken: string
  mpUserId: string | null
  nombreCuenta: string | null
  qrHabilitado: boolean
  checkoutHabilitado: boolean
  activo: boolean
}

interface Transaccion {
  id: number
  mpPaymentId: string
  estado: string
  monto: number
  montoNeto: number | null
  comisionMp: number | null
  medioPago: string
  descripcion: string | null
  emailPagador: string | null
  conciliado: boolean
  fechaPago: string | null
  createdAt: string
}

interface Resumen {
  totalTransacciones: number
  cobradoAprobado: number
  cantidadAprobados: number
  pendientes: number
  comisionesMP: number
}

const ESTADO_COLORS: Record<string, string> = {
  approved: "bg-emerald-500/15 text-emerald-600",
  pending: "bg-amber-500/15 text-amber-600",
  rejected: "bg-red-500/15 text-red-600",
  refunded: "bg-blue-500/15 text-blue-600",
  cancelled: "bg-gray-500/15 text-gray-600",
}

export default function MercadoPagoPage() {
  const [config, setConfig] = useState<Config | null>(null)
  const [transacciones, setTransacciones] = useState<Transaccion[]>([])
  const [resumen, setResumen] = useState<Resumen | null>(null)
  const [loading, setLoading] = useState(true)

  const headers = { Authorization: `Bearer ${typeof window !== "undefined" ? localStorage.getItem("token") : ""}` }

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [cfgRes, txRes, resRes] = await Promise.all([
        fetch("/api/mercadopago?vista=config", { headers }),
        fetch("/api/mercadopago", { headers }),
        fetch("/api/mercadopago?vista=resumen", { headers }),
      ])
      if (cfgRes.ok) setConfig(await cfgRes.json())
      if (txRes.ok) setTransacciones(await txRes.json())
      if (resRes.ok) setResumen(await resRes.json())
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  useKeyboardShortcuts(erpShortcuts({
    onRefresh: fetchData,
  }))

  async function handleGuardarConfig(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    await fetch("/api/mercadopago", {
      method: "POST",
      headers: { ...headers, "Content-Type": "application/json" },
      body: JSON.stringify({
        accion: "config",
        accessToken: fd.get("accessToken"),
        publicKey: fd.get("publicKey"),
        nombreCuenta: fd.get("nombreCuenta"),
        qrHabilitado: true,
        checkoutHabilitado: true,
      }),
    })
    fetchData()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">MercadoPago</h1>
          <p className="text-muted-foreground">
            Cobros QR, checkout online y conciliación automática
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchData}>
          <RefreshCw className="mr-2 h-4 w-4" /> Actualizar
        </Button>
      </div>

      <Tabs defaultValue={config ? "dashboard" : "config"}>
        <TabsList>
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="transacciones">Transacciones</TabsTrigger>
          <TabsTrigger value="config">Configuración</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-4">
          {resumen && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="pt-4 flex items-center gap-3">
                  <div className="rounded-lg bg-emerald-500/10 p-2"><DollarSign className="h-5 w-5 text-emerald-500" /></div>
                  <div>
                    <p className="text-2xl font-bold">
                      {resumen.cobradoAprobado.toLocaleString("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 })}
                    </p>
                    <p className="text-xs text-muted-foreground">Cobrado (30d)</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4 flex items-center gap-3">
                  <div className="rounded-lg bg-blue-500/10 p-2"><CheckCircle className="h-5 w-5 text-blue-500" /></div>
                  <div>
                    <p className="text-2xl font-bold">{resumen.cantidadAprobados}</p>
                    <p className="text-xs text-muted-foreground">Pagos aprobados</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4 flex items-center gap-3">
                  <div className="rounded-lg bg-amber-500/10 p-2"><Clock className="h-5 w-5 text-amber-500" /></div>
                  <div>
                    <p className="text-2xl font-bold">{resumen.pendientes}</p>
                    <p className="text-xs text-muted-foreground">Pendientes</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4 flex items-center gap-3">
                  <div className="rounded-lg bg-red-500/10 p-2"><TrendingUp className="h-5 w-5 text-red-500" /></div>
                  <div>
                    <p className="text-2xl font-bold">
                      {resumen.comisionesMP.toLocaleString("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 })}
                    </p>
                    <p className="text-xs text-muted-foreground">Comisiones MP</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {!config && (
            <Card className="border-amber-500/30 bg-amber-500/5">
              <CardContent className="py-6 text-center">
                <Settings className="h-8 w-8 text-amber-500 mx-auto mb-2" />
                <p className="font-semibold">MercadoPago no configurado</p>
                <p className="text-sm text-muted-foreground">Ingresá tus credenciales en la pestaña Configuración</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="transacciones" className="space-y-3">
          {transacciones.length === 0 ? (
            <Card><CardContent className="py-10 text-center text-muted-foreground">
              No hay transacciones registradas
            </CardContent></Card>
          ) : (
            transacciones.map((tx) => (
              <Card key={tx.id}>
                <CardContent className="py-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold">{tx.descripcion ?? `Pago #${tx.mpPaymentId}`}</p>
                      <div className="flex items-center gap-3 text-sm text-muted-foreground">
                        <Badge className={ESTADO_COLORS[tx.estado] ?? ""}>{tx.estado}</Badge>
                        <span>{tx.medioPago}</span>
                        {tx.emailPagador && <span>{tx.emailPagador}</span>}
                        {tx.conciliado && <Badge className="bg-emerald-500/15 text-emerald-600">Conciliado</Badge>}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-lg">
                        {Number(tx.monto).toLocaleString("es-AR", { style: "currency", currency: "ARS" })}
                      </p>
                      {tx.fechaPago && (
                        <p className="text-xs text-muted-foreground">
                          {new Date(tx.fechaPago).toLocaleString("es-AR")}
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="config">
          <Card>
            <CardHeader><CardTitle>Credenciales MercadoPago</CardTitle></CardHeader>
            <CardContent>
              <form onSubmit={handleGuardarConfig} className="space-y-4">
                <div><Label>Nombre de la cuenta</Label><Input name="nombreCuenta" defaultValue={config?.nombreCuenta ?? ""} /></div>
                <div><Label>Access Token *</Label><Input name="accessToken" type="password" placeholder="APP_USR-..." required /></div>
                <div><Label>Public Key *</Label><Input name="publicKey" placeholder="APP_USR-..." required /></div>
                <div className="flex gap-4">
                  <div className="flex items-center gap-2">
                    <QrCode className="h-4 w-4" /><span className="text-sm">QR habilitado</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <ShoppingCart className="h-4 w-4" /><span className="text-sm">Checkout habilitado</span>
                  </div>
                </div>
                <Button type="submit">Guardar configuración</Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
