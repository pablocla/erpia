"use client"

import { useState, useEffect } from "react"
import { Topbar } from "@/components/topbar"
import { MotionPage } from "@/components/ui/motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Wallet, Plus, Printer, DollarSign, Users, AlertTriangle, CheckCircle, MessageSquare, ArrowRight, MapPin, HelpCircle } from "lucide-react"
import Link from "next/link"
import { PrestamosHelpDialog } from "@/components/prestamos/prestamos-help-dialog"
import { PrestamosOnboardingWizard } from "@/components/prestamos/prestamos-onboarding-wizard"

interface Prestamo {
  id: number
  cliente: string
  dni: string
  capital: number
  interes: number
  total: number
  cuotasTotales: number
  cuotasPagas: number
  montoCuota: number
  frecuencia: "Diario" | "Semanal" | "Mensual"
  estado: "Al día" | "Atrasado" | "Vencido"
  fechaInicio: string
  fechaVencimiento: string
}

const INITIAL_PRESTAMOS: Prestamo[] = [
  {
    id: 1,
    cliente: "Madera",
    dni: "Cliente #01",
    capital: 50000,
    interes: 15000,
    total: 65000,
    cuotasTotales: 1,
    cuotasPagas: 0,
    montoCuota: 65000,
    frecuencia: "Mensual",
    estado: "Al día",
    fechaInicio: "2026-08-01",
    fechaVencimiento: "2026-09-01"
  },
  {
    id: 2,
    cliente: "Aldo",
    dni: "Cliente #02",
    capital: 318500,
    interes: 74500,
    total: 393000,
    cuotasTotales: 1,
    cuotasPagas: 0,
    montoCuota: 393000,
    frecuencia: "Mensual",
    estado: "Al día",
    fechaInicio: "2026-08-01",
    fechaVencimiento: "2026-09-01"
  },
  {
    id: 3,
    cliente: "Máquina (Préstamo 1)",
    dni: "Cliente #03",
    capital: 100000,
    interes: 30000,
    total: 130000,
    cuotasTotales: 1,
    cuotasPagas: 0,
    montoCuota: 130000,
    frecuencia: "Mensual",
    estado: "Al día",
    fechaInicio: "2026-08-01",
    fechaVencimiento: "2026-09-01"
  },
  {
    id: 4,
    cliente: "Máquina (Préstamo 2)",
    dni: "Cliente #04",
    capital: 200000,
    interes: 60000,
    total: 260000,
    cuotasTotales: 1,
    cuotasPagas: 0,
    montoCuota: 260000,
    frecuencia: "Mensual",
    estado: "Al día",
    fechaInicio: "2026-08-01",
    fechaVencimiento: "2026-09-01"
  },
  {
    id: 5,
    cliente: "Farana",
    dni: "Cliente #05",
    capital: 250000,
    interes: 75000,
    total: 325000,
    cuotasTotales: 1,
    cuotasPagas: 0,
    montoCuota: 325000,
    frecuencia: "Mensual",
    estado: "Al día",
    fechaInicio: "2026-08-01",
    fechaVencimiento: "2026-09-01"
  },
  {
    id: 6,
    cliente: "Máquina (Préstamo 3)",
    dni: "Cliente #06",
    capital: 100000,
    interes: 30000,
    total: 130000,
    cuotasTotales: 1,
    cuotasPagas: 0,
    montoCuota: 130000,
    frecuencia: "Mensual",
    estado: "Al día",
    fechaInicio: "2026-08-01",
    fechaVencimiento: "2026-09-01"
  },
  {
    id: 7,
    cliente: "Máquina (Préstamo 4)",
    dni: "Cliente #07",
    capital: 200000,
    interes: 60000,
    total: 260000,
    cuotasTotales: 1,
    cuotasPagas: 0,
    montoCuota: 260000,
    frecuencia: "Mensual",
    estado: "Al día",
    fechaInicio: "2026-08-01",
    fechaVencimiento: "2026-09-01"
  },
  {
    id: 8,
    cliente: "Máquina (Préstamo 5)",
    dni: "Cliente #08",
    capital: 400000,
    interes: 120000,
    total: 520000,
    cuotasTotales: 1,
    cuotasPagas: 0,
    montoCuota: 520000,
    frecuencia: "Mensual",
    estado: "Al día",
    fechaInicio: "2026-08-01",
    fechaVencimiento: "2026-09-01"
  },
  {
    id: 9,
    cliente: "Máquina (Préstamo 6)",
    dni: "Cliente #09",
    capital: 60000,
    interes: 18000,
    total: 78000,
    cuotasTotales: 1,
    cuotasPagas: 0,
    montoCuota: 78000,
    frecuencia: "Mensual",
    estado: "Al día",
    fechaInicio: "2026-08-01",
    fechaVencimiento: "2026-09-01"
  },
  {
    id: 10,
    cliente: "Maquina (Préstamo 7)",
    dni: "Cliente #10",
    capital: 50000,
    interes: 15000,
    total: 65000,
    cuotasTotales: 1,
    cuotasPagas: 0,
    montoCuota: 65000,
    frecuencia: "Mensual",
    estado: "Al día",
    fechaInicio: "2026-08-01",
    fechaVencimiento: "2026-09-01"
  },
  {
    id: 11,
    cliente: "Máquina (Préstamo 8)",
    dni: "Cliente #11",
    capital: 200000,
    interes: 60000,
    total: 260000,
    cuotasTotales: 1,
    cuotasPagas: 0,
    montoCuota: 260000,
    frecuencia: "Mensual",
    estado: "Al día",
    fechaInicio: "2026-08-01",
    fechaVencimiento: "2026-09-01"
  },
  {
    id: 12,
    cliente: "Máquina (Préstamo 9)",
    dni: "Cliente #12",
    capital: 50000,
    interes: 15000,
    total: 65000,
    cuotasTotales: 1,
    cuotasPagas: 0,
    montoCuota: 65000,
    frecuencia: "Mensual",
    estado: "Al día",
    fechaInicio: "2026-08-01",
    fechaVencimiento: "2026-09-01"
  },
  {
    id: 13,
    cliente: "Máquina (Préstamo 10)",
    dni: "Cliente #13",
    capital: 100000,
    interes: 30000,
    total: 130000,
    cuotasTotales: 1,
    cuotasPagas: 0,
    montoCuota: 130000,
    frecuencia: "Mensual",
    estado: "Al día",
    fechaInicio: "2026-08-01",
    fechaVencimiento: "2026-09-01"
  },
  {
    id: 14,
    cliente: "Máquina (Septiembre)",
    dni: "Cliente #14",
    capital: 350000,
    interes: 150000,
    total: 500000,
    cuotasTotales: 1,
    cuotasPagas: 0,
    montoCuota: 500000,
    frecuencia: "Mensual",
    estado: "Al día",
    fechaInicio: "2026-08-01",
    fechaVencimiento: "2026-09-15"
  },
  {
    id: 15,
    cliente: "Padre máquina",
    dni: "Cliente #15",
    capital: 400000,
    interes: 120000,
    total: 520000,
    cuotasTotales: 1,
    cuotasPagas: 0,
    montoCuota: 520000,
    frecuencia: "Mensual",
    estado: "Al día",
    fechaInicio: "2026-08-01",
    fechaVencimiento: "2026-09-01"
  },
  {
    id: 16,
    cliente: "Enano",
    dni: "Cliente #16",
    capital: 400000,
    interes: 120000,
    total: 520000,
    cuotasTotales: 1,
    cuotasPagas: 0,
    montoCuota: 520000,
    frecuencia: "Mensual",
    estado: "Al día",
    fechaInicio: "2026-08-01",
    fechaVencimiento: "2026-09-01"
  }
]

