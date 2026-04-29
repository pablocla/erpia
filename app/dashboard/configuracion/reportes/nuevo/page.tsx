"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Save } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export default function NuevaPlantillaPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    codigo: "",
    nombre: "",
    descripcion: "",
    tipo: "factura",
    motor: "html",
    contenido: "",
  })

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSaving(true)
    try {
      const res = await fetch("/api/reportes/plantillas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || "Error creando plantilla")
      }
      toast({ title: "Plantilla creada", description: "La plantilla se guardó correctamente." })
      router.push("/dashboard/configuracion/reportes")
    } catch (error) {
      toast({ title: "Error", description: (error as Error).message, variant: "destructive" })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-5">
      <div className="dashboard-surface rounded-xl p-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Nueva plantilla de reporte</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Creá un layout que pueda editarse o reutilizarse. Usá motor "html" para vista rápida o "jasper" para diseños avanzados.
          </p>
        </div>
        <Link href="/dashboard/configuracion/reportes">
          <Button variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" /> Volver a plantillas
          </Button>
        </Link>
      </div>

      <Card>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Nombre</Label>
                <Input
                  value={form.nombre}
                  onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                  placeholder="Factura estándar"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Código</Label>
                <Input
                  value={form.codigo}
                  onChange={(e) => setForm({ ...form, codigo: e.target.value })}
                  placeholder="factura_estandar"
                  required
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Tipo de reporte</Label>
                <Select
                  value={form.tipo}
                  onValueChange={(value) => setForm({ ...form, tipo: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="factura">Factura</SelectItem>
                    <SelectItem value="remito">Remito</SelectItem>
                    <SelectItem value="cierre-z">Cierre Z</SelectItem>
                    <SelectItem value="otro">Otro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Motor</Label>
                <Select
                  value={form.motor}
                  onValueChange={(value) => setForm({ ...form, motor: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar motor" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="html">HTML</SelectItem>
                    <SelectItem value="jasper">JasperReports</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Descripción</Label>
              <Textarea
                value={form.descripcion}
                onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
                placeholder="Notas sobre la plantilla, por ejemplo: diseño para factura A/B/C"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label>Contenido del layout</Label>
              <Textarea
                value={form.contenido}
                onChange={(e) => setForm({ ...form, contenido: e.target.value })}
                placeholder="Pegá aquí tu HTML o XML JRXML para JasperReports"
                rows={12}
                required
              />
            </div>

            <Button type="submit" disabled={saving} className="w-full sm:w-auto">
              <Save className="h-4 w-4 mr-2" /> Guardar plantilla
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
