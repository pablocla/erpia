"use client"

import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Loader2, ArrowRight, User, Calendar, Settings } from "lucide-react"

export function OTCard({ ot, onMove, isMoving }: { ot: any, onMove: (estado: string) => void, isMoving: boolean }) {
  const getNextEstado = (estado: string) => {
    switch (estado) {
      case "RECEPCION": return "PRESUPUESTADO"
      case "PRESUPUESTADO": return "EN_PROCESO"
      case "EN_PROCESO": return "FINALIZADO"
      case "FINALIZADO": return "ENTREGADO"
      default: return null
    }
  }

  const nextEstado = getNextEstado(ot.estado)

  const fmt = (n: number) =>
    n.toLocaleString("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 })

  const isLate = ot.fechaPrometida && new Date(ot.fechaPrometida) < new Date() && ot.estado !== "ENTREGADO" && ot.estado !== "FINALIZADO"

  return (
    <Card className="flex flex-col border-l-4 border-l-primary shadow-sm transition-all hover:shadow-md">
      <CardHeader className="p-3 pb-0">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-muted-foreground">#{ot.numero}</span>
          {isLate && <Badge variant="destructive" className="px-1 py-0 text-[10px]">Atrasado</Badge>}
        </div>
        <div className="line-clamp-1 font-semibold leading-tight">{ot.titulo || "Sin vehículo"}</div>
      </CardHeader>
      <CardContent className="flex flex-col gap-2 p-3 text-sm">
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <User className="h-3.5 w-3.5 shrink-0" />
          <span className="line-clamp-1">{ot.cliente?.nombre || "Cliente Gral"}</span>
        </div>
        {ot.fechaPrometida && (
          <div className={`flex items-center gap-1.5 ${isLate ? "text-destructive font-medium" : "text-muted-foreground"}`}>
            <Calendar className="h-3.5 w-3.5 shrink-0" />
            <span>{new Date(ot.fechaPrometida).toLocaleDateString("es-AR")}</span>
          </div>
        )}
        <div className="mt-1 font-medium">{fmt(ot.montoTotal || 0)}</div>
      </CardContent>
      <CardFooter className="flex gap-2 p-3 pt-0">
        <Button variant="outline" size="sm" className="w-full text-xs" onClick={() => {/* TODO: Dialog de detalle */}}>
          <Settings className="mr-1 h-3.5 w-3.5" />
          Ver
        </Button>
        {nextEstado && (
          <Button 
            size="sm" 
            className="w-full text-xs" 
            disabled={isMoving} 
            onClick={() => onMove(nextEstado)}
          >
            {isMoving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ArrowRight className="h-3.5 w-3.5" />}
          </Button>
        )}
      </CardFooter>
    </Card>
  )
}
