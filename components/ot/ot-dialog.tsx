"use client"

import { useEffect, useState } from "react"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { Loader2 } from "lucide-react"
import { getAuthHeaders } from "@/lib/stores/auth-store"
import {
  FUMIGACION_TIPOS_PLAGA,
  FUMIGACION_TIPOS_SERVICIO,
} from "@/lib/fumigacion/constants"

type ClienteOpt = { id: number; nombre: string; direccion?: string | null }

const hoyIso = () => new Date().toISOString().slice(0, 10)

export function OTDialog({
  open,
  onOpenChange,
  onSuccess,
  mode = "general",
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
  /** "fumigacion" muestra plaga / sitio / tipo de servicio */
  mode?: "general" | "fumigacion"
}) {
  const { toast } = useToast()
  const [saving, setSaving] = useState(false)
  const [clientes, setClientes] = useState<ClienteOpt[]>([])
  const [formData, setFormData] = useState({
    clienteSearch: "",
    clienteId: "",
    titulo: "",
    descripcion: "",
    fechaPrometida: hoyIso(),
    tecnicoAsignado: "",
    plaga: "cucarachas",
    tipoServicio: "tratamiento",
    sitio: "",
    precio: "45000",
  })

  useEffect(() => {
    if (!open) return
    fetch("/api/clientes?limit=50", { headers: getAuthHeaders() })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        const list = Array.isArray(data)
          ? data
          : Array.isArray(data?.clientes)
            ? data.clientes
            : Array.isArray(data?.data)
              ? data.data
              : []
        setClientes(
          list.map((c: ClienteOpt) => ({
            id: c.id,
            nombre: c.nombre,
            direccion: (c as { direccion?: string }).direccion ?? null,
          })),
        )
        if (list.length && !formData.clienteId) {
          const first = list[0]
          setFormData((p) => ({ ...p, clienteId: String(first.id), clienteSearch: `${first.nombre}${first.direccion ? ` · ${first.direccion}` : " · sin dirección"}` }))
        }
      })
      .catch(() => setClientes([]))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.clienteId) {
      toast({ title: "Seleccioná un cliente", variant: "destructive" })
      return
    }
    if (!formData.titulo.trim()) {
      toast({
        title: mode === "fumigacion" ? "Indicá el servicio / sitio" : "Título requerido",
        variant: "destructive",
      })
      return
    }

    setSaving(true)
    try {
      const precio = parseFloat(formData.precio) || 0
      const metadata =
        mode === "fumigacion"
          ? {
              plaga: formData.plaga,
              tipoServicio: formData.tipoServicio,
              sitio: formData.sitio || undefined,
              vertical: "fumigacion",
            }
          : { vertical: "servicio" }

      const payload = {
        clienteId: parseInt(formData.clienteId, 10),
        titulo: formData.titulo.trim(),
        descripcion: formData.descripcion || undefined,
        fechaPrometida: formData.fechaPrometida
          ? new Date(`${formData.fechaPrometida}T12:00:00`).toISOString()
          : undefined,
        tecnicoAsignado: formData.tecnicoAsignado || undefined,
        metadata,
        items:
          precio > 0
            ? [
                {
                  descripcion:
                    mode === "fumigacion"
                      ? `Tratamiento ${formData.plaga}${formData.sitio ? ` · ${formData.sitio}` : ""}`
                      : formData.titulo,
                  cantidad: 1,
                  precioUnitario: precio,
                  tipo: "MANO_OBRA" as const,
                },
              ]
            : [],
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

      toast({ title: "Orden de servicio creada" })
      onSuccess()
      onOpenChange(false)
      setFormData((p) => ({
        ...p,
        titulo: "",
        descripcion: "",
        sitio: "",
      }))
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Error desconocido",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === "fumigacion" ? "Nueva visita de fumigación" : "Nueva orden de servicio"}
          </DialogTitle>
          <DialogDescription>
            {mode === "fumigacion"
              ? "Cliente con dirección, plaga y fecha de visita para armar la hoja de ruta."
              : "Cliente, trabajo y fecha prometida."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4 py-2">
          <div className="grid gap-2">
            <Label>Cliente</Label>
            <Input
              list="clientesList"
              placeholder="Escribir para buscar cliente..."
              value={formData.clienteSearch}
              onChange={(e) => {
                const val = e.target.value
                const match = clientes.find(c => `${c.nombre}${c.direccion ? ` · ${c.direccion}` : " · sin dirección"}` === val)
                setFormData(p => ({
                  ...p,
                  clienteSearch: val,
                  clienteId: match ? String(match.id) : ""
                }))
              }}
            />
            <datalist id="clientesList">
              {clientes.map((c) => (
                <option key={c.id} value={`${c.nombre}${c.direccion ? ` · ${c.direccion}` : " · sin dirección"}`} />
              ))}
            </datalist>
            {clientes.length === 0 && (
              <p className="text-xs text-amber-600">
                No hay clientes. Cargá al menos uno con dirección en Clientes.
              </p>
            )}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="titulo">
              {mode === "fumigacion" ? "Título / sitio a tratar" : "Título del trabajo"}
            </Label>
            <Input
              id="titulo"
              placeholder={
                mode === "fumigacion"
                  ? "Ej: Cocina + depósito — Edificio Rivadavia"
                  : "Ej: Service split living / cambio filtro"
              }
              value={formData.titulo}
              onChange={(e) => setFormData((p) => ({ ...p, titulo: e.target.value }))}
            />
          </div>

          {mode === "fumigacion" && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-2">
                  <Label>Plaga / tratamiento</Label>
                  <Select
                    value={formData.plaga}
                    onValueChange={(v) => setFormData((p) => ({ ...p, plaga: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {FUMIGACION_TIPOS_PLAGA.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>Tipo de visita</Label>
                  <Select
                    value={formData.tipoServicio}
                    onValueChange={(v) => setFormData((p) => ({ ...p, tipoServicio: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {FUMIGACION_TIPOS_SERVICIO.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="sitio">Sitio / unidad (opcional)</Label>
                <Input
                  id="sitio"
                  placeholder="Ej: Local 3, sótano, terraza"
                  value={formData.sitio}
                  onChange={(e) => setFormData((p) => ({ ...p, sitio: e.target.value }))}
                />
              </div>
            </>
          )}

          <div className="grid gap-2">
            <Label htmlFor="descripcion">Observaciones</Label>
            <Textarea
              id="descripcion"
              placeholder={
                mode === "fumigacion"
                  ? "Acceso por portería, horario preferido, químicos a evitar…"
                  : "Detalle del trabajo o reclamo del cliente"
              }
              value={formData.descripcion}
              onChange={(e) => setFormData((p) => ({ ...p, descripcion: e.target.value }))}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2">
              <Label htmlFor="fecha">Fecha de visita</Label>
              <Input
                id="fecha"
                type="date"
                value={formData.fechaPrometida}
                onChange={(e) => setFormData((p) => ({ ...p, fechaPrometida: e.target.value }))}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="precio">Precio mano de obra</Label>
              <Input
                id="precio"
                type="number"
                min={0}
                step="100"
                value={formData.precio}
                onChange={(e) => setFormData((p) => ({ ...p, precio: e.target.value }))}
              />
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="tecnico">Técnico / fumigador (opcional)</Label>
            <Input
              id="tecnico"
              placeholder="Ej: Diego Ruta Norte"
              value={formData.tecnicoAsignado}
              onChange={(e) => setFormData((p) => ({ ...p, tecnicoAsignado: e.target.value }))}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Crear orden
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
