"use client"

import { useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { ScanLine, ArrowLeft, CheckCircle2 } from "lucide-react"
import { authFetch } from "@/lib/stores"

interface TareaRf {
  id: number
  numero: string
  tipo: string
  estado: string
  cantidadPedida: number
  cantidadHecha: number
  producto?: { codigo: string; nombre: string; codigoBarras?: string | null }
  fromUbicacion?: { codigo: string } | null
  toUbicacion?: { codigo: string } | null
  lote?: { numeroLote: string } | null
}

export default function WmsRfPage() {
  const [depositoId, setDepositoId] = useState("")
  const [tipo, setTipo] = useState<"pick" | "putaway">("pick")
  const [tarea, setTarea] = useState<TareaRf | null>(null)
  const [codigoUbicacion, setCodigoUbicacion] = useState("")
  const [codigoProducto, setCodigoProducto] = useState("")
  const [cantidad, setCantidad] = useState("")
  const [operario, setOperario] = useState("")
  const [msg, setMsg] = useState<string | null>(null)
  const [ok, setOk] = useState(false)
  const [loading, setLoading] = useState(false)

  async function siguiente() {
    setLoading(true)
    setMsg(null)
    setOk(false)
    try {
      const res = await authFetch("/api/wms/rf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "siguiente_tarea",
          tipo,
          depositoId: depositoId ? Number(depositoId) : undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Error")
      setTarea(data.tarea)
      if (!data.tarea) {
        setMsg("No hay tareas pendientes")
        setCodigoUbicacion("")
        setCodigoProducto("")
        setCantidad("")
      } else {
        setCodigoUbicacion(
          data.tarea.tipo === "putaway"
            ? data.tarea.toUbicacion?.codigo ?? ""
            : data.tarea.fromUbicacion?.codigo ?? "",
        )
        setCodigoProducto(data.tarea.producto?.codigo ?? "")
        setCantidad(String(data.tarea.cantidadPedida - data.tarea.cantidadHecha))
      }
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Error")
    } finally {
      setLoading(false)
    }
  }

  async function confirmar() {
    if (!tarea) return
    setLoading(true)
    setMsg(null)
    setOk(false)
    try {
      const action = tarea.tipo === "putaway" ? "putaway_scan" : "pick_scan"
      const res = await authFetch("/api/wms/rf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          tareaId: tarea.id,
          codigoUbicacion,
          codigoProducto,
          cantidad: Number(cantidad),
          operarioNombre: operario || undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Error")
      setOk(true)
      setMsg(`OK ${data.numero ?? tarea.numero} — ${data.estado}`)
      setTarea(data.estado === "completada" ? null : data)
      if (data.estado === "completada") {
        setCodigoUbicacion("")
        setCodigoProducto("")
        setCantidad("")
      }
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Error")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-lg space-y-4 p-4 pb-24">
      <div className="flex items-center justify-between">
        <Link href="/dashboard/wms" className="inline-flex items-center gap-1 text-sm text-muted-foreground">
          <ArrowLeft className="h-4 w-4" /> WMS
        </Link>
        <Badge variant="outline">Handheld / RF</Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <ScanLine className="h-6 w-6 text-amber-600" />
            Modo RF
          </CardTitle>
          <CardDescription>
            Escaneá ubicación y producto. Validación estricta de bin y SKU.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Depósito ID (opc.)</Label>
              <Input
                inputMode="numeric"
                value={depositoId}
                onChange={(e) => setDepositoId(e.target.value)}
                placeholder="1"
                className="text-lg h-12"
              />
            </div>
            <div className="space-y-1">
              <Label>Tipo tarea</Label>
              <select
                className="flex h-12 w-full rounded-md border border-input bg-background px-3 text-lg"
                value={tipo}
                onChange={(e) => setTipo(e.target.value as "pick" | "putaway")}
              >
                <option value="pick">Pick</option>
                <option value="putaway">Putaway</option>
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <Label>Operario</Label>
            <Input
              value={operario}
              onChange={(e) => setOperario(e.target.value)}
              placeholder="Nombre"
              className="h-12 text-lg"
            />
          </div>

          <Button className="w-full h-14 text-lg" onClick={() => void siguiente()} disabled={loading}>
            Siguiente tarea
          </Button>

          {tarea && (
            <div className="rounded-lg border bg-muted/30 p-4 space-y-2">
              <div className="flex justify-between items-center">
                <span className="font-mono text-sm">{tarea.numero}</span>
                <Badge>{tarea.tipo}</Badge>
              </div>
              <p className="text-lg font-medium">
                {tarea.producto?.codigo} — {tarea.producto?.nombre}
              </p>
              <p className="text-sm text-muted-foreground">
                Bin:{" "}
                <strong>
                  {tarea.tipo === "putaway"
                    ? tarea.toUbicacion?.codigo
                    : tarea.fromUbicacion?.codigo}
                </strong>
                {tarea.lote?.numeroLote ? ` · Lote ${tarea.lote.numeroLote}` : ""}
              </p>
              <p className="text-sm">
                Cantidad: {tarea.cantidadHecha} / {tarea.cantidadPedida}
              </p>
            </div>
          )}

          <div className="space-y-1">
            <Label>Scan ubicación</Label>
            <Input
              value={codigoUbicacion}
              onChange={(e) => setCodigoUbicacion(e.target.value.toUpperCase())}
              placeholder="A-01-01"
              className="h-14 text-xl font-mono tracking-wider"
              autoComplete="off"
            />
          </div>
          <div className="space-y-1">
            <Label>Scan producto / SKU</Label>
            <Input
              value={codigoProducto}
              onChange={(e) => setCodigoProducto(e.target.value)}
              placeholder="SKU o barcode"
              className="h-14 text-xl font-mono"
              autoComplete="off"
            />
          </div>
          <div className="space-y-1">
            <Label>Cantidad</Label>
            <Input
              inputMode="decimal"
              value={cantidad}
              onChange={(e) => setCantidad(e.target.value)}
              className="h-14 text-xl"
            />
          </div>

          <Button
            className="w-full h-16 text-xl gap-2"
            variant={ok ? "secondary" : "default"}
            onClick={() => void confirmar()}
            disabled={!tarea || loading}
          >
            {ok ? <CheckCircle2 className="h-6 w-6" /> : <ScanLine className="h-6 w-6" />}
            Confirmar
          </Button>

          {msg && (
            <div
              className={`rounded-md px-3 py-2 text-sm ${
                ok ? "bg-emerald-500/15 text-emerald-800 dark:text-emerald-200" : "bg-muted"
              }`}
            >
              {msg}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
