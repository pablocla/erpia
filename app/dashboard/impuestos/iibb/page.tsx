"use client"

import { useState, useCallback, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { useToast } from "@/hooks/use-toast"
import {
  FileText,
  Download,
  Lock,
  ShieldCheck,
  Loader2,
  TrendingUp,
  MapPin,
} from "lucide-react"

interface PeriodoIIBB {
  id: number
  mes: number
  anio: number
  jurisdiccion: string
  organismo: string
  baseImponible: number
  alicuota: number
  montoDevengado: number
  montoPercibido: number
  saldo: number
  estado: "abierto" | "cerrado" | "presentado"
}

const ESTADO_BADGE = {
  abierto: { label: "Abierto", variant: "default" as const },
  cerrado: { label: "Cerrado", variant: "secondary" as const },
  presentado: { label: "Presentado", variant: "outline" as const },
}

const MESES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
]

export default function IIBBPage() {
  const [mes, setMes] = useState(new Date().getMonth() + 1)
  const [anio, setAnio] = useState(new Date().getFullYear())
  const [periodos, setPeriodos] = useState<PeriodoIIBB[]>([])
  const [resumen, setResumen] = useState<{totalDevengado: number; totalPercibido: number; totalSaldo: number} | null>(null)
  const [loading, setLoading] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)
  const { toast } = useToast()

  const cargar = useCallback(async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem("token")
      const res = await fetch(`/api/impuestos/iibb?mes=${mes}&anio=${anio}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error("Error al cargar")
      const data = await res.json()
      setPeriodos(data.liquidacion?.periodos ?? [])
      setResumen(data.liquidacion?.resumen ?? null)
    } catch {
      toast({ variant: "destructive", title: "Error", description: "No se pudo cargar la liquidación IIBB" })
    } finally {
      setLoading(false)
    }
  }, [mes, anio, toast])

  useEffect(() => { cargar() }, [cargar])

  const ejecutarAccion = async (jurisdiccion: string, accion: "cerrar" | "presentado") => {
    setActionLoading(true)
    try {
      const token = localStorage.getItem("token")
      const res = await fetch("/api/impuestos/iibb", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ accion, mes, anio, jurisdiccion }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? "Error")
      toast({ title: "Éxito", description: data.mensaje })
      cargar()
    } catch (err: any) {
      toast({ variant: "destructive", title: "Error", description: err.message })
    } finally {
      setActionLoading(false)
    }
  }

  const descargarDDJJ = async () => {
    const token = localStorage.getItem("token")
    const res = await fetch(`/api/impuestos/iibb?mes=${mes}&anio=${anio}&formato=ddjj`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (!res.ok) {
      toast({ variant: "destructive", title: "Error", description: "No se pudo generar la DDJJ" })
      return
    }
    const text = await res.text()
    const blob = new Blob([text], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `iibb_ddjj_${anio}_${String(mes).padStart(2, "0")}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  const fmt = (n: number) => n.toLocaleString("es-AR", { style: "currency", currency: "ARS" })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <MapPin className="h-6 w-6 text-primary" />
            Ingresos Brutos
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Liquidación mensual por jurisdicción, cierre y generación de DDJJ.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={String(mes)} onValueChange={(v) => setMes(parseInt(v, 10))}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {MESES.map((label, i) => (
                <SelectItem key={i} value={String(i + 1)}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={String(anio)} onValueChange={(v) => setAnio(parseInt(v, 10))}>
            <SelectTrigger className="w-[100px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[2025, 2026, 2027].map((a) => (
                <SelectItem key={a} value={String(a)}>{a}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={cargar} disabled={loading} size="sm">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Consultar"}
          </Button>
        </div>
      </div>

      {/* Summary cards */}
      {resumen && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2 p-4">
              <CardDescription className="text-xs">Total Devengado</CardDescription>
              <CardTitle className="text-xl">{fmt(resumen.totalDevengado)}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2 p-4">
              <CardDescription className="text-xs">Percepciones Recibidas</CardDescription>
              <CardTitle className="text-xl text-emerald-600">{fmt(resumen.totalPercibido)}</CardTitle>
            </CardHeader>
          </Card>
          <Card className="border-primary/30">
            <CardHeader className="pb-2 p-4">
              <CardDescription className="text-xs">Saldo a Pagar</CardDescription>
              <CardTitle className="text-xl">
                <span className={resumen.totalSaldo > 0 ? "text-red-600" : "text-emerald-600"}>
                  {fmt(resumen.totalSaldo)}
                </span>
              </CardTitle>
            </CardHeader>
          </Card>
        </div>
      )}

      {/* Table of jurisdictions */}
      <Card>
        <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base">Liquidación por Jurisdicción</CardTitle>
            <CardDescription className="text-xs">
              {MESES[mes - 1]} {anio}
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" className="gap-1.5" onClick={descargarDDJJ}>
            <Download className="h-3.5 w-3.5" />
            Descargar DDJJ
          </Button>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          {periodos.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">
              Sin movimientos de IIBB en el período seleccionado.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Jurisdicción</TableHead>
                  <TableHead>Organismo</TableHead>
                  <TableHead className="text-right">Base Imponible</TableHead>
                  <TableHead className="text-right">Alícuota</TableHead>
                  <TableHead className="text-right">Devengado</TableHead>
                  <TableHead className="text-right">Percepciones</TableHead>
                  <TableHead className="text-right">Saldo</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {periodos.map((p) => {
                  const badge = ESTADO_BADGE[p.estado]
                  return (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium">{p.jurisdiccion}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{p.organismo}</TableCell>
                      <TableCell className="text-right">{fmt(p.baseImponible)}</TableCell>
                      <TableCell className="text-right">{p.alicuota}%</TableCell>
                      <TableCell className="text-right">{fmt(p.montoDevengado)}</TableCell>
                      <TableCell className="text-right text-emerald-600">{fmt(p.montoPercibido)}</TableCell>
                      <TableCell className="text-right font-medium">
                        <span className={p.saldo > 0 ? "text-red-600" : "text-emerald-600"}>
                          {fmt(p.saldo)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge variant={badge.variant}>{badge.label}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-1 justify-end">
                          {p.estado === "abierto" && (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button size="sm" variant="ghost" className="h-7 gap-1 text-xs" disabled={actionLoading}>
                                  <Lock className="h-3 w-3" /> Cerrar
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>¿Cerrar IIBB {p.jurisdiccion}?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    No se podrán acumular más ventas en este período para {p.jurisdiccion}.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => ejecutarAccion(p.jurisdiccion, "cerrar")}>
                                    Cerrar
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          )}
                          {p.estado === "cerrado" && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 gap-1 text-xs"
                              disabled={actionLoading}
                              onClick={() => ejecutarAccion(p.jurisdiccion, "presentado")}
                            >
                              <ShieldCheck className="h-3 w-3" /> Presentar
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
