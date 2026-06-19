"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { useAuthFetch } from "@/hooks/use-auth-fetch"
import { authFetch } from "@/lib/stores"
import { useToast } from "@/hooks/use-toast"
import { DollarSign, ChevronLeft, Calculator } from "lucide-react"
import Link from "next/link"

interface Contrato { id: number; numero: string; grano: { nombre: string }; campana: string; proveedor: { id: number; nombre: string } | null }
interface Proveedor { id: number; nombre: string; cuit: string | null }

const ARS = (v: number) => new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(v)
const NUM = (v: number, d = 2) => new Intl.NumberFormat("es-AR", { minimumFractionDigits: d, maximumFractionDigits: d }).format(v)

export default function NuevaLiquidacionPage() {
  const router = useRouter()
  const { toast } = useToast()

  const { data: contratosData } = useAuthFetch<{ contratos: Contrato[] }>("/api/agro/contratos?estado=abierto&tipo=compra&limit=200")
  const { data: proveedores } = useAuthFetch<{ proveedores: Proveedor[] }>("/api/proveedores?limit=200")

  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    contratoId: "",
    proveedorId: "",
    campana: "2025/26",
    toneladasLiquidadas: "",
    precioUnitario: "",
    descuentoCalidad: "",
    observaciones: "",
  })

  function set(field: string, value: string) {
    setForm(f => ({ ...f, [field]: value }))
  }

  // Pre-llenar proveedor y campaña al seleccionar contrato
  function onContratoChange(contratoId: string) {
    set("contratoId", contratoId)
    const contrato = contratosData?.contratos.find(c => String(c.id) === contratoId)
    if (contrato) {
      if (contrato.proveedor) set("proveedorId", String(contrato.proveedor.id))
      set("campana", contrato.campana)
    }
  }

  // Cálculo en tiempo real
  const tn = Number(form.toneladasLiquidadas) || 0
  const precio = Number(form.precioUnitario) || 0
  const descuento = Number(form.descuentoCalidad) || 0
  const importeBruto = tn * precio
  let retencionGanancias = 0
  if (importeBruto > 500000) retencionGanancias = importeBruto * 0.15
  else if (importeBruto > 100000) retencionGanancias = importeBruto * 0.10
  const percepcionIva = importeBruto * 0.01
  const importeNeto = importeBruto - descuento - retencionGanancias - percepcionIva

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.contratoId || !form.proveedorId || !form.toneladasLiquidadas || !form.precioUnitario) {
      toast({ title: "Campos requeridos", variant: "destructive" })
      return
    }
    setSaving(true)
    try {
      const res = await authFetch("/api/agro/liquidaciones", {
        method: "POST",
        body: JSON.stringify({
          contratoId: Number(form.contratoId),
          proveedorId: Number(form.proveedorId),
          campana: form.campana,
          toneladasLiquidadas: Number(form.toneladasLiquidadas),
          precioUnitario: Number(form.precioUnitario),
          descuentoCalidad: descuento || undefined,
          observaciones: form.observaciones || undefined,
        }),
      })
      if (!res.ok) throw new Error((await res.json()).error)
      const liq = await res.json()
      toast({ title: `Liquidación ${liq.numero} creada`, description: `Neto: ${ARS(Number(liq.importeNeto))}` })
      router.push("/dashboard/agro/liquidaciones")
    } catch (err: unknown) {
      toast({ title: "Error", description: err instanceof Error ? err.message : "Error", variant: "destructive" })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/dashboard/agro/liquidaciones">
            <ChevronLeft className="h-4 w-4 mr-1" /> Liquidaciones
          </Link>
        </Button>
        <h1 className="text-2xl font-semibold">Nueva liquidación</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><DollarSign className="h-4 w-4" /> Datos</CardTitle></CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Label>Contrato *</Label>
              <Select value={form.contratoId} onValueChange={onContratoChange}>
                <SelectTrigger><SelectValue placeholder="Seleccionar contrato..." /></SelectTrigger>
                <SelectContent>
                  {(contratosData?.contratos ?? []).map(c => (
                    <SelectItem key={c.id} value={String(c.id)}>
                      {c.numero} — {c.grano.nombre} {c.campana} — {c.proveedor?.nombre ?? "Sin productor"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Productor *</Label>
              <Select value={form.proveedorId} onValueChange={v => set("proveedorId", v)}>
                <SelectTrigger><SelectValue placeholder="Seleccionar productor..." /></SelectTrigger>
                <SelectContent>
                  {(proveedores?.proveedores ?? []).map(p => (
                    <SelectItem key={p.id} value={String(p.id)}>{p.nombre}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Campaña *</Label>
              <Input value={form.campana} onChange={e => set("campana", e.target.value)} placeholder="2025/26" />
            </div>
            <div>
              <Label>Toneladas a liquidar *</Label>
              <Input type="number" min="0" step="0.001" placeholder="100" value={form.toneladasLiquidadas} onChange={e => set("toneladasLiquidadas", e.target.value)} />
            </div>
            <div>
              <Label>Precio por tonelada (ARS) *</Label>
              <Input type="number" min="0" step="0.01" placeholder="450000" value={form.precioUnitario} onChange={e => set("precioUnitario", e.target.value)} />
            </div>
            <div>
              <Label>Descuento por calidad (ARS)</Label>
              <Input type="number" min="0" step="0.01" placeholder="0" value={form.descuentoCalidad} onChange={e => set("descuentoCalidad", e.target.value)} />
            </div>
            <div>
              <Label>Observaciones</Label>
              <Input placeholder="Notas..." value={form.observaciones} onChange={e => set("observaciones", e.target.value)} />
            </div>
          </CardContent>
        </Card>

        {/* Calculadora en tiempo real */}
        {importeBruto > 0 && (
          <Card className="border-primary/30 bg-primary/5">
            <CardHeader><CardTitle className="flex items-center gap-2 text-sm"><Calculator className="h-4 w-4" /> Cálculo de retenciones (Res. 2300/07)</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Importe bruto ({NUM(tn, 3)} tn × {ARS(precio)}/tn)</span>
                  <span className="font-medium">{ARS(importeBruto)}</span>
                </div>
                {descuento > 0 && (
                  <div className="flex justify-between text-amber-600">
                    <span>− Descuento calidad</span>
                    <span>−{ARS(descuento)}</span>
                  </div>
                )}
                <div className="flex justify-between text-red-600">
                  <span>− Ret. Ganancias ({importeBruto > 500000 ? "15%" : importeBruto > 100000 ? "10%" : "0%"})</span>
                  <span>−{ARS(retencionGanancias)}</span>
                </div>
                <div className="flex justify-between text-red-600">
                  <span>− Percepción IVA (1%)</span>
                  <span>−{ARS(percepcionIva)}</span>
                </div>
                <Separator />
                <div className="flex justify-between text-base font-bold">
                  <span>Importe NETO a pagar</span>
                  <span className="text-primary">{ARS(importeNeto)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" asChild>
            <Link href="/dashboard/agro/liquidaciones">Cancelar</Link>
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? "Guardando..." : "Crear liquidación"}
          </Button>
        </div>
      </form>
    </div>
  )
}
