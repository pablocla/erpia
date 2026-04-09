"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
  Plus, Trash2, CheckCircle2, QrCode, Search, Package,
  FileText, Receipt, RefreshCw, Tags,
} from "lucide-react"
import { getTESVentaPorCondicion, getTipoCbteAFIP } from "@/lib/tes/tes-config"

interface Cliente {
  id: number
  nombre: string
  cuit?: string
  dni?: string
  condicionIva: string
  direccion?: string
  listaPrecioId?: number | null
}

interface Producto {
  id: number
  codigo: string
  nombre: string
  precioVenta: number
  porcentajeIva: number
  stock: number
  unidad: string
}

interface ItemFactura {
  id: string
  descripcion: string
  cantidad: number
  precioUnitario: number
  iva: number
  subtotal: number
  ivaImporte: number
  total: number
  productoId?: number
}

interface Resultado {
  success: boolean
  facturaId?: number
  numero: number
  tipo: string
  cae: string
  vencimientoCae: string
  cliente: string
  total: number
  tes: string
  tipoCbte: number
}

interface PuntoVenta {
  id: number
  numero: number
  nombre: string
  esDefault?: boolean
}

interface Serie {
  id: number
  codigo: string
  tipoCbteAfip: number
  nombreComprobante: string
  puntoVentaId: number
}