export default function PrestamosPage() {
  const [prestamos, setPrestamos] = useState<Prestamo[]>([])
  const [loading, setLoading] = useState(true)
  const [modalNuevoOpen, setModalNuevoOpen] = useState(false)
  const [modalWapOpen, setModalWapOpen] = useState(false)
  const [helpOpen, setHelpOpen] = useState(false)
  const [selectedPrestamo, setSelectedPrestamo] = useState<Prestamo | null>(null)
  
  // Formulario Nuevo Préstamo (30% mensual por defecto)
  const [nuevoCliente, setNuevoCliente] = useState("")
  const [nuevoCapital, setNuevoCapital] = useState(100000)
  const [nuevoInteresPct, setNuevoInteresPct] = useState(30) // 30% TEM mensual por defecto
  const [nuevoTelefono, setNuevoTelefono] = useState("")
  const [submitting, setSubmitting] = useState(false)

  const cargarPrestamos = async () => {
    try {
      const res = await fetch("/api/prestamos")
      if (res.ok) {
        const data = await res.json()
        if (Array.isArray(data) && data.length > 0) {
          setPrestamos(data)
          setLoading(false)
          return
        }
      }
    } catch (e) {
      console.error(e)
    }
    const saved = localStorage.getItem("claver:prestamos")
    if (saved && saved.includes("Madera")) {
      setPrestamos(JSON.parse(saved))
    } else {
      setPrestamos(INITIAL_PRESTAMOS)
      localStorage.setItem("claver:prestamos", JSON.stringify(INITIAL_PRESTAMOS))
    }
    setLoading(false)
  }

  useEffect(() => {
    void cargarPrestamos()
  }, [])

  // Cálculos dinámicos del simulador (30% directo)
  const calculoInteres = Math.round((nuevoCapital * nuevoInteresPct) / 100)
  const calculoTotal = nuevoCapital + calculoInteres

  const handleCrearPrestamo = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!nuevoCliente || !nuevoCapital) return
    setSubmitting(true)

    try {
      const res = await fetch("/api/prestamos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cliente: nuevoCliente,
          capital: nuevoCapital,
          interesPct: nuevoInteresPct,
          telefono: nuevoTelefono
        })
      })
      if (res.ok) {
        await cargarPrestamos()
        setModalNuevoOpen(false)
        setNuevoCliente("")
        setNuevoCapital(100000)
        setNuevoTelefono("")
        setSubmitting(false)
        return
      }
    } catch (e) {
      console.error(e)
    }

    const nuevo: Prestamo = {
      id: Date.now(),
      cliente: nuevoCliente,
      dni: "Cliente #" + (prestamos.length + 1),
      capital: nuevoCapital,
      interes: calculoInteres,
      total: calculoTotal,
      cuotasTotales: 1,
      cuotasPagas: 0,
      montoCuota: calculoTotal,
      frecuencia: "Mensual",
      estado: "Al día",
      fechaInicio: new Date().toISOString().split("T")[0],
      fechaVencimiento: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
    }

    const actualizados = [nuevo, ...prestamos]
    setPrestamos(actualizados)
    localStorage.setItem("claver:prestamos", JSON.stringify(actualizados))
    setModalNuevoOpen(false)
    setNuevoCliente("")
    setNuevoCapital(100000)
    setSubmitting(false)
  }

  const handleCobrarCuota = async (id: number, monto: number) => {
    try {
      await fetch("/api/prestamos/cobrar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clienteId: id, monto })
      })
    } catch (e) {
      console.error(e)
    }

    const actualizados = prestamos.map(p => {
      if (p.id === id) {
        const pagas = Math.min(p.cuotasPagas + 1, p.cuotasTotales)
        return { ...p, cuotasPagas: pagas, estado: "Al día" as const }
      }
      return p
    })
    setPrestamos(actualizados)
    localStorage.setItem("claver:prestamos", JSON.stringify(actualizados))
  }

  // Métricas
  const totalPrestado = prestamos.reduce((sum, p) => sum + p.capital, 0)
  const totalIntereses = prestamos.reduce((sum, p) => sum + p.interes, 0)
  const totalMoroso = prestamos.filter(p => p.estado !== "Al día").reduce((sum, p) => sum + p.total - (p.cuotasPagas * p.montoCuota), 0)
  const cobroHoySugerido = prestamos.reduce((sum, p) => sum + p.montoCuota, 0)

  return (
    <MotionPage className="flex h-full flex-col bg-slate-50">
      <Topbar />
      <div className="flex-1 p-6 space-y-6 overflow-y-auto max-w-7xl mx-auto w-full">
        
        {/* Encabezado Principal */}
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
          <div>
            <h2 className="text-3xl font-extrabold tracking-tight text-slate-900">Dashboard de Préstamos</h2>
            <p className="text-slate-500">Originación, cuotas y ruteo inteligente para prestamistas de efectivo.</p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setHelpOpen(true)} className="border-blue-300 text-blue-700 hover:bg-blue-50 bg-white">
              <HelpCircle className="mr-2 h-4 w-4 text-blue-600" /> Manual & Diagrama
            </Button>
            <Link href="/dashboard/prestamos/cobranza">
              <Button variant="outline" className="border-slate-300 hover:bg-slate-100 bg-white">
                <MapPin className="mr-2 h-4 w-4 text-emerald-600" /> Ruteo Cobranza
              </Button>
            </Link>
            <Button onClick={() => setModalNuevoOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-md">
              <Plus className="mr-2 h-4 w-4" /> Otorgar Préstamo
            </Button>
          </div>
        </div>

        {/* Tarjetas de Métricas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="border-slate-200/80 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-semibold text-slate-500">Capital Activo en Calle</CardTitle>
              <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                <Wallet className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">${totalPrestado.toLocaleString("es-AR")}</div>
              <p className="text-xs text-slate-400 mt-1">Suma del capital otorgado</p>
            </CardContent>
          </Card>

          <Card className="border-slate-200/80 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-semibold text-slate-500">Intereses a Cobrar</CardTitle>
              <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600">
                <DollarSign className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">${totalIntereses.toLocaleString("es-AR")}</div>
              <p className="text-xs text-slate-400 mt-1">Margen de ganancia bruto</p>
            </CardContent>
          </Card>

          <Card className="border-slate-200/80 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-semibold text-slate-500">Saldo Moroso / Vencido</CardTitle>
              <div className="p-2 bg-rose-50 rounded-lg text-rose-600">
                <AlertTriangle className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-rose-600">${totalMoroso.toLocaleString("es-AR")}</div>
              <p className="text-xs text-slate-400 mt-1">Saldo atrasado / impago</p>
            </CardContent>
          </Card>

          <Card className="border-slate-200/80 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-semibold text-slate-500">Cobranza del Día (Proyectada)</CardTitle>
              <div className="p-2 bg-violet-50 rounded-lg text-violet-600">
                <CheckCircle className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">${cobroHoySugerido.toLocaleString("es-AR")}</div>
              <p className="text-xs text-slate-400 mt-1">Meta diaria del ruteador</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabla de Cartera Activa */}
        <Card className="border-slate-200/80 shadow-sm">
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-xl">Clientes & Préstamos Vigentes</CardTitle>
              <CardDescription>Listado general de cobros, pagarés y recordatorios directos.</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader className="bg-slate-100/50">
                <TableRow>
                  <TableHead className="font-semibold text-slate-700">Deudor</TableHead>
                  <TableHead className="font-semibold text-slate-700">Plan</TableHead>
                  <TableHead className="font-semibold text-slate-700 text-right">Capital</TableHead>
                  <TableHead className="font-semibold text-slate-700 text-right">Monto Cuota</TableHead>
                  <TableHead className="font-semibold text-slate-700 text-center">Progreso</TableHead>
                  <TableHead className="font-semibold text-slate-700 text-center">Estado</TableHead>
                  <TableHead className="font-semibold text-slate-700 text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {prestamos.map(p => {
                  const saldoRestante = p.total - (p.cuotasPagas * p.montoCuota)
                  return (
                    <TableRow key={p.id} className="hover:bg-slate-50/50 transition-colors">
                      <TableCell className="font-medium text-slate-900">
                        <div>{p.cliente}</div>
                        <div className="text-xs text-slate-400 font-normal">DNI: {p.dni}</div>
                      </TableCell>
                      <TableCell className="text-slate-600">
                        {p.cuotasTotales} cuotas / {p.frecuencia}
                      </TableCell>
                      <TableCell className="text-right font-medium text-slate-950">
                        ${p.capital.toLocaleString("es-AR")}
                      </TableCell>
                      <TableCell className="text-right font-semibold text-slate-900">
                        ${p.montoCuota.toLocaleString("es-AR")}
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-2">
                          <span className="text-xs font-semibold">{p.cuotasPagas}/{p.cuotasTotales}</span>
                          <div className="w-16 bg-slate-200 h-1.5 rounded-full overflow-hidden">
                            <div 
                              className="bg-blue-600 h-full rounded-full" 
                              style={{ width: `${(p.cuotasPagas / p.cuotasTotales) * 100}%` }}
                            />
                          </div>
                        </div>
                        <div className="text-[10px] text-slate-400 text-center mt-0.5">Saldo restante: ${saldoRestante.toLocaleString("es-AR")}</div>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge 
                          className={
                            p.estado === "Al día" 
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-50"
                              : p.estado === "Atrasado"
                                ? "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-50"
                                : "bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-50"
                          }
                          variant="outline"
                        >
                          {p.estado}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1.5">
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="h-8 border-slate-300 px-2.5 text-slate-700 hover:bg-slate-100"
                            onClick={() => handleCobrarCuota(p.id)}
                            disabled={p.cuotasPagas === p.cuotasTotales}
                          >
                            Cobrar
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="h-8 border-slate-300 px-2.5 text-slate-700 hover:bg-slate-100"
                            onClick={() => {
                              setSelectedPrestamo(p)
                              setModalWapOpen(true)
                            }}
                          >
                            <MessageSquare className="h-3.5 w-3.5 text-blue-500" />
                          </Button>
                          <Link href={`/dashboard/prestamos/pagares?id=${p.id}`}>
                            <Button size="sm" variant="outline" className="h-8 border-slate-300 px-2.5 text-slate-700 hover:bg-slate-100">
                              <Printer className="h-3.5 w-3.5" />
                            </Button>
                          </Link>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Modal: Otorgar Préstamo (Con Simulador de Tasas) */}
      <Dialog open={modalNuevoOpen} onOpenChange={setModalNuevoOpen}>
        <DialogContent className="max-w-2xl bg-white border border-slate-200 shadow-xl rounded-xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Otorgar Nuevo Préstamo</DialogTitle>
            <DialogDescription>Simulá cuotas, intereses y generá la orden comercial de cobro en un solo paso.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCrearPrestamo} className="space-y-6 py-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="cliente">Nombre Completo del Cliente</Label>
                <Input id="cliente" value={nuevoCliente} onChange={e => setNuevoCliente(e.target.value)} placeholder="Ej: Roberto Sánchez" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dni">DNI / Documento</Label>
                <Input id="dni" value={nuevoDni} onChange={e => setNuevoDni(e.target.value)} placeholder="Ej: 22.345.678" required />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="capital">Capital a Prestar ($)</Label>
                <Input id="capital" type="number" value={nuevoCapital} onChange={e => setNuevoCapital(Number(e.target.value))} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tna">Tasa Nominal Anual (%)</Label>
                <Input id="tna" type="number" value={nuevaTna} onChange={e => setNuevaTna(Number(e.target.value))} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="frecuencia">Frecuencia de Pago</Label>
                <select 
                  id="frecuencia" 
                  value={nuevaFrecuencia} 
                  onChange={e => setNuevaFrecuencia(e.target.value as any)}
                  className="w-full h-10 px-3 border rounded-md border-slate-200 bg-white text-sm"
                >
                  <option value="Diario">Diario</option>
                  <option value="Semanal">Semanal</option>
                  <option value="Mensual">Mensual</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="cuotas">Cantidad de Cuotas</Label>
                <Input id="cuotas" type="number" value={nuevasCuotas} onChange={e => setNuevasCuotas(Number(e.target.value))} required />
              </div>
            </div>

            {/* Caja de Simulación en Vivo */}
            <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-slate-500">Intereses Totales ({nuevaTna}% TNA):</p>
                <p className="text-lg font-bold text-slate-800">${calculoInteres.toLocaleString("es-AR")}</p>
              </div>
              <div>
                <p className="text-slate-500">Monto Final a Devolver:</p>
                <p className="text-lg font-bold text-blue-600">${calculoTotal.toLocaleString("es-AR")}</p>
              </div>
              <div className="col-span-2 pt-2 border-t border-slate-200 flex justify-between items-center">
                <span className="text-slate-500">Valor de cada cuota:</span>
                <span className="text-xl font-black text-emerald-600">${calculoCuota.toLocaleString("es-AR")} / {nuevaFrecuencia.toLowerCase()}</span>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setModalNuevoOpen(false)}>Cancelar</Button>
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white shadow-md">Confirmar y Generar Pagaré</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal: Bot de Cobranza WhatsApp */}
      <Dialog open={modalWapOpen} onOpenChange={setModalWapOpen}>
        <DialogContent className="max-w-md bg-white border border-slate-200 shadow-xl rounded-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-emerald-600" />
              Notificar Cuota por WhatsApp
            </DialogTitle>
            <DialogDescription>
              Se enviará un recordatorio automático utilizando la plantilla homologada de cobranzas de Claver.
            </DialogDescription>
          </DialogHeader>

          {selectedPrestamo && (
            <div className="space-y-4 py-3">
              <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100 text-sm text-slate-800 whitespace-pre-line leading-relaxed">
                {`*Recordatorio de Pago de Cuota Claver*\n\nHola *${selectedPrestamo.cliente}*,\n\nTe recordamos que tenés una cuota pendiente del préstamo con vencimiento próximo.\n\n👉 *Detalles del vencimiento:*\n• Cuota N°: *${selectedPrestamo.cuotasPagas + 1}/${selectedPrestamo.cuotasTotales}*\n• Monto cuota: *$: ${selectedPrestamo.montoCuota.toLocaleString("es-AR")}*\n• Frecuencia: *${selectedPrestamo.frecuencia}*\n\nPodés abonarla ahora de forma digital ingresando a este link de pago de MercadoPago: \n_https://mpago.la/claver-prestamos-${selectedPrestamo.id}_\n\nSi ya realizaste la transferencia, por favor envianos el comprobante por este medio.\n\n*Grupo Claver - Cobranza Automatizada*`}
              </div>
              
              <div className="text-xs text-slate-400 italic">
                El mensaje simulará su salida a través de la API oficial de WhatsApp Business de Claver.
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="ghost" onClick={() => setModalWapOpen(false)}>Cerrar</Button>
            <Button 
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
              onClick={() => {
                setModalWapOpen(false)
                alert("¡Mensaje de WhatsApp encolado y enviado con éxito al cliente!")
              }}
            >
              Enviar por WhatsApp
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <PrestamosHelpDialog open={helpOpen} onOpenChange={setHelpOpen} />
      <PrestamosOnboardingWizard onComplete={() => {}} />
    </MotionPage>
  )
}
