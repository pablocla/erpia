"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { LayoutGrid, Loader2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { PageHeader, PageShell } from "@/components/layout"
import { TemplateGalleryCard } from "@/components/reporting/TemplateGalleryCard"
import { TemplatePreviewDialog } from "@/components/reporting/TemplatePreviewDialog"
import { SheetsLockedState } from "@/components/reporting/SheetsUpsellDialog"
import { useSheetsEntitlement } from "@/hooks/use-sheets-entitlement"
import { useAuthStore } from "@/lib/stores/auth-store"
import type { SheetTemplate, SheetTemplateSummary } from "@/lib/reporting/templates/types"

const ADMIN_ROLES = new Set(["admin", "administrador", "gerente", "dueno"])

const CATEGORIAS = [
  { id: "all", label: "Todas" },
  { id: "ventas", label: "Ventas" },
  { id: "clientes", label: "Clientes" },
  { id: "stock", label: "Stock" },
  { id: "compras", label: "Compras" },
  { id: "fiscal", label: "Fiscal" },
] as const

function authHeaders(): HeadersInit {
  const token = localStorage.getItem("token")
  return token ? { Authorization: `Bearer ${token}` } : {}
}

export default function ReportesPlantillasPage() {
  const router = useRouter()
  const [templates, setTemplates] = useState<SheetTemplateSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [categoria, setCategoria] = useState<string>("all")
  const [previewTemplate, setPreviewTemplate] = useState<SheetTemplate | null>(null)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [activating, setActivating] = useState(false)

  const { entitled, plans, loading: entitlementLoading, refresh } = useSheetsEntitlement()
  const role = useAuthStore((s) => s.user?.rol)
  const isAdmin = role ? ADMIN_ROLES.has(role) : false

  const cargar = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/reporting/templates", { headers: authHeaders() })
      if (res.ok) {
        const data = await res.json()
        setTemplates(data.data ?? [])
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (entitled) void cargar()
  }, [entitled, cargar])

  const filtradas = useMemo(() => {
    if (categoria === "all") return templates
    return templates.filter((t) => t.categoria === categoria)
  }, [templates, categoria])

  async function abrirPreview(id: string) {
    const res = await fetch(`/api/reporting/templates/${id}`, { headers: authHeaders() })
    if (!res.ok) return
    const data = await res.json()
    setPreviewTemplate(data)
    setPreviewOpen(true)
  }

  async function usarPlantilla() {
    if (!previewTemplate) return
    setActivating(true)
    router.push(`/dashboard/reportes/explorar?template=${previewTemplate.id}`)
  }

  if (entitlementLoading) {
    return (
      <PageShell>
        <div className="flex justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </PageShell>
    )
  }

  if (!entitled) {
    return (
      <PageShell>
        <PageHeader title="Plantillas Clav Sheets" description="Reportes pre-armados para PyMEs." />
        <SheetsLockedState plans={plans} isAdmin={isAdmin} onActivated={refresh} />
      </PageShell>
    )
  }

  return (
    <PageShell>
      <div className="mb-2 flex flex-wrap gap-2">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/dashboard/reportes">← Mis reportes</Link>
        </Button>
      </div>

      <PageHeader
        title="Galería de plantillas"
        description="Cargá reportes pre-armados con un clic. Ideal para demos y operación diaria."
        badge={
          <Badge variant="outline" className="gap-1">
            <LayoutGrid className="h-3 w-3" />
            {templates.length} plantillas
          </Badge>
        }
        actions={
          <Button variant="outline" asChild>
            <Link href="/dashboard/reportes/explorar">Explorador vacío</Link>
          </Button>
        }
      />

      <div className="flex flex-wrap gap-2 mb-4">
        {CATEGORIAS.map((c) => (
          <Button
            key={c.id}
            size="sm"
            variant={categoria === c.id ? "default" : "outline"}
            className="h-8 text-xs"
            onClick={() => setCategoria(c.id)}
          >
            {c.label}
          </Button>
        ))}
      </div>

      {loading ? (
        <Card>
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            Cargando plantillas…
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtradas.map((t) => (
            <TemplateGalleryCard
              key={t.id}
              template={t}
              onPreview={() => void abrirPreview(t.id)}
            />
          ))}
        </div>
      )}

      <TemplatePreviewDialog
        template={previewTemplate}
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        onConfirm={usarPlantilla}
        loading={activating}
      />
    </PageShell>
  )
}