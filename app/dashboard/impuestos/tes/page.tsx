"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Tags, Search, ChevronRight, ArrowUpCircle, ArrowDownCircle } from "lucide-react"
import type { TES } from "@/lib/tes/tes-config"

const TIPO_COLORES: Record<string, string> = {
  venta: "bg-green-100 text-green-800",
  compra: "bg-orange-100 text-orange-800",
  devolucion_venta: "bg-yellow-100 text-yellow-800",
  devolucion_compra: "bg-yellow-100 text-yellow-800",
  exportacion: "bg-blue-100 text-blue-800",
  importacion: "bg-purple-100 text-purple-800",
  interno: "bg-slate-100 text-slate-800",
}

export default function TESPage() {
  const [tesList, setTesList] = useState<TES[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [filtroTipo, setFiltroTipo] = useState("")
  const [tesSeleccionado, setTesSeleccionado] = useState<TES | null>(null)
  const [simSubtotal, setSimSubtotal] = useState("10000")
  const [simResultado, setSimResultado] = useState<Record<string, unknown> | null>(null)

  useEffect(() => {
    fetch("/api/tes")
      .then((r) => r.json())
      .then((data) => {
        // API returns { tes: TES[], paises: [...] }
        setTesList(Array.isArray(data) ? data : (data.tes ?? []))
        setLoading(false)
      })
  }, [])

  const simular = async (tes: TES) => {
    setTesSeleccionado(tes)
    const res = await fetch("/api/tes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tesCodigo: tes.codigo, subtotalNeto: parseFloat(simSubtotal) }),
    })
    const data = await res.json()
    setSimResultado(data)
  }

  const filtrados = tesList.filter((t) => {
    const matchSearch =
      !search ||
      t.codigo.toLowerCase().includes(search.toLowerCase()) ||
      t.nombre.toLowerCase().includes(search.toLowerCase())
    const matchTipo = !filtroTipo || t.tipo === filtroTipo
    return matchSearch && matchTipo
  })

  const tipos = [...new Set(tesList.map((t) => t.tipo))]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Tags className="h-7 w-7" />
          TES — Tipos de Entrada / Salida
        </h1>
        <p className="text-muted-foreground mt-1">
          Sistema de discriminación inteligente de impuestos por tipo de transacción. Cada TES define cómo
          se calculan los impuestos, qué cuentas se afectan y si genera movimiento de stock.
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Lista de TES */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardContent className="pt-4">
              <div className="flex gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    className="pl-9"
                    placeholder="Buscar por código o nombre..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
                <Select value={filtroTipo || "__todos__"} onValueChange={v => setFiltroTipo(v === "__todos__" ? "" : v)}>
                  <SelectTrigger className="w-44">
                    <SelectValue placeholder="Todos los tipos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__todos__">Todos</SelectItem>
                    {tipos.map((t) => (
                      <SelectItem key={t} value={t} className="capitalize">
                        {t.replace("_", " ")}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{filtrados.length} TES configurados</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8 text-muted-foreground">Cargando...</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Código</TableHead>
                      <TableHead>Nombre</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Oper.</TableHead>
                      <TableHead>Stock</TableHead>
                      <TableHead>CAE</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtrados.map((tes) => (
                      <TableRow
                        key={tes.codigo}
                        className={`cursor-pointer ${tesSeleccionado?.codigo === tes.codigo ? "bg-primary/5" : ""}`}
                        onClick={() => simular(tes)}
                      >
                        <TableCell className="font-mono font-bold text-sm">{tes.codigo}</TableCell>
                        <TableCell className="font-medium">{tes.nombre}</TableCell>
                        <TableCell>
                          <Badge className={TIPO_COLORES[tes.tipo] ?? ""}>
                            {tes.tipo.replace("_", " ")}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {tes.operacion === "E" ? (
                            <ArrowUpCircle className="h-4 w-4 text-green-600" title="Entrada" />
                          ) : (
                            <ArrowDownCircle className="h-4 w-4 text-red-600" title="Salida" />
                          )}
                        </TableCell>
                        <TableCell>
                          {tes.afectaStock ? (
                            <Badge className="bg-blue-100 text-blue-800">Sí</Badge>
                          ) : (
                            <span className="text-muted-foreground text-sm">No</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {tes.requiereCAE ? (
                            <Badge className="bg-red-100 text-red-800">AFIP</Badge>
                          ) : (
                            <span className="text-muted-foreground text-sm">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Panel detalle / simulador */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Simulador de Impuestos</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Subtotal neto ($)</Label>
                <Input
                  type="number"
                  value={simSubtotal}
                  onChange={(e) => setSimSubtotal(e.target.value)}
                  min="0"
                />
              </div>
              {tesSeleccionado && (
                <p className="text-xs text-muted-foreground">
                  Hacé click en un TES para simular los impuestos
                </p>
              )}
              {!tesSeleccionado && (
                <p className="text-xs text-muted-foreground">
                  ← Seleccioná un TES de la tabla
                </p>
              )}
            </CardContent>
          </Card>

          {tesSeleccionado && simResultado && (
            <Card className="border-primary/20">
              <CardHeader>
                <CardTitle className="text-sm">
                  {tesSeleccionado.codigo} — {tesSeleccionado.nombre}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-xs text-muted-foreground">{tesSeleccionado.descripcion}</p>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal neto</span>
                    <span>${(simResultado.subtotalNeto as number).toFixed(2)}</span>
                  </div>
                  {(simResultado.impuestos as { codigo: string; nombre: string; alicuota: number; monto: number }[]).map((imp) => (
                    <div key={imp.codigo} className="flex justify-between text-orange-700">
                      <span>{imp.nombre} ({imp.alicuota}%)</span>
                      <span>+${imp.monto.toFixed(2)}</span>
                    </div>
                  ))}
                  <div className="flex justify-between font-bold border-t pt-2">
                    <span>Total</span>
                    <span>${(simResultado.total as number).toFixed(2)}</span>
                  </div>
                </div>

                {/* Cuentas contables */}
                {(tesSeleccionado.cuentaVenta || tesSeleccionado.cuentaCompra) && (
                  <div className="border-t pt-3 space-y-1">
                    <p className="text-xs font-semibold text-muted-foreground">Cuentas afectadas</p>
                    {tesSeleccionado.cuentaVenta && (
                      <p className="text-xs">
                        <span className="font-mono bg-muted px-1 rounded">{tesSeleccionado.cuentaVenta}</span>
                        {" "}Ventas
                      </p>
                    )}
                    {tesSeleccionado.cuentaCompra && (
                      <p className="text-xs">
                        <span className="font-mono bg-muted px-1 rounded">{tesSeleccionado.cuentaCompra}</span>
                        {" "}Compras/CMV
                      </p>
                    )}
                    {tesSeleccionado.cuentaIVADebito && (
                      <p className="text-xs">
                        <span className="font-mono bg-muted px-1 rounded">{tesSeleccionado.cuentaIVADebito}</span>
                        {" "}IVA Débito Fiscal
                      </p>
                    )}
                    {tesSeleccionado.cuentaIVACredito && (
                      <p className="text-xs">
                        <span className="font-mono bg-muted px-1 rounded">{tesSeleccionado.cuentaIVACredito}</span>
                        {" "}IVA Crédito Fiscal
                      </p>
                    )}
                  </div>
                )}

                <div className="border-t pt-3 flex flex-wrap gap-1">
                  {tesSeleccionado.afectaStock && (
                    <Badge variant="outline" className="text-xs">Mueve stock</Badge>
                  )}
                  {tesSeleccionado.afectaCaja && (
                    <Badge variant="outline" className="text-xs">Afecta caja</Badge>
                  )}
                  {tesSeleccionado.requiereCAE && (
                    <Badge className="bg-red-100 text-red-800 text-xs">Requiere CAE</Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
