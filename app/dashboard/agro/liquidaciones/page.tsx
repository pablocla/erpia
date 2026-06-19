"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Spinner } from "@/components/ui/spinner"
import { useAuthFetch } from "@/hooks/use-auth-fetch"
import { authFetch } from "@/lib/stores"
import { useToast } from "@/hooks/use-toast"
import { DollarSign, Plus, CheckCircle } from "lucide-react"
import Link from "next/link"

interface Liquidacion {
  id: number
  numero: string
  proveedor: { nombre: string }
  contrato: { numero: string; grano: { nombre: string } }
  campana: string
  toneladasLiquidadas: number
  precioUnitario: number
  importeBruto: number
  descuentoCalidad: number
  retencionGanancias: number
  percepcionIva: number
  importeNeto: number
  estado: string
  fechaEmision: string
}

interface Response { liquidaciones: Liquidacion[]; total: number; pages: number }

const ARS = (v: number) => new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(v)
const NUM = (v: number, d = 1) => new Intl.NumberFormat("es-AR", { minimumFractionDigits: d, maximumFractionDigits: d }).format(v)
const FECHA = (s: string) => new Date(s).toLocaleDateString("es-AR")

const ESTADO_VARIANT: Record<string, "default" | "secondary" | "destructive"> = {
  pendiente: "secondary",
  pagada: "default",
  anulada: "destructive",
}

export default function LiquidacionesPage() {
  const { toast } = useToast()
  const [page, setPage] = useState(1)
  const [estado, setEstado] = useState("")

  const qs = new URLSearchParams({ page: String(page), limit: "50" })
  if (estado) qs.set("estado", estado)

  const { data, isLoading, mutate } = useAuthFetch<Response>(`/api/agro/liquidaciones?${qs}`)

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Liquidaciones</h1>
          <p className="text-sm text-muted-foreground">Liquidaciones a productores con retenciones AFIP</p>
        </div>
        <Button asChild>
          <Link href="/dashboard/agro/liquidaciones/nuevo">
            <Plus className="mr-1 h-4 w-4" /> Nueva liquidación
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex gap-3">
            {["", "pendiente", "pagada", "anulada"].map(e => (
              <Button key={e} size="sm" variant={estado === e ? "default" : "outline"} onClick={() => { setEstado(e); setPage(1) }}>
                {e === "" ? "Todas" : e.charAt(0).toUpperCase() + e.slice(1)}
              </Button>
            ))}
            <span className="ml-auto flex items-center text-sm text-muted-foreground">{data?.total ?? 0} registros</span>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex h-32 items-center justify-center"><Spinner /></div>
          ) : (data?.liquidaciones ?? []).length === 0 ? (
            <div className="flex flex-col items-center gap-4 py-12 text-center text-muted-foreground">
              <DollarSign className="h-12 w-12 opacity-20" />
              <div>
                <p className="font-medium">Sin liquidaciones</p>
                <p className="text-sm">Liquide toneladas de un contrato de compra</p>
              </div>
              <Button asChild><Link href="/dashboard/agro/liquidaciones/nuevo"><Plus className="mr-1 h-4 w-4" /> Nueva</Link></Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-muted-foreground text-left">
                    <th className="pb-2 pr-3 font-medium">N°</th>
                    <th className="pb-2 pr-3 font-medium">Fecha</th>
                    <th className="pb-2 pr-3 font-medium">Productor</th>
                    <th className="pb-2 pr-3 font-medium">Grano</th>
                    <th className="pb-2 pr-3 font-medium">Campaña</th>
                    <th className="pb-2 pr-3 font-medium text-right">Tn</th>
                    <th className="pb-2 pr-3 font-medium text-right">Bruto</th>
                    <th className="pb-2 pr-3 font-medium text-right">Ret.Gan.</th>
                    <th className="pb-2 pr-3 font-medium text-right">NETO</th>
                    <th className="pb-2 font-medium">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {data?.liquidaciones.map(l => (
                    <tr key={l.id} className="hover:bg-accent/40">
                      <td className="py-2 pr-3 font-mono font-medium">{l.numero}</td>
                      <td className="py-2 pr-3 text-muted-foreground">{FECHA(l.fechaEmision)}</td>
                      <td className="py-2 pr-3 font-medium">{l.proveedor.nombre}</td>
                      <td className="py-2 pr-3 text-muted-foreground">{l.contrato.grano.nombre}</td>
                      <td className="py-2 pr-3">{l.campana}</td>
                      <td className="py-2 pr-3 text-right">{NUM(l.toneladasLiquidadas)}</td>
                      <td className="py-2 pr-3 text-right text-muted-foreground">{ARS(Number(l.importeBruto))}</td>
                      <td className="py-2 pr-3 text-right text-red-600">−{ARS(Number(l.retencionGanancias))}</td>
                      <td className="py-2 pr-3 text-right font-bold text-primary">{ARS(Number(l.importeNeto))}</td>
                      <td className="py-2">
                        <Badge variant={ESTADO_VARIANT[l.estado] ?? "secondary"} className="text-xs capitalize">{l.estado}</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {(data?.pages ?? 0) > 1 && (
            <div className="mt-4 flex justify-center gap-2">
              <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Anterior</Button>
              <span className="flex items-center text-sm text-muted-foreground">Página {page} de {data?.pages}</span>
              <Button variant="outline" size="sm" disabled={page === data?.pages} onClick={() => setPage(p => p + 1)}>Siguiente</Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
