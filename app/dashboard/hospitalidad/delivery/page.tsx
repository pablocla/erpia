"use client"

import { useState, useEffect } from "react"
import { Topbar } from "@/components/topbar"
import { MotionPage } from "@/components/ui/motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Bike, Plus, Check, TrendingDown, DollarSign, MapPin, Phone, User, MonitorPlay } from "lucide-react"

interface PedidoDelivery {
  id: number
  cliente: string
  telefono: string
  direccion: string
  items: string
  total: number
  cadete: string
  estado: "En cocina" | "Listo para Despacho" | "En viaje" | "Entregado"
  canal: "WhatsApp" | "Teléfono" | "Web"
}

const INITIAL_PEDIDOS: PedidoDelivery[] = [
  {
    id: 1045,
    cliente: "Carlos Spina",
    telefono: "11-4567-8910",
    direccion: "Av. Corrientes 2340, CABA",
    items: "1x Burger Claver Doble, 1x Papas Fritas",
    total: 9500,
    cadete: "Ezequiel López",
    estado: "En cocina",
    canal: "WhatsApp"
  },
  {
    id: 1046,
    cliente: "Florencia Peña",
    telefono: "11-3456-7890",
    direccion: "Sarmiento 840, 4to B, CABA",
    items: "2x Pizza Muzarella, 1x Coca Cola 1.5L",
    total: 16000,
    cadete: "Mariano Silva",
    estado: "Listo para Despacho",
    canal: "Web"
  },
  {
    id: 1047,
    cliente: "Julio Bocca",
    telefono: "11-2345-6789",
    direccion: "Esmeralda 120, CABA",
    items: "1x Ensalada Caesar Premium, 1x Agua Mineral",
    total: 8200,
    cadete: "Ezequiel López",
    estado: "En viaje",
    canal: "Teléfono"
  }
]

