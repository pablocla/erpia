"use client"

import { useState, useEffect, useCallback } from "react"
import { PageShell, PageHeader, KpiStrip } from "@/components/layout"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Wrench,
  Calculator,
  Plus,
  Trash2,
  CheckCircle2,
  FileText,
  DollarSign,
  Layers,
  Ruler,
  Building,
  Loader2,
  Sparkles,
} from "lucide-react"
import { authFetch } from "@/lib/stores/auth-store"
import { useToast } from "@/hooks/use-toast"

export default function FerreteriaPage() {
  const [clientes, setClientes] = useState<{ id: number; nombre: string }[]>([])
  const [platosOProductos, setProductos] = useState<{ id: number; nombre: string; precioVenta: number }[]>([])
  const { toast } = useToast()

  // Calculadora de Cortes
  const [largoBarra, setLargoBarra] = useState("6")
  const [precioBarra, setPrecioBarra] = useState("18000")
  const [cortesTexto, setCortesTexto] = useState("2.4, 2.4, 1.2")
  const [resultadoCorte, setResultadoCorte] = useState<{
    barrasNecesarias: number
    totalMetrosComprados: number
    totalMetrosCortados: number
    desperdicioMetros: number
    desperdicioPorcentaje: number
    costoTotal: number
    distribucionCortes: { barraNum: number; cortes: number[]; sobrante: number }[]
  } | null>(null)
  const [calculando, setCalculando] = useState(false)

  // Presupuesto de Obra
  const [clienteId, setClienteId] = useState("")
  const [nombreObra, setNombreObra] = useState("")
  const [direccionEntrega, setDireccionEntrega] = useState("")
  const [items, setItems] = useState<
    { nombre: string; unidad: "unidad" | "metro" | "kg" | "m2" | "bolsa"; cantidad: number; precioUnitario: number }[]
  >([
    { nombre: "Hierro del 8", unidad: "unidad", cantidad: 10, precioUnitario: 8500 },
    { nombre: "Cemento Loma Negra 50kg", unidad: "bolsa", cantidad: 20, precioUnitario: 9200 },
  ])
  const [guardandoPresupuesto, setGuardandoPresupuesto] = useState(false)

  useEffect(() => {
    authFetch("/api/clientes")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setClientes(data)
        else if (data.clientes) setClientes(data.clientes)
      })
      .catch(() => {})
  }, [])

  const handleCalcularCorte = async () => {
    const cortes = cortesTexto
      .split(/[,;\n]/)
      .map((c) => parseFloat(c.trim()))
      .filter((c) => !isNaN(c) && c > 0)

    if (cortes.length === 0) {
      toast({ title: "Cortes inválidos", description: "Ingresá al menos una medida (ej: 2.4, 1.8).", variant: "destructive" })
      return
    }

    setCalculando(true)
    try {
      const res = await authFetch("/api/ferreteria/presupuestos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "calcular_corte",
          largoBarraMetros: parseFloat(largoBarra) || 6,
          precioPorBarra: parseFloat(precioBarra) || 0,
          cortesRequeridosMetros: cortes,
        }),
      })
      const data = await res.json()
      if (data.ok) setResultadoCorte(data.resultado)
    } catch {
      toast({ title: "Error", description: "No se pudo calcular.", variant: "destructive" })
    } finally {
      setCalculando(false)
    }
  }

  const handleCrearPresupuesto = async () => {
    if (!clienteId) {
      toast({ title: "Seleccioná un cliente", description: "Es necesario asociar la obra a un cliente.", variant: "destructive" })
      return
    }

    setGuardandoPresupuesto(true)
    try {
      const res = await authFetch("/api/ferreteria/presupuestos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clienteId: parseInt(clienteId, 10),
          nombreObra,
          direccionEntrega,
          items,
        }),
      })
      const data = await res.json()
      if (data.ok) {
        toast({
          title: "¡Presupuesto Creado!",
          description: `Cotización ${data.presupuesto.numero} generada con éxito.`,
        })
        setNombreObra("")
        setDireccionEntrega("")
      }
    } catch {
      toast({ title: "Error", description: "No se pudo guardar el presupuesto.", variant: "destructive" })
    } finally {
      setGuardandoPresupuesto(false)
    }
  }

  const totalPresupuesto = items.reduce((sum, it) => sum + it.cantidad * it.precioUnitario, 0)

  return (
    <PageShell>
      <PageHeader
        title="Ferretería & Corralón de Materiales"
        description="Calculadora de cortes con merma, venta fraccionada (metros, kilos) y presupuestos de obra."
        badge={
          <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/5 px-2.5 py-0.5 text-xs font-medium text-primary">
            <Wrench className="h-3 w-3" />
            Ferretería y Corralón
          </span>
        }
      />

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Calculadora de Cortes de Perfiles / Caños */}
        <Card className="flex flex-col justify-between">
          <CardHeader>
            <div className="flex items-center gap-2 text-primary">
              <Ruler className="h-5 w-5" />
              <CardTitle className="text-base">Optimizador de Cortes (Barras / Perfiles)</CardTitle>
            </div>
            <CardDescription className="text-xs">
              Calcula cuántas barras comprar para un pedido de cortes, minimizando el desperdicio.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Largo de barra estándar (m)</Label>
                <Input value={largoBarra} onChange={(e) => setLargoBarra(e.target.value)} placeholder="6" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Precio por barra ($)</Label>
                <Input value={precioBarra} onChange={(e) => setPrecioBarra(e.target.value)} placeholder="18000" />
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Medidas requeridas en metros (separadas por coma)</Label>
              <Input
                value={cortesTexto}
                onChange={(e) => setCortesTexto(e.target.value)}
                placeholder="2.4, 2.4, 1.2, 0.8, 3.0"
              />
            </div>

            <Button onClick={handleCalcularCorte} disabled={calculando} className="w-full">
              {calculando ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : <Calculator className="h-4 w-4 mr-1.5" />}
              Calcular Mermas y Barras Necesarias
            </Button>

            {resultadoCorte && (
              <div className="p-3.5 rounded-xl border bg-muted/40 space-y-2.5">
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="bg-background rounded-lg p-2 border">
                    <p className="text-[10px] text-muted-foreground uppercase">Barras a Comprar</p>
                    <p className="text-base font-bold text-primary">{resultadoCorte.barrasNecesarias}</p>
                  </div>
                  <div className="bg-background rounded-lg p-2 border">
                    <p className="text-[10px] text-muted-foreground uppercase">Costo Total</p>
                    <p className="text-base font-bold text-emerald-600">${resultadoCorte.costoTotal.toLocaleString("es-AR")}</p>
                  </div>
                  <div className="bg-background rounded-lg p-2 border">
                    <p className="text-[10px] text-muted-foreground uppercase">Desperdicio</p>
                    <p className="text-base font-bold text-amber-600">{resultadoCorte.desperdicioPorcentaje}% ({resultadoCorte.desperdicioMetros}m)</p>
                  </div>
                </div>

                <div className="space-y-1 text-[11px]">
                  <p className="font-semibold text-muted-foreground">Distribución de cortes recomendada:</p>
                  {resultadoCorte.distribucionCortes.map((b) => (
                    <div key={b.barraNum} className="flex justify-between p-1.5 rounded bg-background border">
                      <span>Barra #{b.barraNum}: cortes [{b.cortes.join("m, ")}m]</span>
                      <span className="text-muted-foreground">Sobra: {b.sobrante.toFixed(2)}m</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Presupuesto de Obra con Seña */}
        <Card className="flex flex-col justify-between">
          <CardHeader>
            <div className="flex items-center gap-2 text-primary">
              <Building className="h-5 w-5" />
              <CardTitle className="text-base">Presupuesto de Obra / Corralón</CardTitle>
            </div>
            <CardDescription className="text-xs">
              Armá cotizaciones para constructores con materiales fraccionados y reserva de stock.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-xs">
            <div className="space-y-1">
              <Label className="text-xs">Cliente / Constructor</Label>
              <Select value={clienteId} onValueChange={setClienteId}>
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue placeholder="Seleccionar cliente..." />
                </SelectTrigger>
                <SelectContent>
                  {clientes.map((c) => (
                    <SelectItem key={c.id} value={String(c.id)} className="text-xs">
                      {c.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Nombre de Obra / Lote</Label>
                <Input value={nombreObra} onChange={(e) => setNombreObra(e.target.value)} placeholder="Ej: Obra Don Bosco Lote 12" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Dirección de Entrega</Label>
                <Input value={direccionEntrega} onChange={(e) => setDireccionEntrega(e.target.value)} placeholder="Ej: Av. San Martín 4500" />
              </div>
            </div>

            {/* Ítems */}
            <div className="space-y-2 border-t pt-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold">Materiales y Cantidades</Label>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-[11px]"
                  onClick={() => setItems([...items, { nombre: "", unidad: "unidad", cantidad: 1, precioUnitario: 0 }])}
                >
                  <Plus className="h-3 w-3 mr-1" /> Agregar Material
                </Button>
              </div>

              <div className="space-y-2 max-h-40 overflow-y-auto">
                {items.map((it, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <Input
                      placeholder="Material"
                      className="text-xs flex-1"
                      value={it.nombre}
                      onChange={(e) => {
                        const copy = [...items]
                        copy[idx].nombre = e.target.value
                        setItems(copy)
                      }}
                    />
                    <Select
                      value={it.unidad}
                      onValueChange={(val: any) => {
                        const copy = [...items]
                        copy[idx].unidad = val
                        setItems(copy)
                      }}
                    >
                      <SelectTrigger className="w-20 h-8 text-[11px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="unidad">u.</SelectItem>
                        <SelectItem value="metro">m</SelectItem>
                        <SelectItem value="kg">kg</SelectItem>
                        <SelectItem value="m2">m²</SelectItem>
                        <SelectItem value="bolsa">bolsa</SelectItem>
                      </SelectContent>
                    </Select>
                    <Input
                      type="number"
                      className="w-16 h-8 text-xs text-center"
                      value={it.cantidad}
                      onChange={(e) => {
                        const copy = [...items]
                        copy[idx].cantidad = parseFloat(e.target.value) || 0
                        setItems(copy)
                      }}
                    />
                    <Input
                      type="number"
                      className="w-20 h-8 text-xs text-right"
                      value={it.precioUnitario}
                      onChange={(e) => {
                        const copy = [...items]
                        copy[idx].precioUnitario = parseFloat(e.target.value) || 0
                        setItems(copy)
                      }}
                    />
                    {items.length > 1 && (
                      <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => setItems(items.filter((_, i) => i !== idx))}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t font-semibold">
              <span>Total Cotización:</span>
              <span className="text-base text-emerald-600 font-bold">${totalPresupuesto.toLocaleString("es-AR")}</span>
            </div>

            <Button onClick={handleCrearPresupuesto} disabled={guardandoPresupuesto || items.length === 0} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white">
              {guardandoPresupuesto ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : <CheckCircle2 className="h-4 w-4 mr-1.5" />}
              Generar Presupuesto de Obra
            </Button>
          </CardContent>
        </Card>
      </div>
    </PageShell>
  )
}
