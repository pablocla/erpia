"use client"

import { useState } from "react"
import Link from "next/link"
import { CheckCircle2, Circle, Loader2, Package } from "lucide-react"
import { useAuthFetch } from "@/hooks/use-auth-fetch"
import { authFetch } from "@/lib/stores"
import { PageShell, PageHeader } from "@/components/layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"

interface ChecklistResponse {
  items: Array<{ id: string; label: string; hint: string; done: boolean }>
  progresoPct: number
  sku: string
  precioArs: number
}

const fmt = (n: number) =>
  new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(n)

export default function HardwareSetupPage() {
  const { toast } = useToast()
  const { data, isLoading, mutate } = useAuthFetch<ChecklistResponse>("/api/hardware-bundle")
  const [busy, setBusy] = useState(false)

  async function activar() {
    setBusy(true)
    try {
      const res = await authFetch("/api/hardware-bundle", {
        method: "POST",
        body: JSON.stringify({ action: "activar" }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || "Error")
      toast({ title: "Pack Hardware activado", description: "Completá el checklist de go-live" })
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

  async function toggle(itemId: string, done: boolean) {
    setBusy(true)
    try {
      await authFetch("/api/hardware-bundle", {
        method: "POST",
        body: JSON.stringify({ action: "toggle", itemId, done: !done }),
      })
      mutate()
    } finally {
      setBusy(false)
    }
  }

  return (
    <PageShell>
      <PageHeader
        title="Pack Hardware POS"
        description="Checklist de go-live: impresora, lectora, balanza y mostrador."
      />

      <Card className="mb-4">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Package className="h-5 w-5" />
              {data?.sku ?? "pack.hardware_pos"}
            </CardTitle>
            <CardDescription>
              Precio ref. {fmt(data?.precioArs ?? 89000)} · setup + hardware recomendado
            </CardDescription>
          </div>
          <Button disabled={busy} onClick={() => void activar()}>
            {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Activar pack
          </Button>
        </CardHeader>
        <CardContent>
          <div className="mb-2 flex justify-between text-sm">
            <span>Progreso</span>
            <span className="font-semibold">{data?.progresoPct ?? 0}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full bg-emerald-500 transition-all"
              style={{ width: `${data?.progresoPct ?? 0}%` }}
            />
          </div>
        </CardContent>
      </Card>

      {isLoading && (
        <div className="flex justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      )}

      <ul className="space-y-2">
        {data?.items.map((item) => (
          <li key={item.id}>
            <button
              type="button"
              disabled={busy}
              onClick={() => void toggle(item.id, item.done)}
              className={cn(
                "flex w-full items-start gap-3 rounded-xl border p-4 text-left transition hover:bg-muted/40",
                item.done && "border-emerald-200 bg-emerald-50/40",
              )}
            >
              {item.done ? (
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
              ) : (
                <Circle className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />
              )}
              <div>
                <p className="font-medium">{item.label}</p>
                <p className="text-sm text-muted-foreground">{item.hint}</p>
              </div>
            </button>
          </li>
        ))}
      </ul>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        <Link href="/dashboard/pos/config" className="underline">
          Config POS
        </Link>
        {" · "}
        <Link href="/dashboard/partner-portal" className="underline">
          Partners (setup cobrado)
        </Link>
      </p>
    </PageShell>
  )
}