export default function DeliveryPropioPage() {
  const [pedidos, setPedidos] = useState<PedidoDelivery[]>([])
  const [modalNuevoOpen, setModalNuevoOpen] = useState(false)
  const [totalVentasMes, setTotalVentasMes] = useState(850000) // Ventas acumuladas de demo
  
  // Formulario nuevo pedido
  const [cliente, setCliente] = useState("")
  const [telefono, setTelefono] = useState("")
  const [direccion, setDireccion] = useState("")
  const [items, setItems] = useState("")
  const [total, setTotal] = useState(12000)
  const [cadete, setCadete] = useState("Sin Asignar")

  useEffect(() => {
    const saved = localStorage.getItem("claver:delivery_pedidos")
    if (saved) {
      setPedidos(JSON.parse(saved))
    } else {
      setPedidos(INITIAL_PEDIDOS)
      localStorage.setItem("claver:delivery_pedidos", JSON.stringify(INITIAL_PEDIDOS))
    }
  }, [])

  const saveToStorage = (newPedidos: PedidoDelivery[]) => {
    setPedidos(newPedidos)
    localStorage.setItem("claver:delivery_pedidos", JSON.stringify(newPedidos))
  }

  const handleCrearPedido = (e: React.FormEvent) => {
    e.preventDefault()
    if (!cliente || !direccion) return

    const nuevo: PedidoDelivery = {
      id: Math.floor(1000 + Math.random() * 9000),
      cliente,
      telefono,
      direccion,
      items,
      total,
      cadete: cadete || "Ezequiel López",
      estado: "En cocina",
      canal: "Teléfono"
    }

    const actualizados = [nuevo, ...pedidos]
    saveToStorage(actualizados)
    setModalNuevoOpen(false)

    // Resetear form
    setCliente("")
    setTelefono("")
    setDireccion("")
    setItems("")
    setTotal(12000)
  }

  const updateEstado = (id: number, nuevoEstado: "Listo para Despacho" | "En viaje" | "Entregado") => {
    const actualizados = pedidos.map(p => {
      if (p.id === id) {
        // Si se entrega, se suma al total facturado para calcular el ahorro
        if (nuevoEstado === "Entregado" && p.estado !== "Entregado") {
          setTotalVentasMes(prev => prev + p.total)
        }
        return { ...p, estado: nuevoEstado }
      }
      return p
    })
    saveToStorage(actualizados)
  }

  // Cálculos de Ahorro
  const comisionPlataformaPromedio = 0.30 // 30% comision Rappi/PedidosYa
  const costoPlataformas = totalVentasMes * comisionPlataformaPromedio
  // Delivery Propio costo: pagamos $1200 por entrega al cadete (supongamos 100 entregas acumuladas)
  const costoEnviosPropios = (totalVentasMes / 12000) * 1200 + 19900 // envíos + suscripción mensual Claver
  const ahorroNeto = Math.round(costoPlataformas - costoEnviosPropios)

  return (
    <MotionPage className="flex h-full flex-col bg-slate-50">
      <Topbar />
      <div className="flex-1 p-6 space-y-6 overflow-y-auto max-w-7xl mx-auto w-full">
        
        {/* Encabezado */}
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
          <div>
            <h2 className="text-3xl font-extrabold tracking-tight text-slate-900">Delivery Propio (Anti-Rappi)</h2>
            <p className="text-slate-500">Maneja tu propia flota de cadetes y ahorrate las comisiones abusivas.</p>
          </div>
          <Button onClick={() => setModalNuevoOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-md">
            <Plus className="mr-2 h-4 w-4" /> Tomar Pedido Delivery
          </Button>
        </div>

        {/* Tarjetas comparativas de Ahorro Financiero */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="border-slate-200/80 shadow-sm">
            <CardHeader className="pb-2">
              <span className="text-xs text-slate-500 font-medium uppercase tracking-wider">Costo si usaras Rappi / PedidosYa</span>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-rose-600">${Math.round(costoPlataformas).toLocaleString("es-AR")}</div>
              <p className="text-xs text-slate-400 mt-1">Calculado sobre 30% de comisión base</p>
            </CardContent>
          </Card>

          <Card className="border-slate-200/80 shadow-sm">
            <CardHeader className="pb-2">
              <span className="text-xs text-slate-500 font-medium uppercase tracking-wider">Costo Flota Propia + Claver</span>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-emerald-600">${Math.round(costoEnviosPropios).toLocaleString("es-AR")}</div>
              <p className="text-xs text-slate-400 mt-1">Suscripción fija + honorario de cadetes</p>
            </CardContent>
          </Card>

          <Card className="border-emerald-200 bg-emerald-50/50 shadow-md">
            <CardHeader className="pb-2">
              <span className="text-xs text-emerald-800 font-bold uppercase tracking-wider flex items-center gap-1.5">
                <TrendingDown className="h-4 w-4" /> Ahorro Real Neto Acumulado
              </span>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-black text-emerald-700">${ahorroNeto.toLocaleString("es-AR")}</div>
              <p className="text-xs text-emerald-600 font-medium mt-1">¡Dinero que se quedó en tu negocio!</p>
            </CardContent>
          </Card>
        </div>

        {/* Lista de Pedidos en Curso */}
        <Card className="border-slate-200/80 shadow-sm">
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-xl">Pedidos de Delivery Activos</CardTitle>
              <CardDescription>Monitoreá los estados de preparación y despacho de los cadetes.</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader className="bg-slate-100/50">
                <TableRow>
                  <TableHead className="font-semibold text-slate-700">Pedido</TableHead>
                  <TableHead className="font-semibold text-slate-700">Cliente / Dirección</TableHead>
                  <TableHead className="font-semibold text-slate-700">Items Pedidos</TableHead>
                  <TableHead className="font-semibold text-slate-700 text-right">Total</TableHead>
                  <TableHead className="font-semibold text-slate-700">Cadete</TableHead>
                  <TableHead className="font-semibold text-slate-700 text-center">Estado</TableHead>
                  <TableHead className="font-semibold text-slate-700 text-right">Acción de Despacho</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pedidos.map(p => (
                  <TableRow key={p.id} className="hover:bg-slate-50/50 transition-colors">
                    <TableCell className="font-bold text-slate-900">
                      #{p.id}
                      <span className="block text-[10px] font-normal text-slate-400">Vía {p.canal}</span>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium text-slate-900">{p.cliente}</div>
                      <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                        <MapPin className="h-3 w-3 text-slate-400" /> {p.direccion}
                      </div>
                    </TableCell>
                    <TableCell className="text-slate-600 text-xs max-w-xs truncate">
                      {p.items}
                    </TableCell>
                    <TableCell className="text-right font-semibold text-slate-950">
                      ${p.total.toLocaleString("es-AR")}
                    </TableCell>
                    <TableCell className="text-slate-700 font-medium">
                      <div className="flex items-center gap-1.5">
                        <Bike className="h-4 w-4 text-slate-400" /> {p.cadete}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge 
                        className={
                          p.estado === "Entregado"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : p.estado === "En viaje"
                              ? "bg-blue-50 text-blue-700 border-blue-200"
                              : "bg-slate-100 text-slate-700 border-slate-200"
                        }
                        variant="outline"
                      >
                        {p.estado}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1.5">
                        {p.estado === "En cocina" && (
                          <Button 
                            size="sm" 
                            onClick={() => updateEstado(p.id, "Listo para Despacho")}
                            className="bg-slate-800 text-white hover:bg-slate-900 h-8"
                          >
                            Listo
                          </Button>
                        )}
                        {p.estado === "Listo para Despacho" && (
                          <Button 
                            size="sm" 
                            onClick={() => updateEstado(p.id, "En viaje")}
                            className="bg-blue-600 text-white hover:bg-blue-700 h-8"
                          >
                            Despachar
                          </Button>
                        )}
                        {p.estado === "En viaje" && (
                          <Button 
                            size="sm" 
                            onClick={() => updateEstado(p.id, "Entregado")}
                            className="bg-emerald-600 text-white hover:bg-emerald-700 h-8"
                          >
                            <Check className="h-4 w-4 mr-1" /> Entregado
                          </Button>
                        )}
                        {p.estado === "Entregado" && (
                          <span className="text-xs text-slate-400 font-medium">Completado</span>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Modal: Nuevo Pedido */}
      <Dialog open={modalNuevoOpen} onOpenChange={setModalNuevoOpen}>
        <DialogContent className="max-w-md bg-white border border-slate-200 shadow-xl rounded-xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">Tomar Pedido Delivery</DialogTitle>
            <DialogDescription>Registrá los datos del cliente para despachar con tu propio cadete.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCrearPedido} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="cliente">Nombre del Cliente</Label>
              <Input id="cliente" value={cliente} onChange={e => setCliente(e.target.value)} placeholder="Ej: Mariano Mastri" required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="telefono">Teléfono / WhatsApp</Label>
              <Input id="telefono" value={telefono} onChange={e => setTelefono(e.target.value)} placeholder="Ej: 11-5555-5555" required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="direccion">Dirección de Entrega</Label>
              <Input id="direccion" value={direccion} onChange={e => setDireccion(e.target.value)} placeholder="Ej: Belgrano 540, CABA" required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="items">Detalle del Pedido (Comida/Productos)</Label>
              <Input id="items" value={items} onChange={e => setItems(e.target.value)} placeholder="Ej: 2x Hamburguesas, 1x Papas Fritas" required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="total">Total a Cobrar ($)</Label>
                <Input id="total" type="number" value={total} onChange={e => setTotal(Number(e.target.value))} required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="cadete">Asignar Cadete</Label>
                <select 
                  id="cadete"
                  value={cadete}
                  onChange={e => setCadete(e.target.value)}
                  className="w-full h-10 px-3 border rounded-md border-slate-200 bg-white text-sm"
                >
                  <option value="Ezequiel López">Ezequiel López</option>
                  <option value="Mariano Silva">Mariano Silva</option>
                </select>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setModalNuevoOpen(false)}>Cancelar</Button>
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white">Ingresar Pedido</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </MotionPage>
  )
}
