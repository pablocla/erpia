"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { Copy, ExternalLink, Loader2, RefreshCw, Wallet, BookOpen } from "lucide-react"
import { CommissionCalculator } from "@/components/clavernet/commission-calculator"
import { PARTNER_PROGRAM } from "@/lib/partners/program-copy"
import { useAuthFetch } from "@/hooks/use-auth-fetch"
import { authFetch } from "@/lib/stores"
import { PageShell, PageHeader } from "@/components/layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { PartnerTreeVisualizer } from "@/components/clavernet/partner-tree-visualizer"
import { PartnerRewardsCatalog } from "@/components/clavernet/partner-rewards-catalog"

interface PartnerMeResponse {
  partner: {
    id: number
    tipo: string
    nombreFantasia: string | null
    nivel: string
    referralCode: string
    activo: boolean
  }
  referralUrl: string
  parent: { id: number; nombreFantasia: string | null; referralCode: string | null } | null
  subAfiliados: Array<{
    id: number
    nombreFantasia: string | null
    referralCode: string | null
    tipo: string
    nivel: string
  }>
  empresas: Array<{
    id: number
    nombre: string
    email: string | null
    createdAt: string
    mpSubscriptionStatus: string | null
    trialExpiresAt: string | null
  }>
  comisiones: Array<{
    id: number
    monto: number
    nivel: number
    estado: string
    fecha: string
    empresaOrigenId: number
    sku: string | null
  }>
  billetera: {
    pendiente: number
    solicitado?: number
    liquidado: number
    creditoAplicado?: number
    disponible?: number
    modoPago: string
  }
  contadorGratis?: {
    minClientes: number
    clientesPagos: number
    elegible: boolean
  }
  kpis?: {
    referidosTotal: number
    referidosPagos: number
    referidosAncla: number
  }
}

const fmt = (n: number) =>
  new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(n)

