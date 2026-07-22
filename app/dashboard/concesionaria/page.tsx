"use client"

import { useState, useEffect, useCallback } from "react"
import { Topbar } from "@/components/topbar"
import { MotionPage } from "@/components/ui/motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Plus, Car, DollarSign, TrendingUp, RefreshCw, Trash2, Edit } from "lucide-react"
import { VehiculoFormDialog, type VehiculoData } from "@/components/concesionaria/vehiculo-form-dialog"
import { authFetch } from "@/lib/stores"
import { useToast } from "@/hooks/use-toast"

const fmt = (n: number) =>
  n.toLocaleString("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 })

const ESTADO_BADGE: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  preparacion: "outline",
  salon: "default",
  reservado: "secondary",
  vendido: "destructive",
}

export default function ConcesionariaPage() {
  const [vehiculos, setVehiculos] = useState<VehiculoData[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingVehiculo, setEditingVehiculo] = useState<VehiculoData | undefined>()
  const { toast } = useToast()

  const fetchVehiculos = useCallback(async () => {
    setLoading(true)
    try {
      const res = await authFetch("/api/concesionaria/vehiculos")
      if (res.ok) {
        setVehiculos(await res.json())
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchVehiculos()
  }, [fetchVehiculos])

  async function handleSaveVehiculo(data: VehiculoData) {
    const isEdit = !!data.id
    const url = isEdit ? `/api/concesionaria/vehiculos/${data.id}` : "/api/concesionaria/vehiculos"
    const method = isEdit ? "PUT" : "POST"

    const res = await authFetch(url, {
      method,
      body: JSON.stringify(data),
    })

    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      toast({ title: "Error", description: err.error || "No se pudo guardar", variant: "destructive" })
      throw new Error(err.error)
    }

    toast({ title: "Guardado exitoso" })
    fetchVehiculos()
  }

  async function handleDelete(id: number) {
    if (!confirm("¿Seguro que querés eliminar este vehículo?")) return
    const res = await authFetch(`/api/concesionaria/vehiculos/${id}`, { method: "DELETE" })
    if (res.ok) {
      toast({ title: "Vehículo eliminado" })
      fetchVehiculos()
    } else {
      toast({ title: "Error al eliminar", variant: "destructive" })
    }
  }

  const capitalInmovilizado = vehiculos
    .filter(v => v.estado !== "vendido" && !v.consignacion)
    .reduce((acc, v) => acc + Number(v.precioToma || 0), 0)

  const gananciaProyectada = vehiculos
    .filter(v => v.estado !== "vendido")
    .reduce((acc, v) => acc + (Number(v.precioVenta || 0) - Number(v.precioToma || 0)), 0)

  return (
    <MotionPage className="flex h-full flex-col">
      <Topbar />
      <div className="flex-1 p-6 space-y-6 max-w-7xl mx-auto w-full">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-2xl font-semibold">Flota y Vehículos</h2>
            <p className="text-muted-foreground">Inventario, tasaciones y estado general</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={fetchVehiculos} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
              Actualizar
            </Button>
            <Button onClick={() => { setEditingVehiculo(undefined); setDialogOpen(true) }}>
              <Plus className="mr-2 h-4 w-4" /> Ingresar Vehículo
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground flex items-center">
                <Car className="h-4 w-4 mr-2" /> Unidades en Stock
              </CardTitle>
            </CardHeader>
            <CardContent className="text-2xl font-bold">
              {vehiculos.filter(v => v.estado !== "vendido").length}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground flex items-center">
                <DollarSign className="h-4 w-4 mr-2" /> Capital Inmovilizado
              </CardTitle>
            </CardHeader>
            <CardContent className="text-2xl font-bold text-amber-600">
              {fmt(capitalInmovilizado)}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground flex items-center">
                <TrendingUp className="h-4 w-4 mr-2" /> Ganancia Proyectada
              </CardTitle>
            </CardHeader>
            <CardContent className="text-2xl font-bold text-emerald-600">
              {fmt(gananciaProyectada)}
            </CardContent>
          </Card>
        </div>
        
        <Card>
          <CardContent className="p-0">
            {vehiculos.length === 0 && !loading ? (
              <div className="p-12 text-center text-muted-foreground">
                <Car className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
                <p>No hay vehículos cargados en la flota.</p>
                <Button variant="outline" className="mt-4" onClick={() => setDialogOpen(true)}>
                  Agregar el primer vehículo
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-muted-foreground">
                      <th className="py-3 px-4">Vehículo</th>
                      <th className="py-3 px-4">Patente</th>
                      <th className="py-3 px-4 text-right">Kilómetros</th>
                      <th className="py-3 px-4 text-center">Estado</th>
                      <th className="py-3 px-4 text-right">Precio Venta</th>
                      <th className="py-3 px-4 text-right">Margen</th>
                      <th className="py-3 px-4"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {vehiculos.map(v => {
                      const margen = Number(v.precioVenta || 0) - Number(v.precioToma || 0)
                      return (
                        <tr key={v.id} className="border-b last:border-0 hover:bg-muted/30">
                          <td className="py-3 px-4">
                            <div className="font-medium">{v.marca} {v.modelo}</div>
                            <div className="text-xs text-muted-foreground">{v.anio} {v.consignacion ? "(Consignación)" : ""}</div>
                          </td>
                          <td className="py-3 px-4 font-mono">{v.patente}</td>
                          <td className="py-3 px-4 text-right">{Number(v.kilometros).toLocaleString("es-AR")} km</td>
                          <td className="py-3 px-4 text-center">
                            <Badge variant={ESTADO_BADGE[v.estado] || "default"} className="uppercase text-[10px]">
                              {v.estado}
                            </Badge>
                          </td>
                          <td className="py-3 px-4 text-right font-medium">{fmt(Number(v.precioVenta))}</td>
                          <td className="py-3 px-4 text-right text-emerald-600">
                            {!v.consignacion ? fmt(margen) : "Comisión"}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <Button variant="ghost" size="icon" onClick={() => { setEditingVehiculo(v); setDialogOpen(true) }}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="text-destructive" onClick={() => void handleDelete(v.id!)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      <VehiculoFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        initialData={editingVehiculo}
        onSave={handleSaveVehiculo}
      />
    </MotionPage>
  )
}
