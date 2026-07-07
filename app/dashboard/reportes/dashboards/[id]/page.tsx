"use client"

import { useEffect, useState, use } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Plus, Save, Trash2, ArrowLeft, Share2, Copy } from "lucide-react"
import { Button } from "@/components/ui/button"
import { PageHeader, PageShell } from "@/components/layout"
import { GlobalSlicers } from "@/components/reporting/GlobalSlicers"
import { DashboardWidget } from "@/components/reporting/DashboardWidget"
import { useAuthStore } from "@/lib/stores/auth-store"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

function authHeaders(): HeadersInit {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null
  return token ? { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } : { "Content-Type": "application/json" }
}

const ADMIN_ROLES = new Set(["admin", "administrador", "gerente", "dueno"])

export default function DashboardPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const isNew = resolvedParams.id === "nuevo"
  const router = useRouter()
  
  const [dashboard, setDashboard] = useState<any>(null)
  const [widgets, setWidgets] = useState<any[]>([])
  const [loading, setLoading] = useState(!isNew)
  
  const [addWidgetOpen, setAddWidgetOpen] = useState(false)
  const [savedReports, setSavedReports] = useState<any[]>([])
  const [loadingReports, setLoadingReports] = useState(false)
  
  const [shareOpen, setShareOpen] = useState(false)
  const [shareUrl, setShareUrl] = useState("")

  const role = useAuthStore((s) => s.user?.rol)
  const isAdmin = role ? ADMIN_ROLES.has(role) : false
  const [editMode, setEditMode] = useState(isNew)

  useEffect(() => {
    if (isNew) {
      setDashboard({ nombre: "Nuevo Dashboard", descripcion: "" })
      return
    }
    fetch(`/api/reporting/dashboards/${resolvedParams.id}`, { headers: authHeaders() })
      .then(res => res.json())
      .then(data => {
        setDashboard(data)
        setWidgets(data.widgets ?? [])
        setLoading(false)
      })
  }, [resolvedParams.id, isNew])

  function openWidgetModal() {
    setAddWidgetOpen(true)
    if (savedReports.length === 0) {
      setLoadingReports(true)
      fetch("/api/reporting/definitions", { headers: authHeaders() })
        .then(res => res.json())
        .then(data => setSavedReports(data.data ?? []))
        .finally(() => setLoadingReports(false))
    }
  }

  function handleAddWidget(report: any) {
    const isKpi = report.tipoVista === "plano"
    const nextWidgets = [
      ...widgets,
      {
        id: Math.random().toString(36).substring(7),
        smartViewId: report.id,
        titulo: report.nombre,
        tipoGrafico: isKpi ? "kpi" : "chart"
      }
    ]
    setWidgets(nextWidgets)
    setAddWidgetOpen(false)
  }

  function removeWidget(id: string) {
    setWidgets(widgets.filter(w => w.id !== id))
  }

  async function guardar() {
    if (!dashboard.nombre.trim()) return alert("El nombre es requerido")
    
    const payload = {
      nombre: dashboard.nombre,
      descripcion: dashboard.descripcion,
      widgets: widgets,
      layout: []
    }

    if (isNew) {
      const res = await fetch("/api/reporting/dashboards", {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify(payload)
      })
      if (res.ok) {
        const created = await res.json()
        router.push(`/dashboard/reportes/dashboards/${created.id}`)
      }
    } else {
      await fetch(`/api/reporting/dashboards/${resolvedParams.id}`, {
        method: "PATCH",
        headers: authHeaders(),
        body: JSON.stringify(payload)
      })
      setEditMode(false)
    }
  }

  async function generarLinkPublico() {
    setShareOpen(true)
    if (!shareUrl) {
      const res = await fetch(`/api/reporting/dashboards/${resolvedParams.id}/share`, {
        method: "POST",
        headers: authHeaders()
      })
      if (res.ok) {
        const { token } = await res.json()
        const url = `${window.location.origin}/public/dashboards/${token}`
        setShareUrl(url)
      }
    }
  }

  function copiarPortapapeles() {
    navigator.clipboard.writeText(shareUrl)
    alert("¡Copiado al portapapeles!")
  }

  if (loading) {
    return <PageShell><div className="flex h-40 items-center justify-center text-muted-foreground">Cargando...</div></PageShell>
  }

  return (
    <PageShell>
      <div className="mb-2">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/dashboard/reportes"><ArrowLeft className="h-4 w-4 mr-2" /> Volver</Link>
        </Button>
      </div>

      <PageHeader
        title={editMode ? (
          <input 
            className="bg-transparent border-b outline-none focus:border-primary text-3xl font-bold tracking-tight"
            value={dashboard?.nombre}
            onChange={(e) => setDashboard({...dashboard, nombre: e.target.value})}
            placeholder="Nombre del Dashboard"
          />
        ) : dashboard?.nombre}
        description={editMode ? (
          <input 
            className="bg-transparent border-b outline-none focus:border-primary text-muted-foreground mt-1 w-full"
            value={dashboard?.descripcion}
            onChange={(e) => setDashboard({...dashboard, descripcion: e.target.value})}
            placeholder="Descripción (opcional)"
          />
        ) : dashboard?.descripcion}
        actions={
          <div className="flex gap-2">
            {!editMode && isAdmin && (
              <>
                <Button onClick={generarLinkPublico} variant="outline" className="bg-primary/5 text-primary border-primary/20 hover:bg-primary/10">
                  <Share2 className="h-4 w-4 mr-2" /> Compartir
                </Button>
                <Button onClick={() => setEditMode(true)} variant="outline">Editar</Button>
              </>
            )}
            {editMode && (
              <>
                <Button onClick={openWidgetModal} variant="outline">
                  <Plus className="h-4 w-4 mr-2" /> Agregar Widget
                </Button>
                <Button onClick={guardar}>
                  <Save className="h-4 w-4 mr-2" /> Guardar
                </Button>
              </>
            )}
          </div>
        }
      />

      <GlobalSlicers />

      {widgets.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-40 border-2 border-dashed rounded-lg text-muted-foreground">
          {editMode ? "Hacé clic en Agregar Widget" : "Dashboard vacío"}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 auto-rows-max">
          {widgets.map((w, idx) => {
            const isKpi = w.tipoGrafico === "kpi"
            const colSpan = isKpi ? "col-span-1" : "col-span-1 md:col-span-2 lg:col-span-2 xl:col-span-2"
            return (
              <div key={w.id || idx} className={`${colSpan} relative group`}>
                <DashboardWidget smartViewId={w.smartViewId} titulo={w.titulo} tipoGrafico={w.tipoGrafico} />
                {editMode && (
                  <Button 
                    variant="destructive" 
                    size="icon" 
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6"
                    onClick={() => removeWidget(w.id)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                )}
              </div>
            )
          })}
        </div>
      )}

      <Dialog open={addWidgetOpen} onOpenChange={setAddWidgetOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Seleccionar reporte</DialogTitle>
          </DialogHeader>
          <div className="grid gap-2 max-h-[60vh] overflow-y-auto">
            {loadingReports ? (
              <div className="p-4 text-center text-muted-foreground">Cargando...</div>
            ) : savedReports.length === 0 ? (
              <div className="p-4 text-center text-muted-foreground">No hay reportes guardados</div>
            ) : (
              savedReports.map(r => (
                <Button key={r.id} variant="outline" className="justify-start h-auto py-3 flex flex-col items-start gap-1" onClick={() => handleAddWidget(r)}>
                  <div className="font-semibold">{r.nombre}</div>
                  <div className="text-xs text-muted-foreground">Vista: {r.tipoVista} · Origen: {r.connectorId}</div>
                </Button>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={shareOpen} onOpenChange={setShareOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Compartir Dashboard</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground">
              Cualquiera con este enlace podrá ver los datos de este dashboard (solo lectura). No se requiere inicio de sesión.
            </p>
            <div className="flex gap-2 items-center">
              <input 
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                value={shareUrl}
                readOnly
              />
              <Button size="icon" onClick={copiarPortapapeles}>
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="mt-4">
              <p className="text-sm font-medium mb-2">Código para embeber (iFrame)</p>
              <div className="relative">
                <textarea 
                  className="flex w-full rounded-md border border-input bg-muted/50 px-3 py-2 text-xs font-mono text-muted-foreground"
                  rows={3}
                  readOnly
                  value={`<iframe src="${shareUrl}" width="100%" height="800" frameborder="0"></iframe>`}
                />
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </PageShell>
  )
}