export default function PartnerPortalPage() {
  const { toast } = useToast()
  const { data, error, isLoading, mutate } = useAuthFetch<PartnerMeResponse>("/api/partners/me")
  const [busy, setBusy] = useState(false)

  const copyLink = useCallback(async () => {
    if (!data?.referralUrl) return
    try {
      await navigator.clipboard.writeText(data.referralUrl)
      toast({ title: "Link copiado", description: "Compartilo por WhatsApp o mail." })
    } catch {
      toast({ title: "No se pudo copiar", variant: "destructive" })
    }
  }, [data?.referralUrl, toast])

  const partnerAction = async (action: string, extra?: Record<string, unknown>) => {
    setBusy(true)
    try {
      const res = await authFetch("/api/partners/me", {
        method: "POST",
        body: JSON.stringify({ action, ...extra }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || "Error")
      toast({
        title: "Listo",
        description:
          json.message ??
          (action === "solicitar_retiro"
            ? `${json.actualizadas ?? 0} comisiones → solicitado (cash)`
            : "Operación OK"),
      })
      mutate()
      if (action === "pagar_con_credito" || action === "canjear_contador_gratis") {
        // refrescar módulos en shell
        window.dispatchEvent(new Event("productos-updated"))
      }
    } catch (e) {
      toast({
        title: "No se pudo completar",
        description: e instanceof Error ? e.message : "Error",
        variant: "destructive",
      })
    } finally {
      setBusy(false)
    }
  }

  const solicitarRetiro = () => partnerAction("solicitar_retiro")
  const pagarConCredito = () => partnerAction("pagar_con_credito")
  const canjearContador = () => partnerAction("canjear_contador_gratis")

  useEffect(() => {
    // Forzar carga si el hook no revalida
  }, [])

  if (isLoading && !data) {
    return (
      <PageShell>
        <div className="flex min-h-[40vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </PageShell>
    )
  }

  if (error || !data) {
    return (
      <PageShell>
        <PageHeader title="Portal Partner" description="Red de afiliados Claver" />
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            No se pudo cargar el portal. ¿Estás logueado?
            <div className="mt-4">
              <Button variant="outline" onClick={() => mutate()}>
                Reintentar
              </Button>
            </div>
          </CardContent>
        </Card>
      </PageShell>
    )
  }

  const isImplementer =
    data.partner.tipo === "implementer" || data.partner.tipo === "hybrid"

  return (
    <PageShell>
      <PageHeader
        title={PARTNER_PROGRAM.name}
        description={
          isImplementer
            ? "Implementá clientes referidos y acumulá comisiones."
            : "Tu link de referidos, sub-afiliados y billetera de comisiones."
        }
        actions={
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link href={PARTNER_PROGRAM.paths.landing}>
                <BookOpen className="mr-2 h-4 w-4" />
                Reglas del programa
              </Link>
            </Button>
            <Button variant="outline" size="sm" onClick={() => mutate()}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Actualizar
            </Button>
          </div>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Disponible (crédito o retiro)</CardDescription>
            <CardTitle className="flex items-center gap-2 text-2xl text-emerald-700">
              <Wallet className="h-5 w-5" />
              {fmt(data.billetera.disponible ?? data.billetera.pendiente)}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            Usalo para pagar Claver o pedí cash
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Solicitado (cash)</CardDescription>
            <CardTitle className="text-2xl">{fmt(data.billetera.solicitado ?? 0)}</CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">En cola de liquidación</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Aplicado a Claver</CardDescription>
            <CardTitle className="text-2xl">{fmt(data.billetera.creditoAplicado ?? 0)}</CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">Sin salir por MP</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Nivel · liquidado cash</CardDescription>
            <CardTitle className="flex items-center gap-2 text-xl capitalize">
              {data.partner.nivel}
              <Badge variant="secondary">{data.partner.tipo}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            Cash histórico: {fmt(data.billetera.liquidado)} ·{" "}
            <strong>{data.partner.referralCode}</strong>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-4">
        <CardHeader>
          <CardTitle className="text-lg">Tu link de referidos</CardTitle>
          <CardDescription>
            QR de calle: claver.com.ar/f?ref=TUCODIGO. Comisión solo si el comercio paga un extra
            (Cobrá, AFIP, 2ª caja), no por la libreta gratis.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <code className="flex-1 truncate rounded-lg border bg-muted/40 px-3 py-2 text-xs sm:text-sm">
            {data.referralUrl}
          </code>
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={copyLink}>
              <Copy className="mr-2 h-4 w-4" />
              Copiar
            </Button>
            <Button type="button" variant="outline" asChild>
              <a href={data.referralUrl} target="_blank" rel="noreferrer">
                <ExternalLink className="mr-2 h-4 w-4" />
                Abrir
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="mt-4 border-emerald-500/30 bg-emerald-500/5">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Monetizá tu billetera</CardTitle>
          <CardDescription>
            Lo más rentable para vos y para Claver: pagar tu suscripción con comisiones (sin
            Mercado Pago). El cash out es manual y puede demorar.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <div className="flex flex-wrap gap-2">
            <Button
              disabled={busy || (data.billetera.disponible ?? data.billetera.pendiente) <= 0}
              onClick={pagarConCredito}
              className="bg-emerald-600 hover:bg-emerald-500"
            >
              {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Pagar mi Claver con crédito
            </Button>
            <Button
              variant="outline"
              disabled={busy || !data.contadorGratis?.elegible}
              onClick={canjearContador}
            >
              Pack Contador gratis
              {data.contadorGratis
                ? ` (${data.contadorGratis.clientesPagos}/${data.contadorGratis.minClientes})`
                : ""}
            </Button>
            <Button
              variant="secondary"
              disabled={busy || (data.billetera.disponible ?? data.billetera.pendiente) <= 0}
              onClick={solicitarRetiro}
            >
              Solicitar retiro cash
            </Button>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/dashboard/mi-plan">Ir a Mi plan</Link>
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Contador gratis: {data.contadorGratis?.minClientes ?? 3} referidos con suscripción paga.
            Retiro cash: comisiones con 60 días o más; un analista liquida (no es automático). Clawback 30 días si hay reembolso.
          </p>
        </CardContent>
      </Card>

      {/* Visualizador de Esquema Piramidal */}
      <PartnerTreeVisualizer
        partner={data.partner}
        empresas={data.empresas}
        subAfiliados={data.subAfiliados}
        comisiones={data.comisiones}
      />

      {/* Catálogo de Premios & Viajes de Incentivo */}
      <PartnerRewardsCatalog
        activeReferralsCount={data.kpis?.referidosPagos ?? data.contadorGratis?.clientesPagos ?? 0}
        currentCommissionsMonthly={data.comisiones.reduce((acc, c) => acc + c.monto, 0)}
      />

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Comercios que pagan ({data.kpis?.referidosPagos ?? 0}) · ancla $0 ({data.kpis?.referidosAncla ?? 0})
            </CardTitle>
            <CardDescription>
              El número que importa es quién paga extra. Fiado gratis todavía no te genera comisión: ofrecele
              Cobrá.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {data.empresas.length === 0 && (
              <p className="text-sm text-muted-foreground">Todavía no hay altas con tu link.</p>
            )}
            {data.empresas.map((e) => {
              const paga =
                e.mpSubscriptionStatus === "authorized" ||
                e.mpSubscriptionStatus === "authorized_credito_partner"
              return (
                <div
                  key={e.id}
                  className="flex items-center justify-between gap-2 rounded-lg border px-3 py-2 text-sm"
                >
                  <div>
                    <p className="font-medium">{e.nombre}</p>
                    <p className="text-xs text-muted-foreground">
                      {paga
                        ? "Te genera comisión"
                        : "Fiado gratis — todavía no te genera. Ofrecele Cobrá."}
                    </p>
                  </div>
                  <Badge variant={paga ? "default" : "outline"}>
                    {paga ? "Paga extra" : "Ancla $0"}
                  </Badge>
                </div>
              )
            })}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Sub-afiliados N2 ({data.subAfiliados.length})</CardTitle>
            <CardDescription>Partners que entraron con tu código como parent</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {data.subAfiliados.length === 0 && (
              <p className="text-sm text-muted-foreground">Sin red de segundo nivel aún.</p>
            )}
            {data.subAfiliados.map((s) => (
              <div key={s.id} className="rounded-lg border px-3 py-2 text-sm">
                <p className="font-medium">{s.nombreFantasia ?? s.referralCode ?? `#${s.id}`}</p>
                <p className="text-xs text-muted-foreground">
                  {s.tipo} · {s.referralCode}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card className="mt-4">
        <CardHeader>
          <CardTitle className="text-base">Últimas comisiones</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-xs text-muted-foreground">
              <tr>
                <th className="pb-2 pr-2">Fecha</th>
                <th className="pb-2 pr-2">Monto</th>
                <th className="pb-2 pr-2">Nivel</th>
                <th className="pb-2 pr-2">Estado</th>
                <th className="pb-2">Empresa</th>
              </tr>
            </thead>
            <tbody>
              {data.comisiones.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-4 text-muted-foreground">
                    Sin comisiones. Se generan al confirmar pago de suscripción del referido.
                  </td>
                </tr>
              )}
              {data.comisiones.map((c) => (
                <tr key={c.id} className="border-t">
                  <td className="py-2 pr-2">{new Date(c.fecha).toLocaleDateString("es-AR")}</td>
                  <td className="py-2 pr-2 font-medium">{fmt(c.monto)}</td>
                  <td className="py-2 pr-2">N{c.nivel}</td>
                  <td className="py-2 pr-2">
                    <Badge variant="secondary">{c.estado}</Badge>
                  </td>
                  <td className="py-2">#{c.empresaOrigenId}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <div className="mt-8">
        <CommissionCalculator />
      </div>

      <p className="mt-6 text-center text-xs text-muted-foreground">
        <Link href="/dashboard" className="underline">
          Volver al dashboard
        </Link>
        {" · "}
        Tasas: sellers {PARTNER_PROGRAM.rates.sellerN1}% / {PARTNER_PROGRAM.rates.sellerN2}% ·
        implementers {PARTNER_PROGRAM.rates.implementerN1}% / {PARTNER_PROGRAM.rates.implementerN2}% ·{" "}
        <Link href={PARTNER_PROGRAM.paths.landing} className="underline">
          Programa público
        </Link>
      </p>
    </PageShell>
  )
}
