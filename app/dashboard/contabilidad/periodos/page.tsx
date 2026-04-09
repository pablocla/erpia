"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { useToast } from "@/hooks/use-toast"
import {
  Lock,
  LockOpen,
  ShieldCheck,
  Calendar,
  FileText,
  ShoppingCart,
  Receipt,
  Info,
} from "lucide-react"

interface PeriodoMes {
  mes: number
  anio: number
  label: string
  estado: "abierto" | "cerrado" | "bloqueado"
  fechaCierre: string | null
  cerradoPor: number | null
  id: number | null
}

const ESTADO_CONFIG = {
  abierto: { label: "Abierto", variant: "default" as const, icon: LockOpen, color: "text-emerald-600" },
  cerrado: { label: "Cerrado", variant: "secondary" as const, icon: Lock, color: "text-amber-600" },
  bloqueado: { label: "Bloqueado", variant: "destructive" as const, icon: ShieldCheck, color: "text-red-600" },
}

export default function PeriodosFiscalesPage() {
  const [anio, setAnio] = useState(new Date().getFullYear())
  const [meses, setMeses] = useState<PeriodoMes[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<number | null>(null)
  const { toast } = useToast()

  const cargar = useCallback(async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem("token")
      const res = await fetch(`/api/contabilidad/periodos-fiscales?anio=${anio}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error("Error al cargar períodos")
      const data = await res.json()
      setMeses(data.meses ?? [])
    } catch {
      toast({ variant: "destructive", title: "Error", description: "No se pudieron cargar los períodos fiscales" })
    } finally {
      setLoading(false)
    }
  }, [anio, toast])

  useEffect(() => { cargar() }, [cargar])

  const ejecutarAccion = async (mes: number, accion: "cerrar" | "reabrir") => {
    setActionLoading(mes)
    try {
      const token = localStorage.getItem("token")
      const method = accion === "cerrar" ? "POST" : "PATCH"
      const res = await fetch("/api/contabilidad/periodos-fiscales", {
        method,
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ mes, anio }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? "Error")

      toast({
        title: accion === "cerrar" ? "Período cerrado" : "Período reabierto",
        description: accion === "cerrar"
          ? `${data.resumen?.asientos ?? 0} asientos, ${data.resumen?.facturas ?? 0} facturas, ${data.resumen?.compras ?? 0} compras registradas.`
          : `El período ${String(mes).padStart(2, "0")}/${anio} fue reabierto.`,
      })
      cargar()
    } catch (err: any) {
      toast({ variant: "destructive", title: "Error", description: err.message })
    } finally {
      setActionLoading(null)
    }
  }

  const mesActual = new Date().getMonth() + 1
  const anioActual = new Date().getFullYear()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Calendar className="h-6 w-6 text-primary" />
            Períodos Fiscales
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Controle la apertura y cierre de meses contables. Un período cerrado bloquea asientos, facturas y compras.
          </p>
        </div>
        <Select value={String(anio)} onValueChange={(v) => setAnio(parseInt(v, 10))}>
          <SelectTrigger className="w-[120px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {[anioActual - 1, anioActual, anioActual + 1].map((a) => (
              <SelectItem key={a} value={String(a)}>{a}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Info card */}
      <Card className="border-blue-200 bg-blue-50/50 dark:border-blue-900 dark:bg-blue-950/20">
        <CardContent className="p-4">
          <div className="flex gap-3">
            <Info className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
            <div className="text-sm space-y-1.5">
              <p className="font-medium text-blue-900 dark:text-blue-200">¿Cómo funcionan los períodos fiscales?</p>
              <ul className="text-blue-800/80 dark:text-blue-300/80 space-y-1 list-disc list-inside">
                <li><strong>Abierto:</strong> Se pueden registrar transacciones normalmente.</li>
                <li><strong>Cerrado:</strong> Bloquea nuevas facturas, compras y asientos en ese mes. Un administrador puede reabrirlo.</li>
                <li><strong>Bloqueado:</strong> El período fue presentado ante AFIP. No se puede reabrir sin auditoría.</li>
                <li>Para cerrar un mes, todos los meses anteriores deben estar cerrados primero.</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Grid of months */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 12 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-4 h-32" />
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {meses.map((p) => {
            const config = ESTADO_CONFIG[p.estado]
            const IconEstado = config.icon
            const esMesActual = p.mes === mesActual && anio === anioActual
            const esFuturo = anio > anioActual || (anio === anioActual && p.mes > mesActual)

            return (
              <Card
                key={p.mes}
                className={
                  esMesActual
                    ? "ring-2 ring-primary/30 border-primary/50"
                    : esFuturo
                    ? "opacity-60"
                    : ""
                }
              >
                <CardHeader className="pb-2 p-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">{p.label}</CardTitle>
                    <Badge variant={config.variant} className="gap-1 text-xs">
                      <IconEstado className="h-3 w-3" />
                      {config.label}
                    </Badge>
                  </div>
                  <CardDescription className="text-xs">
                    {esMesActual && "← Mes en curso"}
                    {p.fechaCierre && ` Cerrado: ${new Date(p.fechaCierre).toLocaleDateString("es-AR")}`}
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-4 pt-0 space-y-3">
                  {/* Action buttons */}
                  <div className="flex gap-2">
                    {p.estado === "abierto" && !esFuturo && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1 gap-1.5 text-xs"
                            disabled={actionLoading === p.mes}
                          >
                            <Lock className="h-3.5 w-3.5" />
                            Cerrar
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>¿Cerrar {p.label} {anio}?</AlertDialogTitle>
                            <AlertDialogDescription>
                              No se podrán crear facturas, compras ni asientos contables con fecha en este mes.
                              Un administrador puede reabrir el período después si es necesario.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={() => ejecutarAccion(p.mes, "cerrar")}>
                              Cerrar período
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}

                    {p.estado === "cerrado" && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1 gap-1.5 text-xs"
                            disabled={actionLoading === p.mes}
                          >
                            <LockOpen className="h-3.5 w-3.5" />
                            Reabrir
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>¿Reabrir {p.label} {anio}?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Se permitirán nuevamente transacciones en este período.
                              Esto puede afectar la integridad de los cierres contables.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={() => ejecutarAccion(p.mes, "reabrir")}>
                              Reabrir
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}

                    {p.estado === "bloqueado" && (
                      <span className="text-[11px] text-muted-foreground italic">
                        Presentado ante AFIP — no modificable
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
