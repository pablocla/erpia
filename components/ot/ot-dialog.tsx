"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"
import { Loader2 } from "lucide-react"
import { getAuthHeaders } from "@/lib/stores/auth-store"

export function OTDialog({ open, onOpenChange, onSuccess }: { open: boolean, onOpenChange: (open: boolean) => void, onSuccess: () => void }) {
  const { toast } = useToast()
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    clienteId: "1", // TODO: Usar selector real de clientes
    titulo: "",
    descripcion: "",
    fechaPrometida: "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.titulo) {
      toast({ title: "Vehículo / Título requerido", variant: "destructive" })
      return
    }

    setSaving(true)
    try {
      const payload = {
        clienteId: parseInt(formData.clienteId),
        titulo: formData.titulo,
        descripcion: formData.descripcion || undefined,
        fechaPrometida: formData.fechaPrometida ? new Date(formData.fechaPrometida).toISOString() : undefined,
      }

      const res = await fetch("/api/ot", {
        method: "POST",
        headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || "Error al crear la orden")
      }

      toast({ title: "Orden de Servicio creada exitosamente" })
      onSuccess()
      onOpenChange(false)
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Error desconocido",
        variant: "destructive"
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Nueva Orden de Servicio</DialogTitle>
          <DialogDescription>
            Ingresa los datos de recepción del vehículo o equipo.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="titulo">Vehículo / Equipo</Label>
            <Input 
              id="titulo" 
              placeholder="Ej: Ford Focus 2018 (Patente AB123CD)" 
              value={formData.titulo}
              onChange={(e) => setFormData(p => ({ ...p, titulo: e.target.value }))}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="descripcion">Problema reportado</Label>
            <Textarea 
              id="descripcion" 
              placeholder="El cliente indica ruido al frenar..." 
              value={formData.descripcion}
              onChange={(e) => setFormData(p => ({ ...p, descripcion: e.target.value }))}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="fecha">Fecha Prometida (Opcional)</Label>
            <Input 
              id="fecha" 
              type="date" 
              value={formData.fechaPrometida}
              onChange={(e) => setFormData(p => ({ ...p, fechaPrometida: e.target.value }))}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Crear OT
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
