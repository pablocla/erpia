"use client"

import { useEffect, useRef } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { authFetch } from "@/lib/stores"
import { useToast } from "@/hooks/use-toast"

/** Confirma retorno de checkout MP (mock o subscription=ok). */
export function MpCheckoutReturn() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { toast } = useToast()
  const handled = useRef(false)

  useEffect(() => {
    if (handled.current) return
    const mpMock = searchParams.get("mp_mock")
    const subscription = searchParams.get("subscription")
    const ref = searchParams.get("ref")

    if (!mpMock && subscription !== "ok") return
    handled.current = true

    void (async () => {
      if (mpMock === "1") {
        const res = await authFetch("/api/billing/confirm-mock", {
          method: "POST",
          body: JSON.stringify({ ref }),
        })
        const data = await res.json()
        if (res.ok) {
          toast({ title: "Suscripción activada (simulación)", description: "Ya podés usar todos los módulos pagos." })
        } else {
          toast({ title: "No se pudo confirmar el pago simulado", variant: "destructive" })
        }
      } else if (subscription === "ok") {
        const res = await authFetch("/api/billing/sync-subscription", { method: "POST" })
        const data = await res.json()
        if (res.ok && data.authorized) {
          toast({
            title: "Suscripción activada",
            description: "Pago confirmado en Mercado Pago (modo local sin webhook).",
          })
        } else if (res.ok && data.status === "pending") {
          toast({
            title: "Pago pendiente",
            description: "MP aún no autorizó. Reintentá en unos segundos desde el panel upsell.",
          })
        } else {
          toast({
            title: "No se pudo confirmar aún",
            description: data.error ?? data.reason ?? "Revisá el estado en Mercado Pago.",
            variant: "destructive",
          })
        }
      }
      router.replace("/dashboard/apps")
    })()
  }, [searchParams, router, toast])

  return null
}