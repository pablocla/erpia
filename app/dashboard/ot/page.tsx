"use client"

import { useState } from "react"
import { useAuthFetch } from "@/hooks/use-auth-fetch"
import { PageShell, PageHeader } from "@/components/layout"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
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

  return (
    <PageShell>
      <PageHeader
        title="Órdenes de Servicio"
        description="Gestión de taller mecánico y reparaciones"
        actions={
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Nueva OT
          </Button>
        }
      />

      <OTKanban ots={ots} onUpdate={() => mutate()} isLoading={isLoading} />
      
      {dialogOpen && (
        <OTDialog open={dialogOpen} onOpenChange={setDialogOpen} onSuccess={() => mutate()} />
      )}
    </PageShell>
  )
}
