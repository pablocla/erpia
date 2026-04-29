"use client"

import { useEffect, useState } from "react"
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

interface PlantillaReporte {
  id: number
  codigo: string
  nombre: string
  descripcion?: string | null
  orden: number
  activo: boolean
  metadata: {
    tipo: string
    motor: string
    contenido?: string
    version?: number
  }
}

export default function EditarPlantillaPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [previewLoading, setPreviewLoading] = useState(false)
  const [previewHtml, setPreviewHtml] = useState<string | null>(null)
  const [paramsJson, setParamsJson] = useState<string>("{}")
  const [plantilla, setPlantilla] = useState<PlantillaReporte | null>(null)
  const [form, setForm] = useState({
    codigo: "",
    nombre: "",
    descripcion: "",
    tipo: "factura",
    motor: "html",
    contenido: "",
    activo: true,
  })

  useEffect(() => {
    fetchPlantilla()
  }, [params.id])

  async function fetchPlantilla() {
    setLoading(true)
    try {
      const res = await fetch(`/api/reportes/plantillas/${params.id}`)
      if (!res.ok) throw new Error("No se encontró la plantilla")
      const data = await res.json()
      const plantillaData = data.plantilla as PlantillaReporte
      setPlantilla(plantillaData)
      setForm({
        codigo: plantillaData.codigo,
        nombre: plantillaData.nombre,
        descripcion: plantillaData.descripcion || "",
        tipo: plantillaData.metadata.tipo || "factura",
        motor: plantillaData.metadata.motor || "html",
        contenido: plantillaData.metadata.contenido || "",
        activo: plantillaData.activo,
      })
    } catch (error) {
      toast({ title: "Error", description: (error as Error).message || "No se pudo cargar la plantilla", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!plantilla) return
    setSaving(true)
    try {
      const res = await fetch(`/api/reportes/plantillas/${plantilla.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Error actualizando plantilla")
      toast({ title: "Guardado", description: "La plantilla se actualizó correctamente." })
      router.push("/dashboard/configuracion/reportes")
    } catch (error) {
      toast({ title: "Error", description: (error as Error).message, variant: "destructive" })
    } finally {
      setSaving(false)
    }
  }

  async function handlePreview() {
    if (!plantilla) return
    setPreviewLoading(true)
    setPreviewHtml(null)
    let params: Record<string, unknown> = {}
    try {
      params = JSON.parse(paramsJson)
    } catch {
      toast({ title: "Error", description: "Parámetros JSON inválidos", variant: "destructive" })
      setPreviewLoading(false)
      return
    }

    try {
      const res = await fetch("/api/reportes/render", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plantillaId: plantilla.id, parametros: params }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Error generando vista previa")
      setPreviewHtml(data.html ?? "")
      toast({ title: "Preview generada", description: "Mostrando resultado de la plantilla." })
    } catch (error) {
      toast({ title: "Error", description: (error as Error).message, variant: "destructive" })
    } finally {
      setPreviewLoading(false)
    }
  }

  if (loading) {
    return <div>Cargando plantilla...</div>
  }

  return (
    <div className="space-y-5">
      <div className="dashboard-surface rounded-xl p-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Editar plantilla de reporte</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Modificá el layout y la configuración de tu plantilla. Guardá cambios y probá la vista previa.
          </p>
        </div>
        <Link href="/dashboard/configuracion/reportes">
          <Button variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" /> Volver a plantillas
          </Button>
        </Link>
      </div>

      <Card>
        <CardContent className="space-y-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Nombre</Label>
                <Input value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label>Código</Label>
                <Input value={form.codigo} onChange={(e) => setForm({ ...form, codigo: e.target.value })} required />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Tipo de reporte</Label>
                <Select value={form.tipo} onValueChange={(value) => setForm({ ...form, tipo: value })}>
                  <SelectTrigger>
                    <SelectValue />
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
                <Select value={form.motor} onValueChange={(value) => setForm({ ...form, motor: value })}>
                  <SelectTrigger>
                    <SelectValue />
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
              <Textarea value={form.descripcion} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} rows={3} />
            </div>

            <div className="space-y-2">
              <Label>Contenido</Label>
              <Textarea
                value={form.contenido}
                onChange={(e) => setForm({ ...form, contenido: e.target.value })}
                rows={12}
                required
              />
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <Button type="submit" disabled={saving}>
                <Save className="h-4 w-4 mr-2" /> Guardar cambios
              </Button>
              <Button type="button" variant="secondary" disabled={previewLoading} onClick={handlePreview}>
                {previewLoading ? "Generando preview..." : "Generar preview"}
              </Button>
            </div>

            <div className="space-y-2">
              <Label>Parámetros de ejemplo (JSON)</Label>
              <Textarea
                value={paramsJson}
                onChange={(e) => setParamsJson(e.target.value)}
                rows={5}
              />
            </div>
          </form>
        </CardContent>
      </Card>

      <Card id="preview">
        <CardHeader>
          <CardTitle>Vista previa</CardTitle>
        </CardHeader>
        <CardContent>
          {previewHtml ? (
            <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: previewHtml }} />
          ) : form.motor === "html" ? (
            <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: form.contenido }} />
          ) : (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">El contenido Jasper se editó correctamente. Para previsualizar, exportalo a tu servicio Jasper o a un renderizador compatible.</p>
              <pre className="rounded-lg border bg-slate-950 p-4 text-xs text-slate-100 overflow-x-auto">{form.contenido}</pre>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
