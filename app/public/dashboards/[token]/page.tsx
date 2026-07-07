"use client"

import { useEffect, useState, use } from "react"
import { GlobalSlicers } from "@/components/reporting/GlobalSlicers"
import { DashboardWidget } from "@/components/reporting/DashboardWidget"
import { AlertCircle } from "lucide-react"

export default function PublicDashboardViewer({ params }: { params: Promise<{ token: string }> }) {
  const resolvedParams = use(params)
  const token = resolvedParams.token
  
  const [dashboard, setDashboard] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // The public viewer doesn't have a specific GET dashboard endpoint yet.
    // Wait, we need an endpoint to get the layout/widgets of the dashboard!
    // We only created definitions and execute. Let's create `/api/public/reporting/dashboards` or similar.
    // Or we can just include the widgets inside the token? No, token is small.
    // I need to create a `/api/public/reporting/dashboards/route.ts` that takes the token.
    
    fetch(`/api/public/reporting/dashboards`, { 
      headers: { Authorization: `Public Bearer ${token}` } 
    })
      .then(async res => {
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || "Error al cargar dashboard")
        setDashboard(data)
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [token])

  if (loading) {
    return <div className="flex h-screen w-full items-center justify-center bg-background text-muted-foreground">Cargando tablero...</div>
  }

  if (error) {
    return (
      <div className="flex flex-col h-screen w-full items-center justify-center bg-background text-destructive gap-2">
        <AlertCircle className="h-8 w-8" />
        <p>{error}</p>
      </div>
    )
  }

  const widgets = (dashboard?.widgets as any[]) ?? []

  return (
    <div className="min-h-screen w-full bg-background p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold tracking-tight">{dashboard?.nombre}</h1>
          {dashboard?.descripcion && <p className="text-muted-foreground">{dashboard.descripcion}</p>}
        </div>

        <GlobalSlicers />

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 auto-rows-max">
          {widgets.map((w, idx) => {
            const isKpi = w.tipoGrafico === "kpi"
            const colSpan = isKpi ? "col-span-1" : "col-span-1 md:col-span-2 lg:col-span-2 xl:col-span-2"
            return (
              <div key={w.id || idx} className={`${colSpan}`}>
                <DashboardWidget 
                  smartViewId={w.smartViewId} 
                  titulo={w.titulo} 
                  tipoGrafico={w.tipoGrafico} 
                  publicToken={token}
                />
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
