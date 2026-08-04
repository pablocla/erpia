"use client"

import { useState, useEffect } from "react"
import { Topbar } from "@/components/topbar"
import { MotionPage } from "@/components/ui/motion"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Wallet, MessageSquare, CheckCircle, ArrowLeft, Landmark, Calendar, Phone } from "lucide-react"
import Link from "next/link"

interface DeudorCobranza {
  id: number
  cliente: string
  telefono?: string
  total: number
  estado: string
  observaciones?: string
}

export default function PlanillaCobranzaPage() {
  const [deudores, setDeudores] = useState<DeudorCobranza[]>([])
  const [loading, setLoading] = useState(true)
  const [cobrados, setCobrados] = useState<number[]>([])

  useEffect(() => {
    const fetchCobranzas = async () => {
      try {
        const res = await fetch("/api/prestamos")
        if (res.ok) {
          const data = await res.json()
          if (Array.isArray(data) && data.length > 0) {
            setDeudores(data)
            setLoading(false)
            return
          }
        }
      } catch (e) {
        console.error(e)
      }
      setDeudores([
        { id: 1, cliente: "Aldo", total: 393000, estado: "Pendiente hoy", observaciones: "Capital $318.500 + $74.500" },
        { id: 2, cliente: "Madera", total: 65000, estado: "Pendiente hoy", observaciones: "Capital $50.000 + $15.000" },
        { id: 3, cliente: "Farana", total: 325000, estado: "Pendiente hoy", observaciones: "Capital $250.000 + $75.000" },
        { id: 4, cliente: "Máquina #5", total: 520000, estado: "Vence esta semana", observaciones: "Capital $400.000 + $120.000" },
        { id: 5, cliente: "Enano", total: 520000, estado: "Vence esta semana", observaciones: "Capital $400.000 + $120.000" },
      ])
      setLoading(false)
    }
    void fetchCobranzas()
  }, [])

  const handleMarcarCobrado = async (id: number, monto: number) => {
    try {
      await fetch("/api/prestamos/cobrar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clienteId: id, monto })
      })
    } catch (e) {
      console.error(e)
    }
    setCobrados(prev => [...prev, id])
  }

  const handleWhatsApp = (cliente: string, total: number, tel?: string) => {
    const msg = encodeURIComponent(`Hola ${cliente}! Te hablo de Lázaro Préstamos para recordarte el vencimiento de tu cuota por $${total.toLocaleString("es-AR")}. Avisame cuando realices la transferencia o si paso a buscar el efectivo. Muchas gracias!`)
    const cleanTel = tel ? tel.replace(/\D/g, "") : ""
    const url = cleanTel ? `https://wa.me/${cleanTel}?text=${msg}` : `https://wa.me/?text=${msg}`
    window.open(url, "_blank")
  }

  const totalPendiente = deudores
    .filter(d => !cobrados.includes(d.id))
    .reduce((acc, d) => acc + d.total, 0)

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Topbar title="Planilla de Cobranza Diaria" />
      <MotionPage className="p-4 md:p-6 space-y-6 max-w-4xl mx-auto w-full pb-24">
        
        {/* Encabezado Mobile */}
        <div className="flex items-center justify-between">
          <Link href="/dashboard/prestamos">
            <Button variant="outline" size="sm" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Volver a Préstamos
            </Button>
          </Link>
          <Badge variant="secondary" className="text-xs py-1 px-3">
            📅 HOY: {new Date().toLocaleDateString("es-AR")}
          </Badge>
        </div>

        {/* Tarjeta Resumen Rápido */}
        <Card className="border-primary/30 bg-primary/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Pendiente de Cobro Hoy</CardTitle>
            <div className="text-3xl font-extrabold text-primary">
              ${totalPendiente.toLocaleString("es-AR")} ARS
            </div>
            <CardDescription className="text-xs">
              {deudores.length - cobrados.length} deudores por contactar / cobrar hoy
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Lista de Cobranza Táctil */}
        <div className="space-y-4">
          <h3 className="text-lg font-bold flex items-center gap-2">
            <Landmark className="h-5 w-5 text-primary" />
            Lista de Cobro del Día (1 Touch)
          </h3>

          {loading ? (
            <div className="p-8 text-center text-muted-foreground animate-pulse">Cargando planilla de cobros...</div>
          ) : deudores.length === 0 ? (
            <Card className="p-6 text-center text-muted-foreground">No hay cobros pendientes registrados.</Card>
          ) : (
            deudores.map((d) => {
              const estaCobrado = cobrados.includes(d.id)
              return (
                <Card key={d.id} className={`transition-all ${estaCobrado ? "opacity-50 bg-muted/40 border-dashed" : "hover:border-primary/50"}`}>
                  <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-lg">{d.cliente}</span>
                        {estaCobrado ? (
                          <Badge className="bg-emerald-600 text-white gap-1">
                            <CheckCircle className="h-3 w-3" /> Cobrado
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-amber-500 border-amber-500/30">
                            {d.estado}
                          </Badge>
                        )}
                      </div>
                      <div className="text-2xl font-black text-foreground">
                        ${d.total.toLocaleString("es-AR")} ARS
                      </div>
                      {d.observaciones && (
                        <p className="text-xs text-muted-foreground">{d.observaciones}</p>
                      )}
                    </div>

                    {!estaCobrado && (
                      <div className="flex items-center gap-2 w-full sm:w-auto">
                        <Button
                          onClick={() => handleWhatsApp(d.cliente, d.total, d.telefono)}
                          variant="outline"
                          size="lg"
                          className="flex-1 sm:flex-initial gap-2 border-emerald-500/40 text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700 dark:hover:bg-emerald-950"
                        >
                          <MessageSquare className="h-5 w-5" />
                          WhatsApp
                        </Button>
                        <Button
                          onClick={() => handleMarcarCobrado(d.id, d.total)}
                          size="lg"
                          className="flex-1 sm:flex-initial gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                        >
                          <Wallet className="h-5 w-5" />
                          Cobrar
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )
            })
          )}
        </div>
      </MotionPage>
    </div>
  )
}
