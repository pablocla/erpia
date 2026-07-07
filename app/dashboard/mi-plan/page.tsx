"use client"

import Link from "next/link"
import { useState } from "react"
import {
  ArrowRight,
  Check,
  CreditCard,
  LifeBuoy,
  Sparkles,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { authFetch } from "@/lib/stores"
import { useToast } from "@/hooks/use-toast"
import { useComercialAccess } from "@/hooks/use-comercial-access"
import { formatTrialCountdown } from "@/lib/comercial/trial-service"
import { fmtPrecioArs } from "@/lib/comercial/sub-saas-catalog"
import { MpCheckoutReturn } from "@/components/billing/mp-checkout-return"
import { IaSaasCatalogPanel } from "@/components/comercial/ia-saas-catalog-panel"

export default function MiPlanPage() {
  const { toast } = useToast()
  const { trial, access, loading } = useComercialAccess()
  const [checkoutLoading, setCheckoutLoading] = useState(false)
  const [skuLoading, setSkuLoading] = useState<string | null>(null)

  async function handleUpgrade() {
    setCheckoutLoading(true)
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
      setCheckoutLoading(false)
    }
  }

  async function handleSubscribeSku(sku: string) {
    setSkuLoading(sku)
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
      setSkuLoading(null)
    }
  }

  const monetizados = access?.monetizados ?? []
  const gratis = monetizados.filter((m) => m.gratisPermanente)
  const enTrial = monetizados.filter((m) => m.enTrial && !m.gratisPermanente)
  const expirados = monetizados.filter((m) => m.expirado && !m.gratisPermanente)
  const pagados = monetizados.filter((m) => !m.gratisPermanente && !m.enTrial && !m.expirado)
  const upsells = access?.upsellSkus ?? []
  const precioUpgrade = access?.precioUpgradeArs ?? 0

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <MpCheckoutReturn />

      <div>
        <h1 className="text-2xl font-bold tracking-tight">Mi plan</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Gestioná tu suscripción, trial y módulos de pago desde acá.
        </p>
      </div>

      {loading ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            Cargando estado de tu plan…
          </CardContent>
        </Card>
      ) : (
        <>
          {access?.mpAutorizado ? (
            <Card className="border-emerald-500/30 bg-emerald-500/5">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Check className="h-5 w-5 text-emerald-600" />
                  Suscripción activa
                </CardTitle>
                <CardDescription>
                  Tu pago con Mercado Pago está autorizado. Todos los módulos contratados están habilitados.
                </CardDescription>
              </CardHeader>
            </Card>
          ) : trial?.activo ? (
            <Card className="border-primary/30 bg-primary/5">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  {access?.tieneAnclaGratis ? "Libreta gratis + módulos en trial" : "Período de prueba activo"}
                </CardTitle>
                <CardDescription>
                  {access?.ofertaLema ??
                    `Te quedan ${formatTrialCountdown(trial.diasRestantes)} para probar los módulos de pago.`}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-wrap items-center gap-2">
                <Badge variant="secondary">{formatTrialCountdown(trial.diasRestantes)}</Badge>
                <span className="text-xs text-muted-foreground">
                  Vence el{" "}
                  {new Intl.DateTimeFormat("es-AR", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                  }).format(new Date(trial.expiresAt))}
                </span>
              </CardContent>
            </Card>
          ) : trial?.expirado ? (
            <Card className="border-destructive/30 bg-destructive/5">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Trial finalizado</CardTitle>
                <CardDescription>
                  {access?.tieneAnclaGratis
                    ? "Tu libreta sigue gratis. Activá caja y stock para seguir vendiendo."
                    : "Activá un plan para continuar sin límites."}
                </CardDescription>
              </CardHeader>
            </Card>
          ) : null}

          {(gratis.length > 0 || enTrial.length > 0 || pagados.length > 0 || expirados.length > 0) && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Tus módulos</CardTitle>
                {access?.ofertaNombre && (
                  <CardDescription>{access.ofertaNombre}</CardDescription>
                )}
              </CardHeader>
              <CardContent className="space-y-2">
                {[...gratis, ...pagados, ...enTrial, ...expirados].map((m) => (
                  <div
                    key={m.sku}
                    className="flex items-center justify-between gap-3 rounded-lg border px-3 py-2 text-sm"
                  >
                    <div className="min-w-0">
                      <p className="font-medium truncate">{m.nombre}</p>
                      <p className="text-xs text-muted-foreground">{m.sku}</p>
                    </div>
                    <Badge
                      variant={
                        m.gratisPermanente
                          ? "secondary"
                          : m.expirado
                            ? "destructive"
                            : m.enTrial
                              ? "outline"
                              : "default"
                      }
                    >
                      {m.gratisPermanente
                        ? "Gratis"
                        : m.expirado
                          ? "Vencido"
                          : m.enTrial
                            ? "Trial"
                            : "Activo"}
                    </Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {!access?.mpAutorizado && precioUpgrade > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Activar plan completo</CardTitle>
                <CardDescription>
                  Incluye caja, stock y facturación según tu oferta actual.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col sm:flex-row sm:items-center gap-4">
                <p className="text-2xl font-bold tabular-nums">{fmtPrecioArs(precioUpgrade)}<span className="text-sm font-normal text-muted-foreground">/mes</span></p>
                <Button className="sm:ml-auto" disabled={checkoutLoading} onClick={() => void handleUpgrade()}>
                  <CreditCard className="h-4 w-4 mr-2" />
                  {checkoutLoading ? "Redirigiendo…" : "Pagar con Mercado Pago"}
                </Button>
              </CardContent>
            </Card>
          )}

          {upsells.length > 0 && !access?.mpAutorizado && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Sumar módulos</CardTitle>
                <CardDescription>Activá solo lo que necesitás, cuando lo necesitás.</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-2">
                {upsells.map((u) => (
                  <Button
                    key={u.sku}
                    variant="outline"
                    size="sm"
                    disabled={skuLoading != null}
                    onClick={() => void handleSubscribeSku(u.sku)}
                  >
                    {skuLoading === u.sku ? "…" : `${u.nombre} · ${fmtPrecioArs(u.precioArs)}`}
                  </Button>
                ))}
              </CardContent>
            </Card>
          )}

          <IaSaasCatalogPanel showTiers />

          <div className="flex flex-wrap gap-3 text-sm">
            <Button variant="outline" size="sm" asChild>
              <Link href="/dashboard/apps">
                Ver marketplace
                <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
              </Link>
            </Button>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/claver/contacto">
                <LifeBuoy className="h-3.5 w-3.5 mr-1.5" />
                Hablar con ventas
              </Link>
            </Button>
          </div>
        </>
      )}
    </div>
  )
}