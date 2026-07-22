"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"

export type VehiculoData = {
  id?: number
  patente: string
  marca: string
  modelo: string
  anio: number | string
  kilometros: number | string
  estado: string
  precioToma: number | string
  precioVenta: number | string
  consignacion: boolean
  observaciones?: string
}

interface VehiculoFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialData?: VehiculoData
  onSave: (data: VehiculoData) => Promise<void>
}

export function VehiculoFormDialog({ open, onOpenChange, initialData, onSave }: VehiculoFormDialogProps) {
  const [formData, setFormData] = useState<VehiculoData>({
    patente: "", marca: "", modelo: "", anio: "", kilometros: "", estado: "salon", precioToma: "", precioVenta: "", consignacion: false, observaciones: ""
  })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (open) {
      setFormData(initialData || { patente: "", marca: "", modelo: "", anio: "", kilometros: "", estado: "salon", precioToma: "", precioVenta: "", consignacion: false, observaciones: "" })
    }
  }, [open, initialData])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      await onSave(formData)
      onOpenChange(false)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{initialData ? "Editar Vehículo" : "Nuevo Vehículo"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Patente</Label>
              <Input required value={formData.patente} onChange={(e) => setFormData({ ...formData, patente: e.target.value.toUpperCase() })} placeholder="AA123BB" />
            </div>
            <div className="space-y-2">
              <Label>Estado</Label>
              <Select value={formData.estado} onValueChange={(v) => setFormData({ ...formData, estado: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="preparacion">En Preparación</SelectItem>
                  <SelectItem value="salon">En Salón / Disponible</SelectItem>
                  <SelectItem value="reservado">Reservado</SelectItem>
                  <SelectItem value="vendido">Vendido</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Marca</Label>
              <Input required value={formData.marca} onChange={(e) => setFormData({ ...formData, marca: e.target.value })} placeholder="Ej. Toyota" />
            </div>
            <div className="space-y-2">
              <Label>Modelo</Label>
              <Input required value={formData.modelo} onChange={(e) => setFormData({ ...formData, modelo: e.target.value })} placeholder="Ej. Hilux SRX" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Año</Label>
              <Input type="number" required value={formData.anio} onChange={(e) => setFormData({ ...formData, anio: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Kilómetros</Label>
              <Input type="number" value={formData.kilometros} onChange={(e) => setFormData({ ...formData, kilometros: e.target.value })} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Precio de Toma (Costo)</Label>
              <Input type="number" value={formData.precioToma} onChange={(e) => setFormData({ ...formData, precioToma: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Precio de Venta</Label>
              <Input type="number" value={formData.precioVenta} onChange={(e) => setFormData({ ...formData, precioVenta: e.target.value })} />
            </div>
          </div>
          <div className="flex items-center space-x-2 pt-2 pb-2">
            <Switch checked={formData.consignacion} onCheckedChange={(v) => setFormData({ ...formData, consignacion: v })} />
            <Label>Venta a consignación (de terceros)</Label>
          </div>
          <div className="space-y-2">
            <Label>Observaciones</Label>
            <Input value={formData.observaciones || ""} onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })} placeholder="Detalles, abolladuras, accesorios..." />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Guardando..." : "Guardar Vehículo"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
