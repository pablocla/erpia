"use client"

import { CalendarClock } from "lucide-react"
import { PageHeader, PageShell } from "@/components/layout"
import { UpgradesArcaInbox } from "@/components/claver-cloud/upgrades-arca-inbox"

export default function UpgradesArcaPage() {
  return (
    <PageShell className="max-w-4xl mx-auto">
      <PageHeader
        variant="surface"
        title="Pendientes ARCA / WhatsApp"
        description="Bandeja tipo Calendly: el comerciante pidió upgrade y certificado de factura electrónica. Mientras tanto sigue vendiendo con ticket interno."
        badge={
          <span className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-medium text-amber-300">
            <CalendarClock className="h-3.5 w-3.5" />
            Upgrade pendiente
          </span>
        }
      />
      <UpgradesArcaInbox />
    </PageShell>
  )
}
