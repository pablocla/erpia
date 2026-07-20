"use client"

import { useState } from "react"
import { Loader2, Wallet } from "lucide-react"
import { useAuthFetch } from "@/hooks/use-auth-fetch"
import { authFetch } from "@/lib/stores"
import { PageShell, PageHeader } from "@/components/layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"

const fmt = (n: number) =>
  new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(n)

export default function CobranzaAsAServicePage() {
  const { toast } = useToast()
  const { data, isLoading, mutate } = useAuthFetch<{
    config: { activo: boolean; feePct: number; feeMinArs: number } | null
    feeMes: number
    recuperadoMes: number
    periodo: string
    pendientes?: { saldoTotal: number; clientesUnicos: number; contactablesWhatsApp: number }
    cargos: Array<{ id: number; montoRecuperado: number; feeCobrado: number; estado: string }>
  }>("/api/cobranza-aas")
  const [feePct, setFeePct] = useState("5")
  const [busy, setBusy] = useState(false)

  async function activar() {
    setBusy(true)
    try {
      const res = await authFetch("/api/cobranza-aas", {
        method: "POST",
        body: JSON.stringify({ action: "activar", feePct: Number(feePct) || 5 }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || "Error")
      toast({ title: "Cobranza as a Service activada", description: `Fee ${feePct}% sobre cobros` })
      mutate()
    } catch (e) {
      toast({
        title: "Error",
        description: e instanceof Error ? e.message : "Error",
        variant: "destructive",
      })
    } finally {
      setBusy(false)
    }
  }

  async function desactivar() {
    setBusy(true)
    try {
      await authFetch("/api/cobranza-aas", {
        method: "POST",
        body: JSON.stringify({ action: "desactivar" }),
      })
      toast({ title: "Servicio desactivado" })
      mutate()
    } finally {
      setBusy(false)
    }
  }

  return (
    <PageShell>
      <PageHeader
        title="Cobranza as a Service"
        description="Activá secretaria WA + fee % solo sobre lo que recuperás (no sobre reclutar)."
      />

      {isLoading && (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Estado</CardDescription>
            <CardTitle className="text-xl">
              {data?.config?.activo ? "Activo" : "Inactivo"}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            Fee: {data?.config?.feePct ?? feePct}% · min {fmt(data?.config?.feeMinArs ?? 0)}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Recuperado {data?.periodo}</CardDescription>
            <CardTitle className="text-xl text-emerald-700">
              {fmt(data?.recuperadoMes ?? 0)}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Fee del mes</CardDescription>
            <CardTitle className="flex items-center gap-2 text-xl">
              <Wallet className="h-5 w-5" />
              {fmt(data?.feeMes ?? 0)}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {data?.pendientes && (
        <Card className="mt-4">
          <CardHeader>
            <CardTitle className="text-base">Pipeline de cobranza</CardTitle>
            <CardDescription>
              {data.pendientes.clientesUnicos} clientes ·{" "}
              {data.pendientes.contactablesWhatsApp} con WhatsApp ·{" "}
              {fmt(data.pendientes.saldoTotal)} vencido
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      <Card className="mt-4">
        <CardHeader>
          <CardTitle className="text-base">Configurar</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-end">
          <div className="space-y-2">
            <Label>Fee % sobre cobros</Label>
            <Input
              type="number"
              min={1}
              max={20}
              value={feePct}
              onChange={(e) => setFeePct(e.target.value)}
              className="w-28"
            />
          </div>
          <Button disabled={busy} className="bg-emerald-600 hover:bg-emerald-500" onClick={() => void activar()}>
            {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Activar servicio
          </Button>
          {data?.config?.activo && (
            <Button disabled={busy} variant="outline" onClick={() => void desactivar()}>
              Desactivar
            </Button>
          )}
        </CardContent>
      </Card>

      <Card className="mt-4">
        <CardHeader>
          <CardTitle className="text-base">Cargos del periodo</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          {(data?.cargos?.length ?? 0) === 0 && (
            <p className="text-muted-foreground">
              Cuando registres un cobro (recibo/fiado) con el servicio activo, se genera el fee
              automáticamente.
            </p>
          )}
          {data?.cargos?.map((c) => (
            <div key={c.id} className="flex justify-between border-b py-2">
              <span>
                Recuperado {fmt(c.montoRecuperado)} → fee {fmt(c.feeCobrado)}
              </span>
              <span className="text-muted-foreground">{c.estado}</span>
            </div>
          ))}
        </CardContent>
      </Card>
    </PageShell>
  )
}