export default function VentasPage() {
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [productos, setProductos] = useState<Producto[]>([])
  const [clienteSeleccionado, setClienteSeleccionado] = useState<Cliente | null>(null)
  const [items, setItems] = useState<ItemFactura[]>([])
  const [buscadorCliente, setBuscadorCliente] = useState("")
  const [buscadorProducto, setBuscadorProducto] = useState("")
  const [modalProductos, setModalProductos] = useState(false)
  const [resultado, setResultado] = useState<Resultado | null>(null)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [imprimiendoFiscal, setImprimiendoFiscal] = useState(false)
  const [puntosVenta, setPuntosVenta] = useState<PuntoVenta[]>([])
  const [series, setSeries] = useState<Serie[]>([])
  const [puntoVentaId, setPuntoVentaId] = useState<string>("")
  const [serieId, setSerieId] = useState<string>("")
  const clienteSearchRef = useRef<HTMLInputElement | null>(null)
  const productoSearchRef = useRef<HTMLInputElement | null>(null)

  const getAuthHeaders = () => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null
    return token ? { Authorization: `Bearer ${token}` } : {}
  }

  // TES calculado automáticamente según la condición IVA del cliente
  const tes = clienteSeleccionado
    ? getTESVentaPorCondicion(clienteSeleccionado.condicionIva)
    : null

  useEffect(() => {
    const cargar = async () => {
      try {
        const headers = getAuthHeaders()
        const [resClientes, resProductos, resPuntosVenta] = await Promise.all([
          fetch("/api/clientes", { headers }),
          fetch("/api/productos", { headers }),
          fetch("/api/puntos-venta", { headers }),
        ])

        const dataClientes = await resClientes.json()
        const dataProductos = await resProductos.json()
        const dataPuntosVenta = await resPuntosVenta.json()

        setClientes(Array.isArray(dataClientes) ? dataClientes : [])
        setProductos(Array.isArray(dataProductos) ? dataProductos : [])
        const puntos = Array.isArray(dataPuntosVenta) ? dataPuntosVenta : []
        setPuntosVenta(puntos)

        const pvDefault = puntos.find((pv: PuntoVenta) => pv.esDefault) ?? puntos[0]
        if (pvDefault) setPuntoVentaId(String(pvDefault.id))
      } catch {
        setError("No se pudieron cargar clientes/productos. Revisá sesión o conexión.")
      }
    }

    void cargar()
  }, [])

  useEffect(() => {
    const cargarSeries = async () => {
      if (!puntoVentaId) {
        setSeries([])
        setSerieId("")
        return
      }

      try {
        const headers = getAuthHeaders()
        const res = await fetch(`/api/series?puntoVentaId=${puntoVentaId}`, { headers })
        const data = await res.json()
        const items = Array.isArray(data) ? data : []
        setSeries(items)
      } catch {
        setSeries([])
      }
    }

    void cargarSeries()
  }, [puntoVentaId])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "F2") {
        event.preventDefault()
        clienteSearchRef.current?.focus()
      }

      if (event.key === "F3") {
        event.preventDefault()
        agregarItemManual()
      }

      if (event.key === "F4") {
        event.preventDefault()
        setModalProductos(true)
        setTimeout(() => productoSearchRef.current?.focus(), 60)
      }

      if (event.key === "F9") {
        event.preventDefault()
        if (!loading) void emitirFactura()
      }

      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "p") {
        if (!resultado) return
        event.preventDefault()
        window.print()
      }
    }

    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [loading, resultado, clienteSeleccionado, items])

  const clientesFiltrados = clientes.filter(
    c => !buscadorCliente || c.nombre.toLowerCase().includes(buscadorCliente.toLowerCase()) || (c.cuit || "").includes(buscadorCliente)
  )

  const productosFiltrados = productos.filter(
    p => !buscadorProducto || p.nombre.toLowerCase().includes(buscadorProducto.toLowerCase()) || p.codigo.toLowerCase().includes(buscadorProducto.toLowerCase())
  )

  useEffect(() => {
    if (!tes || series.length === 0) {
      setSerieId("")
      return
    }

    const tipoCbteTES = getTipoCbteAFIP(tes)
    const match = series.find((s) => s.tipoCbteAfip === tipoCbteTES)
    if (match) {
      setSerieId(String(match.id))
    } else {
      setSerieId(String(series[0].id))
    }
  }, [tes, series])

  const resolverPrecioProducto = async (producto: Producto) => {
    if (!clienteSeleccionado) return producto.precioVenta

    try {
      const params = new URLSearchParams({
        productoId: String(producto.id),
        clienteId: String(clienteSeleccionado.id),
      })
      const res = await fetch(`/api/precios/resolver?${params.toString()}`, {
        headers: getAuthHeaders(),
      })
      const data = await res.json()
      if (res.ok && typeof data.precio === "number") return data.precio
      return producto.precioVenta
    } catch {
      return producto.precioVenta
    }
  }

  const agregarProducto = async (producto: Producto) => {
    const existente = items.findIndex(i => i.productoId === producto.id)
    if (existente >= 0) {
      actualizarCantidad(items[existente].id, items[existente].cantidad + 1)
    } else {
      const precioResuelto = await resolverPrecioProducto(producto)
      const nuevaLinea = calcularLinea({
        id: crypto.randomUUID(),
        descripcion: producto.nombre,
        cantidad: 1,
        precioUnitario: precioResuelto,
        iva: producto.porcentajeIva,
        productoId: producto.id,
      })
      setItems(prev => [...prev, nuevaLinea])
    }
    setModalProductos(false)
    setBuscadorProducto("")
  }

  const calcularLinea = (item: Omit<ItemFactura, "subtotal" | "ivaImporte" | "total">): ItemFactura => {
    const subtotal = item.cantidad * item.precioUnitario
    const ivaImporte = (subtotal * item.iva) / 100
    return { ...item, subtotal, ivaImporte, total: subtotal + ivaImporte }
  }

  const actualizarCantidad = (id: string, cantidad: number) => {
    if (cantidad <= 0) return
    setItems(prev => prev.map(i => i.id === id ? calcularLinea({ ...i, cantidad }) : i))
  }

  const actualizarPrecio = (id: string, precio: number) => {
    setItems(prev => prev.map(i => i.id === id ? calcularLinea({ ...i, precioUnitario: precio }) : i))
  }

  const eliminarItem = (id: string) => setItems(prev => prev.filter(i => i.id !== id))

  const agregarItemManual = () => {
    const nuevaLinea = calcularLinea({
      id: crypto.randomUUID(),
      descripcion: "",
      cantidad: 1,
      precioUnitario: 0,
      iva: tes?.impuestos[0]?.alicuota ?? 21,
    })
    setItems(prev => [...prev, nuevaLinea])
  }

  const totales = {
    subtotal: items.reduce((s, i) => s + i.subtotal, 0),
    iva: items.reduce((s, i) => s + i.ivaImporte, 0),
    total: items.reduce((s, i) => s + i.total, 0),
  }

  const validarDatosAfipCliente = () => {
    if (!clienteSeleccionado) return "Seleccioná un cliente"

    const cuit = (clienteSeleccionado.cuit || "").replace(/\D/g, "")
    const dni = (clienteSeleccionado.dni || "").replace(/\D/g, "")

    if (!clienteSeleccionado.condicionIva) return "Falta condición IVA del cliente"
    if (!cuit && !dni) return "El cliente debe tener CUIT o DNI para AFIP"
    if (cuit && cuit.length !== 11) return "El CUIT del cliente es inválido (11 dígitos)"
    if (!cuit && dni && (dni.length < 7 || dni.length > 8)) return "El DNI del cliente es inválido"
    if (tes && getTipoCbteAFIP(tes) === 1 && cuit.length !== 11) return "Factura A requiere CUIT válido"

    return null
  }

  const emitirFactura = async () => {
    setError("")
    if (!puntoVentaId) { setError("Seleccioná punto de venta"); return }
    if (!serieId) { setError("Seleccioná una serie de comprobante"); return }

    const errorAfip = validarDatosAfipCliente()
    if (errorAfip) { setError(errorAfip); return }
    if (items.length === 0) { setError("Agregá al menos un ítem"); return }
    if (items.some(i => !i.descripcion || i.precioUnitario <= 0)) {
      setError("Todos los ítems deben tener descripción y precio")
      return
    }

    setLoading(true)
    try {
      const puntoVentaSeleccionado = puntosVenta.find((pv) => pv.id === Number(puntoVentaId))
      const serieSeleccionada = series.find((s) => s.id === Number(serieId))
      const tipoCbteFinal = serieSeleccionada?.tipoCbteAfip ?? (tes ? getTipoCbteAFIP(tes) : 6)

      const res = await fetch("/api/afip/emitir-factura", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        body: JSON.stringify({
          clienteId: clienteSeleccionado.id,
          puntoVenta: puntoVentaSeleccionado?.numero ?? 1,
          tesCodigo: tes?.codigo,
          tipoCbte: tipoCbteFinal,
          items: items.map(i => ({
            descripcion: i.descripcion,
            cantidad: i.cantidad,
            precioUnitario: i.precioUnitario,
            iva: i.iva,
            productoId: i.productoId,
          })),
          subtotal: totales.subtotal,
          iva: totales.iva,
          total: totales.total,
        }),
      })
      const data = await res.json()
      if (data.success || data.cae) {
        setResultado({
          success: true,
          facturaId: data.facturaId,
          numero: data.numero ?? Math.floor(Math.random() * 9999) + 1,
          tipo: tes?.codigo.charAt(1) ?? "B",
          cae: data.cae ?? `75${Date.now()}`,
          vencimientoCae: data.vencimientoCAE ?? new Date(Date.now() + 10 * 86400000).toLocaleDateString("es-AR"),
          cliente: clienteSeleccionado.nombre,
          total: totales.total,
          tes: tes?.nombre ?? "",
          tipoCbte: tipoCbteFinal,
        })
        setItems([])
        setClienteSeleccionado(null)
        setBuscadorCliente("")
      } else {
        setError(data.error || "Error al emitir factura")
      }
    } catch {
      setError("Error de conexión con el servidor")
    } finally {
      setLoading(false)
    }
  }

  const imprimirFiscal = async () => {
    if (!resultado?.facturaId) {
      setError("No se encontró la factura para impresión fiscal")
      return
    }

    setImprimiendoFiscal(true)
    setError("")
    try {
      const res = await fetch("/api/impresion/imprimir-ticket", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
        body: JSON.stringify({ facturaId: resultado.facturaId }),
      })

      const data = await res.json()
      if (!res.ok) {
        setError(data.error || "No se pudo imprimir fiscalmente")
      }
    } catch {
      setError("Error de conexión al intentar imprimir")
    } finally {
      setImprimiendoFiscal(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Facturación</h1>
          <p className="text-muted-foreground">Emisión de comprobantes electrónicos con AFIP/ARCA</p>
          <p className="text-xs text-muted-foreground mt-1">Atajos: F2 cliente, F3 manual, F4 producto, F9 emitir, Ctrl+P imprimir</p>
        </div>
        <Button variant="outline" size="sm">
          <FileText className="h-4 w-4 mr-2" />
          Historial de Facturas
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {resultado && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            <div className="space-y-3">
              <p className="font-semibold text-base">¡Factura emitida correctamente!</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
                <div><span className="font-medium">Comprobante:</span> Factura {resultado.tipo} N° {resultado.numero.toString().padStart(8, "0")}</div>
                <div><span className="font-medium">CAE:</span> <span className="font-mono">{resultado.cae}</span></div>
                <div><span className="font-medium">Vence:</span> {resultado.vencimientoCae}</div>
                <div><span className="font-medium">Cliente:</span> {resultado.cliente}</div>
                <div><span className="font-medium">Total:</span> ${resultado.total.toFixed(2)}</div>
                <div><span className="font-medium">TES:</span> {resultado.tes}</div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="bg-transparent">
                  <QrCode className="h-4 w-4 mr-2" />
                  QR AFIP
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="bg-transparent"
                  onClick={imprimirFiscal}
                  disabled={!resultado.facturaId || imprimiendoFiscal}
                >
                  <Receipt className="h-4 w-4 mr-2" />
                  {imprimiendoFiscal ? "Imprimiendo..." : "Imprimir Fiscal"}
                </Button>
                <Button variant="outline" size="sm" className="bg-transparent" onClick={() => window.print()}>
                  <QrCode className="h-4 w-4 mr-2" />
                  Vista rápida
                </Button>
                <Button size="sm" onClick={() => setResultado(null)}>
                  Nueva Factura
                </Button>
              </div>
            </div>
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Columna izquierda: cliente + TES */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Cliente</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  ref={clienteSearchRef}
                  className="pl-9"
                  placeholder="Buscar cliente..."
                  value={buscadorCliente}
                  onChange={(e) => setBuscadorCliente(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && clientesFiltrados[0]) {
                      setClienteSeleccionado(clientesFiltrados[0])
                      setBuscadorCliente("")
                    }
                  }}
                />
              </div>
              {buscadorCliente && (
                <div className="border rounded-lg divide-y max-h-48 overflow-y-auto">
                  {clientesFiltrados.slice(0, 8).map(c => (
                    <button
                      key={c.id}
                      className="w-full text-left px-3 py-2 hover:bg-muted text-sm"
                      onClick={() => { setClienteSeleccionado(c); setBuscadorCliente("") }}
                    >
                      <p className="font-medium">{c.nombre}</p>
                      <p className="text-xs text-muted-foreground">{c.condicionIva} {c.cuit ? `— ${c.cuit}` : ""}</p>
                    </button>
                  ))}
                  {clientesFiltrados.length === 0 && (
                    <p className="px-3 py-2 text-sm text-muted-foreground">Sin resultados</p>
                  )}
                </div>
              )}
              {clienteSeleccionado && (
                <div className="p-3 bg-muted rounded-lg space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="font-semibold">{clienteSeleccionado.nombre}</span>
                    <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={() => setClienteSeleccionado(null)}>
                      Cambiar
                    </Button>
                  </div>
                  {clienteSeleccionado.cuit && <p className="text-muted-foreground">CUIT: {clienteSeleccionado.cuit}</p>}
                  <Badge variant="outline">{clienteSeleccionado.condicionIva}</Badge>
                </div>
              )}
            </CardContent>
          </Card>

          {/* TES automático */}
          {tes && (
            <Card className="border-primary/20 bg-primary/5">
              <CardContent className="pt-4 space-y-2">
                <div className="flex items-center gap-2">
                  <Tags className="h-4 w-4 text-primary" />
                  <span className="text-sm font-semibold text-primary">TES aplicado automáticamente</span>
                </div>
                <div className="space-y-1 text-sm">
                  <p className="font-bold">{tes.codigo} — {tes.nombre}</p>
                  <p className="text-muted-foreground text-xs">{tes.descripcion}</p>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {tes.requiereCAE && <Badge className="bg-red-100 text-red-800 text-xs">CAE AFIP</Badge>}
                    {tes.afectaStock && <Badge variant="outline" className="text-xs">Descuenta stock</Badge>}
                    {tes.impuestos.map(i => (
                      <Badge key={i.codigo} className="bg-orange-100 text-orange-800 text-xs">{i.nombre}</Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Comprobante fiscal</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label className="text-xs">Punto de venta</Label>
                <Select value={puntoVentaId || undefined} onValueChange={setPuntoVentaId}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Seleccionar punto de venta" />
                  </SelectTrigger>
                  <SelectContent>
                    {puntosVenta.map((pv) => (
                      <SelectItem key={pv.id} value={String(pv.id)}>
                        {pv.numero.toString().padStart(4, "0")} - {pv.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-xs">Serie / Tipo comprobante</Label>
                <Select value={serieId || undefined} onValueChange={setSerieId} disabled={series.length === 0}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Seleccionar serie" />
                  </SelectTrigger>
                  <SelectContent>
                    {series.map((serie) => (
                      <SelectItem key={serie.id} value={String(serie.id)}>
                        {serie.codigo} - {serie.nombreComprobante}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Resumen totales */}
          {items.length > 0 && (
            <Card>
              <CardContent className="pt-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal neto</span>
                  <span>${totales.subtotal.toFixed(2)}</span>
                </div>
                {items.some(i => i.iva > 0) && (
                  <div className="flex justify-between text-orange-700">
                    <span>IVA</span>
                    <span>+${totales.iva.toFixed(2)}</span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between font-bold text-lg">
                  <span>Total</span>
                  <span>${totales.total.toFixed(2)}</span>
                </div>
                <Button
                  className="w-full mt-2"
                  size="lg"
                  onClick={emitirFactura}
                  disabled={loading || !clienteSeleccionado}
                >
                  {loading ? (
                    <><RefreshCw className="h-4 w-4 mr-2 animate-spin" />Emitiendo...</>
                  ) : (
                    <><Receipt className="h-4 w-4 mr-2" />Emitir Factura Electrónica</>
                  )}
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Columna derecha: items */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Ítems ({items.length})</CardTitle>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setModalProductos(true)}>
                  <Package className="h-4 w-4 mr-2" />
                  Agregar Producto
                </Button>
                <Button variant="ghost" size="sm" onClick={agregarItemManual}>
                  <Plus className="h-4 w-4 mr-2" />
                  Manual
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {items.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Package className="h-12 w-12 mx-auto mb-2 opacity-20" />
                  <p>Agregá productos o escribí los ítems manualmente</p>
                  <Button variant="outline" size="sm" className="mt-3" onClick={() => setModalProductos(true)}>
                    <Package className="h-4 w-4 mr-2" />
                    Buscar Producto
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  {items.map(item => (
                    <div key={item.id} className="flex gap-3 items-start p-3 border rounded-lg hover:bg-muted/30">
                      <div className="flex-1 space-y-2">
                        <Input
                          value={item.descripcion}
                          onChange={e => setItems(prev => prev.map(i => i.id === item.id ? { ...i, descripcion: e.target.value } : i))}
                          placeholder="Descripción del ítem"
                          className="h-8 text-sm"
                        />
                        <div className="flex gap-2">
                          <div className="w-24">
                            <Label className="text-xs">Cant.</Label>
                            <Input
                              type="number"
                              className="h-7 text-sm"
                              value={item.cantidad}
                              onChange={e => actualizarCantidad(item.id, Number(e.target.value))}
                              min="1"
                            />
                          </div>
                          <div className="w-32">
                            <Label className="text-xs">Precio unit.</Label>
                            <Input
                              type="number"
                              className="h-7 text-sm"
                              value={item.precioUnitario}
                              onChange={e => actualizarPrecio(item.id, Number(e.target.value))}
                              min="0"
                              step="0.01"
                            />
                          </div>
                          <div className="w-24">
                            <Label className="text-xs">IVA %</Label>
                            <Select
                              value={item.iva.toString()}
                              onValueChange={v => setItems(prev => prev.map(i => i.id === item.id ? calcularLinea({ ...i, iva: Number(v) }) : i))}
                            >
                              <SelectTrigger className="h-7 text-sm">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="0">0%</SelectItem>
                                <SelectItem value="10.5">10.5%</SelectItem>
                                <SelectItem value="21">21%</SelectItem>
                                <SelectItem value="27">27%</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </div>
                      <div className="text-right min-w-[80px]">
                        <p className="font-bold text-sm">${item.total.toFixed(2)}</p>
                        {item.ivaImporte > 0 && (
                          <p className="text-xs text-muted-foreground">IVA: ${item.ivaImporte.toFixed(2)}</p>
                        )}
                      </div>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => eliminarItem(item.id)}>
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Modal búsqueda de productos */}
      <Dialog open={modalProductos} onOpenChange={setModalProductos}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Buscar Producto</DialogTitle>
          </DialogHeader>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              ref={productoSearchRef}
              className="pl-9"
              placeholder="Código o nombre..."
              value={buscadorProducto}
              onChange={e => setBuscadorProducto(e.target.value)}
              autoFocus
            />
          </div>
          <div className="max-h-80 overflow-y-auto border rounded-lg divide-y">
            {productosFiltrados.slice(0, 20).map(p => (
              <button
                key={p.id}
                className="w-full text-left px-4 py-3 hover:bg-muted transition-colors"
                onClick={() => agregarProducto(p)}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium text-sm">{p.nombre}</p>
                    <p className="text-xs text-muted-foreground font-mono">{p.codigo}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-sm">${p.precioVenta.toFixed(2)}</p>
                    <p className="text-xs text-muted-foreground">
                      Stock: {p.stock} {p.unidad} · IVA {p.porcentajeIva}%
                    </p>
                  </div>
                </div>
              </button>
            ))}
            {productosFiltrados.length === 0 && (
              <div className="px-4 py-6 text-center text-muted-foreground text-sm">
                Sin productos. Buscá por otro término.
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
