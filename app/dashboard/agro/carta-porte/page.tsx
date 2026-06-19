"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { Truck, FileText, CheckCircle2 } from "lucide-react"

const ESTADOS = ["PENDIENTE", "ACTIVO", "CONFIRMADO", "ANULADO"] as const

type EstadoCPE = (typeof ESTADOS)[number]

export default function CartaPortePage() {
  const { toast } = useToast()
  const [estado, setEstado] = useState<EstadoCPE>("PENDIENTE")
  const [loading, setLoading] = useState(false)

  const [form, setForm] = useState({
    cuitOrigen: "",
    cuitDestino: "",
    renspa: "",
    grano: "Soja",
    toneladas: "",
    patente: "",
    conductor: "",
    localidadOrigen: "",
    localidadDestino: "",
  })

  function set(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  function nextEstado(curr: EstadoCPE): EstadoCPE {
    if (curr === "PENDIENTE") return "ACTIVO"
    if (curr === "ACTIVO") return "CONFIRMADO"
    return curr
  }

  async function handleEmitir(e: React.FormEvent) {
    e.preventDefault()
    if (!form.cuitOrigen || !form.cuitDestino || !form.toneladas || !form.patente) {
      toast({ title: "Completá campos obligatorios", variant: "destructive" })
      return
    }

    setLoading(true)
    await new Promise((r) => setTimeout(r, 500))
    const nuevo = nextEstado(estado)
    setEstado(nuevo)
    setLoading(false)

    toast({
      title: nuevo === "ACTIVO" ? "CPE emitida" : "CPE confirmada",
      description: "Integración AFIP disponible en Fase 2 con certificado digital",
    })
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Carta de Porte Electrónica (CPE)</h1>
          <p className="text-sm text-muted-foreground">Res. AFIP 5017/21 · Transporte de granos</p>
        </div>
        <Badge variant={estado === "CONFIRMADO" ? "default" : estado === "ANULADO" ? "destructive" : "secondary"}>
          Estado: {estado}
        </Badge>
      </div>

      <form onSubmit={handleEmitir} className="space-y-4">
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Truck className="h-4 w-4" /> Datos de transporte</CardTitle></CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>CUIT Origen *</Label>
              <Input placeholder="30-12345678-9" value={form.cuitOrigen} onChange={(e) => set("cuitOrigen", e.target.value)} className="font-mono" />
            </div>
            <div>
              <Label>CUIT Destino *</Label>
              <Input placeholder="30-98765432-1" value={form.cuitDestino} onChange={(e) => set("cuitDestino", e.target.value)} className="font-mono" />
            </div>
            <div>
              <Label>RENSPA</Label>
              <Input placeholder="12.345.6.78901/23" value={form.renspa} onChange={(e) => set("renspa", e.target.value)} className="font-mono" />
            </div>
            <div>
              <Label>Grano</Label>
              <Select value={form.grano} onValueChange={(v) => set("grano", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Soja">Soja</SelectItem>
                  <SelectItem value="Maíz">Maíz</SelectItem>
                  <SelectItem value="Trigo">Trigo</SelectItem>
                  <SelectItem value="Girasol">Girasol</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Toneladas brutas *</Label>
              <Input type="number" min="0" step="0.001" value={form.toneladas} onChange={(e) => set("toneladas", e.target.value)} />
            </div>
            <div>
              <Label>Patente camión *</Label>
              <Input placeholder="ABC123" value={form.patente} onChange={(e) => set("patente", e.target.value.toUpperCase())} className="font-mono" />
            </div>
            <div>
              <Label>Conductor</Label>
              <Input value={form.conductor} onChange={(e) => set("conductor", e.target.value)} />
            </div>
            <div>
              <Label>Origen</Label>
              <Input placeholder="Pergamino" value={form.localidadOrigen} onChange={(e) => set("localidadOrigen", e.target.value)} />
            </div>
            <div>
              <Label>Destino</Label>
              <Input placeholder="Rosario" value={form.localidadDestino} onChange={(e) => set("localidadDestino", e.target.value)} />
            </div>
          </CardContent>
        </Card>

        <Card className="border-dashed">
          <CardContent className="py-4 text-sm text-muted-foreground">
            <p>
              Este formulario ya está operativo a nivel ERP para workflow interno. La emisión real AFIP requiere
              certificado digital y conexión al web service CPE.
            </p>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={() => setEstado("ANULADO")}>
            Anular
          </Button>
          <Button type="submit" disabled={loading || estado === "ANULADO"}>
            <FileText className="mr-1 h-4 w-4" />
            {estado === "PENDIENTE" ? "Emitir CPE" : "Confirmar CPE"}
          </Button>
        </div>
      </form>

      {estado === "CONFIRMADO" && (
        <Card className="border-emerald-500/40 bg-emerald-500/5">
          <CardContent className="py-4 flex items-center gap-3 text-emerald-700">
            <CheckCircle2 className="h-5 w-5" />
            CPE confirmada. El camión ya puede circular con documentación validada.
          </CardContent>
        </Card>
      )}
    </div>
  )
}
