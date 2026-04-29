"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { DataTable, type DataTableColumn } from "@/components/data-table"
import { useToast } from "@/hooks/use-toast"
import { Calendar, UserCircle, Wallet, FileText, ChevronLeft, ChevronRight } from "lucide-react"

interface EmpleadoLiquidacion {
  id: number
  nombre: string
  cargo: string | null
  departamento: string | null
  sueldoBruto: number
  descuentoEstimado: number
  netoEstimado: number
}

interface LiquidacionResponse {
  success: boolean
  liquidez: {
    periodo: string
    totalEmpleados: number
    totalBruto: number
    totalDescuento: number
    totalNeto: number
    promedioNeto: number
    empleados: EmpleadoLiquidacion[]
  }
}

const MES_ES = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"]

function formatMonth(periodo: string) {
  const [year, month] = periodo.split("-")
  if (!year || !month) return periodo
  const index = Number(month) - 1
  return `${MES_ES[index] ?? month} ${year}`
}

export default function LiquidacionSueldosPage() {
  const [periodo, setPeriodo] = useState(() => new Date().toISOString().slice(0, 7))
  const [liquidacion, setLiquidacion] = useState<LiquidacionResponse["liquidez"] | null>(null)
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  const fetchLiquidacion = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/rrhh/liquidacion?periodo=${periodo}`)
      if (!res.ok) throw new Error("No se pudo cargar la liquidación")
      const data = (await res.json()) as LiquidacionResponse
      if (!data.success) throw new Error("Respuesta inválida")
      setLiquidacion(data.liquidez)
    } catch (error) {
      console.error(error)
      toast({ title: "Error", description: error instanceof Error ? error.message : "No se pudo cargar la liquidación", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { void fetchLiquidacion() }, [periodo])

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Liquidación de Sueldos</h1>
          <p className="text-muted-foreground">Resumen mensual de sueldos brutos, descuentos y netos estimados.</p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Label htmlFor="periodo">Período</Label>
          <Input id="periodo" type="month" value={periodo} onChange={(e) => setPeriodo(e.target.value)} className="max-w-[180px]" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3"><CardTitle>Período</CardTitle></CardHeader>
          <CardContent>
            <p className="text-lg font-semibold">{formatMonth(periodo)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3"><CardTitle>Empleados</CardTitle></CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{liquidacion?.totalEmpleados ?? 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3"><CardTitle>Total Neto</CardTitle></CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">${liquidacion?.totalNeto.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) ?? "0.00"}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3"><CardTitle>Promedio neto</CardTitle></CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">${liquidacion?.promedioNeto.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) ?? "0.00"}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex items-center justify-between gap-2">
          <div>
            <CardTitle>Detalle por empleado</CardTitle>
            <p className="text-sm text-muted-foreground">Sueldos brutos y netos estimados según plantilla de RRHH.</p>
          </div>
          <Button variant="outline" size="sm" onClick={fetchLiquidacion} disabled={loading}>
            {loading ? "Actualizando..." : "Actualizar"}
          </Button>
        </CardHeader>
        <CardContent>
          <DataTable<EmpleadoLiquidacion>
            data={liquidacion?.empleados ?? []}
            columns={[
              { key: "nombre", header: "Empleado", cell: (item) => item.nombre, sortable: true },
              { key: "cargo" as any, header: "Cargo", cell: (item) => item.cargo ?? "-" },
              { key: "departamento" as any, header: "Departamento", cell: (item) => item.departamento ?? "-" },
              { key: "sueldoBruto", header: "Sueldo Bruto", cell: (item) => `$${item.sueldoBruto.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` },
              { key: "descuentoEstimado", header: "Descuento 30%", cell: (item) => `$${item.descuentoEstimado.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` },
              { key: "netoEstimado", header: "Neto Estimado", cell: (item) => `$${item.netoEstimado.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` },
            ] as DataTableColumn<EmpleadoLiquidacion>[]}
            rowKey="id"
            searchPlaceholder="Buscar empleado..."
            searchKeys={["nombre", "cargo", "departamento"]}
          />
        </CardContent>
      </Card>
    </div>
  )
}
