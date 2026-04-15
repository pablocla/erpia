"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Repeat, Plus, RefreshCw, ToggleLeft, ToggleRight,
  DollarSign, Calendar, Users, FileText,
} from "lucide-react"
import { useKeyboardShortcuts, erpShortcuts } from "@/hooks/use-keyboard-shortcuts"
import { useToast } from "@/hooks/use-toast"

interface FacturaRecurrente {
  id: number
  concepto: string
  montoNeto: number
  alicuotaIva: number
  frecuencia: string
  diaEmision: number
  proximaEmision: string
  fechaFin: string | null
  tipoCbte: number
  activo: boolean
  facturasEmitidas: number
  ultimaEmision: string | null
  clienteId: number
}

const FRECUENCIAS: Record<string, string> = {
  mensual: "Mensual",
  bimestral: "Bimestral",
  trimestral: "Trimestral",
  semestral: "Semestral",
  anual: "Anual",
}

export default function FacturacionRecurrentePage() {
  const [facturas, setFacturas] = useState<FacturaRecurrente[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [procesando, setProcesando] = useState(false)
  const { toast } = useToast()

  const headers = { Authorization: `Bearer ${typeof window !== "undefined" ? localStorage.getItem("token") : ""}` }

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/facturacion-recurrente", { headers })
      if (res.ok) setFacturas(await res.json())
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  useKeyboardShortcuts(erpShortcuts({
    onRefresh: fetchData,
    onNew: () => setDialogOpen(true),
  }))

  async function handleCrear(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const res = await fetch("/api/facturacion-recurrente", {
      method: "POST",
      headers: { ...headers, "Content-Type": "application/json" },
      body: JSON.stringify({
        clienteId: Number(fd.get("clienteId")),
        concepto: fd.get("concepto"),
        montoNeto: Number(fd.get("montoNeto")),
        alicuotaIva: Number(fd.get("alicuotaIva")) || 21,
        frecuencia: fd.get("frecuencia") || "mensual",
        diaEmision: Number(fd.get("diaEmision")) || 1,
        fechaFin: fd.get("fechaFin") || undefined,
      }),
    })
    if (res.ok) { setDialogOpen(false); fetchData(); toast({ title: "Factura recurrente creada", description: "La suscripción se guardó correctamente" }) }
    else { toast({ title: "Error al crear recurrente", description: "No se pudo guardar la factura recurrente", variant: "destructive" }) }
  }

  async function handleProcesar() {
    setProcesando(true)
    try {
      await fetch("/api/facturacion-recurrente", {
        method: "POST",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({ accion: "procesar" }),
      })
      fetchData()
      toast({ title: "Emisión procesada", description: "Las facturas recurrentes se emitieron correctamente" })
    } finally {
      setProcesando(false)
    }
  }

  async function handleToggle(id: number, activo: boolean) {
    await fetch("/api/facturacion-recurrente", {
      method: "POST",
      headers: { ...headers, "Content-Type": "application/json" },
      body: JSON.stringify({ accion: "toggle", id, activo: !activo }),
    })
    fetchData()
  }

  const totalMensual = facturas
    .filter((f) => f.activo)
    .reduce((sum, f) => sum + Number(f.montoNeto) * (1 + f.alicuotaIva / 100), 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Facturación Recurrente</h1>
          <p className="text-muted-foreground">
            Suscripciones, alquileres y servicios con facturación automática
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleProcesar} disabled={procesando}>
            <Repeat className="mr-2 h-4 w-4" /> {procesando ? "Procesando..." : "Ejecutar emisión"}
          </Button>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm"><Plus className="mr-2 h-4 w-4" /> Nueva recurrente</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Nueva Factura Recurrente</DialogTitle></DialogHeader>
              <form onSubmit={handleCrear} className="space-y-4">
                <div><Label>ID Cliente *</Label><Input name="clienteId" type="number" required /></div>
                <div><Label>Concepto *</Label><Input name="concepto" placeholder="Ej: Suscripción mensual" required /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div><Label>Monto neto *</Label><Input name="montoNeto" type="number" step="0.01" required /></div>
                  <div><Label>Alícuota IVA %</Label><Input name="alicuotaIva" type="number" defaultValue="21" /></div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Frecuencia</Label>
                    <Select name="frecuencia">
                      <SelectTrigger><SelectValue placeholder="Mensual" /></SelectTrigger>
                      <SelectContent>
                        {Object.entries(FRECUENCIAS).map(([k, v]) => (
                          <SelectItem key={k} value={k}>{v}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div><Label>Día de emisión</Label><Input name="diaEmision" type="number" min="1" max="28" defaultValue="1" /></div>
                </div>
                <div><Label>Fecha fin (opcional)</Label><Input name="fechaFin" type="date" /></div>
                <DialogFooter><Button type="submit">Crear</Button></DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Resumen */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-4 flex items-center gap-3">
            <div className="rounded-lg bg-blue-500/10 p-2"><FileText className="h-5 w-5 text-blue-500" /></div>
            <div>
              <p className="text-2xl font-bold">{facturas.filter((f) => f.activo).length}</p>
              <p className="text-xs text-muted-foreground">Activas</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 flex items-center gap-3">
            <div className="rounded-lg bg-emerald-500/10 p-2"><DollarSign className="h-5 w-5 text-emerald-500" /></div>
            <div>
              <p className="text-2xl font-bold">
                {totalMensual.toLocaleString("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 })}
              </p>
              <p className="text-xs text-muted-foreground">Ingreso recurrente</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 flex items-center gap-3">
            <div className="rounded-lg bg-violet-500/10 p-2"><Repeat className="h-5 w-5 text-violet-500" /></div>
            <div>
              <p className="text-2xl font-bold">{facturas.reduce((s, f) => s + f.facturasEmitidas, 0)}</p>
              <p className="text-xs text-muted-foreground">Facturas emitidas total</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lista */}
      {loading ? (
        <p className="text-muted-foreground text-center py-10">Cargando...</p>
      ) : facturas.length === 0 ? (
        <Card><CardContent className="py-10 text-center text-muted-foreground">
          No hay facturas recurrentes configuradas
        </CardContent></Card>
      ) : (
        <div className="space-y-3">
          {facturas.map((fr) => (
            <Card key={fr.id} className={!fr.activo ? "opacity-50" : ""}>
              <CardContent className="py-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold">{fr.concepto}</p>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                      <span>Cliente #{fr.clienteId}</span>
                      <Badge variant="outline">{FRECUENCIAS[fr.frecuencia] ?? fr.frecuencia}</Badge>
                      <span>Día {fr.diaEmision}</span>
                      <span>Emitidas: {fr.facturasEmitidas}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="font-bold text-lg">
                        {(Number(fr.montoNeto) * (1 + fr.alicuotaIva / 100)).toLocaleString("es-AR", { style: "currency", currency: "ARS" })}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Próxima: {new Date(fr.proximaEmision).toLocaleDateString("es-AR")}
                      </p>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => handleToggle(fr.id, fr.activo)}>
                      {fr.activo ? <ToggleRight className="h-5 w-5 text-emerald-500" /> : <ToggleLeft className="h-5 w-5" />}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
