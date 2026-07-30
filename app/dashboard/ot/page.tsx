"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { useAuthFetch } from "@/hooks/use-auth-fetch"
import { PageShell, PageHeader } from "@/components/layout"
import { Button } from "@/components/ui/button"
import { MapPin, Plus } from "lucide-react"
import { OTKanban } from "@/components/ot/ot-kanban"
import { OTDialog } from "@/components/ot/ot-dialog"

export default function OTPage() {
  const { data, mutate, isLoading } = useAuthFetch<unknown>("/api/ot")
  const ots = Array.isArray(data)
    ? data
    : Array.isArray((data as { ots?: unknown[] } | null)?.ots)
      ? ((data as { ots: unknown[] }).ots)
      : []
  const [dialogOpen, setDialogOpen] = useState(false)
  // Si hay OT con metadata fumigacion, el alta usa campos de plagas/sitio
  const mode = useMemo(() => {
    const list = ots as { metadata?: { vertical?: string } }[]
    const fumig = list.some(
      (o) => o?.metadata && (o.metadata as { vertical?: string }).vertical === "fumigacion",
    )
    return fumig ? ("fumigacion" as const) : ("general" as const)
  }, [ots])

  return (
    <PageShell>
      <PageHeader
        title="Órdenes de Servicio"
        description="Visitas, tratamientos y trabajos de campo (fumigación, taller, service). Facturá al cerrar."
        actions={
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" asChild>
              <Link href="/dashboard/fumigacion">
                <MapPin className="mr-2 h-4 w-4" />
                Ruta del día
              </Link>
            </Button>
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Nueva orden
            </Button>
          </div>
        }
      />

      <OTKanban ots={ots} onUpdate={() => mutate()} isLoading={isLoading} />

      {dialogOpen && (
        <OTDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          onSuccess={() => mutate()}
          mode={mode}
        />
      )}
    </PageShell>
  )
}
