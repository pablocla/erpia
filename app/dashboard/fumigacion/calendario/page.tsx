"use client"

import { useState, useEffect, useMemo } from "react"
import { PageShell, PageHeader } from "@/components/layout"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, ArrowLeft } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { useAuthFetch } from "@/hooks/use-auth-fetch"
import { useRouter } from "next/navigation"

export default function CalendarioFumigacionPage() {
  const router = useRouter()
  const [currentDate, setCurrentDate] = useState(new Date())
  
  // Obtenemos todas las OTs. En una app real, deberíamos filtrar por mes en el backend.
  const { data: otsRaw, isLoading } = useAuthFetch<any>("/api/ot")
  
  const ots = useMemo(() => {
    if (Array.isArray(otsRaw)) return otsRaw
    const arr = (otsRaw as { ots?: any[] } | null)?.ots
    return Array.isArray(arr) ? arr : []
  }, [otsRaw])

  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))
  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))
  const today = () => setCurrentDate(new Date())

  const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate()
  const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay()

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()
  const daysInMonth = getDaysInMonth(year, month)
  const firstDay = getFirstDayOfMonth(year, month)

  const days = []
  for (let i = 0; i < firstDay; i++) {
    days.push(null)
  }
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(i)
  }

  const getVisitsForDay = (day: number) => {
    return ots.filter((ot: any) => {
      // Usamos fechaPrometida si existe, sino fechaCreacion
      const fechaBase = ot.fechaPrometida || ot.fechaCreacion
      if (!fechaBase) return false
      const d = new Date(fechaBase)
      return d.getFullYear() === year && d.getMonth() === month && d.getDate() === day
    })
  }

  const getAlertsForDay = (day: number) => {
    return ots.filter((ot: any) => {
      const meta = ot.metadata as Record<string, any>
      if (!meta || !meta.fechaVencimientoCertificado) return false
      const d = new Date(meta.fechaVencimientoCertificado)
      return d.getFullYear() === year && d.getMonth() === month && d.getDate() === day && (ot.estado === "LISTO" || ot.estado === "ENTREGADO")
    })
  }

  return (
    <PageShell>
      <div className="mb-4">
        <Button variant="outline" onClick={() => router.push("/dashboard/fumigacion")} size="sm">
          <ArrowLeft className="h-4 w-4 mr-2" /> Volver al Mapa
        </Button>
      </div>
      <PageHeader
        title="Calendario de Fumigación"
        description="Vista mensual de visitas y rutas planificadas"
      />
      <div className="space-y-4">
        <div className="flex items-center justify-between bg-card p-4 rounded-lg border shadow-sm">
          <h2 className="text-xl font-bold capitalize">
            {currentDate.toLocaleDateString("es-AR", { month: "long", year: "numeric" })}
          </h2>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={today}>Hoy</Button>
            <Button variant="outline" size="icon" onClick={prevMonth}><ChevronLeft className="h-4 w-4" /></Button>
            <Button variant="outline" size="icon" onClick={nextMonth}><ChevronRight className="h-4 w-4" /></Button>
          </div>
        </div>

        {isLoading ? (
          <div className="py-20 text-center text-muted-foreground">Cargando calendario...</div>
        ) : (
          <div className="grid grid-cols-7 gap-px bg-border rounded-lg overflow-hidden border">
            {["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"].map(day => (
              <div key={day} className="bg-muted/50 p-2 text-center text-sm font-semibold text-muted-foreground">
                {day}
              </div>
            ))}
            
            {days.map((day, idx) => {
              if (day === null) {
                return <div key={`empty-${idx}`} className="bg-card min-h-[120px]" />
              }
              
              const visits = getVisitsForDay(day)
              const alerts = getAlertsForDay(day)
              const isToday = new Date().toDateString() === new Date(year, month, day).toDateString()
              
              return (
                <div key={day} className={`bg-card min-h-[120px] p-2 flex flex-col gap-1 transition-colors hover:bg-muted/10 ${isToday ? 'bg-primary/5' : ''}`}>
                  <div className="flex justify-between items-center mb-1">
                    <span className={`text-sm font-medium h-7 w-7 flex items-center justify-center rounded-full ${isToday ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'}`}>
                      {day}
                    </span>
                    {(visits.length > 0 || alerts.length > 0) && (
                      <span className="text-[10px] text-muted-foreground font-medium">
                        {visits.length + alerts.length} eventos
                      </span>
                    )}
                  </div>
                  
                  <div className="flex-1 flex flex-col gap-1 overflow-y-auto max-h-[100px] pr-1">
                    {visits.map((v: any) => (
                      <div key={`v-${v.id}`} className="text-xs p-1 rounded bg-blue-50 text-blue-800 border border-blue-200 dark:bg-blue-900/30 dark:border-blue-800 dark:text-blue-300 truncate" title={v.cliente?.nombre}>
                        🔵 {v.cliente?.nombre || `Visita #${v.numero}`}
                      </div>
                    ))}
                    {alerts.map((a: any) => (
                      <div key={`a-${a.id}`} className="text-xs p-1 rounded bg-red-50 text-red-800 border border-red-200 dark:bg-red-900/30 dark:border-red-800 dark:text-red-300 truncate" title={`Vencimiento: ${a.cliente?.nombre}`}>
                        🔴 Renovar: {a.cliente?.nombre || `#${a.numero}`}
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </PageShell>
  )
}
