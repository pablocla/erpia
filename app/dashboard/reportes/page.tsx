"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { ExternalLink, FileSpreadsheet, LayoutGrid, Plus, Trash2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PageHeader, PageShell } from "@/components/layout"
import { SheetsLockedState } from "@/components/reporting/SheetsUpsellDialog"
import { useSheetsEntitlement } from "@/hooks/use-sheets-entitlement"
import { useAuthStore } from "@/lib/stores/auth-store"

type SavedReport = {
  id: number
  codigo: string
  nombre: string
  tipoVista: string
  connectorId: string
  updatedAt: string
}

function authHeaders(): HeadersInit {
  const token = localStorage.getItem("token")
  return token ? { Authorization: `Bearer ${token}` } : {}
}

const ADMIN_ROLES = new Set(["admin", "administrador", "gerente", "dueno"])

export default function ReportesPage() {
  const [reports, setReports] = useState<SavedReport[]>([])
  const [loading, setLoading] = useState(true)
  const { entitled, tier, plans, loading: entitlementLoading, refresh } = useSheetsEntitlement()
  const role = useAuthStore((s) => s.user?.rol)
  const isAdmin = role ? ADMIN_ROLES.has(role) : false

  async function cargar() {
    setLoading(true)
    try {
      const res = await fetch("/api/reporting/definitions", { headers: authHeaders() })
      if (res.ok) {
        const data = await res.json()
        setReports(data.data ?? [])
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (entitled) void cargar()
  }, [entitled])

  async function eliminar(id: number) {
    if (!confirm("¿Eliminar este reporte?")) return
    await fetch(`/api/reporting/definitions/${id}`, { method: "DELETE", headers: authHeaders() })
    void cargar()
  }

  if (entitlementLoading) {
    return (
      <PageShell>
        <Card><CardContent className="py-12 text-sm text-muted-foreground text-center">Cargando…</CardContent></Card>
      </PageShell>
    )
  }

  if (!entitled) {
    return (
      <PageShell>
        <PageHeader title="Clav Sheets" description="Add-on de reporting pivot y Excel." />
        <SheetsLockedState plans={plans} isAdmin={isAdmin} onActivated={refresh} />
      </PageShell>
    )
  }

  return (
    <PageShell>
      <PageHeader
        title="Clav Sheets"
        description="Reportes planos, tablas pivot y gráficos — SmartView en la nube."
        badge={
          <div className="flex gap-1">
            <Badge variant="outline">Reporting</Badge>
            {tier && <Badge variant="secondary">{tier === "pro" ? "Pro" : "Lite"}</Badge>}
          </div>
        }
        actions={
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" asChild>
              <Link href="/dashboard/reportes/plantillas">
                <LayoutGrid className="h-4 w-4 mr-2" />
                Plantillas
              </Link>
            </Button>
            <Button asChild>
              <Link href="/dashboard/reportes/explorar">
                <Plus className="h-4 w-4 mr-2" />
                Nuevo reporte
              </Link>
            </Button>
          </div>
        }
      />

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        <Card className="border-dashed hover:border-primary/40 transition-colors">
          <CardContent className="flex flex-col items-center justify-center py-10 gap-3">
            <LayoutGrid className="h-10 w-10 text-muted-foreground" />
            <Button asChild>
              <Link href="/dashboard/reportes/plantillas">Ver plantillas</Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link href="/dashboard/reportes/explorar">Explorador vacío</Link>
            </Button>
          </CardContent>
        </Card>

        {loading ? (
          <Card><CardContent className="py-8 text-sm text-muted-foreground">Cargando…</CardContent></Card>
        ) : (
          reports.map((r) => (
            <Card key={r.id}>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center justify-between gap-2">
                  <span className="truncate">{r.nombre}</span>
                  <Badge variant="secondary" className="text-[10px] shrink-0">{r.tipoVista}</Badge>
                </CardTitle>
                <p className="text-xs text-muted-foreground">{r.codigo} · {r.connectorId}</p>
              </CardHeader>
              <CardContent className="flex justify-between items-center gap-2">
                <span className="text-[10px] text-muted-foreground">
                  {new Date(r.updatedAt).toLocaleString("es-AR")}
                </span>
                <div className="flex items-center gap-1">
                  <Button variant="outline" size="sm" className="h-7 text-xs" asChild>
                    <Link href={`/dashboard/reportes/explorar?load=${r.id}`}>
                      <ExternalLink className="h-3 w-3 mr-1" />
                      Abrir
                    </Link>
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => eliminar(r.id)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </PageShell>
  )
}