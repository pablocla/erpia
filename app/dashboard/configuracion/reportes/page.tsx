"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Trash2, Pencil, LayoutDashboard, Plus } from "lucide-react"
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

export default function ReportesConfiguracionPage() {
  const { toast } = useToast()
  const [plantillas, setPlantillas] = useState<PlantillaReporte[]>([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState<number | null>(null)

  useEffect(() => {
    fetchTemplates()
  }, [])

  async function fetchTemplates() {
    setLoading(true)
    try {
      const res = await fetch("/api/reportes/plantillas")
      if (!res.ok) throw new Error("No se pudieron cargar las plantillas")
      const data = await res.json()
      setPlantillas(data.plantillas || [])
    } catch (error) {
      toast({ title: "Error", description: (error as Error).message || "Error al cargar plantillas", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(id: number) {
    if (!confirm("¿Querés eliminar esta plantilla de reporte?")) return
    setDeleting(id)
    try {
      const res = await fetch(`/api/reportes/plantillas/${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error("No se pudo eliminar")
      toast({ title: "Eliminado", description: "Plantilla eliminada correctamente." })
      fetchTemplates()
    } catch (error) {
      toast({ title: "Error", description: (error as Error).message || "No se pudo eliminar", variant: "destructive" })
    } finally {
      setDeleting(null)
    }
  }

  return (
    <div className="space-y-5">
      <div className="dashboard-surface rounded-xl p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-medium text-primary mb-2">
              <LayoutDashboard className="h-3.5 w-3.5" />
              Reportes
            </div>
            <h1 className="text-2xl font-bold tracking-tight">Plantillas de Reportes</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Administrá los layouts de reporte y exportación. Cada plantilla puede guardarse como HTML o como diseño compatible con futuros motores Jasper.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/dashboard/configuracion/reportes/nuevo">
              <Button>
                <Plus className="h-4 w-4 mr-2" /> Nueva plantilla
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="grid gap-4">
        {loading ? (
          <Card>
            <CardContent>Cargando plantillas...</CardContent>
          </Card>
        ) : plantillas.length === 0 ? (
          <Card>
            <CardContent>No hay plantillas de reportes configuradas aún. Creá la primera para comenzar.</CardContent>
          </Card>
        ) : (
          plantillas.map((plantilla) => (
            <Card key={plantilla.id}>
              <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between pb-4">
                <div>
                  <CardTitle className="text-base">{plantilla.nombre}</CardTitle>
                  <p className="text-sm text-muted-foreground">{plantilla.descripcion || plantilla.codigo}</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge>{plantilla.metadata.tipo}</Badge>
                  <Badge variant="secondary">{plantilla.metadata.motor}</Badge>
                </div>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-[1fr_auto] items-start">
                <div className="space-y-2 text-sm text-muted-foreground">
                  <div><span className="font-medium">Código:</span> {plantilla.codigo}</div>
                  <div><span className="font-medium">Versión:</span> {plantilla.metadata.version ?? 1}</div>
                  <div><span className="font-medium">Orden:</span> {plantilla.orden ?? 0}</div>
                </div>
                <div className="flex flex-col gap-2 sm:justify-end">
                  <Link href={`/dashboard/configuracion/reportes/${plantilla.id}`}>
                    <Button variant="outline" className="w-full">
                      <Pencil className="h-4 w-4 mr-2" /> Editar
                    </Button>
                  </Link>
                  <Link href={`/dashboard/configuracion/reportes/${plantilla.id}#preview`}>
                    <Button className="w-full">Vista previa</Button>
                  </Link>
                  <Button
                    variant="destructive"
                    className="w-full"
                    disabled={deleting === plantilla.id}
                    onClick={() => handleDelete(plantilla.id)}
                  >
                    <Trash2 className="h-4 w-4 mr-2" /> Eliminar
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
