"use client"

import { useState, useEffect } from "react"
import { getRubroUx } from "@/lib/onboarding/onboarding-ia"
import { useAuthStore } from "@/lib/stores/auth-store"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle2, Circle, ArrowRight, X, Loader2 } from "lucide-react"
import Link from "next/link"
import { Progress } from "@/components/ui/progress"
import { authFetch } from "@/lib/stores/auth-store"

interface RubroSetupChecklistProps {
  rubro: string
}

interface ApiChecklistItem {
  id: string
  label: string
  done: boolean
  href: string
}

export function RubroSetupChecklist({ rubro }: RubroSetupChecklistProps) {
  const { user } = useAuthStore()
  const ux = getRubroUx(rubro)
  
  const storageKey = `claver_setup_dismissed_${user?.empresaId || "guest"}`
  
  const [apiChecklist, setApiChecklist] = useState<ApiChecklistItem[]>([])
  const [dismissed, setDismissed] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setMounted(true)
    try {
      if (localStorage.getItem(storageKey) === "true") {
        setDismissed(true)
      }
    } catch {
      // ignore
    }
  }, [storageKey])

  useEffect(() => {
    if (!mounted || dismissed) return

    async function loadQuality() {
      try {
        const res = await authFetch("/api/maestros/quality-summary")
        if (res.ok) {
          const data = await res.json()
          setApiChecklist(data.checklist || [])
        }
      } catch (error) {
        console.error("Error loading quality summary:", error)
      } finally {
        setLoading(false)
      }
    }
    loadQuality()
  }, [mounted, dismissed])

  function handleDismiss() {
    setDismissed(true)
    try {
      localStorage.setItem(storageKey, "true")
    } catch {
      // ignore
    }
  }

  if (!mounted || dismissed) return null

  // Mapeo básico de tablas a rutas comunes (hardcoded heuristic for now based on typical ERPs)
  const getRoute = (tabla: string) => {
    if (tabla.includes("producto") || tabla.includes("lista")) return "/dashboard/productos"
    if (tabla.includes("cliente")) return "/dashboard/clientes"
    if (tabla.includes("proveedor")) return "/dashboard/proveedores"
    if (tabla.includes("deposito")) return "/dashboard/productos"
    if (tabla.includes("medida") || tabla.includes("marca")) return "/dashboard/maestros"
    return "/dashboard/configuracion"
  }

  // Mergear items de UX (que no están en la API) asumiendo no completados,
  // y los que vienen de la API con su estado real.
  // Para no complicarlo, mostramos primero los de la API, y luego los de getRubroUx que no se solapen
  // En la implementación real la API podría devolver todos, pero acá combinamos:
  
  // Extraemos labels de la API para no duplicar intenciones
  const apiLabels = apiChecklist.map(a => a.label.toLowerCase())
  const uxItems = (ux.maestrosCriticos || [])
    .filter(u => !apiLabels.some(al => al.includes(u.tabla) || u.label.toLowerCase().includes(al)))
    .map(u => ({
      id: `ux_${u.tabla}`,
      label: u.label,
      done: false, // los de UX puros sin validación backend los dejamos pendientes, 
                   // o requeriría un endpoint más complejo para validarlos a todos
      href: getRoute(u.tabla),
      descripcion: u.descripcion
    }))

  const allItems = [...apiChecklist, ...uxItems]
  
  if (allItems.length === 0 && !loading) return null

  const completedCount = allItems.filter(i => i.done).length
  const totalCount = allItems.length
  const progress = totalCount === 0 ? 0 : Math.round((completedCount / totalCount) * 100)
  const isDone = totalCount > 0 && progress === 100

  if (loading) {
    return (
      <Card className="mb-8">
        <CardContent className="p-6 flex items-center justify-center">
          <Loader2 className="h-6 w-6 text-primary animate-spin" />
        </CardContent>
      </Card>
    )
  }

  if (isDone) {
    return (
      <Card className="mb-8 border-emerald-200 bg-emerald-50/50">
        <CardContent className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="h-6 w-6 text-emerald-600" />
            <div>
              <p className="font-semibold text-emerald-900">¡Configuración inicial completada!</p>
              <p className="text-sm text-emerald-700">Ya tenés la base lista para operar.</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={handleDismiss}>
            <X className="h-4 w-4" />
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="mb-8">
      <CardHeader className="pb-3 flex flex-row justify-between items-start">
        <div>
          <CardTitle className="text-lg">Seteo Inicial: {ux.nombre}</CardTitle>
          <CardDescription>Completá estos datos maestros clave para tu rubro.</CardDescription>
        </div>
        <Button variant="ghost" size="icon" onClick={handleDismiss} className="-mt-2 -mr-2 text-muted-foreground">
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <div className="flex justify-between text-xs text-muted-foreground mb-1">
            <span>Progreso</span>
            <span>{progress}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
        
        <div className="grid gap-2 sm:grid-cols-2">
          {allItems.map((item) => {
            const isCompleted = item.done
            return (
              <div 
                key={item.id} 
                className={`flex items-start gap-3 p-3 rounded-lg border transition-colors ${isCompleted ? "bg-muted/50 border-muted" : "bg-card hover:border-primary/50"}`}
              >
                <div className="mt-0.5 text-muted-foreground">
                  {isCompleted ? <CheckCircle2 className="h-5 w-5 text-primary" /> : <Circle className="h-5 w-5" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`font-medium text-sm ${isCompleted ? "text-muted-foreground line-through" : ""}`}>
                    {item.label}
                  </p>
                  {(item as any).descripcion && (
                    <p className="text-xs text-muted-foreground truncate">{(item as any).descripcion}</p>
                  )}
                </div>
                {!isCompleted && item.href && (
                  <Link href={item.href}>
                    <Button variant="ghost" size="icon" className="h-6 w-6">
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                )}
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
