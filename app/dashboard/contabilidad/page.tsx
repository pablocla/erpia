"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Download, Search, Loader2 } from "lucide-react"
import { authFetch } from "@/lib/stores"

interface CuentaContable {
  id: number
  codigo: string
  nombre: string
  imputable?: boolean
}

interface MovimientoMayor {
  id: number
  cuenta: string
  debe: number
  haber: number
  saldo: number
  asiento: { fecha: string; descripcion: string; numero: number }
}

interface LineaBalance {
  cuenta: string
  debe: number
  haber: number
  saldo: number
}

export default function ContabilidadPage() {
  const [desde, setDesde] = useState("")
  const [hasta, setHasta] = useState("")
  const [cuentaCodigo, setCuentaCodigo] = useState("")
  const [cuentas, setCuentas] = useState<CuentaContable[]>([])
  const [asientos, setAsientos] = useState<any[]>([])
  const [libroMayor, setLibroMayor] = useState<MovimientoMayor[]>([])
  const [balance, setBalance] = useState<LineaBalance[]>([])
  const [cargando, setCargando] = useState(false)

  useEffect(() => {
    authFetch("/api/contabilidad/plan-cuentas")
      .then((r) => r.json())
      .then((data) => {
        if (data.success && data.cuentas) {
          const imputables = data.cuentas.filter(
            (c: CuentaContable) => c.imputable !== false,
          )
          setCuentas(imputables)
          if (imputables.length > 0) {
            setCuentaCodigo((prev) => prev || imputables[0].codigo)
          }
        }
      })
      .catch(() => {})
  }, [])

  const buscarAsientos = async () => {
    if (!desde || !hasta) return
    setCargando(true)
    try {
      const res = await authFetch(
        `/api/contabilidad/asientos?fechaDesde=${desde}&fechaHasta=${hasta}`,
      )
      const data = await res.json()
      setAsientos(data.asientos ?? [])
    } catch (error) {
      console.error("Error al buscar asientos:", error)
    }
    setCargando(false)
  }

  const buscarLibroMayor = async () => {
    if (!desde || !hasta || !cuentaCodigo) return
    setCargando(true)
    try {
      const res = await authFetch(
        `/api/contabilidad/libro-mayor?cuenta=${encodeURIComponent(cuentaCodigo)}&fechaDesde=${desde}&fechaHasta=${hasta}`,
      )
      const data = await res.json()
      setLibroMayor(data.movimientos ?? [])
    } catch (error) {
      console.error("Error al buscar libro mayor:", error)
    }
    setCargando(false)
  }

  const buscarBalance = useCallback(async () => {
    setCargando(true)
    try {
      const res = await authFetch("/api/contabilidad/balance-sumas")
      const data = await res.json()
      setBalance(data.balance ?? [])
    } catch (error) {
      console.error("Error al buscar balance:", error)
    }
    setCargando(false)
  }, [])

  const exportarCSV = async (tipo: string) => {
    try {
      const params = new URLSearchParams({ tipo })
      if (desde) params.set("desde", desde)
      if (hasta) params.set("hasta", hasta)
      if (tipo === "mayor" && cuentaCodigo) params.set("cuenta", cuentaCodigo)
      const res = await authFetch(`/api/contabilidad/exportar-csv?${params}`)
      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `${tipo}-${desde || "todo"}-${hasta || "hoy"}.csv`
      a.click()
    } catch (error) {
      console.error("Error al exportar:", error)
    }
  }

  const totalesBalance = balance.reduce(
    (acc, c) => ({
      debe: acc.debe + c.debe,
      haber: acc.haber + c.haber,
      saldoDeudor: acc.saldoDeudor + (c.saldo > 0 ? c.saldo : 0),
      saldoAcreedor: acc.saldoAcreedor + (c.saldo < 0 ? Math.abs(c.saldo) : 0),
    }),
    { debe: 0, haber: 0, saldoDeudor: 0, saldoAcreedor: 0 },
  )

  const fmt = (n: number) =>
    `$${n.toLocaleString("es-AR", { minimumFractionDigits: 2 })}`

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Contabilidad</h1>
        <p className="text-muted-foreground">Gestión contable y libros obligatorios</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filtros de Búsqueda</CardTitle>
          <CardDescription>Seleccioná el rango de fechas y cuenta para el libro mayor</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="desde">Desde</Label>
              <Input id="desde" type="date" value={desde} onChange={(e) => setDesde(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="hasta">Hasta</Label>
              <Input id="hasta" type="date" value={hasta} onChange={(e) => setHasta(e.target.value)} />
            </div>
            <div>
              <Label>Cuenta (Libro Mayor)</Label>
              <Select value={cuentaCodigo} onValueChange={setCuentaCodigo}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar cuenta" />
                </SelectTrigger>
                <SelectContent>
                  {cuentas.map((c) => (
                    <SelectItem key={c.codigo} value={c.codigo}>
                      {c.codigo} — {c.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="diario" className="space-y-4">
        <TabsList>
          <TabsTrigger value="diario">Libro Diario</TabsTrigger>
          <TabsTrigger value="mayor">Libro Mayor</TabsTrigger>
          <TabsTrigger value="balance">Balance de Sumas y Saldos</TabsTrigger>
        </TabsList>

        <TabsContent value="diario" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Libro Diario</CardTitle>
                  <CardDescription>Registro cronológico de todos los asientos contables</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button onClick={buscarAsientos} disabled={cargando || !desde || !hasta}>
                    {cargando ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Search className="h-4 w-4 mr-2" />}
                    Buscar
                  </Button>
                  <Button variant="outline" onClick={() => exportarCSV("diario")}>
                    <Download className="h-4 w-4 mr-2" />
                    Exportar CSV
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Número</TableHead>
                    <TableHead>Descripción</TableHead>
                    <TableHead>Cuenta</TableHead>
                    <TableHead className="text-right">Debe</TableHead>
                    <TableHead className="text-right">Haber</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {asientos.map((asiento) =>
                    asiento.movimientos.map((mov: any, idx: number) => (
                      <TableRow key={`${asiento.id}-${idx}`}>
                        {idx === 0 && (
                          <>
                            <TableCell rowSpan={asiento.movimientos.length}>
                              {new Date(asiento.fecha).toLocaleDateString("es-AR")}
                            </TableCell>
                            <TableCell rowSpan={asiento.movimientos.length}>{asiento.numero}</TableCell>
                            <TableCell rowSpan={asiento.movimientos.length}>{asiento.descripcion}</TableCell>
                          </>
                        )}
                        <TableCell>{mov.cuenta}</TableCell>
                        <TableCell className="text-right">
                          {Number(mov.debe) > 0 ? fmt(Number(mov.debe)) : "-"}
                        </TableCell>
                        <TableCell className="text-right">
                          {Number(mov.haber) > 0 ? fmt(Number(mov.haber)) : "-"}
                        </TableCell>
                      </TableRow>
                    )),
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="mayor" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Libro Mayor</CardTitle>
                  <CardDescription>
                    Movimientos de la cuenta {cuentaCodigo || "—"} con saldo acumulado
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={buscarLibroMayor}
                    disabled={cargando || !desde || !hasta || !cuentaCodigo}
                  >
                    {cargando ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Search className="h-4 w-4 mr-2" />}
                    Buscar
                  </Button>
                  <Button variant="outline" onClick={() => exportarCSV("mayor")}>
                    <Download className="h-4 w-4 mr-2" />
                    Exportar CSV
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Descripción</TableHead>
                    <TableHead className="text-right">Debe</TableHead>
                    <TableHead className="text-right">Haber</TableHead>
                    <TableHead className="text-right">Saldo</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {libroMayor.map((mov) => (
                    <TableRow key={mov.id}>
                      <TableCell>
                        {new Date(mov.asiento.fecha).toLocaleDateString("es-AR")}
                      </TableCell>
                      <TableCell>{mov.asiento.descripcion}</TableCell>
                      <TableCell className="text-right">
                        {mov.debe > 0 ? fmt(mov.debe) : "-"}
                      </TableCell>
                      <TableCell className="text-right">
                        {mov.haber > 0 ? fmt(mov.haber) : "-"}
                      </TableCell>
                      <TableCell className="text-right font-semibold">{fmt(mov.saldo)}</TableCell>
                    </TableRow>
                  ))}
                  {libroMayor.length > 0 && (
                    <TableRow className="bg-muted font-semibold">
                      <TableCell colSpan={2}>Saldo final</TableCell>
                      <TableCell className="text-right">
                        {fmt(libroMayor.reduce((s, m) => s + m.debe, 0))}
                      </TableCell>
                      <TableCell className="text-right">
                        {fmt(libroMayor.reduce((s, m) => s + m.haber, 0))}
                      </TableCell>
                      <TableCell className="text-right">
                        {fmt(libroMayor[libroMayor.length - 1]?.saldo ?? 0)}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="balance" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Balance de Sumas y Saldos</CardTitle>
                  <CardDescription>Resumen de todas las cuentas contables</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button onClick={buscarBalance} disabled={cargando}>
                    {cargando ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Search className="h-4 w-4 mr-2" />}
                    Buscar
                  </Button>
                  <Button variant="outline" onClick={() => exportarCSV("balance")}>
                    <Download className="h-4 w-4 mr-2" />
                    Exportar CSV
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {balance.length > 0 && (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Cuenta</TableHead>
                      <TableHead className="text-right">Debe</TableHead>
                      <TableHead className="text-right">Haber</TableHead>
                      <TableHead className="text-right">Saldo Deudor</TableHead>
                      <TableHead className="text-right">Saldo Acreedor</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {balance.map((cuenta) => (
                      <TableRow key={cuenta.cuenta}>
                        <TableCell>{cuenta.cuenta}</TableCell>
                        <TableCell className="text-right">{fmt(cuenta.debe)}</TableCell>
                        <TableCell className="text-right">{fmt(cuenta.haber)}</TableCell>
                        <TableCell className="text-right">
                          {cuenta.saldo > 0 ? fmt(cuenta.saldo) : "-"}
                        </TableCell>
                        <TableCell className="text-right">
                          {cuenta.saldo < 0 ? fmt(Math.abs(cuenta.saldo)) : "-"}
                        </TableCell>
                      </TableRow>
                    ))}
                    <TableRow className="bg-muted font-bold">
                      <TableCell>TOTALES</TableCell>
                      <TableCell className="text-right">{fmt(totalesBalance.debe)}</TableCell>
                      <TableCell className="text-right">{fmt(totalesBalance.haber)}</TableCell>
                      <TableCell className="text-right">{fmt(totalesBalance.saldoDeudor)}</TableCell>
                      <TableCell className="text-right">{fmt(totalesBalance.saldoAcreedor)}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}