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
import { FileText, ChevronLeft } from "lucide-react"
import Link from "next/link"

interface Grano { id: number; nombre: string; codigo: string }
interface Proveedor { id: number; nombre: string; cuit: string | null }
interface Cliente { id: number; nombre: string; cuit: string | null }

const CAMPANAS = ["2025/26", "2024/25", "2023/24"]

export default function NuevoContratoPage() {
  const router = useRouter()
  const { toast } = useToast()

  const { data: granos } = useAuthFetch<Grano[]>("/api/agro/granos")
  const { data: proveedores } = useAuthFetch<{ proveedores: Proveedor[] }>("/api/proveedores?limit=200")
  const { data: clientes } = useAuthFetch<{ clientes: Cliente[] }>("/api/clientes?limit=200")

  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    tipo: "compra",
    granoId: "",
    proveedorId: "",
    clienteId: "",
    campana: "2025/26",
    toneladasPactadas: "",
    precioPacto: "",
    moneda: "ARS",
    fechaEntrega: "",
    observaciones: "",
  })

  function set(field: string, value: string) {
    setForm(f => ({ ...f, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.granoId || !form.campana || !form.toneladasPactadas) {
      toast({ title: "Campos requeridos", description: "Grano, campaña y toneladas son obligatorios", variant: "destructive" })
      return
    }
    setSaving(true)
    try {
      const res = await authFetch("/api/agro/contratos", {
        method: "POST",
        body: JSON.stringify({
          tipo: form.tipo,
          granoId: Number(form.granoId),
          proveedorId: form.tipo === "compra" && form.proveedorId ? Number(form.proveedorId) : undefined,
          clienteId: form.tipo === "venta" && form.clienteId ? Number(form.clienteId) : undefined,
          campana: form.campana,
          toneladasPactadas: Number(form.toneladasPactadas),
          precioPacto: form.precioPacto ? Number(form.precioPacto) : undefined,
          moneda: form.moneda,
          fechaEntrega: form.fechaEntrega || undefined,
          observaciones: form.observaciones || undefined,
        }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error ?? "Error al guardar")
      }
      const contrato = await res.json()
      toast({ title: `Contrato ${contrato.numero} creado` })
      router.push("/dashboard/agro/contratos")
    } catch (err: unknown) {
      toast({ title: "Error", description: err instanceof Error ? err.message : "Error al crear contrato", variant: "destructive" })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/dashboard/agro/contratos">
            <ChevronLeft className="h-4 w-4 mr-1" /> Contratos
          </Link>
        </Button>
        <h1 className="text-2xl font-semibold">Nuevo contrato</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><FileText className="h-4 w-4" /> Datos del contrato</CardTitle></CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>Tipo *</Label>
              <Select value={form.tipo} onValueChange={v => set("tipo", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="compra">Compra al productor</SelectItem>
                  <SelectItem value="venta">Venta a comprador</SelectItem>
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
              <Label>Campaña *</Label>
              <Select value={form.campana} onValueChange={v => set("campana", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CAMPANAS.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            {form.tipo === "compra" ? (
              <div>
                <Label>Productor</Label>
                <Select value={form.proveedorId} onValueChange={v => set("proveedorId", v)}>
                  <SelectTrigger><SelectValue placeholder="Seleccionar productor..." /></SelectTrigger>
                  <SelectContent>
                    {(proveedores?.proveedores ?? []).map(p => (
                      <SelectItem key={p.id} value={String(p.id)}>{p.nombre}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <div>
                <Label>Comprador</Label>
                <Select value={form.clienteId} onValueChange={v => set("clienteId", v)}>
                  <SelectTrigger><SelectValue placeholder="Seleccionar comprador..." /></SelectTrigger>
                  <SelectContent>
                    {(clientes?.clientes ?? []).map(c => (
                      <SelectItem key={c.id} value={String(c.id)}>{c.nombre}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Precio y toneladas</CardTitle></CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>Toneladas pactadas *</Label>
              <Input type="number" min="0" step="0.001" placeholder="500" value={form.toneladasPactadas} onChange={e => set("toneladasPactadas", e.target.value)} />
            </div>
            <div className="sm:col-span-2 grid grid-cols-2 gap-3">
              <div>
                <Label>Precio pactado (dejar vacío si "a fijar")</Label>
                <Input type="number" min="0" step="0.01" placeholder="450000" value={form.precioPacto} onChange={e => set("precioPacto", e.target.value)} />
              </div>
              <div>
                <Label>Moneda</Label>
                <Select value={form.moneda} onValueChange={v => set("moneda", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ARS">ARS — Peso argentino</SelectItem>
                    <SelectItem value="USD">USD — Dólar</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Fecha de entrega estimada</Label>
              <Input type="date" value={form.fechaEntrega} onChange={e => set("fechaEntrega", e.target.value)} />
            </div>
            <div>
              <Label>Observaciones</Label>
              <Input placeholder="Notas adicionales..." value={form.observaciones} onChange={e => set("observaciones", e.target.value)} />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" asChild>
            <Link href="/dashboard/agro/contratos">Cancelar</Link>
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? "Guardando..." : "Crear contrato"}
          </Button>
        </div>
      </form>
    </div>
  )
}
