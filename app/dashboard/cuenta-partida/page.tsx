"use client"

import { useState, useEffect } from "react"
import { Topbar } from "@/components/topbar"
import { MotionPage } from "@/components/ui/motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Scale, Plus, DollarSign, Users, ArrowUpRight, ArrowDownRight, Percent } from "lucide-react"

interface Socio {
  id: number
  nombre: string
  porcentaje: number
  balance: number // Lo que la sociedad le debe (positivo) o lo que debe (negativo)
  aportesAcumulados: number
}

interface TransaccionSocio {
  id: number
  fecha: string
  socio: string
  concepto: string
  monto: number
  tipo: "Aporte" | "Gasto" | "Retiro"
}

const INITIAL_SOCIOS: Socio[] = [
  { id: 1, nombre: "Juan Pablo Clavero", porcentaje: 60, balance: 45000, aportesAcumulados: 1200000 },
  { id: 2, nombre: "Marcos Estévez", porcentaje: 40, balance: -45000, aportesAcumulados: 800000 }
]

const INITIAL_TRANSACCIONES: TransaccionSocio[] = [
  { id: 1, fecha: "2026-06-10", socio: "Juan Pablo Clavero", concepto: "Compra de Heladera Comercial", monto: 150000, tipo: "Gasto" },
  { id: 2, fecha: "2026-06-15", socio: "Marcos Estévez", concepto: "Pago de Alquiler de Local", monto: 200000, tipo: "Gasto" },
  { id: 3, fecha: "2026-06-20", socio: "Juan Pablo Clavero", concepto: "Aporte inicial caja chica", monto: 50000, tipo: "Aporte" },
  { id: 4, fecha: "2026-06-25", socio: "Marcos Estévez", concepto: "Retiro a cuenta de honorarios", monto: 60000, tipo: "Retiro" }
]

