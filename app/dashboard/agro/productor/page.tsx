"use client"

import { useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Spinner } from "@/components/ui/spinner"
import { useAuthFetch } from "@/hooks/use-auth-fetch"
import { UserCircle, Wheat, DollarSign, FileText, Truck } from "lucide-react"

interface Proveedor {
  id: number
  nombre: string
  cuit: string | null
}

interface ProductorResumen {
  proveedor: Proveedor
  resumen: {
    saldoTn: number
    contratosActivos: number
    liquidacionesPendientes: number
    montoPendiente: number
  }
  contratos: Array<{ id: number; numero: string; campana: string; estado: string; grano: { nombre: string } }>
  liquidaciones: Array<{ id: number; numero: string; estado: string; importeNeto: number; fechaEmision: string }>
  tickets: Array<{ id: number; numero: string; tipo: string; pesoNeto: number; grano: { nombre: string }; fecha: string }>
}

const ARS = (v: number) => new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(v)
const NUM = (v: number, d = 2) => new Intl.NumberFormat("es-AR", { minimumFractionDigits: d, maximumFractionDigits: d }).format(v)

export default function PortalProductorPage() {
  const { data: proveedoresData } = useAuthFetch<{ proveedores: Proveedor[] }>("/api/proveedores?limit=300")
  const proveedores = proveedoresData?.proveedores ?? []

  const [proveedorId, setProveedorId] = useState("")
  const query = proveedorId ? `/api/agro/productor/resumen?proveedorId=${proveedorId}` : null
  const { data, isLoading } = useAuthFetch<ProductorResumen>(query || "")

  const proveedorSeleccionado = useMemo(
    () => proveedores.find((p) => String(p.id) === proveedorId),
    [proveedores, proveedorId],
  )

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold">Portal Productor</h1>
        <p className="text-sm text-muted-foreground">Vista de saldos, contratos y liquidaciones para compartir con el productor</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Seleccionar productor</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label>Productor</Label>
            <Select value={proveedorId} onValueChange={setProveedorId}>
              <SelectTrigger>
                <SelectValue placeholder="Elegir productor..." />
              </SelectTrigger>
              <SelectContent>
                {proveedores.map((p) => (
                  <SelectItem key={p.id} value={String(p.id)}>{p.nombre}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-end text-sm text-muted-foreground">
            {proveedorSeleccionado ? `CUIT: ${proveedorSeleccionado.cuit ?? "Sin CUIT"}` : "Seleccione un productor para ver resumen"}
          </div>
        </CardContent>
      </Card>

      {!proveedorId ? null : isLoading ? (
        <div className="flex h-40 items-center justify-center"><Spinner /></div>
      ) : !data ? (
        <Card><CardContent className="py-10 text-center text-muted-foreground">No hay datos para este productor.</CardContent></Card>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-xs text-muted-foreground flex items-center gap-1"><Wheat className="h-3.5 w-3.5" /> Saldo en acopio</CardTitle></CardHeader>
              <CardContent><p className="text-2xl font-bold">{NUM(data.resumen.saldoTn, 3)} tn</p></CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-xs text-muted-foreground flex items-center gap-1"><FileText className="h-3.5 w-3.5" /> Contratos activos</CardTitle></CardHeader>
              <CardContent><p className="text-2xl font-bold">{data.resumen.contratosActivos}</p></CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-xs text-muted-foreground flex items-center gap-1"><DollarSign className="h-3.5 w-3.5" /> Liquidaciones pendientes</CardTitle></CardHeader>
              <CardContent><p className="text-2xl font-bold">{data.resumen.liquidacionesPendientes}</p></CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-xs text-muted-foreground flex items-center gap-1"><DollarSign className="h-3.5 w-3.5" /> Monto pendiente</CardTitle></CardHeader>
              <CardContent><p className="text-xl font-bold">{ARS(data.resumen.montoPendiente)}</p></CardContent>
            </Card>
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <Card className="lg:col-span-1">
              <CardHeader><CardTitle className="text-base">Últimos contratos</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {data.contratos.length === 0 ? <p className="text-sm text-muted-foreground">Sin contratos.</p> : data.contratos.slice(0, 6).map((c) => (
                  <div key={c.id} className="flex items-center justify-between border rounded-md p-2 text-sm">
                    <div>
                      <p className="font-medium">{c.numero}</p>
                      <p className="text-xs text-muted-foreground">{c.grano.nombre} · {c.campana}</p>
                    </div>
                    <Badge variant={c.estado === "cerrado" ? "outline" : "secondary"} className="text-xs">{c.estado}</Badge>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="lg:col-span-1">
              <CardHeader><CardTitle className="text-base">Liquidaciones</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {data.liquidaciones.length === 0 ? <p className="text-sm text-muted-foreground">Sin liquidaciones.</p> : data.liquidaciones.slice(0, 6).map((l) => (
                  <div key={l.id} className="flex items-center justify-between border rounded-md p-2 text-sm">
                    <div>
                      <p className="font-medium">{l.numero}</p>
                      <p className="text-xs text-muted-foreground">{new Date(l.fechaEmision).toLocaleDateString("es-AR")}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{ARS(Number(l.importeNeto))}</p>
                      <Badge variant={l.estado === "pagada" ? "default" : "secondary"} className="text-xs">{l.estado}</Badge>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="lg:col-span-1">
              <CardHeader><CardTitle className="text-base">Movimientos de balanza</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {data.tickets.length === 0 ? <p className="text-sm text-muted-foreground">Sin movimientos.</p> : data.tickets.slice(0, 6).map((t) => (
                  <div key={t.id} className="flex items-center justify-between border rounded-md p-2 text-sm">
                    <div>
                      <p className="font-medium flex items-center gap-1"><Truck className="h-3.5 w-3.5" /> {t.numero}</p>
                      <p className="text-xs text-muted-foreground">{t.grano.nombre}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{NUM(t.pesoNeto / 1000, 3)} tn</p>
                      <Badge variant={t.tipo === "entrada" ? "default" : "outline"} className="text-xs">{t.tipo}</Badge>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  )
}
