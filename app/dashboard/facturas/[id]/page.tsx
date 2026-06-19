"use client"

import { use, useState } from "react"
import Link from "next/link"
import { useAuthFetch } from "@/hooks/use-auth-fetch"
import { authFetch } from "@/lib/stores"
import { useToast } from "@/hooks/use-toast"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import {
  ArrowLeft,
  FileText,
  Loader2,
  Printer,
  RefreshCw,
  AlertTriangle,
} from "lucide-react"

interface LineaFactura {
  id: number
  descripcion: string
  cantidad: number
  precioUnitario: number
  porcentajeIva: number
  subtotal: number
  iva: number
  total: number
}

interface FacturaDetalle {
  id: number
  tipo: string
  tipoCbte: number
  numero: number
  puntoVenta: number
  fecha?: string
  createdAt: string
  subtotal: number
  iva: number
  total: number
  estado: string
  cae?: string | null
  vencimientoCAE?: string | null
  qrBase64?: string | null
  observaciones?: string | null
  cliente?: { id: number; nombre: string; cuit?: string | null; condicionIva?: string }
  lineas: LineaFactura[]
}

const estadoStyles: Record<string, string> = {
  emitida: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  pendiente_cae: "bg-amber-100 text-amber-900 dark:bg-amber-900 dark:text-amber-100",
  error_cae: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  ticket: "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200",
  anulada: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
}

export default function FacturaDetallePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const { toast } = useToast()
  const [reintentando, setReintentando] = useState(false)

  const { data, isLoading, mutate } = useAuthFetch<FacturaDetalle>(`/api/facturas/${id}`)

  const fmt = (n: number) =>
    new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" }).format(n)

  const comprobante = data
    ? `${data.tipo} ${String(data.puntoVenta).padStart(5, "0")}-${String(data.numero).padStart(8, "0")}`
    : ""

  const reintentarCae = async () => {
    setReintentando(true)
    try {
      const res = await authFetch("/api/afip/reintentar-cae", { method: "POST" })
      const json = await res.json()
      if (!res.ok) {
        toast({
          variant: "destructive",
          title: "Error AFIP",
          description: json.error ?? "No se pudo reintentar",
        })
        return
      }
      toast({ title: "Sincronización AFIP", description: json.mensaje })
      mutate()
    } catch {
      toast({ variant: "destructive", title: "Error de conexión" })
    } finally {
      setReintentando(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!data) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/dashboard/facturas">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Link>
        </Button>
        <p className="text-muted-foreground">Factura no encontrada</p>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/dashboard/facturas">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Facturas
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <FileText className="h-6 w-6" />
              {comprobante}
            </h1>
            <p className="text-sm text-muted-foreground">
              {new Date(data.createdAt).toLocaleString("es-AR")}
              {data.cliente && ` · ${data.cliente.nombre}`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className={estadoStyles[data.estado] ?? ""}>
            {data.estado.replace(/_/g, " ")}
          </Badge>
          {(data.estado === "pendiente_cae" || data.estado === "error_cae") && (
            <Button
              size="sm"
              variant="secondary"
              onClick={() => void reintentarCae()}
              disabled={reintentando}
            >
              {reintentando ? (
                <Loader2 className="h-4 w-4 animate-spin mr-1" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-1" />
              )}
              Reintentar CAE
            </Button>
          )}
        </div>
      </div>

      {data.estado === "pendiente_cae" && (
        <Card className="border-amber-500/40 bg-amber-500/5">
          <CardContent className="pt-4 flex items-start gap-2 text-sm">
            <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
            <p>
              Este comprobante aún no tiene CAE de AFIP. Reintentá la emisión o revisá el certificado en{" "}
              <Link href="/dashboard/configuracion?seccion=afip" className="underline font-medium">
                Configuración AFIP
              </Link>
              .
            </p>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Datos fiscales</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">CAE</span>
              <span className="font-mono text-xs">{data.cae ?? "—"}</span>
            </div>
            {data.vencimientoCAE && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Vence CAE</span>
                <span>{new Date(data.vencimientoCAE).toLocaleDateString("es-AR")}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-muted-foreground">Tipo AFIP</span>
              <span>{data.tipoCbte}</span>
            </div>
            {data.cliente?.cuit && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">CUIT cliente</span>
                <span className="font-mono text-xs">{data.cliente.cuit}</span>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Totales</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Neto</span>
              <span>{fmt(Number(data.subtotal))}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">IVA</span>
              <span>{fmt(Number(data.iva))}</span>
            </div>
            <Separator />
            <div className="flex justify-between font-bold text-base">
              <span>Total</span>
              <span>{fmt(Number(data.total))}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {data.qrBase64 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">QR AFIP</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap items-center gap-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={data.qrBase64} alt="QR AFIP" className="h-32 w-32 rounded border" />
            <Button variant="outline" size="sm" onClick={() => window.print()}>
              <Printer className="h-4 w-4 mr-2" />
              Imprimir
            </Button>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Líneas ({data.lineas.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {data.lineas.map((l) => (
              <div
                key={l.id}
                className="flex flex-wrap items-center justify-between gap-2 py-2 border-b last:border-0 text-sm"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-medium truncate">{l.descripcion}</p>
                  <p className="text-xs text-muted-foreground">
                    {l.cantidad} × {fmt(Number(l.precioUnitario))} · IVA {l.porcentajeIva}%
                  </p>
                </div>
                <span className="font-medium">{fmt(Number(l.total))}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {data.observaciones && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Observaciones</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">{data.observaciones}</CardContent>
        </Card>
      )}
    </div>
  )
}