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
import { Truck, ChevronLeft, Calculator } from "lucide-react"
import Link from "next/link"

interface Grano { id: number; nombre: string; codigo: string }
interface Silo { id: number; nombre: string; capacidadTn: number; stockActualTn: number }
interface Proveedor { id: number; nombre: string }
interface Contrato { id: number; numero: string; grano: { nombre: string }; toneladasPactadas: number; toneladasEntregadas: number }

const NUM = (v: number, d = 0) =>
  new Intl.NumberFormat("es-AR", { minimumFractionDigits: d, maximumFractionDigits: d }).format(v)

export default function NuevoTicketPage() {
  const router = useRouter()
  const { toast } = useToast()

  const { data: granos } = useAuthFetch<Grano[]>("/api/agro/granos")
  const { data: silos } = useAuthFetch<Silo[]>("/api/agro/silos")
  const { data: contratosData } = useAuthFetch<{ contratos: Contrato[] }>("/api/agro/contratos?estado=abierto&tipo=compra")

  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    tipo: "entrada",
    granoId: "",
    siloId: "",
    contratoId: "",
    patente: "",
    conductor: "",
    pesoBruto: "",
    tara: "",
    humedad: "",
    impureza: "",
    proteina: "",
    cartaPorteNumero: "",
    observaciones: "",
  })

  const pesoBruto = Number(form.pesoBruto) || 0
  const tara = Number(form.tara) || 0
  const pesoNeto = Math.max(0, pesoBruto - tara)
  const humedad = Number(form.humedad) || 0
  const impureza = Number(form.impureza) || 0
  let factorCalidad = 1.0
  if (humedad > 13.5) factorCalidad -= (humedad - 13.5) * 0.01
  if (impureza > 2) factorCalidad -= (impureza - 2) * 0.01
  factorCalidad = Math.max(0.8, factorCalidad)
  const pesoLiquidable = pesoNeto * factorCalidad

  function set(field: string, value: string) {
    setForm(f => ({ ...f, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.granoId || !form.pesoBruto || !form.tara) {
      toast({ title: "Campos requeridos", description: "Grano, peso bruto y tara son obligatorios", variant: "destructive" })
      return
    }
    setSaving(true)
    try {
      const res = await authFetch("/api/agro/balanza", {
        method: "POST",
        body: JSON.stringify({
          tipo: form.tipo,
          granoId: Number(form.granoId),
          siloId: form.siloId ? Number(form.siloId) : undefined,
          contratoId: form.contratoId ? Number(form.contratoId) : undefined,
          patente: form.patente || undefined,
          conductor: form.conductor || undefined,
          pesoBruto: Number(form.pesoBruto),
          tara: Number(form.tara),
          humedad: form.humedad ? Number(form.humedad) : undefined,
          impureza: form.impureza ? Number(form.impureza) : undefined,
          proteina: form.proteina ? Number(form.proteina) : undefined,
          cartaPorteNumero: form.cartaPorteNumero || undefined,
          observaciones: form.observaciones || undefined,
        }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error ?? "Error al guardar")
      }
      const ticket = await res.json()
      toast({ title: `Ticket #${ticket.numero} creado`, description: `${NUM(pesoNeto)} kg neto de ${ticket.grano?.nombre}` })
      router.push("/dashboard/agro/balanza")
    } catch (err: unknown) {
      toast({ title: "Error", description: err instanceof Error ? err.message : "Error al crear ticket", variant: "destructive" })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/dashboard/agro/balanza">
            <ChevronLeft className="h-4 w-4 mr-1" /> Balanza
          </Link>
        </Button>
        <h1 className="text-2xl font-semibold">Nuevo ticket de balanza</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Datos básicos */}
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Truck className="h-4 w-4" /> Datos del ingreso</CardTitle></CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>Tipo *</Label>
              <Select value={form.tipo} onValueChange={v => set("tipo", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="entrada">↓ Entrada</SelectItem>
                  <SelectItem value="salida">↑ Salida</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Grano *</Label>
              <Select value={form.granoId} onValueChange={v => set("granoId", v)}>
                <SelectTrigger><SelectValue placeholder="Seleccionar grano..." /></SelectTrigger>
                <SelectContent>
                  {(granos ?? []).map(g => (
                    <SelectItem key={g.id} value={String(g.id)}>{g.nombre} ({g.codigo})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Silo destino</Label>
              <Select value={form.siloId} onValueChange={v => set("siloId", v)}>
                <SelectTrigger><SelectValue placeholder="Seleccionar silo..." /></SelectTrigger>
                <SelectContent>
                  {(silos ?? []).map(s => (
                    <SelectItem key={s.id} value={String(s.id)}>
                      {s.nombre} — {NUM(s.stockActualTn, 1)}/{NUM(s.capacidadTn, 1)} tn
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Contrato</Label>
              <Select value={form.contratoId} onValueChange={v => set("contratoId", v)}>
                <SelectTrigger><SelectValue placeholder="Seleccionar contrato..." /></SelectTrigger>
                <SelectContent>
                  {(contratosData?.contratos ?? []).map(c => (
                    <SelectItem key={c.id} value={String(c.id)}>
                      {c.numero} — {c.grano.nombre} ({NUM(c.toneladasEntregadas, 1)}/{NUM(c.toneladasPactadas, 1)} tn)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Patente del camión</Label>
              <Input
                placeholder="ABC123"
                value={form.patente}
                onChange={e => set("patente", e.target.value.toUpperCase())}
                className="font-mono"
              />
            </div>
            <div>
              <Label>Conductor</Label>
              <Input placeholder="Nombre del conductor" value={form.conductor} onChange={e => set("conductor", e.target.value)} />
            </div>
            <div>
              <Label>Carta de Porte (CPE)</Label>
              <Input placeholder="Número CPE AFIP" value={form.cartaPorteNumero} onChange={e => set("cartaPorteNumero", e.target.value)} className="font-mono" />
            </div>
          </CardContent>
        </Card>

        {/* Pesaje */}
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Calculator className="h-4 w-4" /> Pesaje</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <Label>Peso bruto (kg) *</Label>
                <Input type="number" min="0" step="1" placeholder="28000" value={form.pesoBruto} onChange={e => set("pesoBruto", e.target.value)} />
              </div>
              <div>
                <Label>Tara (kg) *</Label>
                <Input type="number" min="0" step="1" placeholder="9000" value={form.tara} onChange={e => set("tara", e.target.value)} />
              </div>
              <div>
                <Label>Peso neto (kg)</Label>
                <Input readOnly value={pesoNeto > 0 ? NUM(pesoNeto) : ""} className="bg-muted font-bold text-right" />
              </div>
            </div>

            <Separator />
            <p className="text-sm font-medium text-muted-foreground">Análisis de calidad (opcional)</p>

            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <Label>Humedad (%)</Label>
                <Input type="number" min="0" max="40" step="0.1" placeholder="13.5" value={form.humedad} onChange={e => set("humedad", e.target.value)} />
              </div>
              <div>
                <Label>Impureza (%)</Label>
                <Input type="number" min="0" max="20" step="0.1" placeholder="2.0" value={form.impureza} onChange={e => set("impureza", e.target.value)} />
              </div>
              <div>
                <Label>Proteína (%)</Label>
                <Input type="number" min="0" max="50" step="0.1" placeholder="36.0" value={form.proteina} onChange={e => set("proteina", e.target.value)} />
              </div>
            </div>

            {/* Resumen de calidad */}
            {pesoNeto > 0 && (
              <div className="rounded-lg bg-muted/50 p-4 grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-xs text-muted-foreground">Peso neto</p>
                  <p className="text-lg font-bold">{NUM(pesoNeto)} kg</p>
                  <p className="text-xs text-muted-foreground">{NUM(pesoNeto / 1000, 2)} tn</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Factor calidad</p>
                  <p className={`text-lg font-bold ${factorCalidad < 1 ? "text-amber-600" : "text-green-600"}`}>
                    {NUM(factorCalidad * 100, 2)}%
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Peso liquidable</p>
                  <p className="text-lg font-bold">{NUM(pesoLiquidable)} kg</p>
                  <p className="text-xs text-muted-foreground">{NUM(pesoLiquidable / 1000, 2)} tn</p>
                </div>
              </div>
            )}

            <div>
              <Label>Observaciones</Label>
              <Input placeholder="Notas adicionales..." value={form.observaciones} onChange={e => set("observaciones", e.target.value)} />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" asChild>
            <Link href="/dashboard/agro/balanza">Cancelar</Link>
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? "Guardando..." : "Guardar ticket"}
          </Button>
        </div>
      </form>
    </div>
  )
}
