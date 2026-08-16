"use client"

/**
 * Planilla del día — redirige mentalmente a la misma libreta en tab Hoy.
 * Mantiene URL /cobranza para bottom nav y bookmarks.
 */
import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function PlanillaCobranzaPage() {
  const router = useRouter()
  useEffect(() => {
    router.replace("/dashboard/prestamos?tab=hoy")
  }, [router])
  return (
    <div className="flex min-h-[40vh] items-center justify-center text-muted-foreground text-sm">
      Abriendo cobros de hoy…
    </div>
  )
}
