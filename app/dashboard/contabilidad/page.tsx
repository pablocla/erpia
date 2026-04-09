"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Download, Search } from "lucide-react"

export default function ContabilidadPage() {
  const [desde, setDesde] = useState("")
  const [hasta, setHasta] = useState("")
  const [asientos, setAsientos] = useState<any[]>([])
  const [libroMayor, setLibroMayor] = useState<any[]>([])
  const [balance, setBalance] = useState<any>(null)
  const [cargando, setCargando] = useState(false)

  const buscarAsientos = async () => {
    setCargando(true)
    try {
      const token = localStorage.getItem("token")
      const res = await fetch(`/api/contabilidad/asientos?desde=${desde}&hasta=${hasta}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      setAsientos(data)
    } catch (error) {
      console.error("Error al buscar asientos:", error)
    }
    setCargando(false)
  }

  const buscarLibroMayor = async () => {
    setCargando(true)
    try {
      const token = localStorage.getItem("token")
      const res = await fetch(`/api/contabilidad/libro-mayor?desde=${desde}&hasta=${hasta}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      setLibroMayor(data)
    } catch (error) {
      console.error("Error al buscar libro mayor:", error)
    }
    setCargando(false)
  }

  const buscarBalance = async () => {
    setCargando(true)
    try {
      const token = localStorage.getItem("token")
      const res = await fetch(`/api/contabilidad/balance-sumas?desde=${desde}&hasta=${hasta}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      setBalance(data)
    } catch (error) {
      console.error("Error al buscar balance:", error)
    }
    setCargando(false)
  }

  const exportarCSV = async (tipo: string) => {
    try {
      const token = localStorage.getItem("token")
      const res = await fetch(`/api/contabilidad/exportar-csv?tipo=${tipo}&desde=${desde}&hasta=${hasta}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `${tipo}-${desde}-${hasta}.csv`
      a.click()
    } catch (error) {
      console.error("Error al exportar:", error)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Contabilidad</h1>
        <p className="text-muted-foreground">Gestión contable y libros obligatorios</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filtros de Búsqueda</CardTitle>
          <CardDescription>Selecciona el rango de fechas para consultar</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="desde">Desde</Label>
              <Input id="desde" type="date" value={desde} onChange={(e) => setDesde(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="hasta">Hasta</Label>
              <Input id="hasta" type="date" value={hasta} onChange={(e) => setHasta(e.target.value)} />
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
                  <Button onClick={buscarAsientos} disabled={cargando}>
                    <Search className="h-4 w-4 mr-2" />
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
                              {new Date(asiento.fecha).toLocaleDateString()}
                            </TableCell>
                            <TableCell rowSpan={asiento.movimientos.length}>{asiento.numero}</TableCell>
                            <TableCell rowSpan={asiento.movimientos.length}>{asiento.descripcion}</TableCell>
                          </>
                        )}
                        <TableCell>{mov.cuenta.nombre}</TableCell>
                        <TableCell className="text-right">
                          {mov.tipo === "DEBE" ? `$${mov.importe.toFixed(2)}` : "-"}
                        </TableCell>
                        <TableCell className="text-right">
                          {mov.tipo === "HABER" ? `$${mov.importe.toFixed(2)}` : "-"}
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
                  <CardDescription>Movimientos agrupados por cuenta contable</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button onClick={buscarLibroMayor} disabled={cargando}>
                    <Search className="h-4 w-4 mr-2" />
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
              <div className="space-y-6">
                {libroMayor.map((cuenta) => (
                  <div key={cuenta.codigo} className="border rounded-lg p-4">
                    <h3 className="font-semibold mb-2">
                      {cuenta.codigo} - {cuenta.nombre}
                    </h3>
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
                        {cuenta.movimientos.map((mov: any) => (
                          <TableRow key={mov.id}>
                            <TableCell>{new Date(mov.fecha).toLocaleDateString()}</TableCell>
                            <TableCell>{mov.descripcion}</TableCell>
                            <TableCell className="text-right">
                              {mov.tipo === "DEBE" ? `$${mov.importe.toFixed(2)}` : "-"}
                            </TableCell>
                            <TableCell className="text-right">
                              {mov.tipo === "HABER" ? `$${mov.importe.toFixed(2)}` : "-"}
                            </TableCell>
                            <TableCell className="text-right font-semibold">${mov.saldo.toFixed(2)}</TableCell>
                          </TableRow>
                        ))}
                        <TableRow className="bg-muted font-semibold">
                          <TableCell colSpan={2}>Total</TableCell>
                          <TableCell className="text-right">${cuenta.totalDebe.toFixed(2)}</TableCell>
                          <TableCell className="text-right">${cuenta.totalHaber.toFixed(2)}</TableCell>
                          <TableCell className="text-right">${cuenta.saldoFinal.toFixed(2)}</TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>
                ))}
              </div>
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
                    <Search className="h-4 w-4 mr-2" />
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
              {balance && (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Código</TableHead>
                      <TableHead>Cuenta</TableHead>
                      <TableHead className="text-right">Debe</TableHead>
                      <TableHead className="text-right">Haber</TableHead>
                      <TableHead className="text-right">Saldo Deudor</TableHead>
                      <TableHead className="text-right">Saldo Acreedor</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {balance.cuentas?.map((cuenta: any) => (
                      <TableRow key={cuenta.codigo}>
                        <TableCell>{cuenta.codigo}</TableCell>
                        <TableCell>{cuenta.nombre}</TableCell>
                        <TableCell className="text-right">${cuenta.debe.toFixed(2)}</TableCell>
                        <TableCell className="text-right">${cuenta.haber.toFixed(2)}</TableCell>
                        <TableCell className="text-right">
                          {cuenta.saldo > 0 ? `$${cuenta.saldo.toFixed(2)}` : "-"}
                        </TableCell>
                        <TableCell className="text-right">
                          {cuenta.saldo < 0 ? `$${Math.abs(cuenta.saldo).toFixed(2)}` : "-"}
                        </TableCell>
                      </TableRow>
                    ))}
                    <TableRow className="bg-muted font-bold">
                      <TableCell colSpan={2}>TOTALES</TableCell>
                      <TableCell className="text-right">${balance.totales?.debe.toFixed(2)}</TableCell>
                      <TableCell className="text-right">${balance.totales?.haber.toFixed(2)}</TableCell>
                      <TableCell className="text-right">${balance.totales?.saldoDeudor.toFixed(2)}</TableCell>
                      <TableCell className="text-right">${balance.totales?.saldoAcreedor.toFixed(2)}</TableCell>
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
