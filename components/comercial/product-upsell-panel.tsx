"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { ArrowRight, CreditCard, Sparkles, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { getAuthHeaders, useAuthStore } from "@/lib/stores/auth-store"
import { authFetch } from "@/lib/stores"
import { formatTrialCountdown } from "@/lib/comercial/trial-service"
import { fmtPrecioArs } from "@/lib/comercial/sub-saas-catalog"
import { useToast } from "@/hooks/use-toast"

interface MonetizadoRow {
  sku: string
  nombre: string
  precioArs: number
  enTrial: boolean
  expirado: boolean
  gratisPermanente: boolean
}

interface UpsellRow {
  sku: string
  nombre: string
  precioArs: number
}

interface AccessPayload {
  ofertaNombre?: string
  ofertaLema?: string
  tieneAnclaGratis?: boolean
  monetizados?: MonetizadoRow[]
  upsellSkus?: UpsellRow[]
  precioUpgradeArs?: number
  bloqueoTotal?: boolean
}

export function ProductUpsellPanel({ className }: { className?: string }) {
  const token = useAuthStore((s) => s.token)
  const { toast } = useToast()
  const [dismissed, setDismissed] = useState(false)
  const [loading, setLoading] = useState(false)
  const [access, setAccess] = useState<AccessPayload | null>(null)
  const [trialDias, setTrialDias] = useState<number | null>(null)

  useEffect(() => {
    if (!token) return
    fetch("/api/config/trial", { headers: getAuthHeaders() })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        setAccess(data?.access ?? null)
        setTrialDias(data?.trial?.diasRestantes ?? null)
      })
      .catch(() => setAccess(null))
  }, [token])

  if (dismissed || !access) return null

  const expirados = (access.monetizados ?? []).filter((m) => m.expirado && !m.gratisPermanente)
  const enTrial = (access.monetizados ?? []).filter((m) => m.enTrial)
  const upsells = access.upsellSkus ?? []

  const showPanel =
    expirados.length > 0 || enTrial.length > 0 || upsells.length > 0 || access.tieneAnclaGratis

  if (!showPanel) return null

  async function handleUpgrade() {
    setLoading(true)
    try {
      const res = await authFetch("/api/billing/create-subscription", { method: "POST" })
      const data = await res.json()
      if (res.ok && data.init_point) {
        window.location.href = data.init_point
        return
      }
      toast({
        title: "No se pudo iniciar el pago",
        description: data.error ?? "Intentá de nuevo.",
        variant: "destructive",
      })
    } catch {
      toast({ title: "Error de conexión", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  async function handleSubscribeSku(sku: string) {
    setLoading(true)
    try {
      const res = await authFetch("/api/billing/subscribe", {
        method: "POST",
        body: JSON.stringify({ sku }),
      })
      const data = await res.json()
      if (res.ok && data.free) {
        toast({ title: data.message ?? "Módulo activado" })
        window.location.reload()
        return
      }
      if (res.ok && data.init_point) {
        window.location.href = data.init_point
        return
      }
      toast({
        title: "No se pudo activar",
        description: data.error ?? "Intentá de nuevo.",
        variant: "destructive",
      })
    } catch {
      toast({ title: "Error de conexión", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  const titulo = expirados.length
    ? "Activá caja y stock para seguir vendiendo"
    : access.tieneAnclaGratis
      ? "Tu libreta sigue gratis"
      : "Sumá módulos a tu negocio"

  const descripcion =
    access.ofertaLema ??
    (trialDias != null && trialDias > 0
      ? `Trial de módulos de pago — ${formatTrialCountdown(trialDias)}`
      : "Elegí qué activar cuando lo necesites.")

  return (
    <div
      className={cn(
        "rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 flex flex-col sm:flex-row sm:items-center gap-3",
        className,
      )}
    >
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary shrink-0" />
          {titulo}
        </p>
        <p className="text-xs text-muted-foreground mt-0.5">{descripcion}</p>
        {upsells.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2">
            {upsells.slice(0, 3).map((u) => (
              <Button
                key={u.sku}
                variant="outline"
                size="sm"
                className="h-7 text-xs"
                disabled={loading}
                onClick={() => void handleSubscribeSku(u.sku)}
              >
                {u.nombre} · {fmtPrecioArs(u.precioArs)}
              </Button>
            ))}
          </div>
        )}
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {(expirados.length > 0 || enTrial.length > 0) && (access.precioUpgradeArs ?? 0) > 0 && (
          <Button size="sm" disabled={loading} onClick={() => void handleUpgrade()}>
            <CreditCard className="h-3.5 w-3.5 mr-1.5" />
            {loading ? "..." : fmtPrecioArs(access.precioUpgradeArs!)}
          </Button>
        )}
        <Button size="sm" variant="outline" asChild>
          <Link href="/dashboard/mi-plan">Mi plan</Link>
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setDismissed(true)}>
          <X className="h-4 w-4" />
        </Button>
      </div>
      {access.tieneAnclaGratis && (
        <Link
          href="/dashboard/apps"
          className="text-xs text-primary hover:underline inline-flex items-center gap-1 sm:hidden"
        >
          Ver marketplace <ArrowRight className="h-3 w-3" />
        </Link>
      )}
    </div>
  )
}