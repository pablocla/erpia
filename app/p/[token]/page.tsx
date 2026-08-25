"use client"

import { useParams } from "next/navigation"
import useSWR from "swr"
import { Building2, CheckCircle2, FileText, Mail, MapPin, Phone, XCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { useState } from "react"
import { cn } from "@/lib/utils"

const fetcher = (url: string) => fetch(url).then(async (res) => {
  if (!res.ok) {
    const error = await res.json()
    throw new Error(error.error || "Error al cargar")
  }
  return res.json()
})

const formatARS = (value: number) => {
  return new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" }).format(value)
}

export default function PresupuestoPublicoPage() {
  const params = useParams()
  const token = params.token as string

  const { data: presupuesto, error, isLoading, mutate } = useSWR(`/api/p/${token}`, fetcher)
  const [isAccepting, setIsAccepting] = useState(false)

  const handleAceptar = async () => {
    try {
      setIsAccepting(true)
      const res = await fetch(`/api/p/${token}/aceptar`, {
        method: "POST",
      })
      const data = await res.json()
      
      if (!res.ok) {
        throw new Error(data.error || "Error al aceptar el presupuesto")
      }

      toast.success(data.message || "Presupuesto aceptado con éxito")
      mutate() // Recargar datos
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setIsAccepting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-muted/30 p-4 md:p-8 flex justify-center">
        <div className="w-full max-w-3xl space-y-4">
          <Skeleton className="h-32 w-full rounded-xl" />
          <Skeleton className="h-64 w-full rounded-xl" />
        </div>
      </div>
    )
  }

  if (error || !presupuesto) {
    return (
      <div className="min-h-screen bg-muted/30 p-4 flex items-center justify-center">
        <Card className="w-full max-w-md text-center p-6 border-destructive/20 bg-destructive/5 shadow-none">
          <XCircle className="mx-auto h-12 w-12 text-destructive mb-4" />
          <CardTitle className="text-xl mb-2">Enlace no válido</CardTitle>
          <CardDescription>
            {error?.message || "El presupuesto no existe, ha caducado o el enlace es incorrecto."}
          </CardDescription>
        </Card>
      </div>
    )
  }

  const { empresa, cliente, lineas } = presupuesto
  const isAceptado = presupuesto.estado === "aceptado" || presupuesto.estado === "facturado"
  const isRechazadoOVencido = presupuesto.estado === "rechazado" || presupuesto.estado === "vencido"

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 p-4 md:p-8 flex justify-center">
      <div className="w-full max-w-3xl space-y-6">
        
        {/* Banner de Estado */}
        {isAceptado && (
          <div className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 p-4 rounded-xl flex items-center gap-3 border border-emerald-500/20">
            <CheckCircle2 className="h-6 w-6" />
            <div>
              <p className="font-semibold">Presupuesto Aceptado</p>
              <p className="text-sm opacity-90">Este presupuesto ya ha sido aceptado y se encuentra en curso.</p>
            </div>
          </div>
        )}

        {isRechazadoOVencido && (
          <div className="bg-rose-500/15 text-rose-700 dark:text-rose-400 p-4 rounded-xl flex items-center gap-3 border border-rose-500/20">
            <XCircle className="h-6 w-6" />
            <div>
              <p className="font-semibold">Presupuesto {presupuesto.estado}</p>
              <p className="text-sm opacity-90">Este documento ya no es válido para su aceptación.</p>
            </div>
          </div>
        )}

        {/* Cabecera / Empresa */}
        <Card className="border-0 shadow-sm overflow-hidden">
          <div className="h-2 bg-primary w-full"></div>
          <CardContent className="p-6 md:p-8 flex flex-col md:flex-row gap-6 justify-between items-start">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                {empresa.logoUrl ? (
                  <img src={empresa.logoUrl} alt={empresa.nombre} className="h-12 w-12 rounded-lg object-contain" />
                ) : (
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                    <Building2 className="h-6 w-6" />
                  </div>
                )}
                <div>
                  <h1 className="text-2xl font-bold tracking-tight">{empresa.nombre}</h1>
                  <p className="text-sm text-muted-foreground">CUIT: {empresa.cuit}</p>
                </div>
              </div>
              
              <div className="space-y-2 text-sm text-muted-foreground">
                {empresa.telefono && <div className="flex items-center gap-2"><Phone className="h-4 w-4" /> {empresa.telefono}</div>}
                {empresa.direccion && <div className="flex items-center gap-2"><MapPin className="h-4 w-4" /> {empresa.direccion}</div>}
              </div>
            </div>

            <div className="text-left md:text-right space-y-1">
              <Badge variant="outline" className="mb-2 uppercase">{presupuesto.estado}</Badge>
              <h2 className="text-xl font-semibold text-primary">Presupuesto #{presupuesto.numero}</h2>
              <p className="text-sm text-muted-foreground">
                Emitido: {new Date(presupuesto.fechaEmision).toLocaleDateString("es-AR")}
              </p>
              {presupuesto.fechaVencimiento && (
                <p className="text-sm text-muted-foreground">
                  Vence: {new Date(presupuesto.fechaVencimiento).toLocaleDateString("es-AR")}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Detalles del Cliente */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3 border-b">
            <CardTitle className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
              <FileText className="h-4 w-4" /> PREPARADO PARA
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold">{cliente.nombre}</h3>
            {cliente.cuit && <p className="text-sm text-muted-foreground">CUIT/DNI: {cliente.cuit}</p>}
            <div className="mt-3 space-y-2 text-sm text-muted-foreground">
              {cliente.email && <div className="flex items-center gap-2"><Mail className="h-4 w-4" /> {cliente.email}</div>}
              {cliente.telefono && <div className="flex items-center gap-2"><Phone className="h-4 w-4" /> {cliente.telefono}</div>}
            </div>
          </CardContent>
        </Card>

        {/* Items */}
        <Card className="border-0 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-muted/50 text-muted-foreground uppercase text-xs">
                <tr>
                  <th className="px-6 py-4 font-medium">Descripción</th>
                  <th className="px-6 py-4 font-medium text-center">Cant</th>
                  <th className="px-6 py-4 font-medium text-right">Precio Un.</th>
                  <th className="px-6 py-4 font-medium text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {lineas.map((l: any) => (
                  <tr key={l.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-medium">{l.producto?.nombre || l.descripcion || "Item sin nombre"}</p>
                      {l.producto?.descripcion && <p className="text-xs text-muted-foreground mt-1">{l.producto.descripcion}</p>}
                    </td>
                    <td className="px-6 py-4 text-center">{Number(l.cantidad)}</td>
                    <td className="px-6 py-4 text-right">{formatARS(Number(l.precioUnitario))}</td>
                    <td className="px-6 py-4 text-right font-medium">{formatARS(Number(l.subtotal))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <div className="bg-muted/10 p-6 flex flex-col md:flex-row justify-between items-end gap-6 border-t">
            <div className="w-full md:w-auto text-sm text-muted-foreground">
              <p>Condición de pago: {presupuesto.condicionPago?.nombre || "Contado"}</p>
            </div>
            <div className="w-full md:w-64 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{formatARS(Number(presupuesto.subtotal))}</span>
              </div>
              {Number(presupuesto.descuentoPct) > 0 && (
                <div className="flex justify-between text-sm text-emerald-600">
                  <span>Descuento ({Number(presupuesto.descuentoPct)}%)</span>
                  <span>-{formatARS((Number(presupuesto.subtotal) * Number(presupuesto.descuentoPct)) / 100)}</span>
                </div>
              )}
              {Number(presupuesto.impuestos) > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Impuestos</span>
                  <span>{formatARS(Number(presupuesto.impuestos))}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-xl pt-3 border-t">
                <span>Total</span>
                <span className="text-primary">{formatARS(Number(presupuesto.total))}</span>
              </div>
            </div>
          </div>
        </Card>

        {/* Action Button */}
        {!isAceptado && !isRechazadoOVencido && (
          <div className="flex flex-col sm:flex-row gap-4 pt-4 pb-8">
            <Button 
              size="lg" 
              className="w-full sm:flex-1 h-14 text-base font-semibold shadow-lg hover:shadow-xl transition-all"
              onClick={handleAceptar}
              disabled={isAccepting}
            >
              <CheckCircle2 className="mr-2 h-5 w-5" />
              {isAccepting ? "Procesando..." : "Aceptar Presupuesto"}
            </Button>
            <Button size="lg" variant="outline" className="w-full sm:w-auto h-14" disabled={isAccepting}>
              Tengo una duda
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