export default function CuentaPartidaPage() {
  const [socios, setSocios] = useState<Socio[]>([])
  const [transacciones, setTransacciones] = useState<TransaccionSocio[]>([])

  // Formulario de Gasto / Transacción
  const [transSocioId, setTransSocioId] = useState(1)
  const [transConcepto, setTransConcepto] = useState("")
  const [transMonto, setTransMonto] = useState(0)
  const [transTipo, setTransTipo] = useState<"Gasto" | "Aporte" | "Retiro">("Gasto")

  // Simulador de Split de Ganancia
  const [gananciaNeta, setGananciaNeta] = useState(1500000)

  useEffect(() => {
    const savedSocios = localStorage.getItem("claver:socios")
    const savedTrans = localStorage.getItem("claver:socios_trans")
    if (savedSocios && savedTrans) {
      setSocios(JSON.parse(savedSocios))
      setTransacciones(JSON.parse(savedTrans))
    } else {
      setSocios(INITIAL_SOCIOS)
      setTransacciones(INITIAL_TRANSACCIONES)
      localStorage.setItem("claver:socios", JSON.stringify(INITIAL_SOCIOS))
      localStorage.setItem("claver:socios_trans", JSON.stringify(INITIAL_TRANSACCIONES))
    }
  }, [])

  const saveToStorage = (newSocios: Socio[], newTrans: TransaccionSocio[]) => {
    setSocios(newSocios)
    setTransacciones(newTrans)
    localStorage.setItem("claver:socios", JSON.stringify(newSocios))
    localStorage.setItem("claver:socios_trans", JSON.stringify(newTrans))
  }

  const handleCargarTransaccion = (e: React.FormEvent) => {
    e.preventDefault()
    if (!transConcepto || transMonto <= 0) return

    const socioSeleccionado = socios.find(s => s.id === Number(transSocioId))
    if (!socioSeleccionado) return

    const nuevaTrans: TransaccionSocio = {
      id: Date.now(),
      fecha: new Date().toISOString().split("T")[0],
      socio: socioSeleccionado.nombre,
      concepto: transConcepto,
      monto: transMonto,
      tipo: transTipo
    }

    // Calcular balances cruzados:
    // Si un socio paga un Gasto de la empresa ($100), cada socio debe absorber su porcentaje.
    // El socio que gastó queda a favor por la porción del otro socio.
    const nuevosSocios = socios.map(s => {
      let balanceDiff = 0
      let aporteDiff = 0

      if (transTipo === "Gasto") {
        // El socio que hace el gasto puso el 100% de la plata.
        // La empresa le debe el porcentaje correspondiente al OTRO socio.
        if (s.id === socioSeleccionado.id) {
          // A favor: el % del gasto que no le correspondía pagar
          const porcentajeOtros = 100 - s.porcentaje
          balanceDiff = (transMonto * porcentajeOtros) / 100
        } else {
          // En contra: tiene que pagar su porcentaje del gasto hecho por su socio
          balanceDiff = -((transMonto * s.porcentaje) / 100)
        }
      } else if (transTipo === "Aporte") {
        if (s.id === socioSeleccionado.id) {
          aporteDiff = transMonto
        }
      } else if (transTipo === "Retiro") {
        if (s.id === socioSeleccionado.id) {
          balanceDiff = -transMonto
        }
      }

      return {
        ...s,
        balance: s.balance + balanceDiff,
        aportesAcumulados: s.aportesAcumulados + aporteDiff
      }
    })

    const nuevasTransacciones = [nuevaTrans, ...transacciones]
    saveToStorage(nuevosSocios, nuevasTransacciones)

    // Resetear form
    setTransConcepto("")
    setTransMonto(0)
  }

  return (
    <MotionPage className="flex h-full flex-col bg-slate-50">
      <Topbar />
      <div className="flex-1 p-6 space-y-6 overflow-y-auto max-w-7xl mx-auto w-full">
        
        {/* Header */}
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight text-slate-900">Cuenta Partida (Control de Socios)</h2>
          <p className="text-slate-500">Mantené claras las cuentas de aportes, gastos y división de ganancias de tu local.</p>
        </div>

        {/* Tarjetas de Socios */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {socios.map(s => (
            <Card key={s.id} className="border-slate-200 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-slate-50 rounded-bl-full flex items-center justify-center">
                <span className="text-xl font-black text-slate-300">{s.porcentaje}%</span>
              </div>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Users className="h-5 w-5 text-blue-500" /> {s.nombre}
                </CardTitle>
                <CardDescription>Socio Activo de la Sociedad</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center pt-2">
                  <span className="text-sm text-slate-500">Saldo compensatorio:</span>
                  <Badge className={s.balance >= 0 ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-rose-50 text-rose-700 border-rose-200"}>
                    {s.balance >= 0 ? `A favor: +$${s.balance.toLocaleString("es-AR")}` : `Debe: -$${Math.abs(s.balance).toLocaleString("es-AR")}`}
                  </Badge>
                </div>
                <div className="flex justify-between items-center text-sm pt-2 border-t border-slate-100">
                  <span className="text-slate-500">Aportes totales acumulados:</span>
                  <span className="font-semibold text-slate-900">${s.aportesAcumulados.toLocaleString("es-AR")}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Grid Interactivo */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Carga de Transacciones (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            <Card className="border-slate-200/80 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">Cargar Gasto / Aporte de Socio</CardTitle>
                <CardDescription>Los balances cruzados se calculan dinámicamente según el porcentaje accionario.</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCargarTransaccion} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="socio">Socio Involucrado</Label>
                    <select 
                      id="socio"
                      value={transSocioId}
                      onChange={e => setTransSocioId(Number(e.target.value))}
                      className="w-full h-10 px-3 border rounded-md border-slate-200 bg-white text-sm"
                    >
                      {socios.map(s => (
                        <option key={s.id} value={s.id}>{s.nombre}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="tipo">Tipo de Operación</Label>
                    <div className="grid grid-cols-3 gap-2">
                      {["Gasto", "Aporte", "Retiro"].map(t => (
                        <Button 
                          key={t}
                          type="button"
                          variant={transTipo === t ? "default" : "outline"}
                          className={`h-9 text-xs font-semibold ${transTipo === t ? "bg-blue-600 text-white" : "border-slate-200 text-slate-600"}`}
                          onClick={() => setTransTipo(t as any)}
                        >
                          {t}
                        </Button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="concepto">Concepto / Descripción</Label>
                    <Input id="concepto" value={transConcepto} onChange={e => setTransConcepto(e.target.value)} placeholder="Ej: Compra de insumos descartables" required />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="monto">Monto de la Operación ($)</Label>
                    <Input id="monto" type="number" value={transMonto} onChange={e => setTransMonto(Number(e.target.value))} required />
                  </div>

                  <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium">
                    <Plus className="mr-1 h-4 w-4" /> Cargar Transacción
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Simulador de Split de Ganancias */}
            <Card className="border-slate-200/80 shadow-sm bg-gradient-to-br from-blue-50/50 to-slate-50">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Scale className="h-5 w-5 text-blue-600" /> Liquidar Ganancias Netas
                </CardTitle>
                <CardDescription>Simulá el reparto de caja del mes según las cuotas partes.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="ganancia">Ganancia Neta a Repartir ($)</Label>
                  <Input id="ganancia" type="number" value={gananciaNeta} onChange={e => setGananciaNeta(Number(e.target.value))} />
                </div>
                <div className="space-y-2.5 pt-2 border-t border-slate-200">
                  {socios.map(s => {
                    const pagoSocio = (gananciaNeta * s.porcentaje) / 100
                    const netoConCompensacion = pagoSocio + s.balance
                    return (
                      <div key={s.id} className="flex justify-between items-center text-sm">
                        <span className="font-medium text-slate-700">{s.nombre.split(" ")[0]} ({s.porcentaje}%):</span>
                        <div className="text-right">
                          <span className="font-bold text-slate-900 block">${pagoSocio.toLocaleString("es-AR")}</span>
                          <span className="text-[10px] text-slate-400">Neto c/compensación: ${netoConCompensacion.toLocaleString("es-AR")}</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Historial de Movimientos de Socios (7 cols) */}
          <div className="lg:col-span-7">
            <Card className="border-slate-200/80 shadow-sm h-full flex flex-col">
              <CardHeader>
                <CardTitle className="text-lg">Libro Diario de Caja de Socios</CardTitle>
                <CardDescription>Detalle cronológico de los gastos e inversiones de cada socio.</CardDescription>
              </CardHeader>
              <CardContent className="flex-1 overflow-y-auto max-h-[550px]">
                <Table>
                  <TableHeader className="bg-slate-100/50">
                    <TableRow>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Socio</TableHead>
                      <TableHead>Detalle</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead className="text-right">Monto</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transacciones.map(t => (
                      <TableRow key={t.id}>
                        <TableCell className="text-xs text-slate-500">{t.fecha}</TableCell>
                        <TableCell className="font-medium text-slate-900">{t.socio.split(" ")[0]}</TableCell>
                        <TableCell className="text-slate-600 text-xs">{t.concepto}</TableCell>
                        <TableCell>
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium ${
                            t.tipo === "Gasto"
                              ? "bg-amber-100 text-amber-800"
                              : t.tipo === "Aporte"
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-rose-100 text-rose-800"
                          }`}>
                            {t.tipo}
                          </span>
                        </TableCell>
                        <TableCell className="text-right font-semibold text-slate-900">${t.monto.toLocaleString("es-AR")}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>

        </div>

      </div>
    </MotionPage>
  )
}
