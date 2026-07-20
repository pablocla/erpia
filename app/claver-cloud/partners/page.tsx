"use client"

import { useCallback, useEffect, useState } from "react"
import { authFetch } from "@/lib/stores/auth-store"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Banknote, RefreshCw, Wallet } from "lucide-react"

type PartnerRow = {
  partnerId: number
  email: string
  nombre: string
  tipo: string
  referralCode: string | null
  referidos: number
  pendiente: number
  solicitado: number
  comisionIdsSolicitados: number[]
}

const fmt = (n: number) =>
  new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(n)

export default function ClaverPartnersLiquidacionPage() {
  const [partners, setPartners] = useState<PartnerRow[]>([])
  const [summary, setSummary] = useState<{
    totalSolicitado: number
    totalPendiente: number
    message?: string
  } | null>(null)
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState<number | null>(null)
  const [error, setError] = useState("")

  const load = useCallback(async () => {
    setLoading(true)
    setError("")
    try {
      const res = await authFetch("/api/claver/partners/liquidaciones")
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? `HTTP ${res.status}`)
      setPartners(data.partners ?? [])
      setSummary(data.summary ?? null)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  async function liquidar(p: PartnerRow) {
    if (p.solicitado <= 0) return
    setBusyId(p.partnerId)
    try {
      const res = await authFetch("/api/claver/partners/liquidaciones", {
        method: "POST",
        body: JSON.stringify({
          partnerId: p.partnerId,
          comisionIds: p.comisionIdsSolicitados,
          nota: "transferencia_manual",
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? "Error")
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error liquidando")
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="space-y-6 p-4 md:p-6 max-w-5xl">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
            <Banknote className="h-6 w-6 text-emerald-600" />
            Partners · liquidación cash
          </h1>
          <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
            Preferí que el partner use crédito Claver (retiene MRR). Cash out: transferí y marcá
            liquidado. El pendiente sin solicitar no se paga acá.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => void load()} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          Actualizar
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {summary && (
        <div className="grid gap-3 sm:grid-cols-2">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>A pagar (solicitado)</CardDescription>
              <CardTitle className="text-2xl text-amber-700">
                {fmt(summary.totalSolicitado)}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-1">
                <Wallet className="h-3.5 w-3.5" /> Crédito potencial (pendiente)
              </CardDescription>
              <CardTitle className="text-2xl text-emerald-700">
                {fmt(summary.totalPendiente)}
              </CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-muted-foreground">
              {summary.message}
            </CardContent>
          </Card>
        </div>
      )}

      {loading && partners.length === 0 ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground py-12 justify-center">
          <Loader2 className="h-5 w-5 animate-spin" /> Cargando…
        </div>
      ) : partners.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground text-sm">
            Nadie con saldo pendiente o solicitado.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {partners.map((p) => (
            <Card key={p.partnerId}>
              <CardHeader className="pb-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <CardTitle className="text-base">{p.nombre}</CardTitle>
                    <CardDescription>
                      {p.email} · {p.referralCode ?? "sin código"} · {p.referidos} referidos
                    </CardDescription>
                  </div>
                  <Badge variant="secondary">{p.tipo}</Badge>
                </div>
              </CardHeader>
              <CardContent className="flex flex-wrap items-center justify-between gap-3 text-sm">
                <div className="space-y-1">
                  <p>
                    Solicitado cash:{" "}
                    <strong className="text-amber-700">{fmt(p.solicitado)}</strong>
                  </p>
                  <p className="text-muted-foreground">
                    Pendiente (puede ir a crédito): {fmt(p.pendiente)}
                  </p>
                </div>
                <Button
                  disabled={p.solicitado <= 0 || busyId === p.partnerId}
                  onClick={() => void liquidar(p)}
                >
                  {busyId === p.partnerId && (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  )}
                  Marcar liquidado
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
