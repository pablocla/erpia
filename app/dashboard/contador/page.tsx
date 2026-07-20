"use client"

import { useState } from "react"
import Link from "next/link"
import { Loader2, Plus, Building2, FileSpreadsheet } from "lucide-react"
import { useAuthFetch } from "@/hooks/use-auth-fetch"
import { authFetch } from "@/lib/stores"
import { PageShell, PageHeader } from "@/components/layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"

interface ClienteRow {
  linkId: number
  permisos: string
  empresa: {
    id: number
    nombre: string
    cuit: string
    email: string | null
    rubro: string
  }
  trial: { diasRestantes: number; expirado: boolean } | null
}

export default function ContadorMultiEmpresaPage() {
  const { toast } = useToast()
  const { data, isLoading, mutate } = useAuthFetch<{
    clientes: ClienteRow[]
    estudioEmpresaId: number
  }>("/api/contador/clientes")
  const [clienteId, setClienteId] = useState("")
  const [estudioRef, setEstudioRef] = useState("")
  const [busy, setBusy] = useState(false)
  const [resumen, setResumen] = useState<Record<string, unknown> | null>(null)

  async function vincular() {
    setBusy(true)
    try {
      const res = await authFetch("/api/contador/clientes", {
        method: "POST",
        body: JSON.stringify({
          action: "vincular",
          clienteEmpresaId: Number(clienteId),
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || "Error")
      toast({ title: "Cliente vinculado" })
      setClienteId("")
      mutate()
    } catch (e) {
      toast({
        title: "No se pudo vincular",
        description: e instanceof Error ? e.message : "Error",
        variant: "destructive",
      })
    } finally {
      setBusy(false)
    }
  }

  async function autorizarEstudio() {
    setBusy(true)
    try {
      const res = await authFetch("/api/contador/clientes", {
        method: "POST",
        body: JSON.stringify({
          action: "autorizar_estudio",
          estudioCuitOrId: estudioRef,
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || "Error")
      toast({ title: "Estudio autorizado", description: "Tu contador ya puede ver lecturas fiscales." })
      setEstudioRef("")
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

  async function verResumen(empresaId: number) {
    setBusy(true)
    try {
      const res = await authFetch(`/api/contador/clientes/${empresaId}/resumen`)
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || "Error")
      setResumen(json)
    } catch (e) {
      toast({
        title: "Sin acceso",
        description: e instanceof Error ? e.message : "Error",
        variant: "destructive",
      })
    } finally {
      setBusy(false)
    }
  }

  return (
    <PageShell>
      <PageHeader
        title="Pack Contador — Multi-empresa"
        description="Vinculá comercios de tu estudio y mirá resúmenes fiscales en lectura."
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Como estudio: agregar cliente</CardTitle>
            <CardDescription>ID numérico de la empresa cliente en Claver</CardDescription>
          </CardHeader>
          <CardContent className="flex gap-2">
            <Input
              placeholder="empresaId del cliente"
              value={clienteId}
              onChange={(e) => setClienteId(e.target.value)}
            />
            <Button disabled={busy || !clienteId} onClick={() => void vincular()}>
              <Plus className="mr-2 h-4 w-4" />
              Vincular
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Como comercio: autorizar estudio</CardTitle>
            <CardDescription>CUIT o ID de la empresa del contador</CardDescription>
          </CardHeader>
          <CardContent className="flex gap-2">
            <Input
              placeholder="CUIT o ID del estudio"
              value={estudioRef}
              onChange={(e) => setEstudioRef(e.target.value)}
            />
            <Button disabled={busy || !estudioRef} variant="outline" onClick={() => void autorizarEstudio()}>
              Autorizar
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-4">
        <CardHeader>
          <CardTitle className="text-base">
            Clientes del estudio ({data?.clientes?.length ?? 0})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {isLoading && (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          )}
          {!isLoading && (data?.clientes?.length ?? 0) === 0 && (
            <p className="text-sm text-muted-foreground">
              Todavía no hay empresas vinculadas. Usá el ID de empresa del cliente o pedile que te
              autorice con tu CUIT.
            </p>
          )}
          {data?.clientes?.map((c) => (
            <div
              key={c.linkId}
              className="flex flex-col gap-2 rounded-lg border p-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex items-start gap-2">
                <Building2 className="mt-0.5 h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="font-medium">{c.empresa.nombre}</p>
                  <p className="text-xs text-muted-foreground">
                    CUIT {c.empresa.cuit} · #{c.empresa.id} · {c.empresa.rubro}
                  </p>
                  <Badge variant="secondary" className="mt-1 text-[10px]">
                    {c.permisos}
                  </Badge>
                </div>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => void verResumen(c.empresa.id)}>
                  <FileSpreadsheet className="mr-1 h-3.5 w-3.5" />
                  Resumen mes
                </Button>
                <Button size="sm" variant="ghost" asChild>
                  <Link href="/dashboard/reportes">Reportes</Link>
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {resumen && (
        <Card className="mt-4 border-emerald-200 bg-emerald-50/30">
          <CardHeader>
            <CardTitle className="text-base">
              Resumen empresa #{String((resumen as { clienteEmpresaId?: number }).clienteEmpresaId)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="overflow-x-auto rounded-lg bg-slate-950 p-3 text-xs text-emerald-100">
              {JSON.stringify((resumen as { resumen?: unknown }).resumen ?? resumen, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}
    </PageShell>
  )
}
