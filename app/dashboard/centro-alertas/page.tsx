"use client"

import { useCallback, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { BellRing } from "lucide-react"
import { CentroAlertasPanel } from "@/components/ia/centro-alertas-panel"

function useAuthHeaders(): () => HeadersInit {
  return useCallback(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null
    return token ? { Authorization: `Bearer ${token}` } : {}
  }, [])
}

function CentroAlertasContent() {
  const searchParams = useSearchParams()
  const authHeaders = useAuthHeaders()

  const tab = searchParams.get("tab") ?? "bandeja"
  const alertaId = searchParams.get("alerta") ? Number(searchParams.get("alerta")) : null

  return (
    <CentroAlertasPanel
      authHeaders={authHeaders}
      tabInicial={tab}
      alertaIdInicial={alertaId}
    />
  )
}

export default function CentroAlertasPage() {
  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex items-center gap-3">
        <BellRing className="h-8 w-8 text-amber-500" />
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Centro de Alertas</h1>
          <p className="text-sm text-muted-foreground">
            Bandeja unificada de alertas IA, reglas configurables, WhatsApp y Telegram
          </p>
        </div>
      </div>

      <Suspense fallback={<p className="text-muted-foreground text-center py-12">Cargando...</p>}>
        <CentroAlertasContent />
      </Suspense>
    </div>
  )
}